/**
 * Booking.com stay offers near a POI (no full-site embed, no Airbnb).
 * Optional VITE_BOOKING_AID for affiliate tracking.
 */
const STAY_HINTS = {
  'poi-ouzoud-falls': 'Ouzoud, Azilal, Morocco',
  'poi-ain-asserdoun': 'Beni Mellal, Morocco',
  'poi-kasbah-ras-el-ain': 'Beni Mellal, Morocco',
  'poi-bin-el-ouidane': 'Bin el Ouidane, Morocco',
  'poi-kasbah-tadla': 'Tadla, Morocco',
  'poi-imi-n-ifri': 'Demnate, Azilal, Morocco',
  'poi-khenifra-national-park': 'Khenifra, Morocco',
  'poi-aguelmame-azigza': 'Khenifra, Morocco',
  'poi-khenifra-waterfall-park': 'Khenifra, Morocco',
  'poi-taghzirte-gorges': 'Taghzirt, Beni Mellal, Morocco',
  'poi-ait-bouguemez': 'Ait Bouguemez, Azilal, Morocco',
  'poi-zaouiat-ahansal': 'Zaouiat Ahansal, Azilal, Morocco',
  'poi-aoujgal-granaries': 'Aoujgal, Morocco',
  'poi-oum-er-rbia-springs': 'Khenifra, Morocco',
  'poi-zaouiat-cheikh-tamda': 'Zaouiat Cheikh, Beni Mellal, Morocco',
  'poi-taghbalout': 'El Ksiba, Morocco',
  'poi-assif-ahansal': 'Zaouiat Ahansal, Azilal, Morocco',
  'poi-ain-kbi': 'Fquih Ben Salah, Morocco',
  'poi-aguelmame-sidi-ali': 'Aguelmame Sidi Ali, Morocco',
  'poi-tigelmamine': 'Khenifra, Morocco',
  'poi-tamda-lake-azilal': 'Ait Bouguemez, Azilal, Morocco',
  'poi-mgoun-peak': 'Ait Bouguemez, Azilal, Morocco',
  'poi-imsfrane-cathedral': 'Tilougguite, Azilal, Morocco',
  'poi-tissilit-gorges': 'Azilal, Morocco',
  'poi-ahouli-mibladen': 'Midelt, Morocco',
  'poi-iouaridene-tracks': 'Demnate, Azilal, Morocco',
  'poi-mgoun-geopark-center': 'Azilal, Morocco',
  'poi-musee-azilal': 'Azilal, Morocco',
  'poi-mastfrane-folds': 'Tilougguite, Azilal, Morocco',
  'poi-kasbah-bel-kush': 'Fquih Ben Salah, Morocco',
  'poi-kasbah-moha-hammou': 'Khenifra, Morocco',
  'poi-agadir-ait-bouguemez': 'Ait Bouguemez, Azilal, Morocco',
  'poi-zaouia-sidi-hamza': 'Azilal, Morocco',
  'poi-ajdir-plateau': 'Khenifra, Morocco',
  'poi-cip-ain-asserdoun': 'Beni Mellal, Morocco',
  'poi-musee-resistance-bm': 'Beni Mellal, Morocco',
  'poi-maison-geoparc-bouguemez': 'Ait Bouguemez, Azilal, Morocco',
  'poi-maison-geoparc-ahansal': 'Zaouiat Ahansal, Azilal, Morocco',
  'poi-maison-geoparc-iouaridene': 'Demnate, Azilal, Morocco',
  'poi-parc-municipal-bm': 'Beni Mellal, Morocco',
  'poi-jardin-oliviers-bm': 'Beni Mellal, Morocco',
  'poi-parc-ain-asserdoun-botanique': 'Beni Mellal, Morocco',
  'poi-parc-el-ochaq': 'Khenifra, Morocco',
  'poi-khouribga-phosphate': 'Khouribga, Morocco',
  'poi-oued-zem-lake': 'Oued Zem, Morocco',
  'poi-marche-central-beni-mellal': 'Beni Mellal, Morocco',
};

const BOOKING_LANG = { en: 'en-gb', fr: 'fr', ar: 'ar' };

/** Booking.com property-type filters (nflt=ht_id=…). */
const OFFER_TYPES = [
  { id: 'hotels', nflt: 'ht_id=204', icon: 'hotel', titleKey: 'stayOfferHotels', hintKey: 'stayOfferHotelsHint' },
  { id: 'guesthouses', nflt: 'ht_id=216', icon: 'cottage', titleKey: 'stayOfferGuesthouses', hintKey: 'stayOfferGuesthousesHint' },
  { id: 'apartments', nflt: 'ht_id=201', icon: 'apartment', titleKey: 'stayOfferApartments', hintKey: 'stayOfferApartmentsHint' },
];

export function stayQueryFor(place) {
  if (!place) return 'Beni Mellal, Morocco';
  if (place.stayQuery) return place.stayQuery;
  if (place.id && STAY_HINTS[place.id]) return STAY_HINTS[place.id];
  const name = place.name || 'Beni Mellal';
  return name.includes('Morocco') || name.includes('Maroc') ? name : `${name}, Morocco`;
}

function bookingSearchUrl(place, lang, extraParams = {}) {
  const query = stayQueryFor(place);
  const lat = Number(place?.lat);
  const lng = Number(place?.lng);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const aid = import.meta.env.VITE_BOOKING_AID || '';
  const bLang = BOOKING_LANG[lang] || 'fr';

  const params = new URLSearchParams({
    ss: query,
    ...extraParams,
  });
  if (hasCoords) {
    params.set('latitude', String(lat));
    params.set('longitude', String(lng));
  }
  if (aid) params.set('aid', aid);

  return {
    query,
    url: `https://www.booking.com/searchresults.${bLang}.html?${params.toString()}`,
  };
}

export function buildStayOffers(place, lang = 'en') {
  const { query, url: allUrl } = bookingSearchUrl(place, lang);
  const offers = OFFER_TYPES.map((type) => {
    const { url } = bookingSearchUrl(place, lang, { nflt: type.nflt });
    return {
      id: type.id,
      icon: type.icon,
      titleKey: type.titleKey,
      hintKey: type.hintKey,
      url,
    };
  });

  return { query, bookingUrl: allUrl, allUrl, offers };
}

/** Google Maps restaurant search near a place (no API key). */
export function buildDiningSearchUrl(place, lang = 'en') {
  if (!place) return null;
  const name = place.name || stayQueryFor(place);
  const queries = {
    en: `restaurants near ${name}`,
    fr: `restaurants près de ${name}`,
    ar: `مطاعم قرب ${name}`,
  };
  const q = queries[lang] || queries.fr;
  const lat = Number(place.lat);
  const lng = Number(place.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps/search/${encodeURIComponent(q)}/@${lat},${lng},14z`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
