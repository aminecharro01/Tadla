/**
 * Signs in as each demo account and probes Firestore rules:
 * expected-allowed and expected-denied operations per role.
 * Prints a matrix + flags any mismatch. Cleans up test docs as admin.
 */
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'AIzaSyD_8ljDqrksEHI0dPql6fhFGXv6v9k_Z50',
  authDomain: 'bmkh-82c3b.firebaseapp.com',
  projectId: 'bmkh-82c3b',
});
const auth = getAuth(app);
const db = getFirestore(app);

const PASSWORD = 'Tadla2026!';
const UIDS = {
  tourist: 'Di20Me7utndXr67wr9uGbYgCTNb2',
  guide: '8ch7lpjsktUtGV8qJndbWhA0RDt2',
  artisan: 'HTtoh1kJ6AUXI5q6wclVzkrnzE53',
  coop: 'wvKPy5ebI0bMmJwyukUaWTcVfNZ2',
  admin: 'WQWG5oz8SyRdEnNmNxBlDiW8tyC3',
};
const EMAILS = {
  tourist: 'demo.tourist@tadla.ma',
  guide: 'demo.guide@tadla.ma',
  artisan: 'demo.artisan@tadla.ma',
  coop: 'demo.coop@tadla.ma',
  admin: 'demo.admin@tadla.ma',
};

const results = [];
const created = []; // {col, id} to delete as admin at the end
const shared = {}; // ids reused across roles

function record(role, test, allowed, expected, note = '') {
  const ok = allowed === expected;
  results.push({ role, test, allowed, expected, ok, note });
  const mark = ok ? 'OK  ' : 'FLAG';
  console.log(
    `${mark} [${role}] ${test} -> ${allowed ? 'ALLOWED' : 'denied'} (expected ${expected ? 'allowed' : 'denied'}) ${note}`
  );
}

async function attempt(fn) {
  try {
    const val = await fn();
    return { allowed: true, val };
  } catch (err) {
    if (err?.code === 'permission-denied') return { allowed: false };
    if (err?.code === 'not-found') return { allowed: null, skip: true };
    throw err;
  }
}

async function asRole(role, fn) {
  await signInWithEmailAndPassword(auth, EMAILS[role], PASSWORD);
  try {
    await fn(UIDS[role]);
  } finally {
    await signOut(auth);
  }
}

const now = new Date().toISOString();
const futureDate = new Date(Date.now() + 12 * 86400000).toISOString().slice(0, 10);

/* ----------------------------- TOURIST ----------------------------- */
await asRole('tourist', async (uid) => {
  let r = await attempt(() => getDocs(collection(db, 'pois')));
  record('tourist', 'read places catalog', r.allowed, true);

  r = await attempt(() =>
    setDoc(doc(db, 'pois', 'permtest-poi'), { name: 'perm test', category: 'nature' })
  );
  record('tourist', 'write a place (admin only)', r.allowed, false);
  if (r.allowed) created.push({ col: 'pois', id: 'permtest-poi' });

  r = await attempt(() =>
    addDoc(collection(db, 'tripPrograms'), {
      guideId: uid, title: 'perm test trip', price: 1, days: [], availableDates: [], maxGroupSize: 1,
    })
  );
  record('tourist', 'create a trip program (guides only)', r.allowed, false);
  if (r.allowed) created.push({ col: 'tripPrograms', id: r.val.id });

  r = await attempt(() =>
    addDoc(collection(db, 'bookings'), {
      tripProgramId: 'trip-ouzoud-day-escape', touristId: uid, date: futureDate,
      numPeople: 2, status: 'pending', createdAt: now,
    })
  );
  record('tourist', 'book a trip for self', r.allowed, true);
  if (r.allowed) { shared.touristBooking = r.val.id; }

  if (shared.touristBooking) {
    r = await attempt(() =>
      updateDoc(doc(db, 'bookings', shared.touristBooking), { status: 'confirmed' })
    );
    record('tourist', 'self-confirm own booking (should be guide-only)', r.allowed, false);
  }

  r = await attempt(() =>
    addDoc(collection(db, 'artisanListings'), {
      artisanId: uid, craftType: 'test', village: 'test', products: [], contactInfo: { name: 'x', whatsapp: '' },
    })
  );
  record('tourist', 'create artisan listing (artisans only)', r.allowed, false);
  if (r.allowed) created.push({ col: 'artisanListings', id: r.val.id });

  r = await attempt(() =>
    addDoc(collection(db, 'productOrders'), {
      artisanListingId: 'demo', artisanId: UIDS.artisan, artisanName: 'Demo Artisan',
      touristId: uid, touristName: 'Demo Tourist', productName: 'Perm test product',
      unitPrice: 10, quantity: 1, total: 10, note: '', status: 'pending', createdAt: now,
    })
  );
  record('tourist', 'order an artisan product', r.allowed, true);
  if (r.allowed) { shared.touristOrder = r.val.id; }

  if (shared.touristOrder) {
    r = await attempt(() =>
      updateDoc(doc(db, 'productOrders', shared.touristOrder), { status: 'confirmed' })
    );
    record('tourist', 'self-confirm own order (artisan only)', r.allowed, false);
  }

  r = await attempt(() => getDocs(collection(db, 'users')));
  record('tourist', 'list all user accounts (admin only)', r.allowed, false);

  r = await attempt(() => getDoc(doc(db, 'users', UIDS.guide)));
  record('tourist', "read another user's profile", r.allowed, false);

  r = await attempt(() =>
    addDoc(collection(db, 'reviews'), {
      targetType: 'poi', targetId: 'poi-ouzoud-falls', userId: uid,
      rating: 5, comment: 'Demo review', createdAt: now,
    })
  );
  record('tourist', 'leave a review', r.allowed, true);
  if (r.allowed) created.push({ col: 'reviews', id: r.val.id });

  r = await attempt(() =>
    addDoc(collection(db, 'savedItineraries'), {
      touristId: uid, days: [], interests: ['nature'], status: 'pending', createdAt: now,
    })
  );
  record('tourist', 'save an itinerary', r.allowed, true);
  if (r.allowed) created.push({ col: 'savedItineraries', id: r.val.id });

  r = await attempt(() => getDocs(collection(db, 'savedItineraries')));
  record('tourist', "list all tourists' itineraries", r.allowed, false);
});

/* ------------------------------ GUIDE ------------------------------ */
await asRole('guide', async (uid) => {
  let r = await attempt(() =>
    addDoc(collection(db, 'tripPrograms'), {
      guideId: uid, title: 'Perm test guide trip', description: '', price: 100,
      days: [{ day: 1, poiIds: ['poi-ouzoud-falls'] }], availableDates: [futureDate], maxGroupSize: 4,
    })
  );
  record('guide', 'create own trip program', r.allowed, true);
  if (r.allowed) created.push({ col: 'tripPrograms', id: r.val.id });

  r = await attempt(() =>
    updateDoc(doc(db, 'tripPrograms', 'trip-lakes-kasbahs-2d'), { guideId: uid })
  );
  if (r.skip) {
    console.log('SKIP [guide] hijack test — seed trip not in Firestore');
  } else {
    record('guide', "take over ANOTHER guide's trip", r.allowed, false,
      r.allowed ? '<-- SECURITY: rule lets any guide reassign any trip' : '');
    if (r.allowed) shared.hijackedTrip = 'trip-lakes-kasbahs-2d';
  }

  if (shared.touristBooking) {
    r = await attempt(() =>
      updateDoc(doc(db, 'bookings', shared.touristBooking), { status: 'confirmed' })
    );
    record('guide', "confirm a booking on ANOTHER guide's trip", r.allowed, false,
      r.allowed ? '<-- any guide can manage any booking' : '');
  }

  r = await attempt(() =>
    addDoc(collection(db, 'artisanListings'), {
      artisanId: uid, craftType: 'test', village: 'test', products: [], contactInfo: { name: 'x', whatsapp: '' },
    })
  );
  record('guide', 'create artisan listing (artisans only)', r.allowed, false);
  if (r.allowed) created.push({ col: 'artisanListings', id: r.val.id });

  if (shared.touristOrder) {
    r = await attempt(() =>
      updateDoc(doc(db, 'productOrders', shared.touristOrder), { status: 'confirmed' })
    );
    record('guide', "confirm another artisan's product order", r.allowed, false);
  }

  r = await attempt(() => getDocs(collection(db, 'users')));
  record('guide', 'list all user accounts (admin only)', r.allowed, false);

  r = await attempt(() => getDocs(collection(db, 'savedItineraries')));
  record('guide', 'read saved itineraries (quote requests — by design)', r.allowed, true);

  r = await attempt(() =>
    setDoc(doc(db, 'pois', 'permtest-poi'), { name: 'perm test', category: 'nature' })
  );
  record('guide', 'write a place (admin only)', r.allowed, false);
  if (r.allowed) created.push({ col: 'pois', id: 'permtest-poi' });
});

/* ----------------------------- ARTISAN ----------------------------- */
await asRole('artisan', async (uid) => {
  let r = await attempt(() =>
    addDoc(collection(db, 'artisanListings'), {
      artisanId: uid, craftType: 'pottery & ceramics', village: 'Béni Mellal',
      description: 'Demo artisan workshop for the marketplace demo.',
      products: [
        { name: 'Hand-glazed bowl', price: 90 },
        { name: 'Mini tagine', price: 45 },
      ],
      contactInfo: { name: 'Demo Artisan Atelier', whatsapp: '212600000010', photoUrl: '' },
    })
  );
  record('artisan', 'publish own listing', r.allowed, true);
  if (r.allowed) shared.artisanListing = r.val.id; // kept for demo

  r = await attempt(() =>
    updateDoc(doc(db, 'artisanListings', 'artisan-bazar-ouzoud'), { village: 'Ouzoud, Azilal province' })
  );
  if (r.skip) console.log('SKIP [artisan] update-other-listing — seed listing not in Firestore');
  else record('artisan', "edit ANOTHER artisan's listing", r.allowed, false);

  if (shared.touristOrder) {
    r = await attempt(() =>
      updateDoc(doc(db, 'productOrders', shared.touristOrder), { status: 'confirmed' })
    );
    record('artisan', 'confirm an order received (own)', r.allowed, true);
  }

  r = await attempt(() =>
    addDoc(collection(db, 'tripPrograms'), {
      guideId: uid, title: 'artisan trip attempt', price: 1, days: [], availableDates: [], maxGroupSize: 1,
    })
  );
  record('artisan', 'create a trip program (guides only)', r.allowed, false);
  if (r.allowed) created.push({ col: 'tripPrograms', id: r.val.id });

  if (shared.touristBooking) {
    r = await attempt(() =>
      updateDoc(doc(db, 'bookings', shared.touristBooking), { status: 'cancelled' })
    );
    record('artisan', "cancel a tourist's trip booking", r.allowed, false);
  }

  r = await attempt(() => getDocs(collection(db, 'users')));
  record('artisan', 'list all user accounts (admin only)', r.allowed, false);

  r = await attempt(() => getDocs(collection(db, 'savedItineraries')));
  record('artisan', "list tourists' itineraries", r.allowed, false);
});

/* ------------------------------ COOP ------------------------------- */
await asRole('coop', async (uid) => {
  let r = await attempt(() =>
    addDoc(collection(db, 'artisanListings'), {
      artisanId: uid, craftType: 'women weaving cooperative', village: 'Azilal',
      description: 'Demo cooperative listing.',
      products: [{ name: 'Wool blanket', price: 600 }],
      contactInfo: { name: 'Demo Cooperative', whatsapp: '212600000011', photoUrl: '' },
    })
  );
  record('coop', 'publish own listing (cooperative)', r.allowed, true);
  if (r.allowed) shared.coopListing = r.val.id; // kept for demo

  r = await attempt(() =>
    addDoc(collection(db, 'tripPrograms'), {
      guideId: uid, title: 'coop trip attempt', price: 1, days: [], availableDates: [], maxGroupSize: 1,
    })
  );
  record('coop', 'create a trip program (guides only)', r.allowed, false);
  if (r.allowed) created.push({ col: 'tripPrograms', id: r.val.id });

  r = await attempt(() => getDocs(collection(db, 'users')));
  record('coop', 'list all user accounts (admin only)', r.allowed, false);
});

/* ------------------------------ ADMIN ------------------------------ */
await asRole('admin', async () => {
  let r = await attempt(() => getDocs(collection(db, 'users')));
  record('admin', 'list all user accounts', r.allowed, true);

  r = await attempt(() =>
    setDoc(doc(db, 'pois', 'permtest-poi'), { name: 'perm test poi', category: 'nature', lat: 0, lng: 0 })
  );
  record('admin', 'write a place', r.allowed, true);
  if (r.allowed) created.push({ col: 'pois', id: 'permtest-poi' });

  r = await attempt(() => getDocs(collection(db, 'bookings')));
  record('admin', 'read all bookings', r.allowed, true);

  r = await attempt(() => getDocs(collection(db, 'productOrders')));
  record('admin', 'read all product orders', r.allowed, true);

  // Repair anything the hijack test changed
  if (shared.hijackedTrip) {
    await updateDoc(doc(db, 'tripPrograms', shared.hijackedTrip), { guideId: 'seed-guide-demo' });
    console.log('repaired guideId of', shared.hijackedTrip);
  }

  // Cleanup pure test artifacts (keep: tourist booking, tourist order, artisan/coop listings)
  for (const { col, id } of created) {
    try {
      await deleteDoc(doc(db, col, id));
      console.log(`cleaned ${col}/${id}`);
    } catch (err) {
      console.log(`cleanup failed ${col}/${id}: ${err.code}`);
    }
  }
});

/* ------------------------------ SUMMARY ----------------------------- */
const flags = results.filter((r) => !r.ok);
console.log('\n===== SUMMARY =====');
console.log(`checks: ${results.length}, conform: ${results.length - flags.length}, flags: ${flags.length}`);
for (const f of flags) {
  console.log(`FLAG [${f.role}] ${f.test} — got ${f.allowed ? 'ALLOWED' : 'denied'}, expected ${f.expected ? 'allowed' : 'denied'}`);
}
console.log('kept demo data:', JSON.stringify(shared));
process.exit(0);
