/**
 * Download from Commons categories (verified place galleries) with polite delays.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLACES = path.join(__dirname, '..', 'public', 'places');
const UA = 'TanmiyaExplorerBot/1.0 (educational tourism catalog; hackathon)';

/** Commons category → POI (only categories that are clearly the right place) */
const CATEGORIES = {
  'poi-ouzoud-falls': 'Category:Ouzoud_Falls',
  'poi-bin-el-ouidane': 'Category:Bin_el_Ouidane_Reservoir',
  'poi-imi-n-ifri': "Category:Imi_n'Ifri",
  'poi-aguelmame-azigza': 'Category:Aguelmame_Azigza',
  'poi-aguelmame-sidi-ali': 'Category:Aguelmame_Sidi_Ali',
  'poi-ait-bouguemez': 'Category:Aït_Bouguemez',
  'poi-kasbah-tadla': 'Category:Kasbah_of_Tadla',
  'poi-oum-er-rbia-springs': 'Category:Oum_Er-Rbia_River',
  'poi-mgoun-peak': "Category:M'Goun",
  'poi-zaouiat-ahansal': 'Category:Zaouiat_Ahansal',
  'poi-ahouli-mibladen': 'Category:Ahouli',
  'poi-iouaridene-tracks': 'Category:Iouaridene',
  'poi-ain-asserdoun': 'Category:Aïn_Asserdoun',
  'poi-kasbah-ras-el-ain': 'Category:Béni_Mellal',
  'poi-marche-central-beni-mellal': 'Category:Béni_Mellal',
  'poi-parc-municipal-bm': 'Category:Béni_Mellal',
  'poi-parc-ain-asserdoun-botanique': 'Category:Aïn_Asserdoun',
  'poi-cip-ain-asserdoun': 'Category:Aïn_Asserdoun',
  'poi-jardin-oliviers-bm': 'Category:Béni_Mellal',
  'poi-khouribga-phosphate': 'Category:Khouribga',
  'poi-oued-zem-lake': 'Category:Oued_Zem',
  'poi-kasbah-moha-hammou': 'Category:Khénifra',
  'poi-parc-el-ochaq': 'Category:Khénifra',
  'poi-musee-azilal': 'Category:Azilal',
  'poi-khenifra-national-park': 'Category:Cedrus_atlantica',
  'poi-ajdir-plateau': 'Category:Cedrus_atlantica',
  'poi-imsfrane-cathedral': 'Category:Imsfrane',
  'poi-tigelmamine': 'Category:Aguelmame_Ouiouane',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(params) {
  const url = `https://commons.wikimedia.org/w/api.php?${new URLSearchParams({
    format: 'json',
    origin: '*',
    ...params,
  })}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (res.status === 429) {
    console.warn('  rate limited, waiting 20s…');
    await sleep(20000);
    return api(params);
  }
  if (!res.ok) throw new Error(`api ${res.status}`);
  return res.json();
}

async function categoryFiles(cat, limit = 12) {
  const data = await api({
    action: 'query',
    list: 'categorymembers',
    cmtitle: cat,
    cmtype: 'file',
    cmlimit: String(limit),
  });
  return (data?.query?.categorymembers || [])
    .map((m) => m.title.replace(/^File:/, ''))
    .filter((t) => /\.(jpe?g|png|webp)$/i.test(t));
}

async function imageInfo(titles) {
  if (!titles.length) return [];
  const data = await api({
    action: 'query',
    titles: titles.map((t) => (t.startsWith('File:') ? t : `File:${t}`)).join('|'),
    prop: 'imageinfo',
    iiprop: 'url|mime|size',
    iiurlwidth: '1920',
  });
  const pages = Object.values(data?.query?.pages || {});
  return pages
    .map((p) => {
      const ii = p.imageinfo?.[0];
      if (!ii || !String(ii.mime || '').startsWith('image/')) return null;
      if ((ii.size || 0) < 30000 && !(ii.thumburl)) return null;
      return { title: p.title, url: ii.thumburl || ii.url, size: ii.size };
    })
    .filter(Boolean);
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
  if (!res.ok) throw new Error(String(res.status));
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 12000) throw new Error(`small ${buf.length}`);
  const head = buf.slice(0, 80).toString('utf8');
  if (head.includes('<html') || head.includes('<!DOCTYPE')) throw new Error('html');
  fs.writeFileSync(dest, buf);
  return buf.length;
}

function countJpgs(dir) {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter((f) => /^[123]\.jpe?g$/i.test(f)).length;
}

let written = 0;
for (const [poiId, cat] of Object.entries(CATEGORIES)) {
  const dir = path.join(PLACES, poiId);
  fs.mkdirSync(dir, { recursive: true });
  let have = countJpgs(dir);
  if (have >= 3) {
    console.log(`${poiId}: ok (${have})`);
    continue;
  }
  process.stdout.write(`${poiId} ← ${cat} `);
  let files = [];
  try {
    files = await categoryFiles(cat, 15);
  } catch (e) {
    console.log(`FAIL list ${e.message}`);
    await sleep(3000);
    continue;
  }
  if (!files.length) {
    console.log('empty category');
    await sleep(1500);
    continue;
  }

  // batch imageinfo in chunks of 5
  const infos = [];
  for (let i = 0; i < files.length && infos.length < 8; i += 5) {
    try {
      infos.push(...(await imageInfo(files.slice(i, i + 5))));
    } catch (e) {
      process.stdout.write(`!${e.message}`);
    }
    await sleep(1500);
  }

  const sources = [];
  for (const info of infos) {
    if (have >= 3) break;
    const dest = path.join(dir, `${have + 1}.jpg`);
    try {
      const bytes = await download(info.url, dest);
      sources.push({ file: `${have + 1}.jpg`, commons: info.title, bytes, url: info.url });
      have += 1;
      written += 1;
      process.stdout.write('.');
    } catch (e) {
      process.stdout.write('x');
    }
    await sleep(1000);
  }
  console.log(` → ${have}`);
  if (sources.length) {
    fs.writeFileSync(
      path.join(dir, 'SOURCES.json'),
      JSON.stringify(
        {
          poiId,
          category: cat,
          note: 'Wikimedia Commons — free licenses, category-verified place photos. NOT from TripAdvisor/Airbnb/Booking (copyright).',
          downloadedAt: new Date().toISOString(),
          files: sources,
        },
        null,
        2
      )
    );
  }
  await sleep(2500);
}

console.log(`\nNew downloads: ${written}`);
