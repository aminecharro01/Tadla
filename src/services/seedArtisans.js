/**
 * Seed Firestore `artisanListings` from local JSON.
 */
import { doc, writeBatch } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import seedArtisans from '../data/seedArtisans.json';

const LEGACY_ARTISAN_IDS = [
  'artisan-taghzirt-weaving',
  'artisan-beni-mellal-pottery',
  'artisan-azilal-wood',
  'artisan-khenifra-jewelry',
  'artisan-ouzoud-basketry',
];

export function getSeedArtisans() {
  return seedArtisans;
}

export async function seedArtisansToFirestore() {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firestore is not configured. Check your .env file.');
  }

  const batch = writeBatch(db);

  for (const id of LEGACY_ARTISAN_IDS) {
    batch.delete(doc(db, 'artisanListings', id));
  }

  for (const listing of seedArtisans) {
    const { id, ...rest } = listing;
    batch.set(doc(db, 'artisanListings', id), rest);
  }
  await batch.commit();
  return seedArtisans.length;
}
