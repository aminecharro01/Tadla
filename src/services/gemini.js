/**
 * Gemini API client for the AI Itinerary Assistant.
 * Calls Google AI Studio REST API; never hardcodes the key.
 */

import { buildLocalItinerary } from '../utils/localPlanner';
import { localEventsForPoi } from '../data/localEvents';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL =
  import.meta.env.VITE_GEMINI_MODEL || 'gemini-flash-lite-latest';

/**
 * When true (default), only signed-in admins trigger live Gemini calls.
 * Everyone else gets silent local catalog results — saves free-tier tokens for demos.
 */
const ADMIN_ONLY =
  String(import.meta.env.VITE_GEMINI_ADMIN_ONLY ?? 'true').toLowerCase() !==
  'false';

export function isGeminiConfigured() {
  return Boolean(GEMINI_API_KEY);
}

/** Live Gemini is allowed only for admins when ADMIN_ONLY is on. */
export function canUseLiveGemini(isAdmin = false) {
  return isGeminiConfigured() && (!ADMIN_ONLY || Boolean(isAdmin));
}

/** Error carrying the HTTP status so callers can detect quota/rate limits. */
export class GeminiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'GeminiError';
    this.status = status;
  }
}

/** True when an error is a quota / rate-limit / temporary-availability failure. */
export function isQuotaError(err) {
  const status = err?.status;
  if (status === 429 || status === 503) return true;
  const msg = String(err?.message || '').toLowerCase();
  return (
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('resource_exhausted') ||
    msg.includes('exhausted') ||
    msg.includes('overloaded') ||
    msg.includes('too many requests')
  );
}

function buildPrompt(preferences, pois, { stricter = false } = {}) {
  const poiCatalog = pois.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    lat: p.lat,
    lng: p.lng,
    // Descriptions may be TODO — still useful for id/category matching
    description: p.description,
  }));

  const stricterNote = stricter
    ? `\nCRITICAL: Reply with ONLY a single raw JSON object. No markdown, no code fences, no commentary.`
    : '';

  const people = Math.max(1, Number(preferences.people) || 2);
  const hasCar = Boolean(preferences.hasCar);
  const includeHiking = Boolean(preferences.includeHiking);

  return `You are a tourism itinerary planner for the Béni Mellal–Khénifra region of Morocco.
Build a day-by-day itinerary using ONLY the points of interest (POIs) listed below.
Do not invent POI ids. Only use ids from the catalog.
Prefer POIs whose category matches the traveler interests when possible.
Interest → category hints: nature→waterfall/spring/river/lake/nature/garden/park/valley/gorge/peak/geology; history→heritage/geology/museum; culture→village/market/heritage/museum; family→garden/park/lake/waterfall/spring/market/museum.
Respect pace: "relaxed" = fewer POIs per day, "moderate" = balanced, "packed" = more stops.
Transport: if hasCar is false, keep each day's stops geographically close (clustered) and mention shared taxis / local buses in notes when useful. If hasCar is true, you may include farther Atlas sites but still keep a sensible driving order.
Hiking: if includeHiking is true, include at least one gorge/peak/valley/nature trail day when the catalog allows, and mention walking difficulty briefly in notes. If includeHiking is false, avoid strenuous peak/long-hike days; prefer viewpoints, gardens, lakes, heritage, and short walks.
Group size: adapt notes for ${people} traveler(s) (e.g. family logistics if many people, quieter spots if a couple).
Keep notes short and practical (travel tips, order of visit). Do not invent detailed historical facts if POI descriptions are incomplete.
${stricterNote}

Traveler preferences:
- durationDays: ${preferences.duration}
- people: ${people}
- hasCar: ${hasCar}
- includeHiking: ${includeHiking}
- interests: ${JSON.stringify(preferences.interests)}
- pace: ${preferences.pace}

POI catalog (JSON):
${JSON.stringify(poiCatalog)}

Return JSON in this exact shape:
{
  "days": [
    { "dayNumber": 1, "pois": ["poiId1", "poiId2"], "notes": "..." }
  ]
}`;
}

/**
 * Pull JSON object text out of a model response (strips ``` fences if present).
 */
export function extractJsonText(raw) {
  if (!raw || typeof raw !== 'string') {
    throw new Error('Empty model response');
  }

  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;

  // If extra prose surrounds the object, take the outermost { ... }
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found in model response');
  }

  return candidate.slice(start, end + 1);
}

/**
 * Validate + normalize itinerary shape.
 * @returns {{ days: Array<{ dayNumber: number, pois: string[], notes: string }> }}
 */
export function parseItineraryJson(raw, validPoiIds) {
  const jsonText = extractJsonText(raw);
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('Model response was not valid JSON');
  }

  if (!parsed || !Array.isArray(parsed.days)) {
    throw new Error('JSON missing days array');
  }

  const idSet = new Set(validPoiIds);
  const days = parsed.days.map((day, index) => {
    const dayNumber = Number(day?.dayNumber) || index + 1;
    const pois = Array.isArray(day?.pois)
      ? day.pois.map(String).filter((id) => idSet.has(id))
      : [];
    const notes = typeof day?.notes === 'string' ? day.notes : '';
    return { dayNumber, pois, notes };
  });

  if (days.length === 0) {
    throw new Error('Itinerary has no days');
  }

  return { days };
}

/**
 * Low-level Gemini generateContent call.
 * @param {string} prompt
 * @param {{ temperature?: number, json?: boolean }} [opts]
 */
export async function callGemini(prompt, { temperature = 0.4, json = true } = {}) {
  if (!isGeminiConfigured()) {
    throw new Error(
      'VITE_GEMINI_API_KEY is missing. Add it to .env (from Google AI Studio).'
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  const generationConfig = { temperature };
  if (json) generationConfig.responseMimeType = 'application/json';

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    }),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      body?.error?.message ||
      `Gemini request failed (${res.status})`;
    throw new GeminiError(msg, res.status);
  }

  const text = body?.candidates?.[0]?.content?.parts
    ?.map((p) => p.text)
    .filter(Boolean)
    .join('\n');

  if (!text) {
    throw new GeminiError('Gemini returned no text content', res.status);
  }

  return text;
}

/**
 * Fetch upcoming events near a place.
 * Live Gemini + Google Search only when `liveAi` is true (admin demo mode).
 * Otherwise returns curated regional events with no API call.
 */
export async function fetchLiveEvents(
  poi,
  { lang = 'en', signal, liveAi = false } = {}
) {
  if (!poi?.name) {
    throw new Error('A place is required to look up events.');
  }

  const localFallback = () => ({
    events: localEventsForPoi(poi, lang),
    sources: [],
    fallback: true,
  });

  // Public visitors / non-admin: catalog events only — no token spend.
  if (!liveAi || !isGeminiConfigured()) {
    return localFallback();
  }

  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const langName = { en: 'English', fr: 'French', ar: 'Arabic' }[lang] || 'English';

  const prompt = `You are a local events researcher for tourism in the Béni Mellal–Khénifra region of Morocco.
Today's date is ${todayIso}. Use Google Search to find REAL events happening from today onward (next ~90 days) in or near "${poi.name}"${
    typeof poi.lat === 'number' ? ` (approx ${poi.lat.toFixed(3)}, ${poi.lng.toFixed(3)})` : ''
  } that a tourist could realistically attend.
Include: festivals, moussems, weekly souk (market) days, sport/outdoor events, concerts, cultural or religious celebrations, seasonal activities.
STRICT RULES:
- Only include events you can support from search results. Do NOT invent events, dates, or names.
- If you are unsure of an exact date, give your best known recurring window (e.g. "Every Thursday", "Late July, dates vary") and set "dateConfirmed" to false.
- Prefer events closest to the place; it is fine to include a few well-known regional events within ~120 km.
- Return 0 to 6 events. If you find nothing reliable, return an empty array.
- Write "title", "description" and "location" in ${langName}.

Return ONLY a raw JSON object (no markdown) in this exact shape:
{
  "events": [
    {
      "title": "...",
      "date": "YYYY-MM-DD or a short human window",
      "dateConfirmed": true,
      "type": "festival|market|sport|music|cultural|religious|outdoor|other",
      "location": "town / venue",
      "description": "one or two practical sentences for a visitor",
      "url": "https://source-if-available"
    }
  ]
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  let body;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.2 },
      }),
    });
    body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return localFallback();
    }
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    return localFallback();
  }

  const parts = body?.candidates?.[0]?.content?.parts || [];
  const text = parts
    .map((p) => p.text)
    .filter(Boolean)
    .join('\n');

  let events = [];
  if (text) {
    try {
      const parsed = JSON.parse(extractJsonText(text));
      if (Array.isArray(parsed?.events)) events = parsed.events;
    } catch {
      events = [];
    }
  }

  events = events
    .filter((e) => e && typeof e.title === 'string' && e.title.trim())
    .slice(0, 6)
    .map((e) => ({
      title: String(e.title).trim(),
      date: typeof e.date === 'string' ? e.date.trim() : '',
      dateConfirmed: e.dateConfirmed !== false,
      type: typeof e.type === 'string' ? e.type.trim().toLowerCase() : 'other',
      location: typeof e.location === 'string' ? e.location.trim() : '',
      description: typeof e.description === 'string' ? e.description.trim() : '',
      url: typeof e.url === 'string' && /^https?:\/\//i.test(e.url) ? e.url : '',
    }));

  if (events.length === 0) {
    return localFallback();
  }

  const chunks = body?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = [];
  const seen = new Set();
  for (const chunk of chunks) {
    const web = chunk?.web;
    if (web?.uri && !seen.has(web.uri)) {
      seen.add(web.uri);
      sources.push({ title: web.title || web.uri, url: web.uri });
    }
  }

  return { events, sources: sources.slice(0, 5), fallback: false };
}

const EMBED_MODEL = import.meta.env.VITE_GEMINI_EMBED_MODEL || 'text-embedding-004';

/**
 * Embed text with Gemini (for RAG retrieval).
 * @param {string} text
 * @param {'RETRIEVAL_DOCUMENT'|'RETRIEVAL_QUERY'|'SEMANTIC_SIMILARITY'} [taskType]
 * @returns {Promise<number[]>}
 */
export async function embedText(text, taskType = 'RETRIEVAL_DOCUMENT') {
  if (!isGeminiConfigured()) {
    throw new Error('VITE_GEMINI_API_KEY is missing.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: `models/${EMBED_MODEL}`,
      content: { parts: [{ text: String(text).slice(0, 8000) }] },
      taskType,
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new GeminiError(body?.error?.message || `Embedding failed (${res.status})`, res.status);
  }

  const values = body?.embedding?.values;
  if (!Array.isArray(values) || !values.length) {
    throw new Error('Empty embedding vector');
  }
  return values;
}

/**
 * @param {object} preferences - { duration, interests: string[], pace }
 * @param {Array} pois - full POI list used as context
 * @param {{ liveAi?: boolean }} [opts] - set liveAi true only for admin demo
 * @returns {Promise<{ days: Array<{ dayNumber: number, pois: string[], notes: string }>, fallback?: boolean }>}
 */
export async function generateItinerary(preferences, pois, { liveAi = false } = {}) {
  if (!pois?.length) {
    throw new Error('No POIs available to build an itinerary. Seed the map first.');
  }

  // Public / non-admin: local planner only — zero Gemini tokens.
  if (!liveAi || !isGeminiConfigured()) {
    return buildLocalItinerary(preferences, pois);
  }

  const validPoiIds = pois.map((p) => p.id);
  const prompt = buildPrompt(preferences, pois);

  try {
    const raw = await callGemini(prompt);
    return parseItineraryJson(raw, validPoiIds);
  } catch (firstErr) {
    if (isQuotaError(firstErr)) {
      return buildLocalItinerary(preferences, pois);
    }
    try {
      const rawRetry = await callGemini(
        buildPrompt(preferences, pois, { stricter: true })
      );
      return parseItineraryJson(rawRetry, validPoiIds);
    } catch {
      return buildLocalItinerary(preferences, pois);
    }
  }
}
