/**
 * Flagship 360° preview — exactly ONE POI (Phase 6).
 *
 * Swap FLAGSHIP_POI_ID and replace public/panorama/flagship-360.jpg
 * with your real equirectangular photo when ready.
 */
export const FLAGSHIP_POI_ID = 'poi-ouzoud-falls';

export const FLAGSHIP_PANO = {
  /** Local equirectangular image (replace with your team’s real 360° shot). */
  imageUrl: '/panorama/flagship-360.jpg',
  /** Short hotspot labels — observational, not fabricated site history. */
  hotspots: [
    {
      id: 'falls',
      pitch: -8,
      yaw: 0,
      type: 'info',
      text: 'Cascade viewpoint — look toward the main drop.',
    },
    {
      id: 'trail',
      pitch: -5,
      yaw: 90,
      type: 'info',
      text: 'Trail corridor — path along the valley rim.',
    },
    {
      id: 'overlook',
      pitch: 5,
      yaw: -120,
      type: 'info',
      text: 'Valley overlook — wider landscape of the gorge.',
    },
  ],
};

export function isFlagshipPoi(poiId) {
  return poiId === FLAGSHIP_POI_ID;
}
