/**
 * Firebase Authentication helpers (email + Google).
 */
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';

const googleProvider = new GoogleAuthProvider();

function assertAuthReady() {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase Auth is not configured. Check your .env file.');
  }
}

function profilePayload(firebaseUser, role, extra = {}) {
  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
    email: firebaseUser.email || '',
    role,
    ...extra,
  };
}

/**
 * Load profile for the auth listener.
 * Creates a tourist profile only if none exists yet — never overwrites role.
 */
export async function loadUserProfile(firebaseUser) {
  assertAuthReady();
  if (!db) throw new Error('Firestore is not configured.');

  const ref = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }

  const profile = profilePayload(firebaseUser, 'tourist');
  await setDoc(ref, profile);
  return profile;
}

/**
 * Write / merge profile with an explicit role (used on register).
 * Uses merge so it wins over a race where the auth listener created "tourist" first.
 */
export async function saveUserProfile(firebaseUser, role = 'tourist', extra = {}) {
  assertAuthReady();
  if (!db) throw new Error('Firestore is not configured.');

  const ref = doc(db, 'users', firebaseUser.uid);
  const profile = profilePayload(firebaseUser, role, extra);
  await setDoc(ref, profile, { merge: true });
  return profile;
}

/** @deprecated use loadUserProfile / saveUserProfile */
export async function ensureUserProfile(firebaseUser, role = 'tourist') {
  if (role && role !== 'tourist') {
    return saveUserProfile(firebaseUser, role);
  }
  return loadUserProfile(firebaseUser);
}

/** Update only the role field (e.g. convert tourist → guide). */
export async function setUserRole(uid, role) {
  assertAuthReady();
  if (!db) throw new Error('Firestore is not configured.');
  const ref = doc(db, 'users', uid);
  await setDoc(ref, { role }, { merge: true });
  const snap = await getDoc(ref);
  return { id: snap.id, ...snap.data() };
}

export async function registerWithEmail(email, password, name) {
  assertAuthReady();
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) {
    await updateProfile(cred.user, { displayName: name });
  }
  // Public signup is always tourist — partners use registerPartnerWithEmail.
  const profile = await saveUserProfile(cred.user, 'tourist');
  return { user: cred.user, profile };
}

/**
 * Dedicated partner signup: guide | artisan | cooperative with pending verification.
 * Role is set at creation (not tourist → later redefine).
 */
export async function registerPartnerWithEmail({
  email,
  password,
  name,
  role,
  city = '',
  phone = '',
  experience = '',
}) {
  assertAuthReady();
  if (!['guide', 'artisan', 'cooperative'].includes(role)) {
    throw new Error('Invalid partner role.');
  }
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) {
    await updateProfile(cred.user, { displayName: name });
  }
  const profile = await saveUserProfile(cred.user, role, {
    partnerStatus: 'pending_docs',
    city: city || '',
    phone: phone || '',
    experience: experience || '',
    createdAsPartner: true,
    createdAt: new Date().toISOString(),
  });
  return { user: cred.user, profile };
}

export async function loginWithEmail(email, password) {
  assertAuthReady();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const profile = await loadUserProfile(cred.user);
  return { user: cred.user, profile };
}

export async function loginWithGoogle() {
  assertAuthReady();
  const cred = await signInWithPopup(auth, googleProvider);
  const ref = doc(db, 'users', cred.user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const profile = await saveUserProfile(cred.user, 'tourist');
    return { user: cred.user, profile };
  }

  return { user: cred.user, profile: { id: snap.id, ...snap.data() } };
}

export async function logout() {
  assertAuthReady();
  await signOut(auth);
}

export function subscribeToAuth(callback) {
  if (!isFirebaseConfigured() || !auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
