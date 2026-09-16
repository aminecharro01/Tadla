/**
 * Build a wa.me link from a phone number (digits; with or without +).
 * Returns null if unusable.
 */
export function buildWhatsAppUrl(phone, message) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length < 8) return null;
  const base = `https://wa.me/${digits}`;
  if (message) {
    return `${base}?text=${encodeURIComponent(message)}`;
  }
  return base;
}

/** Normalize listing contactInfo (string or object) for the directory UI. */
export function parseArtisanContact(contactInfo) {
  if (!contactInfo) {
    return { name: null, whatsapp: null, photoUrl: null };
  }
  if (typeof contactInfo === 'string') {
    return { name: null, whatsapp: contactInfo, photoUrl: null };
  }
  return {
    name: contactInfo.name || null,
    whatsapp: contactInfo.whatsapp || contactInfo.phone || null,
    photoUrl: contactInfo.photoUrl || contactInfo.photo || null,
  };
}
