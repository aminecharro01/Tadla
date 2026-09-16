import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import CountUpStat from '../components/CountUpStat';
import HeroCount from '../components/HeroCount';
import BrandLogo from '../components/BrandLogo';
import PhotoCarousel from '../components/PhotoCarousel';
import TripCard from '../components/TripCard';
import { LANDING_GALLERY_PLACES } from '../data/landingPanos';
import { useLang } from '../context/LanguageContext';
import {
  getArtisansResolved,
  getPoisResolved,
} from '../services/catalog';
import { getTripPrograms } from '../services/firestore';
import { resolvePoiCoverUrl, resolvePoiGalleryImages } from '../utils/googleMapsMedia';
import { resolveArtisanPhoto } from '../utils/sampleMedia';
import { parseArtisanContact } from '../utils/whatsapp';

const MapView = lazy(() => import('../components/MapView'));
const AiAssistant = lazy(() => import('./AiAssistant'));

const SPOT_ROTATE_MS = 6000;
const MANUAL_PAUSE_MS = 14000;

/**
 * Product-demo landing: map hero, real counts, live module previews.
 */
export default function Landing() {
  const { t } = useLang();
  const [pois, setPois] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [artisans, setArtisans] = useState([]);
  const [fromSeed, setFromSeed] = useState(false);
  const [ready, setReady] = useState(false);
  const [mapLive, setMapLive] = useState(false);
  const [aiVisible, setAiVisible] = useState(false);
  const [spotlightId, setSpotlightId] = useState(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [galleryPlaceId, setGalleryPlaceId] = useState(
    LANDING_GALLERY_PLACES[0].poiId
  );
  const aiSectionRef = useRef(null);
  const heroRef = useRef(null);
  const pauseUntilRef = useRef(0);
  const rotateIndexRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [poiPack, prog, artPack] = await Promise.all([
          getPoisResolved(),
          getTripPrograms().catch(() => []),
          getArtisansResolved(),
        ]);
        if (cancelled) return;
        setPois(poiPack.pois);
        setFromSeed(poiPack.fromSeed || artPack.fromSeed);
        setPrograms(Array.isArray(prog) ? prog : []);
        setArtisans(artPack.artisans);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = aiSectionRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAiVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const guideProgramCount = useMemo(() => {
    const ids = new Set(programs.map((pr) => pr.guideId).filter(Boolean));
    return ids.size || programs.length;
  }, [programs]);

  const stats = useMemo(() => {
    const items = [];
    if (pois.length > 0) {
      items.push({ value: pois.length, label: t('landingStatSites') });
    }
    if (guideProgramCount > 0) {
      items.push({ value: guideProgramCount, label: t('landingStatGuides') });
    }
    if (artisans.length > 0) {
      items.push({ value: artisans.length, label: t('landingStatArtisans') });
    }
    return items;
  }, [pois.length, guideProgramCount, artisans.length, t]);

  const featuredTrips = programs.slice(0, 2);
  const featuredArtisans = artisans.slice(0, 3);
  const heroSpots = useMemo(() => {
    const preferred = [
      'poi-ouzoud-falls',
      'poi-bin-el-ouidane',
      'poi-ain-asserdoun',
      'poi-ait-bouguemez',
    ];
    const byId = new Map(pois.map((p) => [p.id, p]));
    const picked = preferred.map((id) => byId.get(id)).filter(Boolean);
    if (picked.length >= 3) return picked.slice(0, 4);
    return pois.slice(0, 4);
  }, [pois]);

  useEffect(() => {
    if (!ready || heroSpots.length < 2 || mapLive || !autoRotate) return undefined;
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return undefined;

    if (!spotlightId) {
      setSpotlightId(heroSpots[0].id);
      rotateIndexRef.current = 0;
    }

    const id = window.setInterval(() => {
      if (Date.now() < pauseUntilRef.current) return;
      rotateIndexRef.current = (rotateIndexRef.current + 1) % heroSpots.length;
      setSpotlightId(heroSpots[rotateIndexRef.current].id);
    }, SPOT_ROTATE_MS);

    return () => window.clearInterval(id);
  }, [ready, heroSpots, mapLive, autoRotate, spotlightId]);

  const mapPois = useMemo(() => {
    if (!spotlightId) return pois;
    const spot = pois.find((p) => p.id === spotlightId);
    return spot ? [spot] : pois;
  }, [pois, spotlightId]);

  const activeSpot = useMemo(
    () => heroSpots.find((s) => s.id === spotlightId) || heroSpots[0] || null,
    [heroSpots, spotlightId]
  );

  const activeGalleryPlace =
    LANDING_GALLERY_PLACES.find((p) => p.poiId === galleryPlaceId) ||
    LANDING_GALLERY_PLACES[0];
  const activeGalleryPoi = pois.find((p) => p.id === activeGalleryPlace.poiId);
  const galleryImages = (() => {
    const fromPoi = resolvePoiGalleryImages(activeGalleryPoi);
    if (fromPoi.length) return fromPoi;
    return activeGalleryPlace.fallbackImages || [];
  })();
  const galleryTitle =
    activeGalleryPoi?.name || activeGalleryPlace.fallbackName;

  function focusSpot(id) {
    setSpotlightId(id);
    const idx = heroSpots.findIndex((s) => s.id === id);
    if (idx >= 0) rotateIndexRef.current = idx;
    pauseUntilRef.current = Date.now() + MANUAL_PAUSE_MS;
    setMapLive(true);
    setAutoRotate(true);
  }

  function showRegion() {
    setSpotlightId(null);
    setMapLive(false);
    pauseUntilRef.current = Date.now() + MANUAL_PAUSE_MS;
  }

  return (
    <div className="overflow-x-hidden bg-surface">
      <header
        ref={heroRef}
        className="relative h-[calc(100dvh-72px)] min-h-[480px] w-full overflow-hidden md:min-h-[560px]"
      >
        <div className="absolute inset-0 z-[1]">
          {!ready ? (
            <div className="flex h-full items-center justify-center bg-surface-container-low text-on-surface-variant">
              {t('loadingMap')}
            </div>
          ) : (
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center bg-surface-container-low text-on-surface-variant">
                  {t('loadingMap')}
                </div>
              }
            >
              <MapView
                key={spotlightId || 'region'}
                pois={mapPois}
                height="100%"
                className="map-view--embedded"
                showPopupLinks={mapLive}
                scrollWheelZoom={false}
                interactive={mapLive}
                photoMarkers
                highlightId={spotlightId}
              />
            </Suspense>
          )}
        </div>

        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-surface/90 via-transparent to-transparent md:bg-gradient-to-r md:from-surface/90 md:via-surface/25 md:to-transparent" />

        {heroSpots.length > 0 && (
          <div className="absolute inset-x-0 top-4 z-30 flex gap-2 overflow-x-auto px-4 pb-1 md:top-6 md:justify-end md:px-8 lg:px-12">
            {heroSpots.map((spot) => {
              const photo = resolvePoiCoverUrl(spot);
              const active = spotlightId === spot.id;
              return (
                <button
                  key={spot.id}
                  type="button"
                  onClick={() => focusSpot(spot.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-full border bg-surface/90 py-1.5 pe-3 ps-1.5 text-start shadow-lg backdrop-blur-md transition-all ${
                    active
                      ? 'border-tertiary ring-2 ring-tertiary/30'
                      : 'border-outline-variant/25 hover:border-primary/40'
                  }`}
                >
                  <span className="h-9 w-9 overflow-hidden rounded-full bg-surface-container-high">
                    {photo ? (
                      <img src={photo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center">
                        <span className="material-symbols-outlined text-[16px] text-primary/50">
                          landscape
                        </span>
                      </span>
                    )}
                  </span>
                  <span className="max-w-[9rem] truncate text-xs font-semibold text-on-surface">
                    {spot.name}
                  </span>
                </button>
              );
            })}
            {spotlightId && (
              <button
                type="button"
                onClick={showRegion}
                title={t('heroShowAll')}
                aria-label={t('heroShowAll')}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-outline-variant/30 bg-surface/90 text-primary shadow-lg backdrop-blur-md"
              >
                <span className="material-symbols-outlined text-[20px]">public</span>
              </button>
            )}
          </div>
        )}

        {!mapLive && ready && (
          <button
            type="button"
            onClick={() => {
              setMapLive(true);
              setAutoRotate(false);
            }}
            title={t('mapActivate')}
            aria-label={t('mapActivate')}
            className="absolute bottom-28 end-4 z-30 inline-flex h-12 w-12 items-center justify-center rounded-full border border-outline-variant/30 bg-surface/95 text-primary shadow-lg backdrop-blur-md transition-all hover:bg-white md:bottom-8 md:end-8"
          >
            <span className="material-symbols-outlined text-[24px]">touch_app</span>
          </button>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-5 md:inset-auto md:bottom-auto md:start-8 md:top-1/2 md:max-w-md md:-translate-y-1/2 md:p-0 lg:start-12 lg:max-w-lg">
          <div className="pointer-events-auto animate-[fadeUp_0.7s_ease-out] rounded-3xl border border-outline-variant/20 bg-surface/90 p-5 shadow-xl backdrop-blur-md sm:p-7">
            <div className="mb-2">
              <BrandLogo variant="horizontal" tone="light" size="lg" />
            </div>
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary">
              {t('landingEyebrow')}
            </span>
            <h1 className="font-headline mb-3 text-2xl font-extrabold leading-tight text-on-surface sm:text-3xl lg:text-4xl">
              {t('landingHeadline')}
            </h1>
            <p className="mb-4 text-sm text-on-surface-variant sm:text-base">
              {t('landingSubHero')}
            </p>

            {ready && pois.length > 0 && (
              <div className="mb-5 hidden flex-wrap items-center gap-4 border-y border-outline-variant/20 py-3 sm:flex">
                <HeroCount value={pois.length} label={t('landingStatSites')} />
                {activeSpot && (
                  <p className="text-xs font-semibold text-primary">
                    {t('heroNowShowing', { name: activeSpot.name })}
                  </p>
                )}
              </div>
            )}

            {fromSeed && (
              <p className="mb-4 hidden rounded-xl bg-secondary-container/60 px-3 py-2 text-xs text-on-secondary-container sm:block">
                {t('catalogLocalPreview')}{' '}
                <Link className="font-semibold underline" to="/discover">
                  {t('catalogSyncHint')}
                </Link>
              </p>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href="#landing-ai"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-tertiary px-6 py-3 text-sm font-semibold text-on-tertiary transition-all hover:brightness-110 active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                {t('landingCtaPlan')}
              </a>
              <Link
                to="/ask"
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-tertiary/60 px-6 py-3 text-sm font-semibold text-tertiary transition-all hover:bg-tertiary/5"
              >
                <span className="material-symbols-outlined text-[20px]">forum</span>
                {t('landingCtaAsk')}
              </Link>
              <Link
                to="/discover"
                className="hidden items-center justify-center gap-2 rounded-full border-2 border-primary px-6 py-3 text-sm font-semibold text-primary transition-all hover:bg-primary/5 sm:inline-flex"
              >
                <span className="material-symbols-outlined text-[20px]">map</span>
                {t('landingCtaDiscover')}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Trust strip */}
      {stats.length > 0 && (
        <div className="border-y border-outline-variant/20 bg-surface-container-lowest">
          <div className="mx-auto grid max-w-[1280px] grid-cols-1 divide-y divide-outline-variant/20 sm:grid-cols-3 sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse">
            {stats.map((s) => (
              <CountUpStat key={s.label} value={s.value} label={s.label} />
            ))}
          </div>
        </div>
      )}

      {/* 3a. Live AI assistant — deferred mount */}
      <section
        id="landing-ai"
        ref={aiSectionRef}
        className="scroll-mt-24 bg-tertiary/[0.04] py-16 md:py-24"
      >
        <div className="mx-auto max-w-[1280px] px-5 md:px-16">
          <div className="mb-8 max-w-2xl">
            <span className="mb-2 inline-block rounded-full bg-tertiary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-tertiary">
              {t('intelligentDiscovery')}
            </span>
            <h2 className="font-headline text-3xl font-bold text-on-surface md:text-4xl">
              {t('landingAiTitle')}
            </h2>
            <p className="mt-3 text-on-surface-variant">{t('landingAiBody')}</p>
          </div>
          {aiVisible ? (
            <Suspense
              fallback={
                <div className="flex min-h-[320px] items-center justify-center rounded-[28px] border border-tertiary/20 bg-surface-container-lowest text-on-surface-variant">
                  {t('loading')}
                </div>
              }
            >
              <AiAssistant embedded />
            </Suspense>
          ) : (
            <div className="flex min-h-[240px] items-center justify-center rounded-[28px] border border-dashed border-tertiary/30 bg-surface-container-lowest text-sm text-on-surface-variant">
              {t('landingAiDeferred')}
            </div>
          )}
        </div>
      </section>

      {/* 3b. Trips module */}
      <section className="bg-surface-container-low py-16 md:py-24">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-10 px-5 md:flex-row-reverse md:gap-16 md:px-16">
          <div className="w-full md:w-1/2">
            <h2 className="font-headline mb-4 text-3xl font-bold text-on-surface md:text-4xl">
              {t('landingTripsTitle')}
            </h2>
            <p className="mb-6 text-on-surface-variant">{t('landingTripsBody')}</p>
            <Link
              to="/trips"
              className="inline-flex rounded-full border-2 border-primary px-6 py-3 text-sm font-semibold text-primary hover:bg-primary/5"
            >
              {t('landingTripsCta')}
            </Link>
          </div>
          <div className="grid w-full gap-4 sm:grid-cols-2 md:w-1/2 md:grid-cols-1 lg:grid-cols-2">
            {featuredTrips.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface p-6 text-sm text-on-surface-variant">
                {t('landingTripsEmpty')}
              </p>
            ) : (
              featuredTrips.map((program) => (
                <TripCard key={program.id} program={program} pois={pois} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* 3c. Artisans */}
      <section className="mx-auto max-w-[1280px] px-5 py-16 md:px-16 md:py-24">
        <div className="flex flex-col items-center gap-10 md:flex-row md:gap-16">
          <div className="w-full md:w-2/5">
            <h2 className="font-headline mb-4 text-3xl font-bold text-on-surface md:text-4xl">
              {t('landingArtisansTitle')}
            </h2>
            <p className="mb-6 text-on-surface-variant">{t('landingArtisansBody')}</p>
            <Link
              to="/artisans"
              className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary hover:bg-primary-container hover:text-on-primary-container"
            >
              {t('landingArtisansCta')}
            </Link>
          </div>
          <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3 md:w-3/5">
            {featuredArtisans.length === 0 ? (
              <p className="col-span-full rounded-2xl border border-dashed border-outline-variant/40 p-6 text-sm text-on-surface-variant">
                {t('landingArtisansEmpty')}
              </p>
            ) : (
              featuredArtisans.map((listing) => {
                const contact = parseArtisanContact(listing.contactInfo);
                const name = contact.name || listing.village || t('untitled');
                return (
                  <article
                    key={listing.id}
                    className="flex flex-col rounded-[28px] border border-outline-variant/15 bg-white p-5 shadow-sm"
                  >
                    <div className="mb-4 h-16 w-16 overflow-hidden rounded-full bg-surface-container-high ring-2 ring-secondary/40 ring-offset-2">
                      <img
                        src={resolveArtisanPhoto(listing)}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <h3 className="font-headline text-lg font-semibold">{name}</h3>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-secondary">
                      {listing.craftType}
                    </p>
                    {listing.village && (
                      <p className="mb-4 text-sm text-on-surface-variant">{listing.village}</p>
                    )}
                    <Link
                      to={`/artisans/${listing.id}`}
                      className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary hover:bg-on-primary-container"
                    >
                      <span className="material-symbols-outlined text-[18px]">storefront</span>
                      {t('visitStore')}
                    </Link>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* 3d. Photo gallery — flagship places */}
      <section className="bg-surface-container-low py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-5 md:px-16">
          <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <h2 className="font-headline text-3xl font-bold text-on-surface md:text-4xl">
                {t('landingPanoTitle')}
              </h2>
              <p className="mt-3 text-on-surface-variant">{t('landingPanoBody')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {LANDING_GALLERY_PLACES.map((place) => {
                const poi = pois.find((p) => p.id === place.poiId);
                const label = poi?.name || place.fallbackName;
                const active = place.poiId === galleryPlaceId;
                return (
                  <button
                    key={place.poiId}
                    type="button"
                    onClick={() => setGalleryPlaceId(place.poiId)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                      active
                        ? 'bg-tertiary text-on-tertiary shadow-md shadow-tertiary/25'
                        : 'bg-white text-on-surface-variant ring-1 ring-outline-variant/30 hover:text-primary'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-outline-variant/20 bg-surface shadow-sm p-3 md:p-4">
            <PhotoCarousel
              key={activeGalleryPlace.poiId}
              images={galleryImages}
              title={galleryTitle}
              category={activeGalleryPoi?.category}
              mapsUrl={activeGalleryPlace.mapsUrl}
              autoplayMs={4200}
              aspect="wide"
            />
          </div>

          <div className="mt-6">
            <Link
              to={activeGalleryPoi ? `/poi/${activeGalleryPoi.id}` : '/discover'}
              className="inline-flex rounded-full border-2 border-primary px-6 py-3 text-sm font-semibold text-primary hover:bg-primary/5"
            >
              {t('landingPanoCta')}
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Closing CTA */}
      <section className="bg-primary px-5 py-20 md:px-16 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-headline mb-4 text-3xl font-extrabold text-on-primary sm:text-4xl md:text-5xl">
            {t('landingClosingTitle')}
          </h2>
          <p className="mb-10 text-base text-primary-fixed sm:text-lg">
            {t('landingClosingSub')}
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row sm:gap-6">
            <a
              href="#landing-ai"
              className="rounded-full bg-tertiary px-8 py-4 text-sm font-semibold text-on-tertiary shadow-lg transition-transform hover:scale-[1.02] hover:brightness-110"
            >
              {t('landingCtaPlan')}
            </a>
            <Link
              to="/partner"
              className="rounded-full border-2 border-white px-8 py-4 text-sm font-semibold text-white hover:bg-white/10"
            >
              {t('landingCtaBecomeGuide')}
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-outline-variant/10 bg-surface-container">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-6 px-5 py-10 md:flex-row md:px-16">
          <div className="text-center md:text-start">
            <BrandLogo variant="horizontal" tone="light" size="md" className="mx-auto md:mx-0" />
            <p className="mt-1 text-sm text-on-surface-variant">
              © 2026 · {t('landingEyebrow')}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-5 text-sm text-on-surface-variant">
            <Link className="hover:text-primary" to="/discover">
              {t('discover')}
            </Link>
            <Link className="hover:text-primary" to="/trips">
              {t('trips')}
            </Link>
            <Link className="hover:text-primary" to="/artisans">
              {t('artisans')}
            </Link>
            <Link className="hover:text-primary" to="/ask">
              {t('ask')}
            </Link>
            <Link className="hover:text-primary" to="/essentials">
              {t('essentialsTitle')}
            </Link>
            <Link className="hover:text-primary" to="/partner">
              {t('partner')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
