/**
 * Retry HQ Commons downloads one file at a time (avoids 429).
 * Skips POIs that already have >= 2 numbered jpgs unless --force.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLACES = path.join(__dirname, '..', 'public', 'places');
const UA = 'TanmiyaExplorerBot/1.0 (educational; BMK tourism catalog)';
const force = process.argv.includes('--force');

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
  'poi-zaouiat-ahansal': ['Zaouiat Ahansal.jpg', 'Zaouia Ahansal.jpg'],
  'poi-oum-er-rbia-springs': ["Sources de l'Oum Er-Rbia.jpg", 'Oum Er-Rbia.jpg'],
  'poi-mgoun-peak': ["Ighil M'Goun.jpg", 'Jbel Mgoun.jpg'],
  'poi-aguelmame-sidi-ali': ['Aguelmame Sidi Ali.jpg', 'Lac Aguelmame Sidi Ali.jpg'],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function countJpgs(dir) {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter((f) => /^[0-9]+\.jpe?g$/i.test(f)).length;
}

async function resolveOne(title) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const url = `https://commons.wikimedia.org/w/api.php?${new URLSearchParams({
      action: 'query',
      titles: `File:${title}`,
      prop: 'imageinfo',
      iiprop: 'url|mime|size',
      iiurlwidth: '1920',
      format: 'json',
      origin: '*',
    })}`;
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.status === 429) {
      const wait = 20000 + attempt * 15000;
      console.warn(`  429 resolve, wait ${wait / 1000}s`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) throw new Error(`api ${res.status}`);
    const data = await res.json();
    const page = Object.values(data?.query?.pages || {})[0];
    if (!page || page.missing != null) return null;
    const ii = page.imageinfo?.[0];
    if (!ii || !String(ii.mime || '').startsWith('image/')) return null;
    return { title: page.title, url: ii.thumburl || ii.url };
  }
  return null;
}

async function download(url, dest) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
    if (res.status === 429) {
      const wait = 25000 + attempt * 15000;
      console.warn(`  429 download, wait ${wait / 1000}s`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) throw new Error(String(res.status));
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 25000) throw new Error(`small ${buf.length}`);
    fs.writeFileSync(dest, buf);
    return buf.length;
  }
  throw new Error('429 persistent');
}

let ok = 0;
for (const [poiId, titles] of Object.entries(FILES)) {
  const dir = path.join(PLACES, poiId);
  fs.mkdirSync(dir, { recursive: true });
  const existing = countJpgs(dir);
  if (!force && existing >= 2) {
    console.log(`skip ${poiId} (${existing} already)`);
    continue;
  }

  console.log(`\n${poiId} (have ${existing}):`);
  const sourcesPath = path.join(dir, 'SOURCES.json');
  let sources = [];
  if (fs.existsSync(sourcesPath)) {
    try {
      sources = JSON.parse(fs.readFileSync(sourcesPath, 'utf8')).files || [];
    } catch {
      sources = [];
    }
  }

  let n = existing;
  // continue numbering from existing+1 if not force
  if (force) {
    for (const f of fs.readdirSync(dir)) {
      if (/^[0-9]+\.jpe?g$/i.test(f)) fs.unlinkSync(path.join(dir, f));
    }
    n = 0;
    sources = [];
  }

  for (const title of titles) {
    if (n >= 3) break;
    process.stdout.write(`  ${title.slice(0, 50)}… `);
    try {
      const resolved = await resolveOne(title);
      await sleep(3000);
      if (!resolved) {
        console.log('missing');
        continue;
      }
      const dest = path.join(dir, `${n + 1}.jpg`);
      const bytes = await download(resolved.url, dest);
      sources.push({ file: `${n + 1}.jpg`, commons: resolved.title, bytes, url: resolved.url });
      n += 1;
      ok += 1;
      console.log(`ok ${(bytes / 1024).toFixed(0)}KB`);
    } catch (e) {
      console.log('FAIL', e.message);
    }
    await sleep(5000);
  }

  fs.writeFileSync(
    sourcesPath,
    JSON.stringify(
      {
        poiId,
        note: 'Wikimedia Commons HQ photos for famous places.',
        downloadedAt: new Date().toISOString(),
        files: sources,
      },
      null,
      2
    )
  );
}

console.log(`\nDone. New/updated files this run: ${ok}`);
