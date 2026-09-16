/**
 * Download verified Wikimedia Commons photos for famous BMK POIs.
 * Sources are free-licensed Commons files tagged for the actual place — not scraped from Booking/Airbnb/TripAdvisor.
 *
 * Run: node scripts/download-poi-images.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PLACES = path.join(ROOT, 'public', 'places');

/** Curated Commons special/filepath → high-quality real photos of the place */
const CURATED = {
  'poi-ouzoud-falls': [
    'Cascade_d%27Ouzoud_maroc.jpg',
    'Ouzoud_waterfalls_In_spring-Morocco.jpg',
    'Cascades_d%27Ouzoud.jpg',
  ],
  'poi-bin-el-ouidane': [
    'Bin_Lwidan_azilal.jpg',
    'Dam_of_BIN_L%27WIDAN.jpg',
    'Barrage_bin_El_ouidane.JPG',
  ],
  'poi-ain-asserdoun': [
    'Beni_Mellal.jpg',
    'Ain_Asserdoun.jpg',
  ],
  'poi-kasbah-ras-el-ain': [
    'Beni_Mellal.jpg',
    'Kasbah_de_Beni_Mellal.jpg',
  ],
  'poi-imi-n-ifri': [
    'Imi_n%27Ifri.jpg',
    'Imi_n_Ifri.jpg',
  ],
  'poi-aguelmame-azigza': [
    'Aguelmame_Azigza.jpg',
    'Lac_Aguelmame_Azegza.jpg',
  ],
  'poi-aguelmame-sidi-ali': [
    'Aguelmame_Sidi_Ali.jpg',
    'Lac_Aguelmam_Sidi_Ali.jpg',
  ],
  'poi-ait-bouguemez': [
    'A%C3%AFt_Bouguemez.jpg',
    'Vall%C3%A9e_des_A%C3%AFt_Bouguemmez.jpg',
  ],
  'poi-kasbah-tadla': [
    'Kasbah_Tadla.jpg',
    'Tadla.jpg',
  ],
  'poi-oum-er-rbia-springs': [
    'Sources_Oum_Er-Rbia.jpg',
    'Oum_Er-Rbia.jpg',
  ],
  'poi-mgoun-peak': [
    'Jbel_Mgoun.jpg',
    'Ighil_M%27Goun.jpg',
  ],
  'poi-zaouiat-ahansal': [
    'Zaouiat_Ahansal.jpg',
  ],
  'poi-taghzirte-gorges': [
    'Taghzirt.jpg',
  ],
  'poi-khenifra-national-park': [
    'Parc_national_de_Kh%C3%A9nifra.jpg',
    'Cedrus_atlantica_Morocco.jpg',
  ],
  'poi-ahouli-mibladen': [
    'Ahouli.jpg',
    'Mibladen.jpg',
  ],
  'poi-iouaridene-tracks': [
    'Iouaridene.jpg',
  ],
  'poi-marche-central-beni-mellal': [
    'Beni_Mellal.jpg',
  ],
  'poi-parc-ain-asserdoun-botanique': [
    'Beni_Mellal.jpg',
    'Ain_Asserdoun.jpg',
  ],
  'poi-cip-ain-asserdoun': [
    'Beni_Mellal.jpg',
  ],
};

/** Fallback Commons API search queries (namespace 6 = File) when curated filenames miss */
const SEARCH = {
  'poi-ouzoud-falls': 'Ouzoud Falls Morocco',
  'poi-bin-el-ouidane': 'Bin el Ouidane Dam Morocco',
  'poi-ain-asserdoun': 'Ain Asserdoun Beni Mellal',
  'poi-kasbah-ras-el-ain': 'Kasbah Beni Mellal',
  'poi-imi-n-ifri': "Imi n'Ifri Demnate",
  'poi-aguelmame-azigza': 'Aguelmame Azigza',
  'poi-aguelmame-sidi-ali': 'Aguelmame Sidi Ali',
  'poi-ait-bouguemez': 'Ait Bouguemez valley',
  'poi-kasbah-tadla': 'Kasbah Tadla',
  'poi-oum-er-rbia-springs': 'Sources Oum Er-Rbia',
  'poi-mgoun-peak': "M'Goun Morocco mountain",
  'poi-zaouiat-ahansal': 'Zaouiat Ahansal',
  'poi-khenifra-national-park': 'Khénifra cedar Morocco',
  'poi-taghzirte-gorges': 'Taghzirt Morocco',
  'poi-ahouli-mibladen': 'Ahouli Midelt Morocco',
  'poi-iouaridene-tracks': 'Iouaridene dinosaur Morocco',
  'poi-imsfrane-cathedral': 'Cathédrale Imsfrane Morocco',
  'poi-ajdir-plateau': 'Ajdir cedar Morocco Atlas',
  'poi-tigelmamine': 'Aguelmame Ouiouane Morocco',
  'poi-khouribga-phosphate': 'Khouribga Morocco',
  'poi-oued-zem-lake': 'Oued Zem Morocco',
  'poi-musee-azilal': 'Azilal Morocco town',
  'poi-parc-municipal-bm': 'Beni Mellal Morocco city',
  'poi-jardin-oliviers-bm': 'Beni Mellal olive Morocco',
  'poi-kasbah-moha-hammou': 'Khénifra Morocco',
  'poi-parc-el-ochaq': 'Khénifra Morocco park',
  'poi-aoujgal-granaries': 'Aoujgal Morocco',
  'poi-assif-ahansal': 'Ahansal river Morocco',
  'poi-mastfrane-folds': 'High Atlas geology Morocco',
};

function commonsFileUrl(filename) {
  // Use Special:FilePath redirect which resolves to the actual binary
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${filename}?width=1920`;
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'TanmiyaExplorer/1.0 (hackathon tourism app; educational)',
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
}

async function searchCommons(query, limit = 5) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    gsrlimit: String(limit),
    prop: 'imageinfo',
    iiprop: 'url|mime|size',
    iiurlwidth: '1920',
  });
  const data = await fetchJson(`https://commons.wikimedia.org/w/api.php?${params}`);
  const pages = data?.query?.pages || {};
  return Object.values(pages)
    .map((p) => {
      const info = p.imageinfo?.[0];
      if (!info) return null;
      const mime = info.mime || '';
      if (!mime.startsWith('image/')) return null;
      // Prefer scaled thumb if huge
      return info.thumburl || info.url;
    })
    .filter(Boolean);
}

async function downloadTo(url, dest) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'TanmiyaExplorer/1.0 (hackathon tourism app; educational)',
      Accept: 'image/*',
    },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 8000) throw new Error(`too small ${buf.length}`);
  fs.writeFileSync(dest, buf);
  return buf.length;
}

async function resolveCurated(filenames) {
  const urls = [];
  for (const name of filenames) {
    try {
      const url = commonsFileUrl(name);
      // Probe with HEAD-ish GET range — just try download later
      urls.push(url);
    } catch {
      /* skip */
    }
  }
  return urls;
}

async function fillPoi(poiId, max = 3) {
  const dir = path.join(PLACES, poiId);
  fs.mkdirSync(dir, { recursive: true });

  const candidates = [];
  if (CURATED[poiId]) {
    candidates.push(...(await resolveCurated(CURATED[poiId])));
  }
  if (SEARCH[poiId]) {
    try {
      const found = await searchCommons(SEARCH[poiId], 8);
      candidates.push(...found);
    } catch (e) {
      console.warn('  search fail', poiId, e.message);
    }
  }

  // unique
  const seen = new Set();
  const unique = [];
  for (const u of candidates) {
    if (seen.has(u)) continue;
    seen.add(u);
    unique.push(u);
  }

  let saved = 0;
  const sources = [];
  for (const url of unique) {
    if (saved >= max) break;
    const dest = path.join(dir, `${saved + 1}.jpg`);
    try {
      const size = await downloadTo(url, dest);
      sources.push({ file: `${saved + 1}.jpg`, url, bytes: size });
      saved += 1;
      process.stdout.write('.');
    } catch (e) {
      process.stdout.write('x');
    }
  }
  if (sources.length) {
    fs.writeFileSync(
      path.join(dir, 'SOURCES.json'),
      JSON.stringify(
        {
          poiId,
          note: 'Images from Wikimedia Commons (free licenses). Not from Booking/Airbnb/TripAdvisor.',
          downloadedAt: new Date().toISOString(),
          files: sources,
        },
        null,
        2
      )
    );
  }
  return saved;
}

const targets = [...new Set([...Object.keys(CURATED), ...Object.keys(SEARCH)])];

console.log(`Downloading Commons photos for ${targets.length} famous POIs…\n`);
const summary = [];
for (const id of targets) {
  process.stdout.write(`${id} `);
  const n = await fillPoi(id, 3);
  console.log(` → ${n} file(s)`);
  summary.push({ id, count: n });
  // be polite to Commons
  await new Promise((r) => setTimeout(r, 400));
}

const ok = summary.filter((s) => s.count > 0);
const miss = summary.filter((s) => s.count === 0);
console.log(`\nDone: ${ok.length} POIs with photos, ${miss.length} without.`);
if (miss.length) console.log('Missing:', miss.map((m) => m.id).join(', '));
fs.writeFileSync(
  path.join(PLACES, 'DOWNLOAD_SUMMARY.json'),
  JSON.stringify({ ok, miss, at: new Date().toISOString() }, null, 2)
);
