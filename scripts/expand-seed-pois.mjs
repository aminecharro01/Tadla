/**
 * Append verified/approximate BMK POIs from the regional tourism list.
 * Run: node scripts/expand-seed-pois.mjs
 */
import fs from 'fs';

const path = new URL('../src/data/seedPois.json', import.meta.url);
const existing = JSON.parse(fs.readFileSync(path, 'utf8'));

const additions = [
  {
    id: 'poi-oum-er-rbia-springs',
    name: 'Sources de l’Oum Er-Rbia',
    category: 'spring',
    description:
      'Headwaters of Morocco’s Oum Er-Rbia river in the Middle Atlas near Khénifra, with dozens of freshwater and mineral springs cascading from limestone cliffs. A classic picnic and short-walk site inside the wider Aguelmame Azigza / cedar-forest landscape.',
    lat: 33.052778,
    lng: -5.413889,
    hours: 'Open year-round, daylight hours',
    images: [
      'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1600&q=80',
    ],
    source: 'Wikimapia / regional tourism references (33°3′10″N 5°24′50″W)',
  },
  {
    id: 'poi-zaouiat-cheikh-tamda',
    name: 'Sources Zaouiat Cheikh / Parc Tamda',
    category: 'spring',
    description:
      'Mountain spring complex and landscaped water park near Zaouiat Cheikh (Béni Mellal province), fed by clear natural springs — popular for family outings and weekend recreation.',
    lat: 32.6441708,
    lng: -5.916589,
    hours: 'Typically daylight hours; facilities may vary by season',
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80',
    ],
    source: 'Nominatim town center Zaouiat Cheikh — verify park entrance on site',
  },
  {
    id: 'poi-taghbalout',
    name: 'Parc de Taghbalout (El Ksiba)',
    category: 'spring',
    description:
      'Shaded pine and cedar setting around natural freshwater pools near Dir El Ksiba / Taghbalout — a cooler escape for walks and picnics in the foothills.',
    lat: 32.5522039,
    lng: -6.0129631,
    hours: 'Open year-round, daylight hours',
    images: [
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80',
    ],
    source: 'Nominatim Taghbalout, RN12 / Dir El Ksiba',
  },
  {
    id: 'poi-assif-ahansal',
    name: 'Assif Ahansal (river corridor)',
    category: 'river',
    description:
      'Major High Atlas mountain river corridor used for white-water kayaking, rafting, riverside camping, and approaches into Zaouiat Ahansal country. Conditions depend heavily on season and water levels — go with local operators.',
    lat: 31.9082587,
    lng: -6.0933353,
    hours: 'Seasonal outdoor access; guide recommended for water sports',
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80',
    ],
    source: 'Nominatim Assif Ahansal near Zaouiat Ahansal',
  },
  {
    id: 'poi-ain-kbi',
    name: 'Aïn Kbi (Fquih Ben Salah)',
    category: 'spring',
    description:
      'Quiet natural spring oasis with palm shade on the Tadla plain near Fquih Ben Salah — a local picnic and refreshment stop rather than a major tourist complex.',
    lat: 32.505,
    lng: -6.695,
    hours: 'Daylight hours',
    images: [
      'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1600&q=80',
    ],
    source: 'approximate — near Fquih Ben Salah; confirm spring access locally',
  },
  {
    id: 'poi-aguelmame-sidi-ali',
    name: 'Aguelmame Sidi Ali',
    category: 'lake',
    description:
      'High-altitude volcanic / karst lake on the Khénifra–Ifrane side of the Middle Atlas, known for tranquil mountain scenery and birdwatching. Cooler climate; pack layers.',
    lat: 33.073662,
    lng: -4.9954392,
    hours: 'Open year-round; best late spring to autumn',
    images: [
      'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1600&q=80',
    ],
    source: 'Nominatim Lac Aguelmame Sidi Ali',
  },
  {
    id: 'poi-tigelmamine',
    name: 'Lacs de Tigelmamine / Ouiouane',
    category: 'lake',
    description:
      'Twin natural lakes in the Middle Atlas forest near Oum Rabia / Aguelmous country — often nicknamed the “eyes” of the Khénifra highlands. Quiet setting for walks and photography.',
    lat: 33.1322207,
    lng: -5.3435877,
    hours: 'Open year-round, daylight hours',
    images: [
      'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1600&q=80',
    ],
    source: 'Nominatim Lac Ouiouane (Tigelmamine twin-lakes area)',
  },
  {
    id: 'poi-tamda-lake-azilal',
    name: 'Lac Tamda (Azilal / Anmiter area)',
    category: 'lake',
    description:
      'High-altitude alpine lake in the Azilal High Atlas, typically reached by scenic trekking paths near Anmiter / Aït Bouguemez approaches. Remote — plan daylight returns.',
    lat: 31.62,
    lng: -6.48,
    hours: 'Daylight; trek access only in good weather',
    images: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
    ],
    source: 'approximate — High Atlas lake near Aït Bouguemez approaches; verify trailhead',
  },
  {
    id: 'poi-mgoun-peak',
    name: 'Jebel M’Goun (Ighil M’Goun)',
    category: 'peak',
    description:
      'One of the High Atlas’s ultra-prominent summits at about 4,071 m — a multi-day trekking objective from the M’Goun / Aït Bouguemez side. Requires mountain experience or a certified guide.',
    lat: 31.50833,
    lng: -6.44333,
    hours: 'Seasonal mountaineering; summer–early autumn preferred',
    images: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
    ],
    source: 'Wikipedia / Peaklist coordinates',
  },
  {
    id: 'poi-imsfrane-cathedral',
    name: 'Cathédrale d’Imsfrane (Amsafrane)',
    category: 'geology',
    description:
      'Massive sheer rock wall near Tilougguite / Ouawizeght country, often compared to a gothic cathedral façade. Popular for hiking viewpoints and climbing with local partners.',
    lat: 31.9827289,
    lng: -6.1329576,
    hours: 'Daylight; climbing only with qualified guides',
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80',
    ],
    source: 'Nominatim Cathédrale d’Imsfrane (Amsafrane)',
  },
  {
    id: 'poi-tissilit-gorges',
    name: 'Gorges de Tissilit',
    category: 'gorge',
    description:
      'Dramatic river canyon in Azilal province used for canyoning, climbing, and wild scenery day trips. Access and difficulty vary with water levels — hire local canyon guides.',
    lat: 31.85,
    lng: -6.15,
    hours: 'Seasonal; guide strongly recommended',
    images: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
    ],
    source: 'approximate — Azilal canyon country near Ahansal approaches',
  },
  {
    id: 'poi-ahouli-mibladen',
    name: 'Vallées d’Ahouli & Mibladen',
    category: 'gorge',
    description:
      'Rugged red-rock gorges and former mining settlements on the Midelt side of the Atlas, historically linked to regional lead/silver mining. Photogenic canyons; check road conditions.',
    lat: 32.8269124,
    lng: -4.5727666,
    hours: 'Daylight; remote roads',
    images: [
      'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?auto=format&fit=crop&w=1600&q=80',
    ],
    source: 'Nominatim Aouli / Mibladen (Midelt border of the wider region)',
  },
  {
    id: 'poi-iouaridene-tracks',
    name: 'Empreintes de dinosaures d’Iouaridène',
    category: 'geology',
    description:
      'Famous Jurassic dinosaur trackways in red continental sandstones near Demnate, within the M’Goun UNESCO Global Geopark — theropod and sauropod prints protected with walkways and panels.',
    lat: 31.76667,
    lng: -6.58333,
    hours: 'Daylight; stay on marked paths to protect the prints',
    images: [
      'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1600&q=80',
    ],
    source: 'Geopark / scientific literature approximate site location near Demnate',
  },
  {
    id: 'poi-mgoun-geopark-center',
    name: 'Centre / musée du Géoparc M’Goun (Azilal)',
    category: 'geology',
    description:
      'Visitor interpretation hub for the M’Goun UNESCO Global Geopark in Azilal, with exhibits on regional geology and paleontology (including dinosaur heritage). Confirm opening hours locally before visiting.',
    lat: 31.959295,
    lng: -6.570991,
    hours: 'Check locally — often weekday daytime hours',
    images: [
      'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1600&q=80',
    ],
    source: 'Nominatim Azilal city — verify museum address on geoparc-mgoun.ma',
  },
  {
    id: 'poi-mastfrane-folds',
    name: 'Plis / formations de Mastfrane (Tillouguit)',
    category: 'geology',
    description:
      'Striking folded sedimentary rock layers visible in the Tillouguit / Ouawizeght foothills — a roadside and short-hike geology highlight of the Central High Atlas.',
    lat: 31.99,
    lng: -6.14,
    hours: 'Daylight viewpoints',
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80',
    ],
    source: 'approximate — near Imsfrane / Tillouguit geology corridor',
  },
  {
    id: 'poi-kasbah-bel-kush',
    name: 'Kasbah Bel-Kush (Fquih Ben Salah)',
    category: 'heritage',
    description:
      'Historic citadel associated with 18th-century trade-route defenses on the Tadla plain at Fquih Ben Salah. Exterior viewing is the usual visit; interior access may be limited.',
    lat: 32.504,
    lng: -6.69,
    hours: 'Exterior year-round; interior access varies',
    images: [
      'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1600&q=80',
    ],
    source: 'approximate — Fquih Ben Salah urban kasbah; confirm access',
  },
  {
    id: 'poi-kasbah-moha-hammou',
    name: 'Kasbah Moha ou Hammou Zayani (Khénifra)',
    category: 'heritage',
    description:
      'Historic Amazigh stronghold in Khénifra linked to resistance leader Moha ou Hammou Zayani. Part of the city’s heritage circuit along the Oum Er-Rbia corridor.',
    lat: 32.935,
    lng: -5.668,
    hours: 'Exterior accessible; guided visits when available',
    images: [
      'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1600&q=80',
    ],
    source: 'approximate — Khénifra historic kasbah district',
  },
  {
    id: 'poi-agadir-ait-bouguemez',
    name: 'Agadir n’Aït Bouguemez (Sidi Chita)',
    category: 'heritage',
    description:
      'Hilltop fortified communal granary (agadir) overlooking the Happy Valley, with wide 360° views over terraced fields and villages. Combine with a valley cultural walk.',
    lat: 31.68,
    lng: -6.45,
    hours: 'Daylight; ask locally before entering private compounds',
    images: [
      'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?auto=format&fit=crop&w=1600&q=80',
    ],
    source: 'approximate — Sidi Chita / Aït Bouguemez granary viewpoints',
  },
  {
    id: 'poi-zaouia-sidi-hamza',
    name: 'Zaouia de Sidi Hamza (Azilal)',
    category: 'heritage',
    description:
      'Traditional spiritual center in the Azilal Atlas, historically associated with scholarship and manuscript heritage. Visit respectfully; photography rules may apply.',
    lat: 31.9,
    lng: -6.4,
    hours: 'Respect prayer times; ask permission to enter',
    images: [
      'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1600&q=80',
    ],
    source: 'approximate — Azilal Atlas zaouia; confirm village approach',
  },
  {
    id: 'poi-ajdir-plateau',
    name: 'Plateau d’Ajdir & cédraie',
    category: 'nature',
    description:
      'High Middle Atlas forest plateau of Atlas cedar and oak near the Khénifra–Azrou approaches, habitat for Barbary macaques. Cool air; great for scenic drives and short forest walks.',
    lat: 33.02,
    lng: -5.35,
    hours: 'Daylight; watch for livestock and wildlife on roads',
    images: [
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80',
    ],
    source: 'approximate — Ajdir / Oum Rabia forest plateau corridor',
  },
  {
    id: 'poi-parc-el-ochaq',
    name: 'Parc El Ochaq (Khénifra)',
    category: 'park',
    description:
      'Central landscaped city park in Khénifra with streams, plantings, and local gathering spaces — a soft urban break between mountain day trips.',
    lat: 32.9395,
    lng: -5.6675,
    hours: 'Typically open daytime; evenings vary',
    images: [
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80',
    ],
    source: 'approximate — Khénifra city park (Parc El Ochaq / Lovers’ Park)',
  },
  {
    id: 'poi-khouribga-phosphate',
    name: 'Khouribga — patrimoine minier des phosphates',
    category: 'heritage',
    description:
      'Industrial and cultural landscape of Morocco’s phosphate industry around Khouribga, with open-pit heritage and urban visitor points that explain the region’s mining story. Pair with local museums / guided industry visits when available.',
    lat: 32.8856482,
    lng: -6.908798,
    hours: 'Urban sites vary; industrial zones are restricted',
    images: [
      'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1600&q=80',
    ],
    source: 'Nominatim Khouribga — do not enter active mine sites',
  },
  {
    id: 'poi-oued-zem-lake',
    name: 'Lac / parc central d’Oued Zem',
    category: 'park',
    description:
      'Historic city park organized around a large artificial lake created in the early 20th century — a local leisure landmark between Khouribga and the Tadla corridor.',
    lat: 32.8595417,
    lng: -6.5702485,
    hours: 'Daytime public access',
    images: [
      'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1600&q=80',
    ],
    source: 'Nominatim Rue de Lac, Oued Zem',
  },
  {
    id: 'poi-marche-central-beni-mellal',
    name: 'Marché central & vieux quartier (Béni Mellal)',
    category: 'market',
    description:
      'Vibrant central market and old-quarter streets of Béni Mellal for regional spices, olive oil, citrus, and traditional textiles. Go early; bargain politely; keep valuables secure in crowds.',
    lat: 32.3372,
    lng: -6.3498,
    hours: 'Morning peak; many stalls close midday Friday prayer',
    images: [
      'https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&w=1600&q=80',
    ],
    source: 'approximate — Béni Mellal central market / medina district',
  },
];

// Enrich existing Ouzoud / Azigza naming note in description lightly without rewriting facts wrongly
const byId = new Map(existing.map((p) => [p.id, p]));
for (const a of additions) {
  if (byId.has(a.id)) {
    console.warn('skip duplicate', a.id);
    continue;
  }
  byId.set(a.id, a);
}

// Alias note: Aguelmame Aziza == Azigza already present
const merged = [...byId.values()];
fs.writeFileSync(path, JSON.stringify(merged, null, 2) + '\n');
console.log('total POIs', merged.length);
console.log('added', additions.length);
