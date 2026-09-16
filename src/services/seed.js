/**
 * Seed Firestore `pois` from local JSON (client SDK — fine for Spark demo).
 */
import { doc, writeBatch } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import seedPois from '../data/seedPois.json';

/** Legacy demo IDs removed when re-seeding verified Google Maps POIs. */
const LEGACY_POI_IDS = [
  'ouzoud',
  'ain-asserdoun',
  'bin-el-ouidane',
  'kasbah-tadla',
  'oum-er-rbia',
  'aguelmam-azegza',
  'jbel-tassemit',
  'taghzirt',
];

export function getSeedPois() {
  return seedPois;
}

/**
 * Writes all seed POIs (overwrites same IDs) and deletes legacy demo IDs.
 * Returns count written.
 */
export async function seedPoisToFirestore() {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firestore is not configured. Check your .env file.');
  }

  const batch = writeBatch(db);

  for (const id of LEGACY_POI_IDS) {
    batch.delete(doc(db, 'pois', id));
  }

  for (const poi of seedPois) {
    const { id, ...rest } = poi;
    batch.set(doc(db, 'pois', id), rest);
  }

  await batch.commit();
  return seedPois.length;
}

/**
 * Convenience: seed only when the collection is empty.
 * @param {Array} existingPois
 */
export async function seedPoisIfEmpty(existingPois) {
  if (existingPois?.length > 0) {
    return { seeded: false, count: existingPois.length };
  }
  const count = await seedPoisToFirestore();
  return { seeded: true, count };
}
