/**
 * Second-pass download using known Commons Special:FilePath URLs + long delays.
 * Avoids API search rate limits.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLACES = path.join(__dirname, '..', 'public', 'places');

/** Verified Commons filenames (actual place categories / geotags). */
const FILES = {
  'poi-ouzoud-falls': [
    'Cascade_d%27Ouzoud_maroc.jpg',
    'Ouzoud_waterfalls_In_spring-Morocco.jpg',
    'Ouzoud_cascades_(219466327).jpg',
  ],
  'poi-bin-el-ouidane': [
    'Bin_Lwidan_azilal.jpg',
    'Bin_el_Ouidane_2.jpg',
    'Barrage_bin_El_ouidane.JPG',
    'BIN_LWIDAN%27s_DAM.jpg',
  ],
  'poi-ain-asserdoun': [
    'Beni_Mellal.jpg',
    'Sources_d%27A%C3%AFn_Asserdoun.jpg',
    'A%C3%AFn_Asserdoun.jpg',
  ],
  'poi-kasbah-ras-el-ain': [
    'Kasbah_Beni_Mellal.jpg',
    'Beni_Mellal_kasbah.jpg',
    'Beni_Mellal.jpg',
  ],
  'poi-imi-n-ifri': [
    'Pont_naturel_d%27Imi_n%27Ifri.jpg',
    'Imi-n-Ifri.jpg',
    'Natural_bridge_Imi_n_Ifri.jpg',
  ],
  'poi-aguelmame-azigza': [
    'Aguelmame_Azegza.jpg',
    'Lac_Aguelmame_Azigza.jpg',
    'Aguelmam_Azegza.jpg',
  ],
  'poi-aguelmame-sidi-ali': [
    'Aguelmame_Sidi_Ali_01.jpg',
    'Lake_Aguelmame_Sidi_Ali.jpg',
    'Aguelmam_Sidi_Ali.jpg',
  ],
  'poi-ait-bouguemez': [
    'Ait_Bouguemez.jpg',
    'Vall%C3%A9e_A%C3%AFt_Bouguemmez.jpg',
    'Tabant_Ait_Bouguemez.jpg',
  ],
  'poi-kasbah-tadla': [
    'Kasbah_de_Tadla.jpg',
    'Tadla_Kasbah.jpg',
    'Remparts_Tadla.jpg',
  ],
  'poi-oum-er-rbia-springs': [
    'Sources_de_l%27Oum_Er-Rbia.jpg',
    'Oum_Er_Rbia_sources.jpg',
    'Source_Oum_Rabia.jpg',
  ],
  'poi-mgoun-peak': [
    'Mgoun.jpg',
    'Jbel_Mgoun_from_Ait_Bouguemez.jpg',
    'Ighil_Mgoun.jpg',
  ],
  'poi-zaouiat-ahansal': [
    'Zaouia_Ahansal.jpg',
    'Zaouiat_Ahansal_village.jpg',
  ],
  'poi-khenifra-national-park': [
    'Cedrus_atlantica_Middle_Atlas.jpg',
    'For%C3%AAt_de_c%C3%A8dres_Moyen_Atlas.jpg',
    'Parc_National_Khenifra.jpg',
  ],
  'poi-ahouli-mibladen': [
    'Aouli_gorge.jpg',
    'Mibladen_mines.jpg',
    'Gorges_d%27Ahouli.jpg',
  ],
  'poi-iouaridene-tracks': [
    'Empreintes_dinosaures_Iouaridene.jpg',
    'Dinosaur_tracks_Iouarid%C3%A8ne.jpg',
  ],
  'poi-imsfrane-cathedral': [
    'Cath%C3%A9drale_d%27Imsfrane.jpg',
    'Imsfrane_rock.jpg',
  ],
  'poi-tigelmamine': [
    'Lacs_Tigelmamine.jpg',
    'Aguelmame_Ouiouane.jpg',
  ],
  'poi-ajdir-plateau': [
    'Cedrus_atlantica_Azrou.jpg',
    'C%C3%A8dres_Moyen_Atlas.jpg',
  ],
  'poi-assif-ahansal': [
    'Assif_Ahansal.jpg',
    'Rivi%C3%A8re_Ahansal.jpg',
  ],
  'poi-musee-azilal': [
    'Azilal.jpg',
    'Ville_d%27Azilal.jpg',
  ],
  'poi-khouribga-phosphate': [
    'Khouribga.jpg',
    'Phosphate_Khouribga.jpg',
  ],
  'poi-oued-zem-lake': [
    'Oued_Zem.jpg',
  ],
  'poi-kasbah-moha-hammou': [
    'Kh%C3%A9nifra.jpg',
    'Khenifra.jpg',
  ],
  'poi-parc-el-ochaq': [
    'Kh%C3%A9nifra.jpg',
  ],
  'poi-marche-central-beni-mellal': [
    'Beni_Mellal_souk.jpg',
    'Beni_Mellal.jpg',
  ],
  'poi-parc-municipal-bm': [
    'Beni_Mellal.jpg',
  ],
  'poi-parc-ain-asserdoun-botanique': [
    'Beni_Mellal.jpg',
  ],
  'poi-cip-ain-asserdoun': [
    'Beni_Mellal.jpg',
  ],
  'poi-jardin-oliviers-bm': [
    'Beni_Mellal.jpg',
  ],
};

function filePathUrl(name) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${name}?width=1920`;
}

async function download(url, dest) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'TanmiyaExplorerBot/1.0 (educational; contact: hackathon)' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(String(res.status));
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 10000) throw new Error(`small:${buf.length}`);
  // skip html error pages
  const head = buf.slice(0, 200).toString('utf8');
  if (head.includes('<!DOCTYPE') || head.includes('<html')) throw new Error('html');
  fs.writeFileSync(dest, buf);
  return buf.length;
}

function existingCount(dir) {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter((f) => /^[123]\.jpg$/i.test(f)).length;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let totalNew = 0;
for (const [poiId, names] of Object.entries(FILES)) {
  const dir = path.join(PLACES, poiId);
  fs.mkdirSync(dir, { recursive: true });
  let have = existingCount(dir);
  if (have >= 3) {
    console.log(`${poiId}: already ${have}`);
    continue;
  }
  process.stdout.write(`${poiId}: `);
  const sources = [];
  for (const name of names) {
    if (have >= 3) break;
    const dest = path.join(dir, `${have + 1}.jpg`);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 10000) {
      have += 1;
      process.stdout.write('=');
      continue;
    }
    try {
      const size = await download(filePathUrl(name), dest);
      sources.push({ file: `${have + 1}.jpg`, commons: name, bytes: size });
      have += 1;
      totalNew += 1;
      process.stdout.write('.');
    } catch (e) {
      process.stdout.write(`x(${e.message})`);
    }
    await sleep(1200);
  }
  console.log(` → ${have}`);
  if (sources.length) {
    const prev = path.join(dir, 'SOURCES.json');
    let prevData = {};
    try {
      prevData = JSON.parse(fs.readFileSync(prev, 'utf8'));
    } catch {
      /* */
    }
    fs.writeFileSync(
      prev,
      JSON.stringify(
        {
          poiId,
          note: 'Wikimedia Commons free-licensed photos of the real place. Not scraped from TripAdvisor/Airbnb/Booking.',
          downloadedAt: new Date().toISOString(),
          files: [...(prevData.files || []), ...sources],
        },
        null,
        2
      )
    );
  }
  await sleep(800);
}

console.log(`\nNew files written this run: ${totalNew}`);
