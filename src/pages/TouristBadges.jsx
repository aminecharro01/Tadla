import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorBanner, LoadingBlock } from '../components/Feedback';
import { useLang } from '../context/LanguageContext';
import { getPoisResolved } from '../services/catalog';
import {
  getBadgeProgress,
  getVisitedPoiIds,
} from '../utils/experienceStorage';

export default function TouristBadges() {
  const { t } = useLang();
  const [pois, setPois] = useState([]);
  const [visitedIds, setVisitedIds] = useState(getVisitedPoiIds);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getPoisResolved()
      .then(({ pois: rows }) => {
        if (!cancelled) setPois(rows || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || t('loadPoiFail'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    function onVisitsChanged(event) {
      setVisitedIds(Array.isArray(event.detail) ? event.detail : getVisitedPoiIds());
    }
    window.addEventListener('tadla:visits-changed', onVisitsChanged);
    return () => {
      cancelled = true;
      window.removeEventListener('tadla:visits-changed', onVisitsChanged);
    };
  }, [t]);

  const badges = useMemo(
    () => getBadgeProgress(pois, visitedIds),
    [pois, visitedIds]
  );
  const unlocked = badges.filter((badge) => badge.unlocked).length;
  const visitedPois = useMemo(() => {
    const ids = new Set(visitedIds);
    return pois.filter((poi) => ids.has(poi.id));
  }, [pois, visitedIds]);

  if (loading) {
    return (
      <section className="mx-auto max-w-[1000px] px-5 py-10">
        <LoadingBlock label={t('loadingBadges')} />
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1000px] px-5 pb-16 pt-8 md:px-10">
      <header className="mb-8 overflow-hidden rounded-[30px] bg-primary p-6 text-on-primary md:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-fixed">
          {t('touristPassport')}
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="font-headline text-4xl font-bold md:text-5xl">
              {t('badgesTitle')}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-primary-fixed md:text-base">
              {t('badgesIntro')}
            </p>
          </div>
          <div className="flex gap-6 font-dossier">
            <div>
              <p className="text-3xl font-bold">{visitedPois.length}</p>
              <p className="text-xs text-primary-fixed">{t('placesMarkedVisited')}</p>
            </div>
            <div>
              <p className="text-3xl font-bold">
                {unlocked}/{badges.length}
              </p>
              <p className="text-xs text-primary-fixed">{t('badgesUnlocked')}</p>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={error} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {badges.map((badge) => (
          <article
            key={badge.id}
            className={`rounded-2xl border p-5 ${
              badge.unlocked
                ? 'border-secondary/30 bg-secondary-container/35'
                : 'border-outline-variant/20 bg-surface-container-lowest'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className={`material-symbols-outlined text-4xl ${
                  badge.unlocked ? 'text-secondary' : 'text-outline'
                }`}
              >
                {badge.icon}
              </span>
              <span className="font-dossier text-xs font-bold text-on-surface-variant">
                {Math.min(badge.value, badge.threshold)}/{badge.threshold}
              </span>
            </div>
            <h2 className="font-headline mt-4 text-xl font-bold">
              {t(`badge_${badge.id}_title`)}
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              {t(`badge_${badge.id}_description`, { n: badge.threshold })}
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-container-highest">
              <div
                className={`h-full rounded-full ${
                  badge.unlocked ? 'bg-secondary' : 'bg-primary'
                }`}
                style={{ width: `${badge.progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-semibold text-on-surface-variant">
              {badge.unlocked ? t('badgeUnlocked') : t('badgeInProgress')}
            </p>
          </article>
        ))}
      </div>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-headline text-2xl font-bold">{t('visitedPlaces')}</h2>
          <Link to="/discover" className="text-sm font-semibold text-primary">
            {t('discoverMorePlaces')}
          </Link>
        </div>
        {visitedPois.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {visitedPois.map((poi) => (
              <Link
                key={poi.id}
                to={`/poi/${poi.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/25 bg-surface-container-lowest px-3 py-2 text-sm font-semibold hover:border-primary/40 hover:text-primary"
              >
                <span className="material-symbols-outlined text-[17px] text-secondary">
                  check_circle
                </span>
                {poi.name}
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-outline-variant/40 p-6 text-center">
            <p className="text-on-surface-variant">{t('noVisitedPlaces')}</p>
            <Link to="/discover" className="mt-3 inline-block font-semibold text-primary">
              {t('startExploring')}
            </Link>
          </div>
        )}
      </section>

      <p className="mt-8 text-xs leading-relaxed text-on-surface-variant">
        {t('badgesPrivacyNote')}
      </p>
    </section>
  );
}
