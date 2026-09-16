/**
 * Upload partner identity documents to Firebase Storage.
 */
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage, isFirebaseConfigured } from './firebase';

const ALLOWED = /^(image\/(jpeg|png|webp|gif)|application\/pdf)$/i;
const MAX_BYTES = 8 * 1024 * 1024;

export function isPartnerStorageReady() {
  return Boolean(isFirebaseConfigured() && storage);
}

/**
 * @param {string} userId
 * @param {File} file
 * @returns {Promise<{ url: string, path: string, name: string, contentType: string }>}
 */
export async function uploadPartnerDocument(userId, file) {
  if (!isPartnerStorageReady()) {
    throw new Error(
      'Firebase Storage is not configured. Set VITE_FIREBASE_STORAGE_BUCKET and deploy storage.rules.'
    );
  }
  if (!file) throw new Error('No file selected.');
  if (!ALLOWED.test(file.type)) {
    throw new Error('Only images (JPG/PNG/WebP) or PDF are allowed.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('File too large (max 8 MB).');
  }

  const safe = String(file.name || 'document')
    .replace(/[^\w.\-]+/g, '_')
    .slice(0, 80);
  const path = `partner-docs/${userId}/${Date.now()}_${safe}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  const url = await getDownloadURL(storageRef);
  return { url, path, name: file.name, contentType: file.type };
}
