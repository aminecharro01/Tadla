/**
 * Indicative no-car transport plans for a BMK itinerary.
 * Distances = haversine along stop order; prices are planning estimates only (MAD).
 */
import { distanceKm } from '../data/touristGuide';

function roundMad(n) {
  return Math.max(0, Math.round(n / 5) * 5);
}

function clampRange(min, max) {
  const a = roundMad(Math.min(min, max));
  const b = roundMad(Math.max(min, max));
  return [a, b === a ? a + 20 : b];
}

/** Flatten itinerary days into ordered POI stops (dedupe consecutive). */
export function flattenRouteStops(itinerary, poiById) {
  if (!itinerary?.days?.length) return [];
  const stops = [];
  for (const day of itinerary.days) {
    for (const id of day.pois || []) {
      const poi = poiById.get?.(id) || poiById[id];
      if (!poi || typeof poi.lat !== 'number' || typeof poi.lng !== 'number') continue;
      const prev = stops[stops.length - 1];
      if (prev?.id === poi.id) continue;
      stops.push(poi);
    }
  }
  return stops;
}

export function routeDistanceKm(stops) {
  let total = 0;
  for (let i = 1; i < stops.length; i += 1) {
    const d = distanceKm(stops[i - 1], stops[i]);
    if (Number.isFinite(d)) total += d;
  }
  return total;
}

/**
 * @param {{ itinerary: object, poiById: Map|object, people?: number, daysCount?: number }} opts
 * @returns {{ totalKm: number, stopCount: number, plans: Array<object> } | null}
 */
export function buildTransportPlans({
  itinerary,
  poiById,
  people = 2,
  daysCount = 1,
} = {}) {
  const stops = flattenRouteStops(itinerary, poiById);
  if (stops.length < 2) return null;

  const totalKm = routeDistanceKm(stops);
  const p = Math.max(1, Math.min(20, Number(people) || 1));
  const days = Math.max(1, Number(daysCount) || itinerary.days?.length || 1);
  const legs = Math.max(1, stops.length - 1);

  // Rough road factor (Atlas roads longer than crow-fly)
  const roadKm = totalKm * 1.25;

  const inDrivePerKm = 5.5;
  const inDriveBase = 20 * legs;
  const carFactor = p >= 5 ? 1.35 : p >= 3 ? 1.15 : 1;
  const inDriveMid = (inDriveBase + roadKm * inDrivePerKm) * carFactor;
  const inDriveRange = clampRange(inDriveMid * 0.75, inDriveMid * 1.35);

  const taxiPrivateMid = Math.max(days * 400, roadKm * 6) * (p >= 4 ? 1.2 : 1);
  const taxiPrivateRange = clampRange(taxiPrivateMid * 0.8, taxiPrivateMid * 1.3);

  const grandTaxiSeat = clampRange(
    Math.max(15, roadKm * 1.8),
    Math.max(40, roadKm * 3.2)
  );
  const grandTaxiGroup = [
    roundMad(grandTaxiSeat[0] * p),
    roundMad(grandTaxiSeat[1] * p),
  ];

  const busPerPerson = clampRange(
    Math.max(20, days * 25 + roadKm * 0.8),
    Math.max(50, days * 60 + roadKm * 1.6)
  );
  const busGroup = [
    roundMad(busPerPerson[0] * p),
    roundMad(busPerPerson[1] * p),
  ];

  const hybridBusShare = 0.55;
  const hybridTaxiShare = 0.45;
  const hybridMid =
    (busPerPerson[0] + busPerPerson[1]) / 2 * p * hybridBusShare +
    (inDriveRange[0] + inDriveRange[1]) / 2 * hybridTaxiShare;
  const hybridRange = clampRange(hybridMid * 0.8, hybridMid * 1.25);

  const shortUrban = roadKm < 35;
  const longAtlas = roadKm > 120;

  const plans = [
    {
      id: 'indrive',
      icon: 'hail',
      titleKey: 'transportInDrive',
      hintKey: 'transportInDriveHint',
      bestForKey: 'transportBestFlexible',
      priceMin: inDriveRange[0],
      priceMax: inDriveRange[1],
      priceScope: 'group',
      timeKey: shortUrban ? 'transportTimeFast' : 'transportTimeMedium',
      coverageKey: 'transportCoverageDoor',
      recommended: shortUrban || (!longAtlas && p <= 3),
    },
    {
      id: 'taxi',
      icon: 'local_taxi',
      titleKey: 'transportTaxi',
      hintKey: 'transportTaxiHint',
      bestForKey: 'transportBestGroup',
      priceMin: taxiPrivateRange[0],
      priceMax: taxiPrivateRange[1],
      priceScope: 'group',
      timeKey: 'transportTimeFast',
      coverageKey: 'transportCoverageDoor',
      recommended: p >= 3 || longAtlas,
    },
    {
      id: 'grand-taxi',
      icon: 'airport_shuttle',
      titleKey: 'transportGrandTaxi',
      hintKey: 'transportGrandTaxiHint',
      bestForKey: 'transportBestBudget',
      priceMin: grandTaxiGroup[0],
      priceMax: grandTaxiGroup[1],
      priceScope: 'group',
      perPersonMin: grandTaxiSeat[0],
      perPersonMax: grandTaxiSeat[1],
      timeKey: 'transportTimeMedium',
      coverageKey: 'transportCoverageHubs',
      recommended: !shortUrban && p <= 4,
    },
    {
      id: 'bus',
      icon: 'directions_bus',
      titleKey: 'transportBus',
      hintKey: 'transportBusHint',
      bestForKey: 'transportBestCheap',
      priceMin: busGroup[0],
      priceMax: busGroup[1],
      priceScope: 'group',
      perPersonMin: busPerPerson[0],
      perPersonMax: busPerPerson[1],
      timeKey: 'transportTimeSlow',
      coverageKey: 'transportCoverageCities',
      recommended: longAtlas && p >= 2,
    },
    {
      id: 'hybrid',
      icon: 'sync_alt',
      titleKey: 'transportHybrid',
      hintKey: 'transportHybridHint',
      bestForKey: 'transportBestBalanced',
      priceMin: hybridRange[0],
      priceMax: hybridRange[1],
      priceScope: 'group',
      timeKey: 'transportTimeMedium',
      coverageKey: 'transportCoverageMixed',
      recommended: !shortUrban,
    },
  ];

  // Ensure at least one recommended
  if (!plans.some((x) => x.recommended)) {
    plans[0].recommended = true;
  }

  return {
    totalKm: Math.round(totalKm * 10) / 10,
    roadKm: Math.round(roadKm * 10) / 10,
    stopCount: stops.length,
    days,
    people: p,
    plans,
  };
}
