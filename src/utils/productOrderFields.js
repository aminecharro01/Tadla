/**
 * Extra order fields depending on product kind / name.
 * Products may set `kind` explicitly; otherwise we infer from the name.
 */

const FIELD_DEFS = {
  size: {
    key: 'size',
    type: 'select',
    labelKey: 'orderFieldSize',
    optionsKey: 'orderSizeOptions',
  },
  shoeSize: {
    key: 'shoeSize',
    type: 'select',
    labelKey: 'orderFieldShoeSize',
    optionsKey: 'orderShoeSizeOptions',
  },
  color: {
    key: 'color',
    type: 'select',
    labelKey: 'orderFieldColor',
    optionsKey: 'orderColorOptions',
  },
  engraving: {
    key: 'engraving',
    type: 'text',
    labelKey: 'orderFieldEngraving',
    placeholderKey: 'orderFieldEngravingPh',
    optional: true,
  },
  giftWrap: {
    key: 'giftWrap',
    type: 'select',
    labelKey: 'orderFieldGiftWrap',
    optionsKey: 'orderGiftWrapOptions',
  },
  allergyNote: {
    key: 'allergyNote',
    type: 'text',
    labelKey: 'orderFieldAllergy',
    placeholderKey: 'orderFieldAllergyPh',
    optional: true,
  },
  pickup: {
    key: 'pickup',
    type: 'select',
    labelKey: 'orderFieldPickup',
    optionsKey: 'orderPickupOptions',
  },
};

const KIND_FIELDS = {
  jewelry: ['size', 'color', 'engraving', 'pickup'],
  wear: ['size', 'color', 'pickup'],
  footwear: ['shoeSize', 'color', 'pickup'],
  textile: ['color', 'pickup'],
  rug: ['color', 'pickup'],
  pottery: ['color', 'pickup'],
  food: ['giftWrap', 'allergyNote', 'pickup'],
  leather: ['color', 'size', 'pickup'],
  home: ['color', 'pickup'],
  default: ['pickup'],
};

export function inferProductKind(product, craftType = '') {
  if (product?.kind) return product.kind;
  const text = `${product?.name || ''} ${craftType}`.toLowerCase();
  if (/bracelet|jewelry|jewel|necklace|ring|silver/.test(text)) return 'jewelry';
  if (/babouche|slipper|shoe/.test(text)) return 'footwear';
  if (/belt|shawl|scarf|blanket|runner|cushion|bag|wallet|pouch/.test(text)) {
    if (/leather|cuir/.test(text)) return 'leather';
    if (/bag|wallet|pouch|belt/.test(text) && /leather|cuir/.test(craftType.toLowerCase())) {
      return 'leather';
    }
    return /leather|cuir/.test(craftType.toLowerCase()) ? 'leather' : 'wear';
  }
  if (/rug|kilim|carpet|tapis|prayer rug/.test(text)) return 'rug';
  if (/tagine|bowl|jar|vase|ceramic|pottery|poterie/.test(text)) return 'pottery';
  if (/amlou|honey|vinegar|butter|saffron|thyme|tea|food|bio|spread|gift box/.test(text)) {
    return 'food';
  }
  if (/basket|box|spoon|home/.test(text)) return 'home';
  if (/leather|cuir/.test(text)) return 'leather';
  return 'default';
}

/** Ordered field defs for a product (always includes quantity via the form itself). */
export function getOrderFieldsForProduct(product, craftType = '') {
  const kind = inferProductKind(product, craftType);
  const keys = product?.orderFields?.length
    ? product.orderFields
    : KIND_FIELDS[kind] || KIND_FIELDS.default;
  return keys.map((k) => FIELD_DEFS[k]).filter(Boolean);
}

export function formatOrderOptions(options = {}, t) {
  return Object.entries(options)
    .filter(([, v]) => v != null && String(v).trim() !== '')
    .map(([k, v]) => {
      const label =
        {
          size: t('orderFieldSize'),
          shoeSize: t('orderFieldShoeSize'),
          color: t('orderFieldColor'),
          engraving: t('orderFieldEngraving'),
          giftWrap: t('orderFieldGiftWrap'),
          allergyNote: t('orderFieldAllergy'),
          pickup: t('orderFieldPickup'),
        }[k] || k;
      return `${label}: ${v}`;
    })
    .join(' · ');
}
