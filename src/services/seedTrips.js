/**
 * Seed Firestore `tripPrograms` from local JSON (demo trips).
 * Available dates are generated at seed time so they are always in the future.
 */
import { doc, writeBatch } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import seedTrips from '../data/seedTrips.json';

/** Generate future ISO dates (YYYY-MM-DD) at the given day offsets. */
export function demoFutureDates(offsets = [3, 7, 10, 14, 21, 28]) {
  const today = new Date();
  return offsets.map((days) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  });
}

/** Seed trips with fresh future dates injected. */
export function getSeedTrips() {
  return seedTrips.map((trip) => ({
    ...trip,
    availableDates: trip.availableDates?.length
      ? trip.availableDates
      : demoFutureDates(),
  }));
}

export async function seedTripsToFirestore() {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firestore is not configured. Check your .env file.');
  }
  const batch = writeBatch(db);
  for (const trip of getSeedTrips()) {
    const { id, ...rest } = trip;
    batch.set(doc(db, 'tripPrograms', id), rest);
  }
  await batch.commit();
  return seedTrips.length;
}
