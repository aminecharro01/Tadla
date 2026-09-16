/**
 * Creates demo accounts for every role and approves the partners.
 * Run once with the temporary bootstrap rules deployed, then restore rules.
 *
 * Accounts (password: Tadla2026!):
 *   demo.admin@tadla.ma    -> admin
 *   demo.tourist@tadla.ma  -> tourist
 *   demo.guide@tadla.ma    -> guide (approved)
 *   demo.artisan@tadla.ma  -> artisan (approved)
 *   demo.coop@tadla.ma     -> cooperative (approved)
 */
import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getFirestore, setDoc, updateDoc } from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'AIzaSyD_8ljDqrksEHI0dPql6fhFGXv6v9k_Z50',
  authDomain: 'bmkh-82c3b.firebaseapp.com',
  projectId: 'bmkh-82c3b',
});
const auth = getAuth(app);
const db = getFirestore(app);

const PASSWORD = 'Tadla2026!';
const ACCOUNTS = [
  { email: 'demo.tourist@tadla.ma', name: 'Demo Tourist', role: 'tourist' },
  { email: 'demo.guide@tadla.ma', name: 'Demo Guide', role: 'guide' },
  { email: 'demo.artisan@tadla.ma', name: 'Demo Artisan', role: 'artisan' },
  { email: 'demo.coop@tadla.ma', name: 'Demo Cooperative', role: 'cooperative' },
  { email: 'demo.admin@tadla.ma', name: 'Demo Admin', role: 'admin' },
];

async function signInOrCreate(email, name) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, PASSWORD);
    if (name) await updateProfile(cred.user, { displayName: name });
    return { user: cred.user, created: true };
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      const cred = await signInWithEmailAndPassword(auth, email, PASSWORD);
      return { user: cred.user, created: false };
    }
    throw err;
  }
}

const uids = {};

// Pass 1: create accounts + self-writable user docs (tourist / pending partners)
for (const acc of ACCOUNTS) {
  const { user, created } = await signInOrCreate(acc.email, acc.name);
  uids[acc.email] = user.uid;
  const base = { id: user.uid, name: acc.name, email: acc.email };

  if (acc.role === 'tourist') {
    await setDoc(doc(db, 'users', user.uid), { ...base, role: 'tourist' }, { merge: true });
  } else if (acc.role !== 'admin') {
    await setDoc(
      doc(db, 'users', user.uid),
      {
        ...base,
        role: acc.role,
        partnerStatus: 'pending_review',
        city: 'Béni Mellal',
        phone: '212600000000',
        createdAsPartner: true,
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }
  console.log(`${created ? 'created' : 'exists '} ${acc.email} uid=${user.uid}`);
  await signOut(auth);
}

// Pass 2: bootstrap admin sets its own role + approves partners
await signInWithEmailAndPassword(auth, 'demo.admin@tadla.ma', PASSWORD);
const adminUid = uids['demo.admin@tadla.ma'];
await setDoc(
  doc(db, 'users', adminUid),
  { id: adminUid, name: 'Demo Admin', email: 'demo.admin@tadla.ma', role: 'admin' },
  { merge: true }
);
console.log('admin role set');

for (const email of ['demo.guide@tadla.ma', 'demo.artisan@tadla.ma', 'demo.coop@tadla.ma']) {
  await updateDoc(doc(db, 'users', uids[email]), {
    partnerStatus: 'approved',
    approvedAt: new Date().toISOString(),
    approvedBy: adminUid,
  });
  console.log(`approved ${email}`);
}

// Reassign two seed trips to the demo guide so their dashboard has real content
for (const tripId of ['trip-ouzoud-day-escape', 'trip-dinosaur-geopark']) {
  try {
    await updateDoc(doc(db, 'tripPrograms', tripId), {
      guideId: uids['demo.guide@tadla.ma'],
      guideName: 'Demo Guide',
    });
    console.log(`trip ${tripId} -> demo.guide`);
  } catch (err) {
    console.log(`trip ${tripId} skip (${err.code || err.message})`);
  }
}

await signOut(auth);
console.log('\nUIDS=' + JSON.stringify(uids));
console.log('SETUP DONE');
process.exit(0);
