import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorBanner, LoadingBlock } from '../components/Feedback';
import { useLang } from '../context/LanguageContext';
import {
  INTANGIBLE_HERITAGE,
  localized,
  NEIGHBOURING_HERITAGE_NOTE,
  youtubeSearchUrl,
} from '../data/experienceCatalog';
import { getPoisResolved } from '../services/catalog';

export default function HeritagePage() {
  const { lang, t } = useLang();
  const [pois, setPois] = useState([]);
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
    return () => {
      cancelled = true;
    };
  }, [t]);

  const poiById = useMemo(() => new Map(pois.map((poi) => [poi.id, poi])), [pois]);

  useEffect(() => {
    if (loading || !window.location.hash) return;
    requestAnimationFrame(() => {
      document
        .getElementById(window.location.hash.slice(1))
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [loading]);

  if (loading) {
    return (
      <section className="mx-auto max-w-[1100px] px-5 py-10">
        <LoadingBlock label={t('loadingHeritage')} />
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1100px] px-5 pb-16 pt-8 md:px-10">
      <header className="mb-10 grid gap-6 border-b border-outline-variant/20 pb-8 md:grid-cols-[1fr_0.65fr] md:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-tertiary">
            {t('livingHeritageEyebrow')}
          </p>
          <h1 className="font-headline text-4xl font-bold leading-tight md:text-6xl">
            {t('livingHeritageTitle')}
          </h1>
        </div>
        <p className="leading-relaxed text-on-surface-variant">
          {t('livingHeritageIntro')}
        </p>
      </header>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={error} />
        </div>
      )}

      <div className="space-y-6">
        {INTANGIBLE_HERITAGE.map((item, index) => {
          const linked = item.poiIds.map((id) => poiById.get(id)).filter(Boolean);
          return (
            <article
              key={item.id}
              id={item.id}
              className="scroll-mt-24 grid overflow-hidden rounded-[28px] border border-outline-variant/20 bg-surface-container-lowest md:grid-cols-[240px_1fr]"
            >
              <div className="relative flex min-h-44 flex-col justify-between overflow-hidden bg-primary p-5 text-on-primary md:min-h-full">
                {item.image && (
                  <img
                    src={item.image}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/20" />
                <span className="material-symbols-outlined relative text-4xl drop-shadow">
                  {item.icon}
                </span>
                <div className="relative">
                  <p className="font-dossier text-xs text-primary-fixed">
                    {String(index + 1).padStart(2, '0')} / {INTANGIBLE_HERITAGE.length}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wider">
                    {localized(item.period, lang)}
                  </p>
                </div>
              </div>
              <div className="p-5 md:p-7">
                <h2 className="font-headline text-2xl font-bold">
                  {localized(item.title, lang)}
                </h2>
                <p className="mt-3 leading-relaxed text-on-surface-variant">
                  {localized(item.summary, lang)}
                </p>
                {item.history && (
                  <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/[0.04] p-4">
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                      <span className="material-symbols-outlined text-[16px]">history_edu</span>
                      {t('heritageHistoryTitle')}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                      {localized(item.history, lang)}
                    </p>
                  </div>
                )}
                <div className="mt-5 rounded-2xl bg-secondary-container/50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-secondary">
                    {t('participateRespectfully')}
                  </p>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {localized(item.participation, lang)}
                  </p>
                </div>
                {linked.length > 0 && (
                  <div className="mt-5">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      {t('linkedPlaces')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {linked.map((poi) => (
                        <Link
                          key={poi.id}
                          to={`/poi/${poi.id}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/10"
                        >
                          <span className="material-symbols-outlined text-[16px]">place</span>
                          {poi.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {item.videoSearch && (
                    <a
                      href={youtubeSearchUrl(item.videoSearch)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-tertiary px-4 py-2 text-sm font-semibold text-on-tertiary hover:opacity-90"
                    >
                      <span className="material-symbols-outlined text-[18px]">smart_display</span>
                      {t('heritageWatchVideo')}
                    </a>
                  )}
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    {t('heritageSource')}
                    <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <aside className="mt-8 rounded-[28px] border border-tertiary/25 bg-tertiary/[0.05] p-6 md:p-8">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-3xl text-tertiary">info</span>
          <div>
            <h2 className="font-headline text-2xl font-bold">
              {localized(NEIGHBOURING_HERITAGE_NOTE.title, lang)}
            </h2>
            <p className="mt-2 leading-relaxed text-on-surface-variant">
              {localized(NEIGHBOURING_HERITAGE_NOTE.body, lang)}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {NEIGHBOURING_HERITAGE_NOTE.videoSearch && (
                <a
                  href={youtubeSearchUrl(NEIGHBOURING_HERITAGE_NOTE.videoSearch)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-tertiary px-4 py-2 text-sm font-semibold text-on-tertiary hover:opacity-90"
                >
                  <span className="material-symbols-outlined text-[18px]">smart_display</span>
                  {t('heritageWatchVideo')}
                </a>
              )}
              <a
                href={NEIGHBOURING_HERITAGE_NOTE.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-tertiary hover:underline"
              >
                {t('heritageSource')}
                <span className="material-symbols-outlined text-[15px]">open_in_new</span>
              </a>
            </div>
          </div>
        </div>
      </aside>

      <p className="mt-8 rounded-2xl border border-outline-variant/20 bg-surface p-5 text-sm leading-relaxed text-on-surface-variant">
        <strong className="text-on-surface">{t('heritageAccuracyTitle')}</strong>{' '}
        {t('heritageAccuracyBody')}
      </p>
    </section>
  );
}
