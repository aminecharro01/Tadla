/**
 * Catalog reads with local seed fallback so the demo never shows an empty map.
 * When Firestore has POIs / artisans but missing images, fill paths from seed.
 */
import seedArtisans from '../data/seedArtisans.json';
import seedPois from '../data/seedPois.json';
import { getArtisanListings, getPoiById, getPois } from './firestore';

const seedById = new Map(seedPois.map((p) => [p.id, p]));
const seedArtisanById = new Map(seedArtisans.map((a) => [a.id, a]));

function withSeedImages(poi) {
  if (!poi) return poi;
  const images = Array.isArray(poi.images) ? poi.images.filter(Boolean) : [];
  if (images.length) return { ...poi, images };
  const seed = seedById.get(poi.id);
  if (seed?.images?.length) {
    return { ...poi, images: [...seed.images] };
  }
  return { ...poi, images };
}

/**
 * Firestore listings seeded before product photos still lack imageUrl.
 * Fill missing product / contact photos from the local seed when ids match.
 */
function withSeedArtisanMedia(listing) {
  if (!listing) return listing;
  const seed = seedArtisanById.get(listing.id);
  if (!seed) return listing;

  const seedProducts = Array.isArray(seed.products) ? seed.products : [];
  const remoteProducts = Array.isArray(listing.products) ? listing.products : [];

  const products = remoteProducts.map((product, index) => {
    if (product?.imageUrl || product?.photoUrl) return product;
    const byName = seedProducts.find(
      (sp) =>
        sp?.name &&
        product?.name &&
        String(sp.name).toLowerCase() === String(product.name).toLowerCase()
    );
    const fallback = byName || seedProducts[index];
    const imageUrl = fallback?.imageUrl || fallback?.photoUrl || '';
    return imageUrl ? { ...product, imageUrl } : product;
  });

  const contactInfo = { ...(listing.contactInfo || {}) };
  if (!contactInfo.photoUrl && seed.contactInfo?.photoUrl) {
    contactInfo.photoUrl = seed.contactInfo.photoUrl;
  }

  return { ...listing, products, contactInfo };
}

export async function getPoisResolved() {
  try {
    const remote = await getPois();
    if (Array.isArray(remote) && remote.length > 0) {
      return { pois: remote.map(withSeedImages), fromSeed: false };
    }
  } catch {
    /* fall through to seed */
  }
  return { pois: seedPois.map((p) => ({ ...p })), fromSeed: true };
}

export async function getPoiResolved(id) {
  try {
    const remote = await getPoiById(id);
    if (remote) return { poi: withSeedImages(remote), fromSeed: false };
  } catch {
    /* fall through */
  }
  const local = seedPois.find((p) => p.id === id);
  return local
    ? { poi: { ...local }, fromSeed: true }
    : { poi: null, fromSeed: true };
}

export async function getArtisansResolved() {
  try {
    const remote = await getArtisanListings();
    if (Array.isArray(remote) && remote.length > 0) {
      return {
        artisans: remote.map(withSeedArtisanMedia),
        fromSeed: false,
      };
    }
  } catch {
    /* fall through to seed */
  }
  return {
    artisans: seedArtisans.map((a) => ({ ...a })),
    fromSeed: true,
  };
}

export async function getArtisanResolved(id) {
  if (!id) return { listing: null, fromSeed: true };
  try {
    const remote = await getArtisanListings();
    const found = Array.isArray(remote)
      ? remote.find((a) => a.id === id)
      : null;
    if (found) {
      return { listing: withSeedArtisanMedia(found), fromSeed: false };
    }
  } catch {
    /* fall through */
  }
  const local = seedArtisans.find((a) => a.id === id);
  return local
    ? { listing: { ...local }, fromSeed: true }
    : { listing: null, fromSeed: true };
}
