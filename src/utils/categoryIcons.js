/** Material Symbol per POI / interest category (for icon-first filters). */
export const CATEGORY_ICONS = {
  all: 'apps',
  nature: 'forest',
  history: 'history_edu',
  culture: 'palette',
  family: 'groups',
  waterfall: 'water',
  spring: 'water_drop',
  river: 'waves',
  lake: 'water',
  garden: 'yard',
  park: 'park',
  museum: 'museum',
  heritage: 'castle',
  valley: 'landscape',
  village: 'cottage',
  gorge: 'filter_hdr',
  peak: 'terrain',
  geology: 'volcano',
  market: 'storefront',
};

export function categoryIcon(id) {
  return CATEGORY_ICONS[id] || 'place';
}
