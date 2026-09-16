import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ErrorBanner, LoadingBlock } from '../components/Feedback';
import ReviewsPanel from '../components/ReviewsPanel';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { getArtisanResolved } from '../services/catalog';
import { createProductOrder } from '../services/firestore';
import { artisanFallbackPhoto, resolveArtisanPhoto, resolveProductPhoto } from '../utils/sampleMedia';
import {
  getOrderFieldsForProduct,
} from '../utils/productOrderFields';
import { parseArtisanContact } from '../utils/whatsapp';

const fieldClass =
  'mt-1 w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15';

function emptyOptions(fields) {
  const o = {};
  for (const f of fields) o[f.key] = '';
  return o;
}

/**
 * Artisan / cooperative store — products with prices and in-app ordering.
 */
export default function ArtisanStore() {
  const { listingId } = useParams();
  const { t } = useLang();
  const { user, profile } = useAuth();
  const [listing, setListing] = useState(null);
  const [fromSeed, setFromSeed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [options, setOptions] = useState({});
  const [ordering, setOrdering] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const pack = await getArtisanResolved(listingId);
        if (cancelled) return;
        setListing(pack.listing);
        setFromSeed(pack.fromSeed);
        setActiveIndex(0);
      } catch (err) {
        if (!cancelled) setError(err?.message || t('loadArtisansFail'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listingId, t]);

  const contact = useMemo(
    () => parseArtisanContact(listing?.contactInfo),
    [listing]
  );
  const products = Array.isArray(listing?.products) ? listing.products : [];
  const product = products[activeIndex] || null;
  const orderFields = useMemo(
    () => (product ? getOrderFieldsForProduct(product, listing?.craftType) : []),
    [product, listing?.craftType]
  );

  useEffect(() => {
    setQuantity(1);
    setNote('');
    setResult(null);
    setOptions(emptyOptions(orderFields));
  }, [activeIndex, listingId]); // eslint-disable-line react-hooks/exhaustive-deps -- reset when product changes

  useEffect(() => {
    setOptions((prev) => {
      const next = emptyOptions(orderFields);
      for (const f of orderFields) {
        if (prev[f.key] != null) next[f.key] = prev[f.key];
      }
      return next;
    });
  }, [orderFields]);

  async function handleOrder(e) {
    e.preventDefault();
    if (!user || !listing || !product) return;

    for (const f of orderFields) {
      if (!f.optional && !String(options[f.key] || '').trim()) {
        setResult({ ok: false, text: t('orderFieldsRequired') });
        return;
      }
    }

    setOrdering(true);
    setResult(null);
    try {
      const cleanOptions = {};
      for (const f of orderFields) {
        const v = String(options[f.key] || '').trim();
        if (v) cleanOptions[f.key] = v;
      }
      await createProductOrder({
        artisanListingId: listing.id,
        artisanId: listing.artisanId || '',
        artisanName: contact.name || '',
        touristId: user.uid,
        touristName: profile?.name || user.displayName || user.email || '',
        productName: product.name,
        unitPrice: product.price,
        quantity,
        note,
        options: cleanOptions,
      });
      setResult({ ok: true, text: t('orderPlaced') });
      setQuantity(1);
      setNote('');
      setOptions(emptyOptions(orderFields));
    } catch (err) {
      setResult({ ok: false, text: err?.message || t('orderFail') });
    } finally {
      setOrdering(false);
    }
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-5xl px-5 py-10">
        <LoadingBlock label={t('loadingArtisans')} />
      </section>
    );
  }

  if (!listing) {
    return (
      <section className="mx-auto max-w-lg px-5 py-12 text-center">
        <h1 className="font-headline mb-3 text-3xl font-bold">{t('storeNotFound')}</h1>
        <Link to="/artisans" className="font-semibold text-primary">
          {t('backToArtisans')}
        </Link>
      </section>
    );
  }

  const name = contact.name || t('localArtisan');
  const total = (Number(product?.price) || 0) * quantity;

  return (
    <div className="pb-16">
      <section className="relative h-56 overflow-hidden bg-surface-container-high md:h-72">
        <img
          src={resolveArtisanPhoto(listing)}
          alt=""
          className="h-full w-full object-cover"
          onError={(event) => {
            const fallback = artisanFallbackPhoto(listing);
            if (event.currentTarget.src.endsWith(fallback)) return;
            event.currentTarget.src = fallback;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-5xl px-5 pb-6 md:px-8">
          <Link
            to="/artisans"
            className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-primary"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            {t('backToArtisans')}
          </Link>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
            {listing.craftType}
          </p>
          <h1 className="font-headline text-3xl font-extrabold text-on-surface md:text-5xl">
            {name}
          </h1>
          <p className="mt-1 flex items-center gap-1 text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">location_on</span>
            {listing.village}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-8 md:px-8">
        {error && (
          <div className="mb-6">
            <ErrorBanner message={error} />
          </div>
        )}
        {fromSeed && (
          <p className="mb-6 rounded-xl bg-secondary-container/50 px-4 py-3 text-sm text-on-secondary-container">
            {t('catalogLocalPreview')}
          </p>
        )}

        <p className="mb-8 max-w-3xl text-on-surface-variant">
          {listing.description || '—'}
        </p>

        <div className="grid gap-8 lg:grid-cols-[1fr_minmax(280px,360px)]">
          <div>
            <h2 className="font-headline mb-4 text-2xl font-bold">{t('storeProducts')}</h2>
            {products.length === 0 ? (
              <p className="text-on-surface-variant">{t('storeNoProducts')}</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {products.map((p, i) => {
                  const active = i === activeIndex;
                  const img = resolveProductPhoto(p, listing);
                  return (
                    <li key={`${p.name}-${i}`}>
                      <button
                        type="button"
                        onClick={() => setActiveIndex(i)}
                        className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-start transition-all ${
                          active
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-outline-variant/20 bg-surface-container-lowest hover:border-primary/30'
                        }`}
                      >
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-container-high">
                          <img
                            src={img}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = artisanFallbackPhoto(listing);
                            }}
                          />
                        </div>
                        <span className="min-w-0 flex-1">
                          <span className="block font-headline text-lg font-semibold leading-snug">
                            {p.name}
                          </span>
                          <span className="text-xs text-on-surface-variant">{t('tapToOrder')}</span>
                        </span>
                        <span className="shrink-0 font-dossier text-base font-bold text-primary">
                          {p.price} {t('mad')}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-10">
              <ReviewsPanel targetType="artisan" targetId={listing.id} />
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            {product ? (
              <form
                onSubmit={handleOrder}
                className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm"
              >
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-secondary">
                  {t('orderNow')}
                </p>
                <div className="mb-3 h-40 overflow-hidden rounded-2xl bg-surface-container-high">
                  <img
                    src={resolveProductPhoto(product, listing)}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = artisanFallbackPhoto(listing);
                    }}
                  />
                </div>
                <h3 className="font-headline mb-1 text-xl font-bold">{product.name}</h3>
                <p className="mb-4 font-dossier text-on-surface-variant">
                  {product.price} {t('mad')} {t('perItem')}
                </p>

                <label className="mb-3 block text-sm font-semibold">
                  {t('quantity')}
                  <input
                    type="number"
                    min={1}
                    max={99}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className={`${fieldClass} font-dossier`}
                  />
                </label>

                {orderFields.map((f) => {
                  if (f.type === 'select') {
                    const opts = t(f.optionsKey).split('|');
                    return (
                      <label key={f.key} className="mb-3 block text-sm font-semibold">
                        {t(f.labelKey)}
                        {!f.optional && <span className="text-error"> *</span>}
                        <select
                          required={!f.optional}
                          value={options[f.key] || ''}
                          onChange={(e) =>
                            setOptions((prev) => ({ ...prev, [f.key]: e.target.value }))
                          }
                          className={fieldClass}
                        >
                          <option value="">{t('orderSelectOption')}</option>
                          {opts.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  }
                  return (
                    <label key={f.key} className="mb-3 block text-sm font-semibold">
                      {t(f.labelKey)}
                      {!f.optional && <span className="text-error"> *</span>}
                      <input
                        type="text"
                        required={!f.optional}
                        value={options[f.key] || ''}
                        onChange={(e) =>
                          setOptions((prev) => ({ ...prev, [f.key]: e.target.value }))
                        }
                        placeholder={f.placeholderKey ? t(f.placeholderKey) : ''}
                        className={fieldClass}
                      />
                    </label>
                  );
                })}

                <label className="mb-3 block text-sm font-semibold">
                  {t('orderNote')}
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className={fieldClass}
                  />
                </label>

                <p className="mb-2 text-sm text-on-surface-variant">
                  {t('orderTotal')}:{' '}
                  <strong className="font-dossier text-on-surface">
                    {total} {t('mad')}
                  </strong>
                </p>
                <p className="mb-4 text-xs text-on-surface-variant">{t('payOnPickup')}</p>

                {user ? (
                  <button
                    type="submit"
                    disabled={ordering}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-on-primary disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                    {ordering ? t('placingOrder') : t('placeOrder')}
                  </button>
                ) : (
                  <Link
                    to={`/auth?redirect=/artisans/${listing.id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-on-primary"
                  >
                    {t('orderSignIn')}
                  </Link>
                )}

                {result && (
                  <p
                    className={`mt-3 rounded-xl px-3 py-2 text-sm ${
                      result.ok
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-error-container text-on-error-container'
                    }`}
                  >
                    {result.text}
                  </p>
                )}
              </form>
            ) : (
              <div className="rounded-3xl border border-dashed border-outline-variant/40 p-6 text-sm text-on-surface-variant">
                {t('storeNoProducts')}
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
