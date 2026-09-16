/**
 * Append museums & parks for BMK; promote Musée d'Azilal.
 * Images: remote URL first (works now); local /places/{id}/cover.jpg second (swap to first when you add the file).
 * Run: node scripts/add-museums-parks.mjs
 */
import fs from 'fs';

const path = new URL('../src/data/seedPois.json', import.meta.url);
const pois = JSON.parse(fs.readFileSync(path, 'utf8'));
const byId = new Map(pois.map((p) => [p.id, p]));

function imgs(remote, localPath) {
  return [remote, localPath].filter(Boolean);
}

// Upgrade existing geopark hub → official Musée d'Azilal
const oldGeo = byId.get('poi-mgoun-geopark-center') || byId.get('poi-musee-azilal');
if (oldGeo) {
  byId.delete('poi-mgoun-geopark-center');
  byId.delete('poi-musee-azilal');
  byId.set('poi-musee-azilal', {
    ...oldGeo,
    id: 'poi-musee-azilal',
    name: 'Musée d’Azilal (Géoparc M’Goun)',
    category: 'museum',
    description:
      'National museums network site in Azilal dedicated to earth sciences and the M’Goun UNESCO Global Geopark. Circular “Temple of Knowledge” trail with fossils, minerals, regional biodiversity, and the Atlasaurus dinosaur display. Address: Avenue Hassan II, administrative quarter, Azilal.',
    hours: 'Check FNM / local hours — typically daytime; closed some Mondays',
    lat: 31.9615,
    lng: -6.5698,
    source: 'FNM Musée d’Azilal — Avenue Hassan II, Azilal',
    images: imgs(
      'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1600&q=80',
      '/places/poi-musee-azilal/cover.jpg'
    ),
  });
}

const additions = [
  {
    id: 'poi-cip-ain-asserdoun',
    name: 'CIP / Musée d’Aïn Asserdoun',
    category: 'museum',
    description:
      'Centre d’Interprétation du Patrimoine in the Aïn Asserdoun gardens (Béni Mellal): digital and physical exhibits on regional nature, archaeology, Amazigh architecture (igherman), crafts, costumes, and performing arts (Ahwach / Ahidous). Pair with the terraced spring gardens just outside.',
    lat: 32.3254,
    lng: -6.3362,
    hours: 'Daytime museum hours; ticketed — check ministry culture e-services',
    images: imgs(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Beni_Mellal.jpg/1920px-Beni_Mellal.jpg',
      '/places/poi-cip-ain-asserdoun/cover.jpg'
    ),
    source: 'Ministère de la Culture — CIP Ain Assardoun (approx. garden complex)',
  },
  {
    id: 'poi-musee-resistance-bm',
    name: 'Espace de la Mémoire (Résistance & Libération) — Béni Mellal',
    category: 'museum',
    description:
      'Local history museum dedicated to the region’s role in Morocco’s resistance and independence struggle, with photographs, documents, and artifacts. A focused cultural stop in Béni Mellal city.',
    lat: 32.3395,
    lng: -6.3605,
    hours: 'Weekday daytime hours — confirm locally before visiting',
    images: imgs(
      'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1600&q=80',
      '/places/poi-musee-resistance-bm/cover.jpg'
    ),
    source: 'approximate — Béni Mellal urban cultural district',
  },
  {
    id: 'poi-maison-geoparc-bouguemez',
    name: 'Maison du Géoparc — Aït Bouguemez',
    category: 'museum',
    description:
      'Geopark visitor house in the Happy Valley: orientation to M’Goun geosites, local culture, and hiking options. Useful first stop before multi-day treks in Aït Bouguemez.',
    lat: 31.66111,
    lng: -6.44375,
    hours: 'Seasonal / daytime — ask in Tabant or at the house',
    images: imgs(
      'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1600&q=80',
      '/places/poi-maison-geoparc-bouguemez/cover.jpg'
    ),
    source: 'M’Goun Geopark houses network — Aït Bouguemez (approx. valley center)',
  },
  {
    id: 'poi-maison-geoparc-ahansal',
    name: 'Maison du Géoparc — Zaouiat Ahansal',
    category: 'museum',
    description:
      'Geopark interpretation house serving the Ahansal corridor: canyon access info, village heritage, and trail orientation for visitors exploring gorges and climbing areas.',
    lat: 31.85,
    lng: -6.133,
    hours: 'Seasonal / daytime — confirm on arrival',
    images: imgs(
      'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1600&q=80',
      '/places/poi-maison-geoparc-ahansal/cover.jpg'
    ),
    source: 'M’Goun Geopark houses — Zaouiat Ahansal (approx.)',
  },
  {
    id: 'poi-maison-geoparc-iouaridene',
    name: 'Maison du Géoparc — Iouaridène',
    category: 'museum',
    description:
      'Geopark house near the famous dinosaur trackways of Iouaridène (Demnate side): context for Jurassic footprints and responsible visiting of geosites.',
    lat: 31.77,
    lng: -6.59,
    hours: 'Daytime when staffed — combine with the trackway visit',
    images: imgs(
      'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1600&q=80',
      '/places/poi-maison-geoparc-iouaridene/cover.jpg'
    ),
    source: 'M’Goun Geopark houses — Iouaridène (approx. near trackways)',
  },
  {
    id: 'poi-parc-municipal-bm',
    name: 'Parc municipal de Béni Mellal',
    category: 'park',
    description:
      'Central urban green space in Béni Mellal for evening walks, family outings, and a soft break between heritage and mountain day trips. Shaded paths and local gathering spots.',
    lat: 32.3378,
    lng: -6.3535,
    hours: 'Open year-round, typically daylight to evening',
    images: imgs(
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80',
      '/places/poi-parc-municipal-bm/cover.jpg'
    ),
    source: 'approximate — Béni Mellal city park / public garden area',
  },
  {
    id: 'poi-jardin-oliviers-bm',
    name: 'Vergers & oliveraies périurbaines (Béni Mellal)',
    category: 'park',
    description:
      'Olive grove belts surrounding Béni Mellal that act as informal green parks — cool walks and rural scenery at the foot of the Middle Atlas, especially pleasant in late afternoon.',
    lat: 32.318,
    lng: -6.37,
    hours: 'Daylight; respect private orchard access',
    images: imgs(
      'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1600&q=80',
      '/places/poi-jardin-oliviers-bm/cover.jpg'
    ),
    source: 'approximate — olive belt southwest of Béni Mellal',
  },
  {
    id: 'poi-parc-ain-asserdoun-botanique',
    name: 'Jardins botaniques d’Aïn Asserdoun',
    category: 'park',
    description:
      'Terraced botanical gardens around the Aïn Asserdoun spring complex: roses, fruit trees, shaded picnic lawns, and paths linking the spring pools to the hilltop kasbah and CIP museum.',
    lat: 32.3249,
    lng: -6.3354,
    hours: 'Aligned with Ain Asserdoun garden access (often 9:00–17:00)',
    images: imgs(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Beni_Mellal.jpg/1920px-Beni_Mellal.jpg',
      '/places/poi-parc-ain-asserdoun-botanique/cover.jpg'
    ),
    source: 'Aïn Asserdoun garden complex — distinct from the spring pools POI',
  },
];

for (const a of additions) {
  if (byId.has(a.id)) {
    console.warn('skip existing', a.id);
    continue;
  }
  byId.set(a.id, a);
}

// Document local path slot for Ouzoud (remote stays first until you add cover.jpg)
const ouzoud = byId.get('poi-ouzoud-falls');
if (ouzoud) {
  const remote = (ouzoud.images || []).filter((u) => String(u).startsWith('http'));
  const local = '/places/poi-ouzoud-falls/cover.jpg';
  ouzoud.images = [...remote, local].filter((u, i, arr) => arr.indexOf(u) === i);
}

const merged = [...byId.values()];
fs.writeFileSync(path, JSON.stringify(merged, null, 2) + '\n');
console.log('total', merged.length);
console.log(
  'museums',
  merged.filter((p) => p.category === 'museum').map((p) => p.id).join(', ')
);
console.log(
  'parks',
  merged.filter((p) => p.category === 'park').map((p) => p.id).join(', ')
);
