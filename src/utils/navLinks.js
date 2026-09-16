/**
 * Deep links into Google Maps / Apple Maps / Waze (no API keys).
 * Multi-stop works best in Google Maps; Waze is single-destination.
 */

function validStops(stops) {
  return (stops || []).filter(
    (s) => typeof s?.lat === 'number' && typeof s?.lng === 'number'
  );
}

/** Full multi-stop driving directions in Google Maps. */
export function buildGoogleMapsDirectionsUrl(stops) {
  const list = validStops(stops);
  if (!list.length) return null;
  const path = list.map((s) => `${s.lat},${s.lng}`).join('/');
  return `https://www.google.com/maps/dir/${path}`;
}

/** Apple Maps directions (multi-stop via +to: chain). */
export function buildAppleMapsDirectionsUrl(stops) {
  const list = validStops(stops);
  if (!list.length) return null;

  if (list.length === 1) {
    return `https://maps.apple.com/?daddr=${list[0].lat},${list[0].lng}&dirflg=d`;
  }

  const [start, ...rest] = list;
  const daddr = rest.map((s) => `${s.lat},${s.lng}`).join('+to:');
  return `https://maps.apple.com/?saddr=${start.lat},${start.lng}&daddr=${daddr}&dirflg=d`;
}

/** Waze navigate-to for a single stop (app opens on mobile if installed). */
export function buildWazeNavigateUrl(stop) {
  if (typeof stop?.lat !== 'number' || typeof stop?.lng !== 'number') return null;
  return `https://waze.com/ul?ll=${stop.lat}%2C${stop.lng}&navigate=yes`;
}
