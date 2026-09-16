import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import MapView from '../components/MapView';
import StayOffersPanel from '../components/StayOffersPanel';
import { ErrorBanner, LoadingBlock } from '../components/Feedback';
import IconButton from '../components/IconButton';
import PoiGallery from '../components/PoiGallery';
import PlaceActivities from '../components/PlaceActivities';
import PlaceEvents from '../components/PlaceEvents';
import { useLang } from '../context/LanguageContext';
import {
  budgetDayTotal,
  buildGoogleMapsPlacePinUrl,
  DARIJA_PHRASES,
  EMERGENCY_CONTACTS,
  fetchPoiWeather,
  formatMadRange,
  nearbyPois,
  playbookForCategory,
} from '../data/touristGuide';
import { categoryLabelKey } from '../i18n/strings';
import { getPoisResolved, getPoiResolved } from '../services/catalog';
import {
  buildAppleMapsDirectionsUrl,
  buildGoogleMapsDirectionsUrl,
  buildWazeNavigateUrl,
} from '../utils/navLinks';
import { resolvePoiGalleryImages } from '../utils/googleMapsMedia';
import {
  getBadgeProgress,
  getVisitedPoiIds,
  setVisitedPoiIds,
} from '../utils/experienceStorage';

export default function PoiDetail() {
  const { poiId } = useParams();
  const [searchParams] = useSearchParams();
  const { t, lang } = useLang();
  const [poi, setPoi] = useState(null);
  const [allPois, setAllPois] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weather, setWeather] = useState(null);
  const [weatherErr, setWeatherErr] = useState(null);
  const [copied, setCopied] = useState(false);
  const [visited, setVisited] = useState(false);

  useEffect(() => {
    setVisited(getVisitedPoiIds().includes(poiId));
  }, [poiId]);

  function toggleVisited() {
    const set = new Set(getVisitedPoiIds());
    if (set.has(poiId)) set.delete(poiId);
    else set.add(poiId);
    setVisitedPoiIds([...set]);
    setVisited(set.has(poiId));
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [{ poi: data }, pack] = await Promise.all([
          getPoiResolved(poiId),
          getPoisResolved(),
        ]);
        if (!cancelled) {
          setPoi(data);
          setAllPois(pack.pois || []);
          if (!data) setError(t('poiNotFound'));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || t('loadPoiFail'));
          setPoi(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [poiId, t]);

  useEffect(() => {
    if (!poi || loading) return;
    if (window.location.hash === '#stays') {
      requestAnimationFrame(() => {
        document.getElementById('stays')?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [poi, loading]);

  useEffect(() => {
    if (!poi || typeof poi.lat !== 'number') return undefined;
    let cancelled = false;
    setWeather(null);
    setWeatherErr(null);
    fetchPoiWeather(poi.lat, poi.lng)
      .then((w) => {
        if (!cancelled) setWeather(w);
      })
      .catch(() => {
        if (!cancelled) setWeatherErr(t('weatherUnavailable'));
      });
    return () => {
      cancelled = true;
    };
  }, [poi, t]);

  const playbook = useMemo(
    () => playbookForCategory(poi?.category),
    [poi?.category]
  );
  const near = useMemo(() => nearbyPois(poi, allPois, { limit: 4 }), [poi, allPois]);
  const dayBudget = budgetDayTotal(playbook);
  const earnedBadges = getBadgeProgress(allPois, getVisitedPoiIds()).filter(
    (badge) => badge.unlocked
  );
  const fromPlanner = searchParams.get('from') === 'planner';

  const googleDir = buildGoogleMapsDirectionsUrl(poi ? [poi] : []);
  const appleDir = buildAppleMapsDirectionsUrl(poi ? [poi] : []);
  const waze = buildWazeNavigateUrl(poi);
  const mapsPin = buildGoogleMapsPlacePinUrl(poi);

  if (loading) {
    return (
      <section className="mx-auto max-w-[1280px] px-5 py-10">
        <LoadingBlock label={t('loadingSite')} />
      </section>
    );
  }

  if (error || !poi) {
    return (
      <section className="mx-auto max-w-[1280px] px-5 py-10">
        <Link to="/discover" className="mb-4 inline-block font-semibold text-primary">
          {t('backDiscover')}
        </Link>
        <ErrorBanner message={error || t('notFound')} />
      </section>
    );
  }

  const images = resolvePoiGalleryImages(poi);
  const isTodoDescription =
    !poi.description || String(poi.description).startsWith('TODO');

  async function copyCoords() {
    const text = `${poi.lat}, ${poi.lng}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function sharePlace() {
    const url = window.location.href;
    const title = poi.name;
    try {
      if (navigator.share) {
        await navigator.share({ title, url, text: t('sharePlaceText', { name: title }) });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* user cancelled */
    }
  }

  const locale = lang === 'fr' ? 'fr-FR' : lang === 'ar' ? 'ar-MA' : 'en-GB';

  return (
    <section className="mx-auto max-w-[1280px] px-5 pb-16 pt-6 md:px-16">
      <Link
        to={fromPlanner ? '/assistant' : '/discover'}
        className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-primary"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        {fromPlanner ? t('backToPlanner') : t('backDiscover')}
      </Link>

      <PoiGallery
        images={images}
        placeName={poi.name}
        category={poi.category}
        categoryLabel={t(categoryLabelKey(poi.category))}
        hoursLabel={`${t('hours')} · ${poi.hours || t('notListed')}`}
        badges={
          visited ? (
            <span className="mt-3 inline-block rounded-lg bg-white/20 px-3 py-1 text-xs font-semibold text-white">
              {t('visitedBadge')}
            </span>
          ) : null
        }
      />

      {/* Quick actions */}
      <div className="mb-8 flex flex-wrap gap-2 sm:mb-10">
        {googleDir && (
          <a
            href={googleDir}
            target="_blank"
            rel="noopener noreferrer"
            title={t('googleMaps')}
            aria-label={t('googleMaps')}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-[#1a73e8] px-3.5 text-sm font-semibold text-white sm:px-4"
          >
            <span className="material-symbols-outlined text-[22px]">directions</span>
            <span className="hidden sm:inline">{t('googleMaps')}</span>
          </a>
        )}
        {waze && (
          <a
            href={waze}
            target="_blank"
            rel="noopener noreferrer"
            title="Waze"
            aria-label="Waze"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#33ccff] text-[#0b2a33] sm:w-auto sm:gap-1.5 sm:px-3.5"
          >
            <span className="material-symbols-outlined text-[22px]">navigation</span>
            <span className="hidden sm:inline">Waze</span>
          </a>
        )}
        {appleDir && (
          <a
            href={appleDir}
            target="_blank"
            rel="noopener noreferrer"
            title={t('appleMaps')}
            aria-label={t('appleMaps')}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#1c1c1e] text-white sm:w-auto sm:gap-1.5 sm:px-3.5"
          >
            <span className="material-symbols-outlined text-[22px]">map</span>
            <span className="hidden sm:inline">{t('appleMaps')}</span>
          </a>
        )}
        {mapsPin && (
          <a
            href={mapsPin}
            target="_blank"
            rel="noopener noreferrer"
            title={t('openInMaps')}
            aria-label={t('openInMaps')}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-primary text-primary"
          >
            <span className="material-symbols-outlined text-[22px]">place</span>
          </a>
        )}
        <IconButton
          icon="share"
          label={t('sharePlace')}
          variant="ghost"
          size="lg"
          className="rounded-full"
          onClick={sharePlace}
        />
        <IconButton
          icon="content_copy"
          label={copied ? t('copied') : t('copyCoords')}
          variant="ghost"
          size="lg"
          className="rounded-full"
          onClick={copyCoords}
        />
        <Link
          to={`/ask?q=${encodeURIComponent(poi.name)}`}
          title={t('askAboutPlace')}
          aria-label={t('askAboutPlace')}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-tertiary text-on-tertiary"
        >
          <span className="material-symbols-outlined text-[22px]">forum</span>
        </Link>
        <IconButton
          icon={visited ? 'check_circle' : 'radio_button_unchecked'}
          label={visited ? t('visitedBadge') : t('markVisited')}
          variant={visited ? 'primary' : 'ghost'}
          size="lg"
          className="rounded-full"
          onClick={toggleVisited}
        />
        <Link
          to="/badges"
          className="inline-flex h-11 items-center gap-1.5 rounded-full border border-secondary/35 bg-secondary-container/40 px-3.5 text-sm font-semibold text-secondary"
        >
          <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
          {t('badgeCount', { n: earnedBadges.length })}
        </Link>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-10">
          {/* About */}
          <div>
            <h2 className="font-headline mb-3 text-2xl font-semibold">{t('about')}</h2>
            {isTodoDescription ? (
              <p className="rounded-xl border border-dashed border-outline-variant/50 bg-surface p-4 text-on-surface-variant">
                {t('descPendingLong')}
              </p>
            ) : (
              <p className="leading-relaxed text-on-surface-variant">{poi.description}</p>
            )}
          </div>

          <PlaceActivities poi={poi} />

          <PlaceEvents poi={poi} />

          {/* Visit snapshot */}
          <div>
            <h2 className="font-headline mb-4 text-2xl font-semibold">{t('visitSnapshot')}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: 'schedule', label: t('tipDuration'), value: t(playbook.durationKey) },
                { icon: 'calendar_month', label: t('tipBestTime'), value: t(playbook.bestKey) },
                { icon: 'hiking', label: t('tipDifficulty'), value: t(playbook.difficultyKey) },
                { icon: 'family_restroom', label: t('tipFamily'), value: t(playbook.familyKey) },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4"
                >
                  <div className="mb-2 flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-[22px]">{card.icon}</span>
                    <span className="text-xs font-bold uppercase tracking-wider">{card.label}</span>
                  </div>
                  <p className="text-sm font-semibold text-on-surface">{card.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* What to bring + tips */}
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="font-headline mb-3 text-xl font-semibold">{t('whatToBring')}</h3>
              <ul className="space-y-2">
                {playbook.bringKeys.map((k) => (
                  <li key={k} className="flex items-start gap-2 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined mt-0.5 text-[18px] text-secondary">
                      check_circle
                    </span>
                    {t(k)}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-headline mb-3 text-xl font-semibold">{t('practicalTips')}</h3>
              <ul className="space-y-2">
                {playbook.tipKeys.map((k) => (
                  <li key={k} className="flex items-start gap-2 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined mt-0.5 text-[18px] text-tertiary">
                      lightbulb
                    </span>
                    {t(k)}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-on-surface-variant">{t('tipsDisclaimer')}</p>
            </div>
          </div>

          {/* Budget */}
          <div className="rounded-[24px] border border-secondary/20 bg-secondary-container/30 p-5 md:p-6">
            <h2 className="font-headline mb-1 text-2xl font-semibold">{t('budgetTitle')}</h2>
            <p className="mb-4 text-sm text-on-surface-variant">{t('budgetSub')}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { key: 'budgetEntry', range: playbook.budget.entry },
                { key: 'budgetFood', range: playbook.budget.food },
                { key: 'budgetTransport', range: playbook.budget.transport },
              ].map((row) => {
                const formatted = formatMadRange(row.range);
                return (
                  <div key={row.key} className="rounded-xl bg-white/80 p-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-secondary">
                      {t(row.key)}
                    </p>
                    <p className="mt-1 font-headline text-lg font-bold">
                      {formatted ? `${formatted} ${t('mad')}` : t('budgetFree')}
                    </p>
                  </div>
                );
              })}
            </div>
            {dayBudget && (
              <p className="mt-4 text-sm font-semibold text-on-surface">
                {t('budgetDayTotal', {
                  range: `${formatMadRange(dayBudget)} ${t('mad')}`,
                })}
              </p>
            )}
          </div>

          {/* Darija */}
          <div>
            <h2 className="font-headline mb-2 text-2xl font-semibold">{t('darijaTitle')}</h2>
            <p className="mb-4 text-sm text-on-surface-variant">{t('darijaSub')}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {DARIJA_PHRASES.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest px-3 py-3"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">
                    {t(p.key)}
                  </p>
                  <div className="mt-1.5 flex items-baseline justify-between gap-2">
                    <p className="font-semibold">{p.latin}</p>
                    <p className="shrink-0 text-sm text-on-surface-variant" dir="rtl">
                      {p.ar}
                    </p>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-outline">
                    {t('langDarija')}
                  </p>
                  <div className="mt-1.5 flex items-baseline justify-between gap-2 border-t border-outline-variant/15 pt-1.5">
                    <p className="font-semibold text-secondary">{p.tz}</p>
                    <p className="shrink-0 text-sm text-on-surface-variant">{p.tif}</p>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-outline">
                    {t('langTamazight')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Nearby */}
          {near.length > 0 && (
            <div>
              <h2 className="font-headline mb-4 text-2xl font-semibold">{t('nearbyPlaces')}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {near.map((n) => (
                  <Link
                    key={n.id}
                    to={`/poi/${n.id}`}
                    className="group rounded-2xl border border-outline-variant/15 bg-white p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    <p className="font-headline font-semibold group-hover:text-primary">{n.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-wider text-secondary">
                      {t(categoryLabelKey(n.category))}
                    </p>
                    <p className="mt-2 text-sm text-on-surface-variant">
                      {t('distanceAway', { km: n.distanceKm.toFixed(1) })}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {/* Weather */}
          <div className="rounded-[24px] border border-outline-variant/20 bg-surface-container-lowest p-5">
            <h2 className="font-headline mb-3 text-xl font-semibold">{t('weatherTitle')}</h2>
            {weatherErr && <p className="text-sm text-on-surface-variant">{weatherErr}</p>}
            {!weather && !weatherErr && (
              <p className="text-sm text-on-surface-variant">{t('weatherLoading')}</p>
            )}
            {weather && (
              <>
                <div className="mb-4 flex items-center gap-3">
                  <span className="material-symbols-outlined text-4xl text-primary">
                    {weather.icon}
                  </span>
                  <div>
                    <p className="font-headline text-3xl font-bold">
                      {Math.round(weather.temp)}
                      {weather.unit}
                    </p>
                    <p className="text-sm text-on-surface-variant">{t(weather.labelKey)}</p>
                    <p className="text-xs text-on-surface-variant">
                      {t('wind')}: {Math.round(weather.wind)} {weather.windUnit}
                    </p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {weather.days.map((d) => (
                    <li
                      key={d.date}
                      className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm"
                    >
                      <span>
                        {new Date(d.date).toLocaleDateString(locale, {
                          weekday: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="font-semibold">
                        {Math.round(d.min)}° / {Math.round(d.max)}°
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        {d.rainProb != null ? `${d.rainProb}%` : '—'}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[10px] text-on-surface-variant">{t('weatherSource')}</p>
              </>
            )}
          </div>

          {/* Map */}
          <div>
            <h2 className="font-headline mb-3 text-xl font-semibold">{t('location')}</h2>
            <div className="overflow-hidden rounded-2xl border border-outline-variant/20">
              <MapView pois={[poi]} height="240px" showPopupLinks={false} />
            </div>
            <p className="mt-2 font-dossier text-sm text-on-surface-variant">
              {poi.lat?.toFixed?.(5)}, {poi.lng?.toFixed?.(5)}
            </p>
          </div>

          {/* Emergency */}
          <div className="rounded-[24px] border border-tertiary/25 bg-tertiary/[0.04] p-5">
            <h2 className="font-headline mb-1 text-xl font-semibold">{t('emergencyTitle')}</h2>
            <p className="mb-3 text-xs text-on-surface-variant">{t('emergencySub')}</p>
            <ul className="space-y-2">
              {EMERGENCY_CONTACTS.map((c) => (
                <li key={c.id}>
                  <a
                    href={`tel:${c.dial}`}
                    className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 transition hover:bg-tertiary/10"
                  >
                    <span className="material-symbols-outlined text-tertiary">{c.icon}</span>
                    <span className="flex-1 text-sm font-semibold">{t(c.labelKey)}</span>
                    <span className="font-headline font-bold text-primary">{c.dial}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Next CTAs */}
          <div className="space-y-3 rounded-[24px] border border-primary/20 bg-primary/5 p-5">
            <h3 className="font-headline text-lg font-semibold">{t('planAroundPlace')}</h3>
            <Link
              to="/assistant"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-on-primary"
            >
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              {t('planWithAi')}
            </Link>
            <Link
              to="/trips"
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary py-3 text-sm font-semibold text-primary"
            >
              {t('browseTripPrograms')}
            </Link>
            <Link
              to="/essentials"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-on-surface ring-1 ring-outline-variant/30"
            >
              {t('essentialsTitle')}
            </Link>
            <Link
              to="/artisans"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-on-surface ring-1 ring-outline-variant/30"
            >
              {t('landingArtisansCta')}
            </Link>
          </div>
        </aside>
      </div>

      <div className="mt-12">
        <StayOffersPanel place={poi} defaultOpen />
      </div>
    </section>
  );
}
