/**
 * Deterministic, offline itinerary builder.
 *
 * Used as a real fallback when Gemini is unavailable (quota, network, malformed
 * output). It clusters POIs by proximity and matches traveler interests using
 * only local data — no API calls — so the planner always returns a usable plan.
 */
import { distanceKm } from '../data/touristGuide';

const INTEREST_CATEGORIES = {
  nature: [
    'waterfall',
    'spring',
    'river',
    'lake',
    'nature',
    'garden',
    'park',
    'valley',
    'gorge',
    'peak',
    'geology',
  ],
  history: ['heritage', 'geology', 'museum'],
  culture: ['village', 'market', 'heritage', 'museum'],
  family: ['garden', 'park', 'lake', 'waterfall', 'spring', 'market', 'museum'],
};

const HARD_HIKE_CATEGORIES = new Set(['peak', 'gorge']);
const PACE_PER_DAY = { relaxed: 2, moderate: 3, packed: 4 };

function scorePoi(poi, wantedCategories) {
  if (!poi?.category) return 0;
  return wantedCategories.has(poi.category) ? 1 : 0;
}

/** Greedy nearest-neighbour ordering to keep each day geographically tight. */
function orderByProximity(pois) {
  if (pois.length <= 2) return [...pois];
  const remaining = [...pois];
  const ordered = [remaining.shift()];
  while (remaining.length) {
    const last = ordered[ordered.length - 1];
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i += 1) {
      const d = distanceKm(last, remaining[i]);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    ordered.push(remaining.splice(bestIdx, 1)[0]);
  }
  return ordered;
}

/**
 * @param {object} preferences - { duration, people, hasCar, includeHiking, interests, pace }
 * @param {Array} pois
 * @returns {{ days: Array<{ dayNumber:number, pois:string[], notes:string }>, fallback: true }}
 */
export function buildLocalItinerary(preferences = {}, pois = []) {
  const duration = Math.max(1, Math.min(7, Number(preferences.duration) || 2));
  const pace = PACE_PER_DAY[preferences.pace] ? preferences.pace : 'moderate';
  const perDay = PACE_PER_DAY[pace];
  const includeHiking = Boolean(preferences.includeHiking);
  const hasCar = Boolean(preferences.hasCar);

  const interests = Array.isArray(preferences.interests) ? preferences.interests : [];
  const wanted = new Set();
  for (const interest of interests) {
    for (const cat of INTEREST_CATEGORIES[interest] || []) wanted.add(cat);
  }

  let pool = pois.filter((p) => p && p.id);
  if (!includeHiking) {
    const soft = pool.filter((p) => !HARD_HIKE_CATEGORIES.has(p.category));
    if (soft.length >= duration) pool = soft;
  }

  const ranked = [...pool].sort((a, b) => scorePoi(b, wanted) - scorePoi(a, wanted));
  const needed = Math.min(ranked.length, duration * perDay);
  let selected = ranked.slice(0, needed);

  // Cluster tightly when there is no car so days stay reachable by shared taxi.
  const ordered = hasCar ? selected : orderByProximity(selected);

  const days = [];
  for (let d = 0; d < duration; d += 1) {
    const chunk = ordered.slice(d * perDay, d * perDay + perDay);
    if (chunk.length === 0) break;
    days.push({
      dayNumber: d + 1,
      pois: chunk.map((p) => p.id),
      notes: hasCar
        ? 'Drive between stops in a sensible order and confirm opening hours locally.'
        : 'Stops are grouped nearby — use shared taxis or local buses between towns.',
    });
  }

  if (days.length === 0 && pool.length) {
    days.push({
      dayNumber: 1,
      pois: pool.slice(0, perDay).map((p) => p.id),
      notes: 'Suggested day based on your interests.',
    });
  }

  return { days, fallback: true };
}
