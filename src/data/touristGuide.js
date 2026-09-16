/**
 * Practical tourist helpers for BMK — estimates & tips, not invented POI history.
 * Budget figures are indicative ranges for planning only.
 */

export const EMERGENCY_CONTACTS = [
  { id: 'police', dial: '190', icon: 'local_police', labelKey: 'emPolice' },
  { id: 'ambulance', dial: '150', icon: 'emergency', labelKey: 'emAmbulance' },
  { id: 'fire', dial: '15', icon: 'fire_truck', labelKey: 'emFire' },
  { id: 'gendarmerie', dial: '177', icon: 'shield_person', labelKey: 'emGendarmerie' },
  {
    id: 'tourist',
    dial: '080100664',
    icon: 'support_agent',
    labelKey: 'emTouristPolice',
    noteKey: 'emTouristNote',
  },
];

/**
 * Useful phrases for travelers: Darija (Latin + Arabic script) and
 * Central Atlas Tamazight (Latin + Tifinagh). Most rural BMK communities
 * speak Tamazight first — a simple "Azul" opens many doors.
 * Spellings are approximate; pronunciation varies between valleys.
 */
export const DARIJA_PHRASES = [
  {
    id: 'hello',
    key: 'phraseHello',
    latin: 'Salam / Labas?',
    ar: 'سلام / لاباس؟',
    tz: 'Azul / Manik annak?',
    tif: 'ⴰⵣⵓⵍ',
  },
  {
    id: 'thanks',
    key: 'phraseThanks',
    latin: 'Shukran',
    ar: 'شكراً',
    tz: 'Tanmmirt',
    tif: 'ⵜⴰⵏⵎⵎⵉⵔⵜ',
  },
  {
    id: 'please',
    key: 'phrasePlease',
    latin: 'Afak / Min fadlak',
    ar: 'عفاك',
    tz: 'Afak',
    tif: 'ⴰⴼⴰⴽ',
  },
  {
    id: 'howMuch',
    key: 'phraseHowMuch',
    latin: 'Bshhal hada?',
    ar: 'بشحال هذا؟',
    tz: 'Mnchk aya?',
    tif: 'ⵎⵏⵛⴽ ⴰⵢⴰ',
  },
  {
    id: 'where',
    key: 'phraseWhere',
    latin: 'Fin kayn …?',
    ar: 'فين كاين …؟',
    tz: 'Mani illa …?',
    tif: 'ⵎⴰⵏⵉ ⵉⵍⵍⴰ',
  },
  {
    id: 'water',
    key: 'phraseWater',
    latin: 'Bghit lma',
    ar: 'بغيت الما',
    tz: 'Righ aman',
    tif: 'ⵔⵉⵖ ⴰⵎⴰⵏ',
  },
  {
    id: 'help',
    key: 'phraseHelp',
    latin: '3aweni afak',
    ar: 'عاوني عفاك',
    tz: '3awn-iyi afak',
    tif: 'ⵄⴰⵡⵏ ⵉⵢⵉ',
  },
  {
    id: 'no',
    key: 'phraseNo',
    latin: 'La / Wakha la',
    ar: 'لا',
    tz: 'Uhu',
    tif: 'ⵓⵀⵓ',
  },
  {
    id: 'toilet',
    key: 'phraseToilet',
    latin: 'Fin bit lma?',
    ar: 'فين بيت الما؟',
    tz: 'Mani illa bit lma?',
    tif: 'ⵎⴰⵏⵉ ⵉⵍⵍⴰ ⴱⵉⵜ ⵍⵎⴰ',
  },
  {
    id: 'photo',
    key: 'phrasePhoto',
    latin: 'Nqder nsewwer?',
    ar: 'نقدر نصور؟',
    tz: 'Is zmrgh ad sewwrgh?',
    tif: 'ⵉⵙ ⵣⵎⵔⵖ ⴰⴷ ⵙⵡⵡⵔⵖ',
  },
];

/**
 * Category playbooks — practical visit advice (not historical claims).
 */
export const CATEGORY_PLAYBOOKS = {
  waterfall: {
    durationKey: 'tipDurHalf',
    bestKey: 'tipBestSpringFall',
    difficultyKey: 'tipDiffModerate',
    familyKey: 'tipFamilyOkWatch',
    bringKeys: ['bringShoes', 'bringWater', 'bringCash', 'bringLayers'],
    tipKeys: ['tipWaterSlippery', 'tipWaterMorning', 'tipWaterCash'],
    budget: { entry: [0, 30], food: [40, 120], transport: [50, 200] },
  },
  lake: {
    durationKey: 'tipDurHalf',
    bestKey: 'tipBestSpringFall',
    difficultyKey: 'tipDiffEasy',
    familyKey: 'tipFamilyGreat',
    bringKeys: ['bringSun', 'bringWater', 'bringCash'],
    tipKeys: ['tipLakeBoat', 'tipLakeWind', 'tipLakeSun'],
    budget: { entry: [0, 20], food: [50, 150], transport: [40, 180] },
  },
  nature: {
    durationKey: 'tipDurHalfFull',
    bestKey: 'tipBestSpringFall',
    difficultyKey: 'tipDiffModerate',
    familyKey: 'tipFamilyActive',
    bringKeys: ['bringShoes', 'bringWater', 'bringLayers', 'bringSun'],
    tipKeys: ['tipNatureGuide', 'tipNatureDaylight', 'tipNatureLeaveNoTrace'],
    budget: { entry: [0, 40], food: [40, 100], transport: [60, 220] },
  },
  garden: {
    durationKey: 'tipDurShort',
    bestKey: 'tipBestMorning',
    difficultyKey: 'tipDiffEasy',
    familyKey: 'tipFamilyGreat',
    bringKeys: ['bringSun', 'bringCash', 'bringWater'],
    tipKeys: ['tipGardenShade', 'tipGardenWeekend', 'tipGardenPhoto'],
    budget: { entry: [10, 40], food: [30, 90], transport: [20, 80] },
  },
  heritage: {
    durationKey: 'tipDurShort',
    bestKey: 'tipBestMorning',
    difficultyKey: 'tipDiffEasy',
    familyKey: 'tipFamilyOk',
    bringKeys: ['bringSun', 'bringCash', 'bringModest'],
    tipKeys: ['tipHeritageRespect', 'tipHeritageGuide', 'tipHeritagePhoto'],
    budget: { entry: [0, 50], food: [40, 100], transport: [20, 100] },
  },
  valley: {
    durationKey: 'tipDurFull',
    bestKey: 'tipBestSpringFall',
    difficultyKey: 'tipDiffModerate',
    familyKey: 'tipFamilyActive',
    bringKeys: ['bringLayers', 'bringWater', 'bringCash', 'bringShoes'],
    tipKeys: ['tipValleyAltitude', 'tipValleyDays', 'tipValleyGuide'],
    budget: { entry: [0, 0], food: [60, 160], transport: [100, 350] },
  },
  village: {
    durationKey: 'tipDurHalf',
    bestKey: 'tipBestSpringFall',
    difficultyKey: 'tipDiffEasy',
    familyKey: 'tipFamilyOk',
    bringKeys: ['bringModest', 'bringCash', 'bringWater'],
    tipKeys: ['tipVillageRespect', 'tipVillageAsk', 'tipVillageMarket'],
    budget: { entry: [0, 0], food: [40, 120], transport: [80, 300] },
  },
  spring: {
    durationKey: 'tipDurShort',
    bestKey: 'tipBestMorning',
    difficultyKey: 'tipDiffEasy',
    familyKey: 'tipFamilyGreat',
    bringKeys: ['bringShoes', 'bringWater', 'bringCash'],
    tipKeys: ['tipWaterSlippery', 'tipGardenShade', 'tipGardenWeekend'],
    budget: { entry: [0, 30], food: [30, 90], transport: [30, 120] },
  },
  river: {
    durationKey: 'tipDurHalfFull',
    bestKey: 'tipBestSpringFall',
    difficultyKey: 'tipDiffModerate',
    familyKey: 'tipFamilyActive',
    bringKeys: ['bringShoes', 'bringWater', 'bringLayers', 'bringSun'],
    tipKeys: ['tipNatureGuide', 'tipNatureDaylight', 'tipWaterSlippery'],
    budget: { entry: [0, 50], food: [50, 140], transport: [80, 280] },
  },
  gorge: {
    durationKey: 'tipDurHalfFull',
    bestKey: 'tipBestSpringFall',
    difficultyKey: 'tipDiffModerate',
    familyKey: 'tipFamilyActive',
    bringKeys: ['bringShoes', 'bringWater', 'bringLayers', 'bringSun'],
    tipKeys: ['tipNatureGuide', 'tipNatureDaylight', 'tipNatureLeaveNoTrace'],
    budget: { entry: [0, 40], food: [40, 120], transport: [80, 300] },
  },
  peak: {
    durationKey: 'tipDurFull',
    bestKey: 'tipBestSpringFall',
    difficultyKey: 'tipDiffModerate',
    familyKey: 'tipFamilyActive',
    bringKeys: ['bringLayers', 'bringWater', 'bringShoes', 'bringSun'],
    tipKeys: ['tipValleyAltitude', 'tipValleyDays', 'tipValleyGuide'],
    budget: { entry: [0, 0], food: [80, 200], transport: [150, 400] },
  },
  geology: {
    durationKey: 'tipDurShort',
    bestKey: 'tipBestMorning',
    difficultyKey: 'tipDiffEasy',
    familyKey: 'tipFamilyOk',
    bringKeys: ['bringSun', 'bringWater', 'bringShoes', 'bringCash'],
    tipKeys: ['tipHeritageRespect', 'tipNatureLeaveNoTrace', 'tipHeritagePhoto'],
    budget: { entry: [0, 40], food: [30, 90], transport: [40, 150] },
  },
  park: {
    durationKey: 'tipDurShort',
    bestKey: 'tipBestMorning',
    difficultyKey: 'tipDiffEasy',
    familyKey: 'tipFamilyGreat',
    bringKeys: ['bringSun', 'bringCash', 'bringWater'],
    tipKeys: ['tipGardenShade', 'tipGardenWeekend', 'tipGardenPhoto'],
    budget: { entry: [0, 20], food: [30, 80], transport: [20, 80] },
  },
  museum: {
    durationKey: 'tipDurShort',
    bestKey: 'tipBestMorning',
    difficultyKey: 'tipDiffEasy',
    familyKey: 'tipFamilyOk',
    bringKeys: ['bringCash', 'bringModest', 'bringWater'],
    tipKeys: ['tipHeritageRespect', 'tipHeritageGuide', 'tipHeritagePhoto'],
    budget: { entry: [10, 60], food: [30, 90], transport: [20, 100] },
  },
  market: {
    durationKey: 'tipDurShort',
    bestKey: 'tipBestMorning',
    difficultyKey: 'tipDiffEasy',
    familyKey: 'tipFamilyOk',
    bringKeys: ['bringCash', 'bringModest', 'bringWater'],
    tipKeys: ['tipVillageMarket', 'tipVillageAsk', 'tipVillageRespect'],
    budget: { entry: [0, 0], food: [40, 120], transport: [10, 60] },
  },
};

const DEFAULT_PLAYBOOK = CATEGORY_PLAYBOOKS.nature;

export function playbookForCategory(category) {
  return CATEGORY_PLAYBOOKS[category] || DEFAULT_PLAYBOOK;
}

/** Haversine distance in km */
export function distanceKm(a, b) {
  if (
    typeof a?.lat !== 'number' ||
    typeof a?.lng !== 'number' ||
    typeof b?.lat !== 'number' ||
    typeof b?.lng !== 'number'
  ) {
    return Infinity;
  }
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function nearbyPois(origin, allPois, { limit = 4, maxKm = 80 } = {}) {
  if (!origin || !Array.isArray(allPois)) return [];
  return allPois
    .filter((p) => p.id !== origin.id)
    .map((p) => ({ ...p, distanceKm: distanceKm(origin, p) }))
    .filter((p) => p.distanceKm <= maxKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

export function formatMadRange([min, max]) {
  if (min === 0 && max === 0) return null;
  if (min === max) return `${min}`;
  return `${min}–${max}`;
}

export function budgetDayTotal(playbook) {
  const b = playbook?.budget;
  if (!b) return null;
  const min = (b.entry?.[0] || 0) + (b.food?.[0] || 0) + (b.transport?.[0] || 0);
  const max = (b.entry?.[1] || 0) + (b.food?.[1] || 0) + (b.transport?.[1] || 0);
  return [min, max];
}

/** Open-Meteo WMO weather codes → icon + label key */
export function weatherFromCode(code) {
  if (code === 0) return { icon: 'sunny', labelKey: 'wxClear' };
  if (code <= 3) return { icon: 'partly_cloudy_day', labelKey: 'wxCloud' };
  if (code <= 48) return { icon: 'foggy', labelKey: 'wxFog' };
  if (code <= 67) return { icon: 'rainy', labelKey: 'wxRain' };
  if (code <= 77) return { icon: 'weather_snowy', labelKey: 'wxSnow' };
  if (code <= 82) return { icon: 'rainy', labelKey: 'wxShowers' };
  if (code <= 99) return { icon: 'thunderstorm', labelKey: 'wxStorm' };
  return { icon: 'cloud', labelKey: 'wxCloud' };
}

/**
 * Fetch short forecast (no API key).
 * @returns {Promise<object|null>}
 */
export async function fetchPoiWeather(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,weather_code,wind_speed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&timezone=auto&forecast_days=3`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather unavailable');
  const data = await res.json();
  const code = data?.current?.weather_code;
  const meta = weatherFromCode(code);
  return {
    temp: data.current?.temperature_2m,
    wind: data.current?.wind_speed_10m,
    unit: data.current_units?.temperature_2m || '°C',
    windUnit: data.current_units?.wind_speed_10m || 'km/h',
    ...meta,
    days: (data.daily?.time || []).map((date, i) => ({
      date,
      max: data.daily.temperature_2m_max?.[i],
      min: data.daily.temperature_2m_min?.[i],
      rainProb: data.daily.precipitation_probability_max?.[i],
    })),
  };
}

export function buildGoogleMapsPlaceUrl(poi) {
  if (typeof poi?.lat !== 'number' || typeof poi?.lng !== 'number') return null;
  const q = encodeURIComponent(poi.name || `${poi.lat},${poi.lng}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}&query_place_id=&center=${poi.lat},${poi.lng}`;
}

export function buildGoogleMapsPlacePinUrl(poi) {
  if (typeof poi?.lat !== 'number' || typeof poi?.lng !== 'number') return null;
  return `https://www.google.com/maps?q=${poi.lat},${poi.lng}`;
}
