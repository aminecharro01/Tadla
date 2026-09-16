import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import MapView from '../components/MapView';
import { ErrorBanner, LoadingBlock } from '../components/Feedback';
import IconButton from '../components/IconButton';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { categoryLabelKey } from '../i18n/strings';
import { getPoisResolved } from '../services/catalog';
import { seedPoisToFirestore } from '../services/seed';
import { categoryIcon } from '../utils/categoryIcons';
import { getStreetViewPlace } from '../data/landingPanos';
import { resolvePoiCoverUrl } from '../utils/googleMapsMedia';

const CATEGORY_IDS = [
  'all',
  'waterfall',
  'spring',
  'river',
  'lake',
  'nature',
  'gorge',
  'peak',
  'geology',
  'garden',
  'park',
  'museum',
  'heritage',
  'valley',
  'village',
  'market',
];

/**
 * Discover home — split map + sidebar list (design.html UX).
 */
export default function HomeMap() {
  const { t } = useLang();
  const { isAdmin } = useAuth();
  const [pois, setPois] = useState([]);
  const [fromSeed, setFromSeed] = useState(false);
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [showListMobile, setShowListMobile] = useState(false);

  async function loadPois() {
    setLoading(true);
    setError(null);
    try {
      const pack = await getPoisResolved();
      setPois(pack.pois);
      setFromSeed(pack.fromSeed);
    } catch (err) {
      setError(err?.message || t('loadPoisFail'));
      setPois([]);
      setFromSeed(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPois();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pois.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    });
  }, [pois, category, query]);

  async function handleSeed() {
    if (!isAdmin) {
      setError(t('seedAdminOnly'));
      return;
    }
    setSeeding(true);
    setError(null);
    try {
      await seedPoisToFirestore();
      await loadPois();
    } catch (err) {
      setError(err?.message || t('seedFail'));
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-72px)] flex-col overflow-hidden md:flex-row">
      <section
        className={`relative flex-1 bg-surface-container-low ${
          showListMobile ? 'hidden md:block' : 'block'
        } h-[45%] min-h-[280px] md:h-full`}
      >
        {loading ? (
          <div className="flex h-full items-center justify-center p-6">
            <LoadingBlock label={t('loadingMap')} />
          </div>
        ) : pois.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="text-on-surface-variant">{t('noPoisYet')}</p>
            <IconButton
              icon="cloud_upload"
              label={t('seedPois')}
              showLabel
              variant="primary"
              size="lg"
              disabled={seeding}
              onClick={handleSeed}
            >
              {seeding ? t('seeding') : t('seedPois')}
            </IconButton>
          </div>
        ) : (
          <MapView pois={filtered} height="100%" className="!rounded-none !border-0" />
        )}

        {fromSeed && !loading && pois.length > 0 && (
          <div className="absolute inset-x-4 bottom-4 z-20 md:inset-x-auto md:bottom-6 md:start-4 md:max-w-sm">
            <div className="rounded-2xl border border-secondary/30 bg-surface/95 p-3 text-xs text-on-surface-variant shadow-lg backdrop-blur-md">
              {t('catalogLocalPreview')}{' '}
              {isAdmin ? (
                <IconButton
                  icon="cloud_upload"
                  label={t('seedPois')}
                  showLabel
                  variant="bare"
                  size="sm"
                  className="h-auto px-1.5 py-0.5 underline"
                  disabled={seeding}
                  onClick={handleSeed}
                >
                  {seeding ? t('seeding') : t('seedPois')}
                </IconButton>
              ) : (
                <span>{t('seedAdminOnly')}</span>
              )}
            </div>
          </div>
        )}

        <div className="absolute left-1/2 top-4 z-20 w-full max-w-md -translate-x-1/2 px-4 md:top-6">
          <div className="relative">
            <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPlaces')}
              className="w-full rounded-2xl border border-outline-variant/30 bg-surface/95 py-3.5 ps-12 pe-4 shadow-xl shadow-primary/5 outline-none backdrop-blur-sm transition-all focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </section>

      <aside
        className={`z-30 flex h-full w-full flex-col border-s border-outline-variant/20 bg-surface md:w-[420px] lg:w-[480px] ${
          showListMobile ? 'flex' : 'hidden md:flex'
        }`}
      >
        <div className="sticky top-0 z-10 bg-surface/90 p-5 pb-3 backdrop-blur-md md:p-6 md:pb-4">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-headline text-2xl font-semibold text-on-surface md:text-[32px] md:leading-tight">
              {t('exploreRegions')}
            </h2>
            <IconButton
              icon="cloud_upload"
              label={isAdmin ? t('reseedPois') : t('seedAdminOnly')}
              showLabel
              variant="bare"
              size="sm"
              disabled={seeding || !isAdmin}
              onClick={handleSeed}
            >
              {seeding ? t('seeding') : t('reseedPois')}
            </IconButton>
          </div>

          <div
            className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar"
            role="group"
            aria-label={t('filterCategory')}
          >
            {CATEGORY_IDS.map((id) => {
              const active = category === id;
              const label = t(categoryLabelKey(id));
              return (
                <button
                  key={id}
                  type="button"
                  title={label}
                  aria-label={label}
                  aria-pressed={active}
                  onClick={() => setCategory(id)}
                  className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl transition-all active:scale-95 ${
                    active
                      ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-outline hover:text-on-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {categoryIcon(id)}
                  </span>
                </button>
              );
            })}
          </div>
          {category !== 'all' && (
            <p className="mt-2 text-xs font-semibold text-on-surface-variant">
              {t('selectedCategory')}: {t(categoryLabelKey(category))}
            </p>
          )}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5 md:p-6">
          {error && <ErrorBanner message={error} onRetry={loadPois} />}
          {loading && <LoadingBlock label={t('loadingMap')} />}

          {!loading && filtered.length === 0 && pois.length > 0 && (
            <p className="text-on-surface-variant">{t('noSitesMatch')}</p>
          )}

          {filtered.map((poi) => {
            const photo = resolvePoiCoverUrl(poi, getStreetViewPlace(poi));
            const isTodo =
              !poi.description || String(poi.description).startsWith('TODO');
            return (
              <article
                key={poi.id}
                className="group relative overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-36 overflow-hidden bg-surface-container-high md:h-44">
                  {photo ? (
                    <img
                      src={photo}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        const list = Array.isArray(poi.images) ? poi.images.filter(Boolean) : [];
                        const cur = e.currentTarget.getAttribute('src');
                        const idx = list.indexOf(cur);
                        const next = list[idx + 1];
                        if (next) e.currentTarget.src = next;
                        else {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement
                            ?.querySelector('[data-poi-ph]')
                            ?.classList.remove('hidden');
                        }
                      }}
                    />
                  ) : null}
                  <div
                    data-poi-ph
                    className={`flex h-full items-center justify-center bg-gradient-to-br from-secondary-container to-surface-container-high ${
                      photo ? 'hidden' : ''
                    }`}
                  >
                    <span className="material-symbols-outlined text-5xl text-primary/40">
                      landscape
                    </span>
                  </div>
                  <div className="absolute start-3 top-3 flex gap-2">
                    <span className="rounded-lg bg-secondary-container/90 px-2.5 py-1 text-[11px] font-semibold text-on-secondary-container backdrop-blur-sm">
                      {t(categoryLabelKey(poi.category))}
                    </span>
                    {poi.id === 'poi-ouzoud-falls' && (
                      <span className="rounded-lg bg-surface/90 px-2.5 py-1 text-[11px] font-semibold text-primary backdrop-blur-sm">
                        {t('badge360')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-headline mb-1 line-clamp-1 text-lg font-semibold md:text-xl">
                    {poi.name}
                  </h3>
                  <p className="mb-3 line-clamp-2 text-sm text-on-surface-variant">
                    {isTodo ? t('descPending') : poi.description}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-dossier text-xs text-on-surface-variant">
                      {poi.lat?.toFixed?.(2)}, {poi.lng?.toFixed?.(2)}
                    </span>
                    <Link
                      to={`/poi/${poi.id}`}
                      className="rounded-xl bg-primary/5 p-2.5 text-primary transition-all hover:bg-primary hover:text-on-primary"
                      aria-label={t('viewPoi', { name: poi.name })}
                    >
                      <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
          <div className="pb-8 md:pb-4" />
        </div>
      </aside>

      <IconButton
        icon={showListMobile ? 'map' : 'list'}
        label={showListMobile ? t('viewMap') : t('viewList')}
        variant="primary"
        size="lg"
        className="fixed bottom-28 end-4 z-40 shadow-2xl shadow-primary/40 hover:scale-105 md:hidden"
        onClick={() => setShowListMobile((v) => !v)}
      />
    </div>
  );
}
