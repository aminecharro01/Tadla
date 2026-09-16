/**
 * Multilingual WhatsApp message templates (EN / FR / AR).
 */

export function artisanContactMessage(lang, { craftType, listingName } = {}) {
  const craft = craftType || 'crafts';
  const name = listingName || '';
  const map = {
    en: `Hello${name ? ` ${name}` : ''}, I found you on Tadla (${craft}). I'd like to know more.`,
    fr: `Bonjour${name ? ` ${name}` : ''}, je vous ai trouvé(e) sur Tadla (${craft}). Je souhaite en savoir plus.`,
    ar: `مرحبا${name ? ` ${name}` : ''}، وجدتك على تادلة (${craft}). أود معرفة المزيد.`,
  };
  return map[lang] || map.en;
}

export function productInquiryMessage(lang, { productName, price } = {}) {
  const map = {
    en: `Hello, I'm interested in "${productName}"${price != null ? ` (${price} MAD)` : ''} listed on Tadla.`,
    fr: `Bonjour, je suis intéressé(e) par « ${productName} »${price != null ? ` (${price} MAD)` : ''} sur Tadla.`,
    ar: `مرحبا، أنا مهتم بـ "${productName}"${price != null ? ` (${price} درهم)` : ''} على تادلة.`,
  };
  return map[lang] || map.en;
}

export function guideQuoteMessage(lang, { daysCount, interests } = {}) {
  const interestStr = Array.isArray(interests) && interests.length ? interests.join(', ') : 'general';
  const map = {
    en: `Hello, I saved a ${daysCount}-day AI itinerary (${interestStr}) on Tadla and would like a guided quote.`,
    fr: `Bonjour, j'ai enregistré un itinéraire IA de ${daysCount} jour(s) (${interestStr}) sur Tadla et souhaite un devis guide.`,
    ar: `مرحبا، حفظت برنامج رحلة بالذكاء الاصطناعي لمدة ${daysCount} يوم (${interestStr}) على تادلة وأرغب في عرض سعر مع مرشد.`,
  };
  return map[lang] || map.en;
}
