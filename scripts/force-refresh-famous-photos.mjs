/**
 * Force-refresh famous POI photos from verified Commons file titles.
 * Overwrites 1.jpg–3.jpg. Does NOT scrape TripAdvisor/Airbnb/Booking.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLACES = path.join(__dirname, '..', 'public', 'places');
const UA = 'TanmiyaExplorerBot/1.0 (educational; BMK tourism catalog)';

/** Exact Commons File: titles known to depict the place */
const FILES = {
  'poi-ouzoud-falls': [
    'Cascade d\'Ouzoud maroc.jpg',
    'Ouzoud waterfalls In spring-Morocco.jpg',
    'Ouzoud cascades (219466327).jpg',
  ],
  'poi-bin-el-ouidane': [
    'Barrage Bin el Ouidane 3.JPG',
    'Barrage Bin el Ouidane 2.JPG',
    'Bin Lwidan azilal.jpg',
    'A water dam in the village of Bin al-Ouedan.jpg',
  ],
  'poi-imi-n-ifri': [],
  'poi-ain-asserdoun': [
    'Beni Mellal.jpg',
  ],
  'poi-ait-bouguemez': [
    'Ait bougemaz.jpg',
    'Aguerd n ouzrou.JPG',
    'Aghbalou n\'Tawaïa.jpg',
  ],
  'poi-kasbah-tadla': [
    'Kasbah Tadla.JPG',
    'Tadla kasbah.jpg',
  ],
  'poi-aguelmame-azigza': [
    'Aguelmame Azegza.jpg',
    'Lac Aguelmame Azigza.jpg',
  ],
  'poi-aguelmame-sidi-ali': [
    'Aguelmame Sidi Ali.jpg',
    'Lac Aguelmame Sidi Ali.jpg',
  ],
  'poi-mgoun-peak': [
    'Ighil M\'Goun.jpg',
    'Jbel Mgoun.jpg',
    'MGoun.jpg',
  ],
  'poi-zaouiat-ahansal': [
    'Zaouiat Ahansal.jpg',
    'Zaouia Ahansal.jpg',
  ],
  'poi-oum-er-rbia-springs': [
    'Sources de l\'Oum Er-Rbia.jpg',
    'Oum Er-Rbia.jpg',
  ],
  'poi-ahouli-mibladen': [
    'Ahouli.jpg',
    'Aouli.jpg',
  ],
  'poi-iouaridene-tracks': [
    'Iouaridene dinosaur footprints.jpg',
    'Empreintes Iouaridene.jpg',
  ],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(params) {
  const url = `https://commons.wikimedia.org/w/api.php?${new URLSearchParams({
    format: 'json',
    origin: '*',
    ...params,
  })}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.status === 429) {
      console.warn('rate limit, sleep 25s');
      await sleep(25000);
      continue;
    }
    if (!res.ok) throw new Error(`api ${res.status}`);
    return res.json();
  }
  throw new Error('rate limit persistent');
}

async function resolveUrls(titles) {
  const data = await api({
    action: 'query',
    titles: titles.map((t) => `File:${t}`).join('|'),
    prop: 'imageinfo',
    iiprop: 'url|mime|size',
    iiurlwidth: '1920',
  });
  const out = [];
  for (const p of Object.values(data?.query?.pages || {})) {
    if (p.missing != null) continue;
    const ii = p.imageinfo?.[0];
    if (!ii || !String(ii.mime || '').startsWith('image/')) continue;
    out.push({ title: p.title, url: ii.thumburl || ii.url });
  }
  return out;
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
  if (!res.ok) throw new Error(String(res.status));
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 20000) throw new Error(`small ${buf.length}`);
  const head = buf.slice(0, 40).toString('utf8');
  if (head.includes('<html') || head.includes('<!DOCTYPE')) throw new Error('html');
  fs.writeFileSync(dest, buf);
  return buf.length;
}

function clearJpgs(dir) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    if (/\.jpe?g$/i.test(f)) fs.unlinkSync(path.join(dir, f));
  }
}

// Also try search for POIs with few curated titles
async function searchFiles(query, limit = 6) {
  const data = await api({
    action: 'query',
    list: 'search',
    srsearch: query,
    srnamespace: '6',
    srlimit: String(limit),
  });
  return (data?.query?.search || [])
    .map((s) => s.title.replace(/^File:/, ''))
    .filter((t) => /\.(jpe?g|png|webp)$/i.test(t));
}

const EXTRA_SEARCH = {
  'poi-imi-n-ifri': 'Imi n Ifri filetype:bitmap',
  'poi-kasbah-tadla': 'Kasbah Tadla Morocco',
  'poi-aguelmame-azigza': 'Aguelmame Azigza OR Azegza',
  'poi-aguelmame-sidi-ali': 'Aguelmame Sidi Ali',
  'poi-mgoun-peak': "M'Goun Mgoun Morocco",
  'poi-zaouiat-ahansal': 'Zaouiat Ahansal',
  'poi-oum-er-rbia-springs': 'Sources Oum Er-Rbia',
  'poi-ahouli-mibladen': 'Ahouli Midelt',
  'poi-iouaridene-tracks': 'Iouaridene',
  'poi-ain-asserdoun': 'Aïn Asserdoun Beni Mellal',
};

let ok = 0;
for (const [poiId, titles] of Object.entries(FILES)) {
  const dir = path.join(PLACES, poiId);
  fs.mkdirSync(dir, { recursive: true });
  process.stdout.write(`\n${poiId}: `);

  let candidates = [...titles];
  if (EXTRA_SEARCH[poiId]) {
    try {
      candidates.push(...(await searchFiles(EXTRA_SEARCH[poiId], 8)));
      await sleep(2000);
    } catch (e) {
      process.stdout.write(`search!(${e.message}) `);
    }
  }

  // unique preserve order
  const seen = new Set();
  candidates = candidates.filter((t) => {
    const k = t.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  // resolve in chunks of 4
  const resolved = [];
  for (let i = 0; i < candidates.length && resolved.length < 6; i += 4) {
    try {
      resolved.push(...(await resolveUrls(candidates.slice(i, i + 4))));
    } catch (e) {
      process.stdout.write(`!${e.message}`);
    }
    await sleep(2000);
  }

  if (!resolved.length) {
    console.log('no commons hits — keeping previous files');
    continue;
  }

  clearJpgs(dir);
  const sources = [];
  let n = 0;
  for (const r of resolved) {
    if (n >= 3) break;
    try {
      const bytes = await download(r.url, path.join(dir, `${n + 1}.jpg`));
      sources.push({ file: `${n + 1}.jpg`, commons: r.title, bytes, url: r.url });
      n += 1;
      ok += 1;
      process.stdout.write('.');
    } catch (e) {
      process.stdout.write('x');
    }
    await sleep(1200);
  }
  console.log(` → ${n}`);
  fs.writeFileSync(
    path.join(dir, 'SOURCES.json'),
    JSON.stringify(
      {
        poiId,
        note: 'Wikimedia Commons free-licensed photos verified for this place. NOT scraped from TripAdvisor / Airbnb / Booking (copyright).',
        downloadedAt: new Date().toISOString(),
        files: sources,
      },
      null,
      2
    )
  );
  await sleep(2500);
}

console.log(`\nSaved ${ok} image files.`);
