/**
 * RAG Q&A for Tadla — retrieve catalog/FAQ chunks, answer with Gemini.
 * Hybrid: lexical pre-filter → optional Gemini embeddings re-rank → grounded generate.
 * Returns humanized text + media cards (photos from catalog) + follow-up chips.
 */
import {
  getArtisansResolved,
  getPoisResolved,
} from './catalog';
import { getTripPrograms } from './firestore';
import {
  callGemini,
  embedText,
  extractJsonText,
  isGeminiConfigured,
} from './gemini';
import {
  buildKnowledgeDocs,
  cosineSimilarity,
  lexicalScore,
} from './ragKnowledge';

let cache = {
  key: '',
  docs: [],
};

/**
 * Set VITE_RAG_EMBEDDINGS=false to skip Gemini embeddings entirely and rely on
 * the free lexical retrieval. Use this when you are close to your daily quota —
 * chat then costs just ONE Gemini request per question instead of ~14.
 */
const EMBEDDINGS_ENABLED =
  String(import.meta.env.VITE_RAG_EMBEDDINGS ?? 'true').toLowerCase() !== 'false';

const EMB_STORE_KEY = 'tadla_doc_emb_v1';

// docId -> { h: contentHash, v: number[] }. Document embeddings never change,
// so we compute each once and reuse it across every question (and page reload).
const docEmbeddingCache = new Map();
let embStoreLoaded = false;

function hashText(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return String(h);
}

function loadEmbStore() {
  if (embStoreLoaded) return;
  embStoreLoaded = true;
  try {
    const raw = localStorage.getItem(EMB_STORE_KEY);
    if (!raw) return;
    const obj = JSON.parse(raw);
    for (const [id, entry] of Object.entries(obj)) {
      if (entry?.v?.length) docEmbeddingCache.set(id, entry);
    }
  } catch {
    /* ignore corrupt / unavailable storage */
  }
}

function persistEmbStore() {
  try {
    const obj = {};
    for (const [id, entry] of docEmbeddingCache) obj[id] = entry;
    localStorage.setItem(EMB_STORE_KEY, JSON.stringify(obj));
  } catch {
    /* storage full — fine, we still have the in-memory cache */
  }
}

async function getDocEmbedding(doc) {
  loadEmbStore();
  const text = `${doc.title}\n${doc.text}`.slice(0, 4000);
  const h = hashText(text);
  const cached = docEmbeddingCache.get(doc.id);
  if (cached && cached.h === h) return cached.v;
  const v = await embedText(text, 'RETRIEVAL_DOCUMENT');
  docEmbeddingCache.set(doc.id, { h, v });
  return v;
}

async function loadCatalogDocs() {
  const [poiPack, artPack, programs] = await Promise.all([
    getPoisResolved(),
    getArtisansResolved(),
    getTripPrograms().catch(() => []),
  ]);

  const docs = buildKnowledgeDocs({
    pois: poiPack.pois,
    artisans: artPack.artisans,
    programs: Array.isArray(programs) ? programs : [],
  });

  const key = `${poiPack.fromSeed ? 's' : 'r'}:${docs.length}`;
  if (cache.key !== key) {
    cache = { key, docs };
  }
  return cache.docs;
}

function langInstruction(lang) {
  if (lang === 'fr') {
    return 'Write the "answer" field in warm, natural French (tutoiement OK for travelers).';
  }
  if (lang === 'ar') {
    return 'Write the "answer" field in clear, friendly Modern Standard Arabic.';
  }
  return 'Write the "answer" field in warm, natural English.';
}

async function retrieveHybrid(query, docs, topK = 6, { useEmbeddings = EMBEDDINGS_ENABLED } = {}) {
  const lexicalRanked = docs
    .map((doc) => ({ ...doc, score: lexicalScore(query, doc) }))
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  const pool =
    lexicalRanked.length > 0
      ? lexicalRanked
      : docs.filter((d) => d.type === 'faq').slice(0, 6).map((d) => ({ ...d, score: 0.1 }));

  // Lexical-only mode: zero embedding calls (best when quota is tight).
  if (!useEmbeddings) {
    return { hits: pool.slice(0, topK), usedEmbeddings: false };
  }

  let usedEmbeddings = false;

  try {
    // Only the query is embedded live; document vectors come from the cache
    // and are computed at most once each (then reused across all questions).
    const queryVector = await embedText(query, 'RETRIEVAL_QUERY');
    let newlyEmbedded = false;
    const scored = [];
    for (const doc of pool) {
      try {
        const hadCache = docEmbeddingCache.has(doc.id);
        const vec = await getDocEmbedding(doc);
        if (!hadCache) newlyEmbedded = true;
        const emb = cosineSimilarity(queryVector, vec);
        scored.push({
          ...doc,
          score: emb * 10 + (doc.score || 0) * 0.1,
          _emb: emb,
        });
      } catch {
        scored.push(doc);
      }
    }
    if (newlyEmbedded) persistEmbStore();
    usedEmbeddings = scored.some((d) => d._emb > 0);
    scored.sort((a, b) => b.score - a.score);
    return { hits: scored.slice(0, topK), usedEmbeddings };
  } catch {
    return { hits: pool.slice(0, topK), usedEmbeddings: false };
  }
}

function buildMediaFromHits(hits, highlightIds = []) {
  const prefer = new Set(
    (highlightIds || []).map((id) => String(id).replace(/^(poi|artisan|trip):/, ''))
  );

  const ranked = [...hits].sort((a, b) => {
    const aHit =
      prefer.has(a.id) ||
      prefer.has(a.meta?.poiId) ||
      prefer.has(a.meta?.artisanId) ||
      prefer.has(a.meta?.tripId)
        ? 1
        : 0;
    const bHit =
      prefer.has(b.id) ||
      prefer.has(b.meta?.poiId) ||
      prefer.has(b.meta?.artisanId) ||
      prefer.has(b.meta?.tripId)
        ? 1
        : 0;
    return bHit - aHit || b.score - a.score;
  });

  const media = [];
  for (const h of ranked) {
    if (h.type !== 'poi' && h.type !== 'artisan' && h.type !== 'trip') continue;
    const imageUrl = h.imageUrl || h.meta?.imageUrl || null;
    // Prefer cards with images; still show trip/place without photo if highlighted
    if (!imageUrl && h.type !== 'trip' && !prefer.has(h.id) && !prefer.has(h.meta?.poiId)) {
      continue;
    }
    media.push({
      id: h.id,
      type: h.type,
      title: h.title,
      href: h.href,
      imageUrl,
      caption:
        h.type === 'poi'
          ? h.meta?.category || ''
          : h.type === 'artisan'
            ? h.meta?.craftType || ''
            : typeof h.meta?.price === 'number'
              ? `${h.meta.price} MAD`
              : '',
    });
    if (media.length >= 3) break;
  }

  // Fallback: any POI with a photo from hits
  if (!media.length) {
    for (const h of hits) {
      if (h.imageUrl || h.meta?.imageUrl) {
        media.push({
          id: h.id,
          type: h.type,
          title: h.title,
          href: h.href,
          imageUrl: h.imageUrl || h.meta.imageUrl,
          caption: '',
        });
      }
      if (media.length >= 2) break;
    }
  }

  return media;
}

function parseStructuredReply(raw) {
  try {
    const parsed = JSON.parse(extractJsonText(raw));
    if (parsed && typeof parsed.answer === 'string') {
      return {
        answer: parsed.answer.trim(),
        highlightIds: Array.isArray(parsed.highlightIds)
          ? parsed.highlightIds.map(String)
          : [],
        followUps: Array.isArray(parsed.followUps)
          ? parsed.followUps.map(String).filter(Boolean).slice(0, 3)
          : [],
      };
    }
  } catch {
    /* plain text fallback */
  }
  return {
    answer: String(raw || '').trim(),
    highlightIds: [],
    followUps: [],
  };
}

const LOCAL_INTRO = {
  en: 'Here is what matches in the Tadla guide:',
  fr: 'Voici ce qui correspond dans le guide Tadla :',
  ar: 'إليك ما يطابق سؤالك في دليل تادلة:',
};

const LOCAL_EMPTY = {
  en: 'I could not find a close match. Try Discover for places, Trips for ready itineraries, or Artisans for local crafts.',
  fr: 'Je n’ai pas trouvé de correspondance proche. Essayez Découvrir, Circuits ou Artisans.',
  ar: 'لم أجد نتيجة قريبة. جرّب اكتشف أو الرحلات أو الصنّاع.',
};

const LOCAL_MORE = {
  en: 'Open its page for photos, map and practical tips.',
  fr: 'Ouvrez sa page pour photos, carte et conseils pratiques.',
  ar: 'افتح صفحته للصور والخريطة والنصائح العملية.',
};

/**
 * Build a useful answer from retrieved catalog hits without any LLM call.
 */
function composeLocalAnswer(hits, lang) {
  const usable = hits.filter((h) => h.type === 'poi' || h.type === 'artisan' || h.type === 'trip');
  const top = (usable.length ? usable : hits).slice(0, 3);

  if (top.length === 0) {
    return { answer: LOCAL_EMPTY[lang] || LOCAL_EMPTY.en, highlightIds: [], followUps: [] };
  }

  const lines = top.map((h) => {
    const firstSentence = String(h.text || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .find((s) => !s.startsWith('App link') && !s.startsWith('Photo')) || '';
    const trimmed = firstSentence.split(/(?<=[.!?])\s/)[0] || firstSentence;
    return `• ${h.title}${trimmed ? ` — ${trimmed}` : ''}`;
  });

  const intro = LOCAL_INTRO[lang] || LOCAL_INTRO.en;
  const more = LOCAL_MORE[lang] || LOCAL_MORE.en;
  const answer = `${intro}\n\n${lines.join('\n')}\n\n${more}`;

  const highlightIds = top.map((h) => `${h.type}:${h.meta?.poiId || h.meta?.artisanId || h.meta?.tripId || h.id}`);
  return { answer, highlightIds, followUps: [] };
}

/**
 * Ask a grounded question about places, trips, artisans, or the app.
 * @param {string} question
 * @param {{ lang?: string, history?: Array, liveAi?: boolean }} [opts]
 */
export async function askTanmiyaRag(
  question,
  { lang = 'en', history = [], liveAi = false } = {}
) {
  const q = String(question || '').trim();
  if (!q) throw new Error('Empty question');

  const docs = await loadCatalogDocs();

  // Public / non-admin: lexical catalog answer only — zero Gemini tokens.
  if (!liveAi || !isGeminiConfigured()) {
    const { hits } = await retrieveHybrid(q, docs, 6, { useEmbeddings: false });
    const structured = composeLocalAnswer(hits, lang);
    const media = buildMediaFromHits(hits, structured.highlightIds);
    return {
      answer: structured.answer,
      followUps: structured.followUps,
      media,
      sources: hits.map((h) => ({
        id: h.id,
        type: h.type,
        title: h.title,
        href: h.href,
        imageUrl: h.imageUrl || h.meta?.imageUrl || null,
        score: Number((h.score || 0).toFixed?.(3) ?? h.score),
      })),
      usedEmbeddings: false,
      usedFallback: true,
    };
  }

  const { hits, usedEmbeddings } = await retrieveHybrid(q, docs, 6);

  const context = hits
    .map(
      (h, i) =>
        `[#${i + 1} | ${h.type} | ${h.id} | ${h.title}]\n${h.text}${
          h.href ? `\nApp link: ${h.href}` : ''
        }${h.imageUrl ? `\nPhoto: yes` : ''}`
    )
    .join('\n\n---\n\n');

  const prior = history
    .slice(-4)
    .map((m) => `${m.role === 'user' ? 'Traveler' : 'Tadla'}: ${m.text}`)
    .join('\n');

  const prompt = `You are Tadla — a warm, local-feeling travel companion inside the Tadla app
(Béni Mellal–Khénifra, Morocco). You sound like a helpful friend who knows the region,
not a corporate bot or a Wikipedia article.

VOICE
- Short paragraphs (2–5 sentences). Natural, encouraging, concrete.
- Address the traveler directly ("you"). Light personality; no slang overload.
- Prefer practical next steps: when to go, what to pack, what to open in the app.
- Never invent history, prices, phones, or hours beyond CONTEXT.
- If CONTEXT is thin, admit it kindly and point to Discover, Plan, Trips, Artisans, or Essentials.

${langInstruction(lang)}

OUTPUT — reply with ONLY a JSON object (no markdown fences):
{
  "answer": "human message to the traveler",
  "highlightIds": ["poi:poi-ouzoud-falls"],
  "followUps": ["short follow-up the traveler might tap", "another"]
}

Rules for highlightIds: use ids from CONTEXT (poi:…, artisan:…, trip:…, faq-…) for places you mention so the UI can show their photos.
followUps: 0–3 short questions in the SAME language as answer.

CONTEXT:
${context}

${prior ? `Recent chat:\n${prior}\n` : ''}
Traveler question: ${q}`;

  let structured;
  let usedFallback = false;
  try {
    const raw = await callGemini(prompt, { temperature: 0.55, json: true });
    structured = parseStructuredReply(raw);
  } catch {
    structured = composeLocalAnswer(hits, lang);
    usedFallback = true;
  }

  const media = buildMediaFromHits(hits, structured.highlightIds);

  return {
    answer: structured.answer,
    followUps: structured.followUps,
    media,
    sources: hits.map((h) => ({
      id: h.id,
      type: h.type,
      title: h.title,
      href: h.href,
      imageUrl: h.imageUrl || h.meta?.imageUrl || null,
      score: Number((h.score || 0).toFixed?.(3) ?? h.score),
    })),
    usedEmbeddings,
    usedFallback,
  };
}

export function clearRagCache() {
  cache = { key: '', docs: [] };
}
