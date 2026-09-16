/**
 * Sample / fallback photos when an entity has no real images.
 * Drop files in public/samples/ — see public/samples/README.md
 */

/** Generic place gallery used when a POI has no images. */
export const SAMPLE_PLACE_IMAGES = [
  '/samples/places/1.jpg',
  '/samples/places/2.jpg',
  '/samples/places/3.jpg',
];

/** Optional single cover per category (falls back to SAMPLE_PLACE_IMAGES). */
export const SAMPLE_CATEGORY_COVER = {
  waterfall: '/samples/categories/waterfall/1.jpg',
  lake: '/samples/categories/lake/1.jpg',
  garden: '/samples/categories/garden/1.jpg',
  heritage: '/samples/categories/heritage/1.jpg',
  nature: '/samples/categories/nature/1.jpg',
  valley: '/samples/categories/nature/1.jpg',
  spring: '/samples/categories/garden/1.jpg',
  river: '/samples/categories/lake/1.jpg',
  peak: '/samples/categories/nature/1.jpg',
  geology: '/samples/categories/nature/1.jpg',
  gorge: '/samples/categories/nature/1.jpg',
  park: '/samples/categories/garden/1.jpg',
  village: '/samples/categories/heritage/1.jpg',
  market: '/samples/categories/heritage/1.jpg',
  museum: '/samples/categories/heritage/1.jpg',
};

export const SAMPLE_ARTISAN_PHOTO = '/samples/artisans/bazar-ibrahimy.jpg';

/** Stable local photos for listings whose former remote URLs no longer exist. */
export const SAMPLE_ARTISAN_PHOTOS = {
  'artisan-bazar-ouzoud': '/samples/artisans/bazar-ouzoud.jpg',
  'artisan-bazar-ibrahimy': '/samples/artisans/bazar-ibrahimy.jpg',
};

export function artisanFallbackPhoto(listingOrContact) {
  return SAMPLE_ARTISAN_PHOTOS[listingOrContact?.id] || SAMPLE_ARTISAN_PHOTO;
}

/** Gallery list for a place with no catalog photos. */
export function samplePlaceImages(category) {
  const cover = category ? SAMPLE_CATEGORY_COVER[category] : null;
  if (cover) {
    return [cover, ...SAMPLE_PLACE_IMAGES.filter((u) => u !== cover)];
  }
  return [...SAMPLE_PLACE_IMAGES];
}

export function samplePlaceCover(category) {
  return samplePlaceImages(category)[0] || null;
}

export function resolveArtisanPhoto(listingOrContact) {
  if (!listingOrContact) return SAMPLE_ARTISAN_PHOTO;
  const localPhoto = SAMPLE_ARTISAN_PHOTOS[listingOrContact.id];
  if (localPhoto) return localPhoto;
  const url =
    listingOrContact.photoUrl ||
    listingOrContact.contactInfo?.photoUrl ||
    listingOrContact.contactInfo?.photo ||
    null;
  return url || artisanFallbackPhoto(listingOrContact);
}

/** Product photo with graceful fallback to the artisan / sample photo. */
export function resolveProductPhoto(product, listing) {
  const url = product?.imageUrl || product?.photoUrl || '';
  if (url) return url;
  return resolveArtisanPhoto(listing);
}
