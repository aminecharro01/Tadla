/**
 * Download real place photos via the official Google Places API (New).
 * Does NOT scrape Google Maps HTML — requires a Maps/Places API key.
 *
 * Usage:
 *   set GOOGLE_MAPS_API_KEY=...   (or VITE_GOOGLE_MAPS_API_KEY in .env)
 *   node scripts/fetch-google-place-photos.mjs
 *   node scripts/fetch-google-place-photos.mjs --force
 *   node scripts/fetch-google-place-photos.mjs --only=poi-ouzoud-falls,poi-bin-el-ouidane
 *
 * Enable in Google Cloud: Places API (New). Restrict the key for server use.
 * Then: node scripts/sync-poi-image-paths.mjs  + Admin re-seed.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const seedPath = path.join(root, 'src', 'data', 'seedPois.json');
const placesRoot = path.join(root, 'public', 'places');

const args = process.argv.slice(2);
const force = args.includes('--force');
const onlyArg = args.find((a) => a.startsWith('--only='));
const only = onlyArg
  ? onlyArg
      .slice('--only='.length)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  : null;
const maxPhotos = 4;

function loadEnvFile() {
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile();

const apiKey =
  process.env.GOOGLE_MAPS_API_KEY?.trim() ||
  process.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ||
  '';

if (!apiKey) {
  console.error(`
Missing API key.

1. Google Cloud Console → enable "Places API (New)"
2. Create an API key
3. Add to .env:
   GOOGLE_MAPS_API_KEY=your_key
   # optional for runtime Street View covers:
   VITE_GOOGLE_MAPS_API_KEY=your_key

We cannot scrape Google Maps photo URLs — Places API is the allowed path.
`);
  process.exit(1);
}

const pois = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
const targets = only ? pois.filter((p) => only.includes(p.id)) : pois;

function countLocalPhotos(poiId) {
  const dir = path.join(placesRoot, poiId);
  if (!fs.existsSync(dir)) return 0;
  return fs
    .readdirSync(dir)
    .filter((f) => /^[0-9]+\.jpe?g$/i.test(f))
    .filter((f) => fs.statSync(path.join(dir, f)).size > 20000).length;
}

async function searchPlace(poi) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.photos,places.location,places.formattedAddress',
    },
    body: JSON.stringify({
      textQuery: `${poi.name} Béni Mellal Khénifra Morocco`,
      maxResultCount: 3,
      locationBias: {
        circle: {
          center: { latitude: Number(poi.lat), longitude: Number(poi.lng) },
          radius: 8000,
        },
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || res.statusText;
    throw new Error(`searchText ${poi.id}: ${msg}`);
  }
  const places = Array.isArray(data.places) ? data.places : [];
  if (!places.length) return null;
  // Prefer a result that has photos and is near the seed coords
  const scored = places.map((pl) => {
    const lat = pl.location?.latitude;
    const lng = pl.location?.longitude;
    let dist = 999;
    if (lat != null && lng != null) {
      dist =
        Math.hypot(Number(lat) - Number(poi.lat), Number(lng) - Number(poi.lng)) *
        111;
    }
    const photos = Array.isArray(pl.photos) ? pl.photos.length : 0;
    return { pl, dist, photos };
  });
  scored.sort((a, b) => b.photos - a.photos || a.dist - b.dist);
  return scored[0].pl;
}

async function downloadPhoto(photoName, destFile) {
  const url = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=1600&maxWidthPx=1600&key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`photo media ${res.status} ${photoName}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 8000) throw new Error(`photo too small (${buf.length}b)`);
  fs.writeFileSync(destFile, buf);
  return buf.length;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

let ok = 0;
let skipped = 0;
let failed = 0;

for (const poi of targets) {
  const existing = countLocalPhotos(poi.id);
  if (!force && existing >= 2) {
    console.log(`skip ${poi.id} (${existing} local photos)`);
    skipped += 1;
    continue;
  }

  process.stdout.write(`fetch ${poi.id} … `);
  try {
    const place = await searchPlace(poi);
    const photos = Array.isArray(place?.photos) ? place.photos : [];
    if (!photos.length) {
      console.log('no Google photos');
      failed += 1;
      await sleep(200);
      continue;
    }

    const dir = path.join(placesRoot, poi.id);
    fs.mkdirSync(dir, { recursive: true });
    const sources = {
      provider: 'Google Places API (New)',
      placeId: place.id || null,
      displayName: place.displayName?.text || null,
      address: place.formattedAddress || null,
      fetchedAt: new Date().toISOString(),
      photos: [],
    };

    let saved = 0;
    for (let i = 0; i < Math.min(maxPhotos, photos.length); i += 1) {
      const photo = photos[i];
      const dest = path.join(dir, `${i + 1}.jpg`);
      try {
        const bytes = await downloadPhoto(photo.name, dest);
        sources.photos.push({
          file: `${i + 1}.jpg`,
          name: photo.name,
          attributions: photo.authorAttributions || [],
          bytes,
        });
        saved += 1;
        await sleep(250);
      } catch (err) {
        console.warn(`\n  warn ${poi.id} photo ${i + 1}:`, err.message);
      }
    }

    fs.writeFileSync(
      path.join(dir, 'SOURCES.json'),
      JSON.stringify(sources, null, 2) + '\n'
    );
    console.log(`saved ${saved}/${photos.length} → ${place.displayName?.text || place.id}`);
    ok += 1;
    await sleep(350);
  } catch (err) {
    console.log('FAIL', err.message);
    failed += 1;
    await sleep(500);
  }
}

console.log(`\nDone. ok=${ok} skipped=${skipped} failed=${failed}`);
console.log('Next: node scripts/sync-poi-image-paths.mjs  then Admin → re-seed places.');
