/**
 * Build a RAG knowledge corpus from catalog + app FAQ.
 * Retrieval is hybrid: lexical score always, optional embedding vectors.
 */
import {
  activitiesForPoi,
  INTANGIBLE_HERITAGE,
  localized,
} from '../data/experienceCatalog';

const APP_FAQ = [
  {
    id: 'faq-plan',
    title: 'AI itinerary planner',
    text: `Tadla Plan (/assistant) builds a day-by-day itinerary for Béni Mellal–Khénifra using Gemini and the POI catalog. The visitor fills a form: trip length (1–7 days), group size, whether they have a car, whether to include hiking, interests (nature, history, culture, family), and pace (relaxed, moderate, packed). Gemini plans accordingly (clustered days without a car; gorge/peak walks when hiking is on). If the visitor has no car, the app shows comparative transport plans (inDrive/rideshare, private taxi day hire, grand taxi, bus/CTM-style, hybrid) with indicative MAD estimates for the route. You can save itineraries when signed in and request a guide quote. On the landing page, an embedded planner gives a preview; open the full planner for maps and stay offers.`,
  },
  {
    id: 'faq-discover',
    title: 'Discover map',
    text: `Discover (/discover) shows an interactive Leaflet map of ~45 regional points of interest: waterfalls, springs, rivers, lakes, gorges, peaks, geology sites, museums (Azilal, Aïn Asserdoun CIP, geopark houses), parks, markets, heritage sites, valleys, and villages. Filter by category or search by name. Place photos can be stored under public/places/{poi-id}/ and referenced as /places/{poi-id}/cover.jpg in the catalog.`,
  },
  {
    id: 'faq-trips',
    title: 'Guide trip programs',
    text: `Trips (/trips) lists multi-day programs published by verified local guides: title, description, price in MAD, dates, capacity, and stop POIs. Tourists book a date; guides manage programs and bookings from the Guide desk after partner approval.`,
  },
  {
    id: 'faq-artisans',
    title: 'Artisan marketplace',
    text: `Artisans (/artisans) lists craftspeople and cooperatives (pottery, carpets, souvenirs, local products). Contact them on WhatsApp from the listing — no in-app middleman. Artisans manage listings from Workshop after partner approval.`,
  },
  {
    id: 'faq-partner',
    title: 'Become a guide or artisan',
    text: `Public signup creates a tourist account only. Guides and artisans apply at /partner; an admin approves the role. Admins use /admin to manage approvals, users, POI catalog, artisans, trips, bookings, reviews, and quote requests. Do not self-claim provider roles.`,
  },
  {
    id: 'faq-region',
    title: 'Béni Mellal–Khénifra region',
    text: `Tadla focuses on the Béni Mellal–Khénifra region of Morocco (Middle Atlas / High Atlas foothills): Cascades d'Ouzoud, Ain Asserdoun, Bin El Ouidane, Kasbah Tadla, Imi n'Ifri, Khenifra National Park, Aït Bouguemez, Zaouiat Ahansal, and related heritage and nature sites. The product is regional — not a full Morocco nationwide planner.`,
  },
  {
    id: 'faq-stays',
    title: 'Stay offers',
    text: `Stay suggestions use Booking.com offer cards near a selected place. There is no Airbnb iframe and no full hotel booking engine inside the app — cards deep-link to Booking.com.`,
  },
  {
    id: 'faq-langs',
    title: 'Languages',
    text: `The UI supports English, French, and Arabic (with RTL). Switch language from the header. Dynamic POI/artisan text stays as authored in the catalog.`,
  },
  {
    id: 'faq-emergency',
    title: 'Emergency numbers Morocco',
    text: `Morocco emergency dial codes shown in the app: Police 190, Ambulance 150, Fire 15, Gendarmerie 177, tourism info line 080100664. Save them before going offline in mountain areas. On each place page you also get live weather (Open-Meteo), Darija phrases, indicative MAD budgets, and navigation links (Google Maps, Waze, Apple Maps).`,
  },
  {
    id: 'faq-budget-darija',
    title: 'Budgets and Darija',
    text: `Place detail pages include indicative day budgets in MAD (entry, food, local transport) for planning only — not official ticket prices. They also list useful Darija phrases (hello, thanks, how much, where, water, help). Ask Tadla RAG can answer questions using the POI catalog, guide trips, artisans, and these FAQs.`,
  },
  {
    id: 'faq-poi-detail',
    title: 'Place detail features',
    text: `Each POI page offers: photos, about text, relevant outdoor/cultural/learning activities, linked living heritage, visit snapshot (duration, season, difficulty, family fit), what to bring, practical tips by category, live weather, nearby places by distance, emergency numbers, stay offers via Booking.com cards, share/copy GPS, and links to Plan with AI, Trips, Heritage, and Artisans.`,
  },
  {
    id: 'faq-heritage',
    title: 'Living and intangible heritage',
    text: `Tadla Heritage (/heritage) documents living practices linked to catalog places: Ahidous poetry and collective dance, collective granaries and shared stewardship, mountain pastoral knowledge, UNESCO-listed Tbourida, Amazigh weaving and natural-dye knowledge, and oral memory of land and water in the M'Goun Geopark. Imilchil's engagement moussem is presented only as neighbouring High Atlas context in Midelt province, outside Béni Mellal–Khénifra. Festival dates and participation must always be confirmed locally.`,
  },
  {
    id: 'faq-badges',
    title: 'Tourist explorer badges',
    text: `Tourists can mark a place visited and follow private progress at /badges. Badges encourage visiting more places and discovering water, nature and heritage categories. Progress is stored on the current device, is not GPS verification, and is not a public leaderboard.`,
  },
];

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9\u0600-\u06ff]+/i)
    .filter((t) => t.length > 1);
}

/**
 * @param {{ pois?: object[], artisans?: object[], programs?: object[] }} catalog
 * @returns {Array<{ id: string, type: string, title: string, text: string, href?: string, meta?: object }>}
 */
export function buildKnowledgeDocs({ pois = [], artisans = [], programs = [] }) {
  const docs = [];

  for (const faq of APP_FAQ) {
    docs.push({
      id: faq.id,
      type: 'faq',
      title: faq.title,
      text: faq.text,
      href: faq.id.includes('plan')
        ? '/assistant'
        : faq.id.includes('discover')
          ? '/discover'
          : faq.id.includes('trips')
            ? '/trips'
            : faq.id.includes('artisans')
              ? '/artisans'
              : faq.id.includes('partner')
                ? '/partner'
                : faq.id.includes('heritage')
                  ? '/heritage'
                  : faq.id.includes('badges')
                    ? '/badges'
                    : '/',
    });
  }

  for (const p of pois) {
    const imageUrl = Array.isArray(p.images) ? p.images.find(Boolean) : null;
    const activities = activitiesForPoi(p);
    docs.push({
      id: `poi:${p.id}`,
      type: 'poi',
      title: p.name || p.id,
      text: [
        `Place: ${p.name}`,
        `Category: ${p.category || 'n/a'}`,
        p.hours ? `Hours: ${p.hours}` : '',
        typeof p.lat === 'number' ? `Coordinates: ${p.lat}, ${p.lng}` : '',
        p.description || '',
        activities.length
          ? `Things to do: ${activities
              .map((activity) => `${localized(activity.title)} — ${localized(activity.description)}`)
              .join('; ')}`
          : '',
        imageUrl ? `Has photo available for the chat UI.` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      href: `/poi/${p.id}`,
      imageUrl: imageUrl || null,
      meta: {
        poiId: p.id,
        category: p.category,
        lat: p.lat,
        lng: p.lng,
        imageUrl: imageUrl || null,
      },
    });
  }

  for (const item of INTANGIBLE_HERITAGE) {
    docs.push({
      id: `heritage:${item.id}`,
      type: 'heritage',
      title: localized(item.title),
      text: [
        `Living heritage: ${localized(item.title)}`,
        `Context: ${localized(item.period)}`,
        localized(item.summary),
        item.history ? `History and origins: ${localized(item.history)}` : '',
        `Responsible participation: ${localized(item.participation)}`,
        `Linked POI ids: ${item.poiIds.join(', ')}`,
      ]
        .filter(Boolean)
        .join('\n'),
      href: `/heritage#${item.id}`,
      meta: { heritageId: item.id, poiIds: item.poiIds },
    });
  }

  for (const a of artisans) {
    const name =
      a?.contactInfo?.name ||
      (typeof a.contactInfo === 'string' ? a.contactInfo : '') ||
      a.village ||
      a.id;
    const imageUrl =
      a?.contactInfo?.photoUrl || a?.photoUrl || null;
    docs.push({
      id: `artisan:${a.id}`,
      type: 'artisan',
      title: String(name),
      text: [
        `Artisan / shop: ${name}`,
        `Craft: ${a.craftType || 'n/a'}`,
        a.village ? `Village / area: ${a.village}` : '',
        a.description || '',
        a.rating != null ? `Rating: ${a.rating} (${a.reviewCount || 0} reviews)` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      href: '/artisans',
      imageUrl: imageUrl || null,
      meta: { artisanId: a.id, craftType: a.craftType, imageUrl: imageUrl || null },
    });
  }

  for (const pr of programs) {
    docs.push({
      id: `trip:${pr.id}`,
      type: 'trip',
      title: pr.title || pr.id,
      text: [
        `Guide trip program: ${pr.title}`,
        pr.description || '',
        typeof pr.price === 'number' ? `Price: ${pr.price} MAD` : '',
        pr.days ? `Duration structure: ${JSON.stringify(pr.days).slice(0, 400)}` : '',
        Array.isArray(pr.availableDates) && pr.availableDates.length
          ? `Available dates: ${pr.availableDates.slice(0, 8).join(', ')}`
          : '',
        pr.maxGroupSize ? `Max group size: ${pr.maxGroupSize}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      href: `/trips/${pr.id}`,
      meta: { tripId: pr.id, price: pr.price },
    });
  }

  return docs;
}

/** Lexical relevance score (fast, no API). */
export function lexicalScore(query, doc) {
  const qTokens = tokenize(query);
  if (!qTokens.length) return 0;
  const hay = tokenize(`${doc.title} ${doc.text} ${doc.type}`).join(' ');
  const title = tokenize(doc.title).join(' ');
  let score = 0;
  for (const tok of qTokens) {
    if (title.includes(tok)) score += 3;
    if (hay.includes(tok)) score += 1;
  }
  return score;
}

export function cosineSimilarity(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Rank documents: blend lexical + optional embedding similarity.
 * @returns {Array<object & { score: number }>}
 */
export function retrieveDocs(query, docs, { topK = 6, docVectors = null, queryVector = null } = {}) {
  const scored = docs.map((doc, i) => {
    const lex = lexicalScore(query, doc);
    let emb = 0;
    if (queryVector && docVectors?.[i]) {
      emb = cosineSimilarity(queryVector, docVectors[i]);
    }
    // Blend: embeddings dominate when present; lexical always helps exact names
    const score = emb > 0 ? emb * 10 + lex * 0.15 : lex;
    return { ...doc, score, _lex: lex, _emb: emb };
  });

  return scored
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
