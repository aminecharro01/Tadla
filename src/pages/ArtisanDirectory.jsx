import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorBanner, LoadingBlock } from '../components/Feedback';
import IconButton from '../components/IconButton';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { getArtisansResolved } from '../services/catalog';
import { seedArtisansToFirestore } from '../services/seedArtisans';
import { artisanFallbackPhoto, resolveArtisanPhoto, resolveProductPhoto } from '../utils/sampleMedia';
import { parseArtisanContact } from '../utils/whatsapp';

/**
 * Artisan directory — craft cards linking to each store.
 */
export default function ArtisanDirectory() {
  const { t } = useLang();
  const { isAdmin } = useAuth();
  const [listings, setListings] = useState([]);
  const [fromSeed, setFromSeed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [craftFilter, setCraftFilter] = useState('all');
  const [query, setQuery] = useState('');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const pack = await getArtisansResolved();
      setListings(pack.artisans);
      setFromSeed(pack.fromSeed);
    } catch (err) {
      setError(err?.message || t('loadArtisansFail'));
      setListings([]);
      setFromSeed(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const craftTypes = useMemo(() => {
    const set = new Set(
      listings.map((l) => String(l.craftType || '').toLowerCase()).filter(Boolean)
    );
    return ['all', ...[...set].sort()];
  }, [listings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((l) => {
      if (craftFilter !== 'all' && String(l.craftType || '').toLowerCase() !== craftFilter) {
        return false;
      }
      if (!q) return true;
      const contact = parseArtisanContact(l.contactInfo);
      return (
        contact.name?.toLowerCase().includes(q) ||
        l.craftType?.toLowerCase().includes(q) ||
        l.village?.toLowerCase().includes(q)
      );
    });
  }, [listings, craftFilter, query]);

  async function handleSeed() {
    if (!isAdmin) {
      setError(t('seedAdminOnly'));
      return;
    }
    setSeeding(true);
    setError(null);
    try {
      await seedArtisansToFirestore();
      await load();
    } catch (err) {
      setError(err?.message || t('seedFail'));
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="pb-10">
      <section className="mx-auto max-w-[1280px] px-5 py-10 md:px-16 md:py-12">
        <h1 className="font-headline mb-4 text-4xl font-extrabold tracking-tight text-on-surface md:text-6xl">
          {t('artisansTitle')}
        </h1>
        <p className="max-w-2xl text-lg text-on-surface-variant">{t('artisansSubtitle')}</p>
      </section>

      <section className="sticky top-[72px] z-40 mx-auto max-w-[1280px] px-5 md:px-16">
        <div className="mb-10 flex flex-col items-center justify-between gap-4 rounded-xl border border-outline-variant/20 bg-surface/90 p-4 shadow-sm backdrop-blur-md md:flex-row">
          <div className="relative w-full md:w-96">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchArtisans')}
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low py-3 pl-12 pr-4 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex w-full gap-2 overflow-x-auto hide-scrollbar md:w-auto">
            {craftTypes.map((craft) => {
              const active = craftFilter === craft;
              return (
                <button
                  key={craft}
                  type="button"
                  onClick={() => setCraftFilter(craft)}
                  className={`flex-none rounded-xl px-5 py-2 text-sm font-semibold capitalize whitespace-nowrap transition-all ${
                    active
                      ? 'bg-primary text-on-primary shadow-md'
                      : 'bg-secondary-container text-on-secondary-container'
                  }`}
                >
                  {craft === 'all' ? t('allCrafts') : craft}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 md:px-16">
        {error && (
          <div className="mb-6">
            <ErrorBanner message={error} onRetry={load} />
          </div>
        )}

        {fromSeed && listings.length > 0 && (
          <p className="mb-4 rounded-xl bg-secondary-container/50 px-4 py-3 text-sm text-on-secondary-container">
            {t('catalogLocalPreview')}{' '}
            {isAdmin ? t('catalogSyncHint') : t('seedAdminOnly')}
          </p>
        )}

        {loading ? (
          <LoadingBlock label={t('loadingArtisans')} />
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface p-10 text-center">
            <p className="mb-4 text-on-surface-variant">{t('noArtisansYet')}</p>
            <IconButton
              icon="cloud_upload"
              label={isAdmin ? t('seedArtisans') : t('seedAdminOnly')}
              showLabel
              variant="primary"
              size="lg"
              disabled={seeding || !isAdmin}
              onClick={handleSeed}
            >
              {seeding ? t('seeding') : isAdmin ? t('seedArtisans') : t('seedAdminOnly')}
            </IconButton>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-on-surface-variant">{t('noArtisansMatch')}</p>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((listing) => {
              const contact = parseArtisanContact(listing.contactInfo);
              const name = contact.name || t('localArtisan');
              const products = Array.isArray(listing.products) ? listing.products : [];
              const fromPrice =
                products.length > 0
                  ? Math.min(...products.map((p) => Number(p.price) || 0).filter((n) => n > 0))
                  : null;

              return (
                <article
                  key={listing.id}
                  className="group flex flex-col overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm transition-all duration-300 hover:shadow-xl"
                >
                  <Link to={`/artisans/${listing.id}`} className="relative block h-52 overflow-hidden bg-surface-container-high">
                    <img
                      src={resolveArtisanPhoto(listing)}
                      alt=""
                      onError={(event) => {
                        const fallback = artisanFallbackPhoto(listing);
                        if (event.currentTarget.src.endsWith(fallback)) return;
                        event.currentTarget.src = fallback;
                      }}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute left-4 top-4">
                      <span className="rounded-lg bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-on-secondary">
                        {listing.craftType}
                      </span>
                    </div>
                  </Link>
                  <div className="flex flex-grow flex-col p-5">
                    <h3 className="font-headline text-2xl font-semibold text-on-surface">
                      <Link to={`/artisans/${listing.id}`} className="hover:text-primary">
                        {name}
                      </Link>
                    </h3>
                    <div className="mb-4 flex items-center gap-1 text-outline">
                      <span className="material-symbols-outlined text-[18px]">location_on</span>
                      <span className="text-sm">{listing.village}</span>
                    </div>
                    <p className="mb-4 line-clamp-2 text-sm text-on-surface-variant">
                      {listing.description || '—'}
                    </p>
                    {products.length > 0 && (
                      <div className="mb-4">
                        <div className="mb-2 flex gap-1.5 overflow-hidden">
                          {products
                            .slice(0, 4)
                            .map((p, idx) => (
                              <img
                                key={`${listing.id}-p-${idx}`}
                                src={resolveProductPhoto(p, listing)}
                                alt=""
                                className="h-12 w-12 rounded-lg object-cover"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = artisanFallbackPhoto(listing);
                                }}
                              />
                            ))}
                        </div>
                        <p className="text-sm text-on-surface-variant">
                          {t('productsCount', { n: products.length })}
                          {fromPrice != null ? (
                            <>
                              {' · '}
                              {t('fromPrice', { price: fromPrice })}
                            </>
                          ) : null}
                        </p>
                      </div>
                    )}
                    <div className="mt-auto">
                      <Link
                        to={`/artisans/${listing.id}`}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-on-primary transition-all hover:bg-on-primary-container active:scale-[0.98]"
                      >
                        <span className="material-symbols-outlined">storefront</span>
                        {t('visitStore')}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {listings.length > 0 && isAdmin && (
          <p className="mt-8 text-center">
            <IconButton
              icon="cloud_upload"
              label={t('reseedArtisans')}
              showLabel
              variant="bare"
              size="sm"
              className="h-auto px-1.5 py-0.5 underline"
              disabled={seeding}
              onClick={handleSeed}
            >
              {seeding ? t('reseeding') : t('reseedArtisans')}
            </IconButton>
          </p>
        )}
      </section>
    </div>
  );
}
