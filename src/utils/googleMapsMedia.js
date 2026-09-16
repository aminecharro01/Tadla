/**
 * Place media helpers: catalog images → sample fallbacks → optional Street View static.
 */
import {
  samplePlaceCover,
  samplePlaceImages,
} from './sampleMedia';

export function getGoogleMapsApiKey() {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  return typeof key === 'string' && key.trim() ? key.trim() : '';
}

export function hasGoogleMapsApiKey() {
  return Boolean(getGoogleMapsApiKey());
}

/**
 * Static Street View JPEG for a place (cover / map pin).
 * @see https://developers.google.com/maps/documentation/streetview/overview
 */
export function streetViewStaticUrl({
  lat,
  lng,
  panoId,
  heading = 0,
  pitch = 0,
  fov = 80,
  size = '640x400',
} = {}) {
  const key = getGoogleMapsApiKey();
  if (!key) return null;
  if (panoId) {
    const params = new URLSearchParams({
      size,
      pano: String(panoId),
      heading: String(heading),
      pitch: String(pitch),
      fov: String(fov),
      key,
    });
    return `https://maps.googleapis.com/maps/api/streetview?${params}`;
  }
  if (lat == null || lng == null || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
    return null;
  }
  const params = new URLSearchParams({
    size,
    location: `${Number(lat)},${Number(lng)}`,
    heading: String(heading),
    pitch: String(pitch),
    fov: String(fov),
    key,
  });
  return `https://maps.googleapis.com/maps/api/streetview?${params}`;
}

function catalogImages(poi) {
  return Array.isArray(poi?.images) ? poi.images.filter(Boolean) : [];
}

/** First usable catalog image, else sample, else Street View static if a Maps key is set. */
export function resolvePoiCoverUrl(poi, streetViewPlace) {
  const images = catalogImages(poi);
  if (images[0]) return images[0];

  const sample = samplePlaceCover(poi?.category);
  if (sample) return sample;

  if (streetViewPlace?.panoId || streetViewPlace?.lat != null) {
    return streetViewStaticUrl({
      lat: streetViewPlace.lat ?? poi?.lat,
      lng: streetViewPlace.lng ?? poi?.lng,
      panoId: streetViewPlace.panoId,
      heading: streetViewPlace.heading ?? 0,
      pitch: streetViewPlace.pitch ?? 0,
      fov: streetViewPlace.fov ?? 80,
    });
  }
  return streetViewStaticUrl({ lat: poi?.lat, lng: poi?.lng });
}

/**
 * Gallery list: catalog images, or category/generic samples.
 * Broken local files are filtered by gallery components; they then call
 * {@link fallbackGalleryImages} when the list becomes empty.
 */
export function resolvePoiGalleryImages(poi, streetViewPlace) {
  const images = catalogImages(poi);
  if (images.length) return images;
  return fallbackGalleryImages(poi, streetViewPlace);
}

/** Sample (or Street View) gallery when a place has no usable photos. */
export function fallbackGalleryImages(poi, streetViewPlace) {
  const samples = samplePlaceImages(poi?.category);
  if (samples.length) return samples;
  const cover = resolvePoiCoverUrl({ ...poi, images: [] }, streetViewPlace);
  return cover ? [cover] : [];
}
