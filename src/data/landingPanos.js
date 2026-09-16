/**
 * Flagship places for the landing photo carousel.
 * Photos live in public/places/{poiId}/1.jpg, 2.jpg, 3.jpg…
 * Optional mapsUrl opens Google Maps for the place.
 */
import { getGoogleMapsApiKey } from '../utils/googleMapsMedia';

export const LANDING_GALLERY_PLACES = [
  {
    poiId: 'poi-ouzoud-falls',
    fallbackName: 'Cascades d’Ouzoud',
    lat: 32.0157826,
    lng: -6.7199528,
    fallbackImages: [
      '/places/poi-ouzoud-falls/1.jpg',
      '/places/poi-ouzoud-falls/2.jpg',
      '/places/poi-ouzoud-falls/3.jpg',
    ],
    mapsUrl:
      'https://www.google.com/maps/place/Ouzoud+Waterfalls/@32.0157826,-6.7199528,17z',
  },
  {
    poiId: 'poi-bin-el-ouidane',
    fallbackName: 'Bin El Ouidane',
    lat: 32.1057742,
    lng: -6.4632473,
    fallbackImages: [
      '/places/poi-bin-el-ouidane/1.jpg',
      '/places/poi-bin-el-ouidane/2.jpg',
      '/places/poi-bin-el-ouidane/3.jpg',
    ],
    mapsUrl:
      'https://www.google.com/maps/place/Bin+el+Ouidane/@32.1057742,-6.4632473,17z',
  },
  {
    poiId: 'poi-ain-asserdoun',
    fallbackName: 'Aïn Asserdoun',
    lat: 32.3249885,
    lng: -6.336337,
    fallbackImages: [
      '/places/poi-ain-asserdoun/1.jpg',
      '/places/poi-ain-asserdoun/2.jpg',
      '/places/poi-ain-asserdoun/3.jpg',
    ],
    mapsUrl:
      'https://www.google.com/maps/place/Ain+Asserdoun/@32.3249885,-6.336337,17z',
  },
];

/** @deprecated use LANDING_GALLERY_PLACES */
export const LANDING_PANO_PLACES = LANDING_GALLERY_PLACES;

const byPoiId = new Map(LANDING_GALLERY_PLACES.map((p) => [p.poiId, p]));

/** Known curated place, or a location pin when Maps key exists. */
export function getStreetViewPlace(poi) {
  if (!poi) return null;
  const known = byPoiId.get(poi.id);
  if (known) return known;
  if (
    poi.lat == null ||
    poi.lng == null ||
    Number.isNaN(Number(poi.lat)) ||
    Number.isNaN(Number(poi.lng))
  ) {
    return null;
  }
  if (!getGoogleMapsApiKey()) return null;
  return {
    poiId: poi.id,
    fallbackName: poi.name,
    lat: Number(poi.lat),
    lng: Number(poi.lng),
    mapsUrl: `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${poi.lat},${poi.lng}`,
  };
}

/** @deprecated Street View embeds removed — PhotoCarousel is used instead. */
export function googleStreetViewEmbedSrc() {
  return null;
}
