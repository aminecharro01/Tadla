/**
 * Offline fallback events for the Béni Mellal–Khénifra region.
 *
 * These are REAL, well-documented recurring events and seasonal draws — used when
 * the live Gemini + Google Search lookup fails or the quota is exhausted. Exact
 * dates shift every year, so everything is returned with `dateConfirmed: false`
 * and an honest window; travelers are told to confirm locally.
 */

const text = (en, fr, ar) => ({ en, fr, ar });

function localized(value, lang = 'en') {
  if (typeof value === 'string') return value;
  return value?.[lang] || value?.en || '';
}

/** Curated recurring / seasonal events, mapped to POIs and regions. */
const REGIONAL_EVENTS = [
  {
    id: 'ahidous-ain-leuh',
    type: 'festival',
    months: [7],
    title: text(
      'National Ahidous Festival — Aïn Leuh',
      'Festival national d’Ahidous — Aïn Leuh',
      'المهرجان الوطني لأحيدوس — عين اللوح'
    ),
    location: text(
      'Aïn Leuh (Middle Atlas)',
      'Aïn Leuh (Moyen Atlas)',
      'عين اللوح (الأطلس المتوسط)'
    ),
    description: text(
      'Dozens of Amazigh troupes gather every summer for three days of ahidous song, poetry and collective dance.',
      'Des dizaines de troupes amazighes se réunissent chaque été pour trois jours de chant, poésie et danse ahidous.',
      'تجتمع عشرات الفرق الأمازيغية كل صيف في ثلاثة أيام من غناء وشعر ورقص أحيدوس الجماعي.'
    ),
    url: 'https://www.maroc.ma/fr/actualites/festival-national-des-arts-dahidous',
    poiIds: ['poi-ajdir-plateau', 'poi-khenifra-national-park', 'poi-kasbah-moha-hammou'],
  },
  {
    id: 'blossom-season',
    type: 'outdoor',
    months: [2, 3],
    title: text(
      'Almond & cherry blossom in the valleys',
      'Floraison des amandiers et cerisiers dans les vallées',
      'إزهار اللوز والكرز في الوديان'
    ),
    location: text(
      'Aït Bouguemez & Azilal highlands',
      'Aït Bouguemez et hauteurs d’Azilal',
      'آيت بوكماز ومرتفعات أزيلال'
    ),
    description: text(
      'Late winter turns the terraced orchards white and pink — a favourite window for walks and photography.',
      'La fin de l’hiver couvre les vergers en terrasses de blanc et de rose — une période idéale pour marcher et photographier.',
      'يكسو أواخر الشتاء البساتين المدرجة بالأبيض والوردي — فترة مثالية للمشي والتصوير.'
    ),
    url: '',
    poiIds: ['poi-ait-bouguemez', 'poi-agadir-ait-bouguemez', 'poi-mgoun-peak', 'poi-musee-azilal'],
  },
  {
    id: 'waterfall-high-season',
    type: 'outdoor',
    months: [4, 5, 6, 9, 10],
    title: text(
      'Waterfalls & lakes high season',
      'Haute saison des cascades et lacs',
      'موسم الشلالات والبحيرات'
    ),
    location: text(
      'Ouzoud, Bin El Ouidane & Middle Atlas lakes',
      'Ouzoud, Bin El Ouidane et lacs du Moyen Atlas',
      'أوزود وبين الويدان وبحيرات الأطلس المتوسط'
    ),
    description: text(
      'Spring and early autumn bring the fullest flow and mildest weather — best light for boat trips and viewpoints.',
      'Le printemps et le début de l’automne offrent le meilleur débit et un climat doux — lumière idéale pour barques et points de vue.',
      'يمنح الربيع وبداية الخريف أقوى تدفق وأطيب طقس — إضاءة مثالية للقوارب ونقاط المشاهدة.'
    ),
    url: '',
    poiIds: ['poi-ouzoud-falls', 'poi-bin-el-ouidane', 'poi-imi-n-ifri'],
  },
  {
    id: 'moussem-season',
    type: 'cultural',
    months: [5, 6, 7, 8, 9],
    title: text(
      'Moussem & tbourida season',
      'Saison des moussems et de la tbourida',
      'موسم المواسم والتبوريدة'
    ),
    location: text(
      'Villages across Beni Mellal, Tadla & Khénifra',
      'Villages de Beni Mellal, Tadla et Khénifra',
      'قرى بني ملال وتادلة وخنيفرة'
    ),
    description: text(
      'Warm months bring local moussems (saint festivals) where tbourida cavalry shows, music and markets take place. Ask locally for the nearest date.',
      'Les mois chauds voient des moussems locaux avec spectacles de tbourida, musique et marchés. Demandez la date la plus proche sur place.',
      'تشهد الأشهر الدافئة مواسم محلية تقام فيها عروض التبوريدة والموسيقى والأسواق. اسأل عن أقرب موعد محلياً.'
    ),
    url: 'https://ich.unesco.org/en/RL/tbourida-01483',
    poiIds: ['poi-kasbah-tadla', 'poi-kasbah-moha-hammou', 'poi-marche-central-beni-mellal'],
  },
];

/** A generic weekly souk applies to town / market / village style POIs. */
const WEEKLY_SOUK = {
  id: 'weekly-souk',
  type: 'market',
  title: text('Weekly souk (local market)', 'Souk hebdomadaire (marché local)', 'السوق الأسبوعي'),
  location: text('Regional towns', 'Villes de la région', 'مدن الجهة'),
  description: text(
    'Most towns in the region hold a lively weekly souk with produce, crafts and street food. Ask your host for the exact souk day nearby.',
    'La plupart des villes tiennent un souk hebdomadaire animé (produits, artisanat, street food). Demandez le jour du souk le plus proche.',
    'تقيم أغلب المدن سوقاً أسبوعياً نابضاً بالمنتجات والحرف والأكل. اسأل مضيفك عن يوم السوق القريب.'
  ),
  url: '',
  dateLabel: text('Weekly — ask locally', 'Chaque semaine — demandez sur place', 'أسبوعياً — اسأل محلياً'),
};

const SOUK_CATEGORIES = new Set(['market', 'village', 'valley', 'heritage', 'museum']);

const MONTH_LOCALE = { en: 'en-US', fr: 'fr-FR', ar: 'ar-MA' };

/** Nearest upcoming month window as a human label, e.g. "July 2026". */
function windowLabel(months, lang, today = new Date()) {
  if (!Array.isArray(months) || months.length === 0) return '';
  const curMonth = today.getMonth() + 1;
  const curYear = today.getFullYear();
  const sorted = [...months].sort((a, b) => a - b);
  const upcoming = sorted.find((m) => m >= curMonth);
  const month = upcoming ?? sorted[0];
  const year = upcoming ? curYear : curYear + 1;
  const locale = MONTH_LOCALE[lang] || 'en-US';
  const name = new Date(year, month - 1, 1).toLocaleString(locale, { month: 'long' });
  if (months.length > 1) {
    const last = sorted[sorted.length - 1];
    const lastName = new Date(year, last - 1, 1).toLocaleString(locale, { month: 'short' });
    const firstName = new Date(year, sorted[0] - 1, 1).toLocaleString(locale, { month: 'short' });
    return `${firstName}–${lastName} ${year}`;
  }
  return `${name} ${year}`;
}

/**
 * Real recurring / seasonal events near a POI, localized, in the same shape as
 * the live Gemini events so the UI can render them identically.
 */
export function localEventsForPoi(poi, lang = 'en', today = new Date()) {
  if (!poi) return [];
  const events = [];

  for (const ev of REGIONAL_EVENTS) {
    if (!ev.poiIds.includes(poi.id)) continue;
    events.push({
      title: localized(ev.title, lang),
      date: windowLabel(ev.months, lang, today),
      dateConfirmed: false,
      type: ev.type,
      location: localized(ev.location, lang),
      description: localized(ev.description, lang),
      url: ev.url || '',
    });
  }

  if (SOUK_CATEGORIES.has(poi.category)) {
    events.push({
      title: localized(WEEKLY_SOUK.title, lang),
      date: localized(WEEKLY_SOUK.dateLabel, lang),
      dateConfirmed: false,
      type: WEEKLY_SOUK.type,
      location: localized(WEEKLY_SOUK.location, lang),
      description: localized(WEEKLY_SOUK.description, lang),
      url: '',
    });
  }

  // Guarantee at least one useful entry for any place: the moussem/season note.
  if (events.length === 0) {
    const seasonal = REGIONAL_EVENTS.find((e) => e.id === 'waterfall-high-season');
    events.push({
      title: localized(seasonal.title, lang),
      date: windowLabel(seasonal.months, lang, today),
      dateConfirmed: false,
      type: seasonal.type,
      location: localized(seasonal.location, lang),
      description: localized(seasonal.description, lang),
      url: seasonal.url || '',
    });
  }

  return events.slice(0, 6);
}
