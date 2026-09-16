/**
 * Download 2–3 high-quality Wikimedia Commons photos for famous BMK places only.
 * Free licences — not Google Maps / TripAdvisor scraping.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLACES = path.join(__dirname, '..', 'public', 'places');
const UA = 'TanmiyaExplorerBot/1.0 (educational; BMK tourism catalog)';

/** Curated Commons File: titles (exact) — famous sites only */
const FILES = {
  'poi-ouzoud-falls': [
    'Ouzoud Falls, Morocco, 20250126 1354 7463.jpg',
    'Cascades d\'ouzoud maroc 01.jpg',
    'Macaca sylvanus, Ouzoud Falls, Morocco, 20250126 1128 7323.jpg',
  ],
  'poi-ain-asserdoun': [
    'Ain Asserdoun in Beni Mellal from above.jpg',
    'Ain asserdoun Béni Mellal.jpg',
    'AIN ASSERDOUN -BNI MELLAL- MOROCCO.jpg',
  ],
  'poi-kasbah-ras-el-ain': [
    'Kasbah d\'Aïn Asserdoun.jpg',
    'Ain Asserdoun Castle.jpg',
    'Ain Asserdoun in Beni Mellal with Fortress.jpg',
    'Kasbah Ras El Ain.JPG',
  ],
  'poi-bin-el-ouidane': [
    'Barrage Bin el Ouidane 3.JPG',
    'Barrage Bin el Ouidane 2.JPG',
    'Bin Elouidane 2.jpg',
  ],
  'poi-imi-n-ifri': [
    'Imi n Ifri (ⵉⵎⵉ ⵏ ⵉⴼⵔⵉ riscrît avou n aplaké a ifri).jpg',
    'Imi n Ifri ⵉⵎⵉ ⵏ ⵉⴼⵔⵉ dizeu do trô.jpg',
    'Imi n Ifri ⵉⵎⵉ ⵏ ⵉⴼⵔⵉ pont foû-wåde.jpg',
  ],
  'poi-ait-bouguemez': [
    'Tabant, Ait Bougmez, Maroc.jpg',
    'Ait bougemaz.jpg',
    'Aguerd n ouzrou.JPG',
  ],
  'poi-aguelmame-azigza': [
    'Aguelmame Aziza lake.jpg',
    'Aguelmam Azegza lake.jpg',
    'Aglmam Azegza khenifra.JPG',
  ],
  'poi-kasbah-tadla': [
    'Kasba Tadla.jpg',
    'KasbaTadla,Kasba1.jpg',
    'KasbaTadla,NW.jpg',
  ],
  'poi-zaouiat-ahansal': [
    'Zaouiat Ahansal.jpg',
    'Zaouia Ahansal.jpg',
  ],
  'poi-oum-er-rbia-springs': [
    "Sources de l'Oum Er-Rbia.jpg",
    'Oum Er-Rbia.jpg',
  ],
  'poi-mgoun-peak': [
    "Ighil M'Goun.jpg",
    'Jbel Mgoun.jpg',
  ],
  'poi-aguelmame-sidi-ali': [
    'Aguelmame Sidi Ali.jpg',
    'Lac Aguelmame Sidi Ali.jpg',
  ],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(params) {
  const url = `https://commons.wikimedia.org/w/api.php?${new URLSearchParams({
    format: 'json',
    origin: '*',
    ...params,
  })}`;
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.status === 429) {
      console.warn('rate limit, sleep 30s');
      await sleep(30000);
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
    out.push({ title: p.title, url: ii.thumburl || ii.url, size: ii.size });
  }
  return out;
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
  if (!res.ok) throw new Error(String(res.status));
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 25000) throw new Error(`small ${buf.length}`);
  const head = buf.slice(0, 40).toString('utf8');
  if (head.includes('<html') || head.includes('<!DOCTYPE')) throw new Error('html');
  fs.writeFileSync(dest, buf);
  return buf.length;
}

function clearNumberedJpgs(dir) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    if (/^[0-9]+\.jpe?g$/i.test(f)) fs.unlinkSync(path.join(dir, f));
  }
}

let ok = 0;
for (const [poiId, titles] of Object.entries(FILES)) {
  const dir = path.join(PLACES, poiId);
  fs.mkdirSync(dir, { recursive: true });
  process.stdout.write(`\n${poiId}: `);

  const resolved = [];
  for (let i = 0; i < titles.length && resolved.length < 4; i += 4) {
    try {
      resolved.push(...(await resolveUrls(titles.slice(i, i + 4))));
    } catch (e) {
      process.stdout.write(`!${e.message} `);
    }
    await sleep(1500);
  }

  if (!resolved.length) {
    console.log('no hits — keep existing');
    continue;
  }

  clearNumberedJpgs(dir);
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
      process.stdout.write(`x(${e.message})`);
    }
    await sleep(1000);
  }
  console.log(` → ${n}`);
  fs.writeFileSync(
    path.join(dir, 'SOURCES.json'),
    JSON.stringify(
      {
        poiId,
        note: 'Wikimedia Commons HQ photos for famous places (free licence).',
        downloadedAt: new Date().toISOString(),
        files: sources,
      },
      null,
      2
    )
  );
  await sleep(2000);
}

console.log(`\nSaved ${ok} image files across ${Object.keys(FILES).length} famous places.`);
console.log('Next: node scripts/sync-poi-image-paths.mjs');
