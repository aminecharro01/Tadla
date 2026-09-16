/**
 * Firestore helpers for Tadla data model (reads + Phase 4 writes).
 */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { categoriesForInterest } from '../i18n/strings';
import { getSeedTrips } from './seedTrips';

function assertDb() {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firestore is not configured. Check your .env file.');
  }
}

export async function getCollection(name) {
  assertDb();
  const snap = await getDocs(collection(db, name));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getById(collectionName, id) {
  assertDb();
  const snap = await getDoc(doc(db, collectionName, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getPois() {
  return getCollection('pois');
}

export async function getPoiById(id) {
  return getById('pois', id);
}

export async function getUserById(id) {
  return getById('users', id);
}

/**
 * Trip programs with demo fallback: when Firestore has none (or is offline),
 * local seed trips are returned so the catalog is never empty.
 */
export async function getTripPrograms() {
  try {
    const remote = await getCollection('tripPrograms');
    if (remote.length > 0) return remote;
  } catch {
    /* fall through to seed */
  }
  return getSeedTrips();
}

export async function getTripProgramById(id) {
  try {
    const remote = await getById('tripPrograms', id);
    if (remote) return remote;
  } catch {
    /* fall through to seed */
  }
  return getSeedTrips().find((trip) => trip.id === id) || null;
}

export async function getTripProgramsByGuide(guideId) {
  assertDb();
  const q = query(collection(db, 'tripPrograms'), where('guideId', '==', guideId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Create a trip program. Returns the new document id.
 * Shape: { guideId, title, description, price, days, availableDates, maxGroupSize }
 */
export async function createTripProgram(data) {
  assertDb();
  const payload = {
    guideId: data.guideId,
    title: data.title,
    description: data.description || '',
    price: Number(data.price) || 0,
    days: Array.isArray(data.days) ? data.days : [],
    availableDates: Array.isArray(data.availableDates) ? data.availableDates : [],
    maxGroupSize: Number(data.maxGroupSize) || 1,
    coverImage: data.coverImage || '',
  };
  const ref = await addDoc(collection(db, 'tripPrograms'), payload);
  return ref.id;
}

export async function getBookingsForTourist(touristId) {
  assertDb();
  const q = query(collection(db, 'bookings'), where('touristId', '==', touristId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getBookingsForTripProgram(tripProgramId) {
  assertDb();
  const q = query(
    collection(db, 'bookings'),
    where('tripProgramId', '==', tripProgramId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** All bookings across a guide’s programs (parallel queries). */
export async function getBookingsForGuide(guideId) {
  const programs = await getTripProgramsByGuide(guideId);
  if (!programs.length) return [];

  const nested = await Promise.all(
    programs.map(async (program) => {
      const bookings = await getBookingsForTripProgram(program.id);
      return bookings.map((b) => ({
        ...b,
        tripTitle: program.title,
      }));
    })
  );

  return nested.flat().sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

export async function getBookingById(id) {
  return getById('bookings', id);
}

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

/** Active = pending or confirmed (cancelled frees the slot). */
function isActiveBooking(b) {
  return b.status === 'pending' || b.status === 'confirmed';
}

/**
 * Remaining seats for a trip on a date (maxGroupSize − sum of active bookings).
 */
export async function getRemainingCapacity(tripProgramId, date, excludeBookingId = null) {
  const program = await getTripProgramById(tripProgramId);
  if (!program) throw new Error('Trip program not found.');
  const max = Number(program.maxGroupSize) || 0;
  const bookings = await getBookingsForTripProgram(tripProgramId);
  const used = bookings
    .filter(
      (b) =>
        b.date === date &&
        isActiveBooking(b) &&
        (!excludeBookingId || b.id !== excludeBookingId)
    )
    .reduce((sum, b) => sum + (Number(b.numPeople) || 0), 0);
  return { max, used, remaining: Math.max(0, max - used), program };
}

/**
 * Create booking with status "pending".
 * Enforces: program exists, date available & not past, no duplicate active booking
 * for same tourist+trip+date, enough remaining capacity.
 */
export async function createBooking({ tripProgramId, touristId, date, numPeople }) {
  assertDb();

  const people = Number(numPeople) || 0;
  if (!touristId) throw new Error('You must be signed in to book.');
  if (!date) throw new Error('Choose a date.');
  if (people < 1) throw new Error('Number of people must be at least 1.');
  if (date < todayISODate()) {
    throw new Error('Cannot book a date in the past.');
  }

  const program = await getTripProgramById(tripProgramId);
  if (!program) throw new Error('Trip program not found.');

  const available = Array.isArray(program.availableDates) ? program.availableDates : [];
  if (!available.includes(date)) {
    throw new Error('That date is not available for this trip.');
  }

  const existing = await getBookingsForTripProgram(tripProgramId);
  const duplicate = existing.find(
    (b) =>
      b.touristId === touristId &&
      b.date === date &&
      isActiveBooking(b)
  );
  if (duplicate) {
    throw new Error(
      'You already have an active booking for this trip on that date. Cancel it first or pick another date.'
    );
  }

  const { remaining, max } = await getRemainingCapacity(tripProgramId, date);
  if (people > remaining) {
    throw new Error(
      remaining === 0
        ? 'This date is fully booked.'
        : `Only ${remaining} seat(s) left on this date (max group ${max}).`
    );
  }

  const payload = {
    tripProgramId,
    touristId,
    date,
    numPeople: people,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  const ref = await addDoc(collection(db, 'bookings'), payload);
  return ref.id;
}

export async function updateBookingStatus(bookingId, status) {
  assertDb();
  const allowed = ['pending', 'confirmed', 'cancelled'];
  if (!allowed.includes(status)) {
    throw new Error(`Invalid booking status: ${status}`);
  }
  await updateDoc(doc(db, 'bookings', bookingId), { status });
}

/** Update an existing trip program (guide edit). */
export async function updateTripProgram(tripId, data) {
  assertDb();
  const payload = {
    title: data.title,
    description: data.description || '',
    price: Number(data.price) || 0,
    days: Array.isArray(data.days) ? data.days : [],
    availableDates: Array.isArray(data.availableDates) ? data.availableDates : [],
    maxGroupSize: Number(data.maxGroupSize) || 1,
    coverImage: data.coverImage || '',
  };
  await updateDoc(doc(db, 'tripPrograms', tripId), payload);
}

export async function getArtisanListings() {
  return getCollection('artisanListings');
}

export async function getArtisanListingsByArtisan(artisanId) {
  assertDb();
  const q = query(collection(db, 'artisanListings'), where('artisanId', '==', artisanId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Create artisan listing.
 * contactInfo: { name, whatsapp, photoUrl }
 */
export async function createArtisanListing(data) {
  assertDb();
  const products = (Array.isArray(data.products) ? data.products : []).map((p) => ({
    name: p.name || '',
    price: Number(p.price) || 0,
    imageUrl: p.imageUrl || p.photoUrl || '',
  }));
  const payload = {
    artisanId: data.artisanId,
    craftType: data.craftType || '',
    village: data.village || '',
    description: data.description || '',
    products,
    contactInfo: {
      name: data.name || '',
      whatsapp: String(data.whatsapp || '').replace(/\D/g, ''),
      photoUrl: data.photoUrl || '',
    },
  };
  const ref = await addDoc(collection(db, 'artisanListings'), payload);
  return ref.id;
}

export async function updateArtisanListing(listingId, data) {
  assertDb();
  const products = (Array.isArray(data.products) ? data.products : []).map((p) => ({
    name: p.name || '',
    price: Number(p.price) || 0,
    imageUrl: p.imageUrl || p.photoUrl || '',
  }));
  const payload = {
    craftType: data.craftType || '',
    village: data.village || '',
    description: data.description || '',
    products,
    contactInfo: {
      name: data.name || '',
      whatsapp: String(data.whatsapp || '').replace(/\D/g, ''),
      photoUrl: data.photoUrl || '',
    },
  };
  await updateDoc(doc(db, 'artisanListings', listingId), payload);
}

/** Cancel own booking (tourist). */
export async function cancelBookingAsTourist(bookingId, touristId) {
  assertDb();
  const booking = await getBookingById(bookingId);
  if (!booking) throw new Error('Booking not found.');
  if (booking.touristId !== touristId) {
    throw new Error('You can only cancel your own bookings.');
  }
  if (booking.status === 'cancelled') {
    throw new Error('Booking is already cancelled.');
  }
  await updateBookingStatus(bookingId, 'cancelled');
}

/**
 * Partner eligibility applications (guide | artisan | cooperative).
 * status: pending_docs | pending_review | pending | approved | rejected
 */
export async function submitPartnerApplication({
  userId,
  name,
  email,
  roleRequested,
  city,
  experience,
  phone,
  documentsNote,
  documentUrls = [],
  status = 'pending_docs',
}) {
  assertDb();
  if (!['guide', 'artisan', 'cooperative'].includes(roleRequested)) {
    throw new Error('Invalid role requested.');
  }
  const existing = await getPartnerApplicationsByUser(userId);
  const open = existing.find(
    (a) =>
      a.roleRequested === roleRequested &&
      ['pending', 'pending_docs', 'pending_review'].includes(a.status)
  );
  if (open) {
    throw new Error('You already have a pending application for this role.');
  }
  const ref = await addDoc(collection(db, 'partnerApplications'), {
    userId,
    name: name || '',
    email: email || '',
    roleRequested,
    city: city || '',
    experience: experience || '',
    phone: phone || '',
    documentsNote: documentsNote || '',
    documentUrls: Array.isArray(documentUrls) ? documentUrls : [],
    status,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updatePartnerApplicationDocs(applicationId, {
  documentUrls = [],
  documentsNote = '',
  status = 'pending_review',
}) {
  assertDb();
  await updateDoc(doc(db, 'partnerApplications', applicationId), {
    documentUrls,
    documentsNote: documentsNote || '',
    status,
    docsSubmittedAt: new Date().toISOString(),
  });
}

export async function getPartnerApplicationsByUser(userId) {
  assertDb();
  const q = query(collection(db, 'partnerApplications'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getPendingPartnerApplications() {
  assertDb();
  const snap = await getDocs(collection(db, 'partnerApplications'));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((a) =>
      ['pending', 'pending_docs', 'pending_review'].includes(a.status)
    )
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function reviewPartnerApplication(applicationId, { status, adminId }) {
  assertDb();
  if (!['approved', 'rejected'].includes(status)) {
    throw new Error('Invalid review status.');
  }
  const app = await getById('partnerApplications', applicationId);
  if (!app) throw new Error('Application not found.');
  await updateDoc(doc(db, 'partnerApplications', applicationId), {
    status,
    reviewedAt: new Date().toISOString(),
    reviewedBy: adminId || null,
  });
  const role = ['guide', 'artisan', 'cooperative'].includes(app.roleRequested)
    ? app.roleRequested
    : 'tourist';
  if (status === 'approved') {
    await updateDoc(doc(db, 'users', app.userId), {
      role,
      partnerStatus: 'approved',
      approvedAt: new Date().toISOString(),
    });
  } else {
    await updateDoc(doc(db, 'users', app.userId), {
      partnerStatus: 'rejected',
      rejectedAt: new Date().toISOString(),
    });
  }
  return app;
}

/** Sync user profile partnerStatus / docs after upload. */
export async function markPartnerDocsSubmitted(userId, { documentUrls = [] } = {}) {
  assertDb();
  await updateDoc(doc(db, 'users', userId), {
    partnerStatus: 'pending_review',
    documentUrls,
    docsSubmittedAt: new Date().toISOString(),
  });
}

/** Saved AI itineraries + optional guide quote request. */
export async function saveItinerary({
  touristId,
  preferences,
  days,
  requestQuote,
  note,
}) {
  assertDb();
  const ref = await addDoc(collection(db, 'savedItineraries'), {
    touristId,
    preferences: preferences || {},
    days: days || [],
    requestQuote: Boolean(requestQuote),
    note: note || '',
    status: requestQuote ? 'quote_requested' : 'saved',
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function getSavedItinerariesForTourist(touristId) {
  assertDb();
  const q = query(collection(db, 'savedItineraries'), where('touristId', '==', touristId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function getQuoteRequestsForGuides() {
  assertDb();
  const q = query(
    collection(db, 'savedItineraries'),
    where('requestQuote', '==', true)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((s) => s.status === 'quote_requested')
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

/** Simple 1–5 star reviews on trips or artisans. */
export async function addReview({
  targetType,
  targetId,
  userId,
  userName,
  rating,
  comment,
}) {
  assertDb();
  const r = Number(rating);
  if (!['trip', 'artisan'].includes(targetType)) {
    throw new Error('Invalid review target.');
  }
  if (r < 1 || r > 5) throw new Error('Rating must be 1–5.');
  const ref = await addDoc(collection(db, 'reviews'), {
    targetType,
    targetId,
    userId,
    userName: userName || 'Traveler',
    rating: r,
    comment: comment || '',
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function getReviews(targetType, targetId) {
  assertDb();
  const q = query(
    collection(db, 'reviews'),
    where('targetType', '==', targetType),
    where('targetId', '==', targetId)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function averageRating(reviews) {
  if (!reviews?.length) return null;
  const sum = reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

/** —— Admin dashboard helpers —— */

const ADMIN_ROLES = ['tourist', 'guide', 'artisan', 'cooperative', 'admin'];

export async function getUsers() {
  const list = await getCollection('users');
  return list.sort((a, b) =>
    String(a.name || a.email || '').localeCompare(String(b.name || b.email || ''))
  );
}

export async function getAllBookings() {
  const list = await getCollection('bookings');
  return list.sort((a, b) => String(b.createdAt || b.date).localeCompare(String(a.createdAt || a.date)));
}

export async function getAllPartnerApplications() {
  const list = await getCollection('partnerApplications');
  return list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function getAllReviews() {
  const list = await getCollection('reviews');
  return list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function getAllSavedItineraries() {
  const list = await getCollection('savedItineraries');
  return list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function adminSetUserRole(userId, role) {
  assertDb();
  if (!ADMIN_ROLES.includes(role)) throw new Error('Invalid role.');
  const patch = { role };
  if (['guide', 'artisan', 'cooperative'].includes(role)) {
    patch.partnerStatus = 'approved';
    patch.approvedAt = new Date().toISOString();
  }
  await updateDoc(doc(db, 'users', userId), patch);
}

/** Convert a signed-in tourist into a pending partner (role at apply time). */
export async function convertTouristToPartner(userId, {
  role,
  city = '',
  phone = '',
  experience = '',
  name = '',
}) {
  assertDb();
  if (!['guide', 'artisan', 'cooperative'].includes(role)) {
    throw new Error('Invalid partner role.');
  }
  const patch = {
    role,
    partnerStatus: 'pending_docs',
    city,
    phone,
    experience,
    createdAsPartner: true,
    convertedAt: new Date().toISOString(),
  };
  if (name) patch.name = name;
  await updateDoc(doc(db, 'users', userId), patch);
}

export async function adminDeleteDocument(collectionName, id) {
  assertDb();
  const allowed = [
    'pois',
    'artisanListings',
    'tripPrograms',
    'bookings',
    'reviews',
    'savedItineraries',
    'partnerApplications',
  ];
  if (!allowed.includes(collectionName)) {
    throw new Error('Delete not allowed for this collection.');
  }
  await deleteDoc(doc(db, collectionName, id));
}

/** Create or merge a POI (admin catalog edit). */
export async function adminUpsertPoi(poi) {
  assertDb();
  const id = String(poi.id || '').trim();
  if (!id.startsWith('poi-')) {
    throw new Error('POI id must start with poi-');
  }
  const payload = {
    name: poi.name || '',
    category: poi.category || 'nature',
    description: poi.description || '',
    lat: Number(poi.lat),
    lng: Number(poi.lng),
    hours: poi.hours || '',
    source: poi.source || 'admin',
  };
  if (Array.isArray(poi.images)) {
    payload.images = poi.images.map((u) => String(u).trim()).filter(Boolean);
  } else if (typeof poi.imagesText === 'string') {
    payload.images = poi.imagesText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (!Number.isFinite(payload.lat) || !Number.isFinite(payload.lng)) {
    throw new Error('Invalid coordinates.');
  }
  await setDoc(doc(db, 'pois', id), payload, { merge: true });
  return id;
}

export async function adminUpdateItineraryStatus(id, status) {
  assertDb();
  await updateDoc(doc(db, 'savedItineraries', id), { status });
}

/**
 * Trip programs whose itinerary POIs match traveler interest categories.
 */
export async function getTripProgramsMatchingInterests(interests, pois) {
  const interestList = (interests || []).map((i) => String(i).toLowerCase());
  if (interestList.length === 0) return [];

  const matchedCats = new Set(interestList.flatMap((i) => categoriesForInterest(i)));

  const [programs, poiList] = await Promise.all([
    getTripPrograms(),
    pois ? Promise.resolve(pois) : getPois(),
  ]);

  const categoryById = new Map(
    poiList.map((p) => [p.id, String(p.category || '').toLowerCase()])
  );

  return programs.filter((program) => {
    const days = Array.isArray(program.days) ? program.days : [];
    const poiIds = days.flatMap((d) => (Array.isArray(d.poiIds) ? d.poiIds : []));
    return poiIds.some((id) => matchedCats.has(categoryById.get(id)));
  });
}

/** Derive theme categories from a program’s POI ids. */
export function getProgramThemes(program, pois) {
  const categoryById = new Map(
    (pois || []).map((p) => [p.id, String(p.category || '').toLowerCase()])
  );
  const days = Array.isArray(program?.days) ? program.days : [];
  const themes = new Set();
  for (const day of days) {
    for (const id of day.poiIds || []) {
      const cat = categoryById.get(id);
      if (cat) themes.add(cat);
    }
  }
  return [...themes];
}

export function getProgramDuration(program) {
  return Array.isArray(program?.days) ? program.days.length : 0;
}

/* ---------------------------------------------------------------------------
 * Product orders — in-app marketplace for artisans & cooperatives.
 * Payment is arranged on pickup/delivery (demo: no online payment).
 * ------------------------------------------------------------------------- */

/**
 * Place an order for an artisan product. Returns the new order id.
 */
export async function createProductOrder({
  artisanListingId,
  artisanId,
  artisanName,
  touristId,
  touristName,
  productName,
  unitPrice,
  quantity,
  note,
  options = {},
}) {
  assertDb();
  const qty = Math.max(1, Number(quantity) || 1);
  const price = Number(unitPrice) || 0;
  const payload = {
    artisanListingId: artisanListingId || '',
    artisanId: artisanId || '',
    artisanName: artisanName || '',
    touristId,
    touristName: touristName || '',
    productName,
    unitPrice: price,
    quantity: qty,
    total: price * qty,
    note: note || '',
    options: options && typeof options === 'object' ? options : {},
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  const ref = await addDoc(collection(db, 'productOrders'), payload);
  return ref.id;
}

export async function getProductOrdersForTourist(touristId) {
  assertDb();
  const q = query(collection(db, 'productOrders'), where('touristId', '==', touristId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export async function getProductOrdersForArtisan(artisanId) {
  assertDb();
  const q = query(collection(db, 'productOrders'), where('artisanId', '==', artisanId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export async function getAllProductOrders() {
  return getCollection('productOrders');
}

/** status: 'pending' | 'confirmed' | 'delivered' | 'declined' | 'cancelled' */
export async function updateProductOrderStatus(orderId, status) {
  assertDb();
  await updateDoc(doc(db, 'productOrders', orderId), { status });
}

export async function checkFirestoreConnection() {
  if (!isFirebaseConfigured() || !db) {
    return {
      ok: false,
      message: 'Firebase config missing — add VITE_FIREBASE_* vars to .env',
      projectId: null,
    };
  }

  try {
    await getDocs(collection(db, 'pois'));
    return {
      ok: true,
      message: 'Firestore connected',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    };
  } catch (err) {
    return {
      ok: false,
      message: err?.message || 'Firestore connection failed',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    };
  }
}
