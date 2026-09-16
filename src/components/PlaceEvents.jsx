import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { canUseLiveGemini, fetchLiveEvents } from '../services/gemini';

const CACHE_PREFIX = 'tadla_events_v1:';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const TYPE_ICONS = {
  festival: 'celebration',
  market: 'storefront',
  sport: 'sports_score',
  music: 'music_note',
  cultural: 'theater_comedy',
  religious: 'mosque',
  outdoor: 'hiking',
  other: 'event',
};

function cacheKey(poiId, lang) {
  return `${CACHE_PREFIX}${lang}:${poiId}`;
}

function readCache(poiId, lang) {
  try {
    const raw = localStorage.getItem(cacheKey(poiId, lang));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(poiId, lang, data) {
  try {
    localStorage.setItem(
      cacheKey(poiId, lang),
      JSON.stringify({ ...data, ts: Date.now() })
    );
  } catch {
    /* ignore */
  }
}

/**
 * Events near a place. Live Gemini search only for admin; everyone else gets
 * curated regional events with no API call and no error messaging.
 */
export default function PlaceEvents({ poi }) {
  const { lang, t } = useLang();
  const { isAdmin } = useAuth();
  const liveAi = canUseLiveGemini(isAdmin);
  const [events, setEvents] = useState([]);
  const [sources, setSources] = useState([]);
  const [status, setStatus] = useState('idle');
  const [updatedAt, setUpdatedAt] = useState(null);
  const abortRef = useRef(null);
  const sectionRef = useRef(null);

  const load = useCallback(
    async ({ force = false } = {}) => {
      if (!poi?.id) return;

      // Cache only applies to live admin results.
      if (liveAi && !force) {
        const cached = readCache(poi.id, lang);
        if (cached) {
          setEvents(cached.events || []);
          setSources(cached.sources || []);
          setUpdatedAt(cached.ts);
          setStatus('done');
          return;
        }
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStatus('loading');
      try {
        const res = await fetchLiveEvents(poi, {
          lang,
          signal: controller.signal,
          liveAi,
        });
        if (controller.signal.aborted) return;
        setEvents(res.events);
        setSources(res.sources || []);
        setUpdatedAt(Date.now());
        setStatus('done');
        if (liveAi && !res.fallback) {
          writeCache(poi.id, lang, { events: res.events, sources: res.sources });
        }
      } catch {
        if (controller.signal.aborted) return;
        // Silent recovery — still try curated list without surfacing errors.
        try {
          const res = await fetchLiveEvents(poi, { lang, liveAi: false });
          setEvents(res.events);
          setSources([]);
          setStatus('done');
        } catch {
          setEvents([]);
          setStatus('done');
        }
      }
    },
    [poi, lang, liveAi]
  );

  useEffect(() => {
    if (!poi?.id) return undefined;

    if (!liveAi) {
      load();
      return () => abortRef.current?.abort();
    }

    const cached = readCache(poi.id, lang);
    if (cached) {
      setEvents(cached.events || []);
      setSources(cached.sources || []);
      setUpdatedAt(cached.ts);
      setStatus('done');
      return undefined;
    }

    setStatus('idle');
    setEvents([]);
    setSources([]);

    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      load();
      return () => abortRef.current?.abort();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          load();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      abortRef.current?.abort();
    };
  }, [poi, lang, liveAi, load]);

  return (
    <section ref={sectionRef}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined mt-0.5 text-3xl text-tertiary">
            event_available
          </span>
          <div>
            <h2 className="font-headline text-2xl font-semibold">{t('eventsTitle')}</h2>
            <p className="text-sm text-on-surface-variant">{t('eventsSubtitle')}</p>
          </div>
        </div>
        {liveAi && (
          <button
            type="button"
            onClick={() => load({ force: true })}
            disabled={status === 'loading'}
            className="shrink-0 rounded-full border border-outline-variant/30 p-2 text-on-surface-variant transition hover:bg-surface-container-high disabled:opacity-50"
            title={t('eventsRefresh')}
            aria-label={t('eventsRefresh')}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${status === 'loading' ? 'animate-spin' : ''}`}
            >
              {status === 'loading' ? 'progress_activity' : 'refresh'}
            </span>
          </button>
        )}
      </div>

      {status === 'loading' && events.length === 0 && (
        <div className="flex items-center gap-2 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-[20px]">
            progress_activity
          </span>
          {t('eventsLoading')}
        </div>
      )}

      {status === 'done' && events.length === 0 && (
        <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 text-sm text-on-surface-variant">
          {t('eventsEmpty')}
        </div>
      )}

      {events.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {events.map((ev, idx) => (
            <article
              key={`${ev.title}-${idx}`}
              className="flex flex-col rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-tertiary">
                  {TYPE_ICONS[ev.type] || TYPE_ICONS.other}
                </span>
                <h3 className="font-headline font-semibold leading-tight">{ev.title}</h3>
              </div>
              {ev.date && (
                <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-primary">
                  <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                  {ev.date}
                  {!ev.dateConfirmed && (
                    <span className="rounded bg-secondary-container px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-secondary-container">
                      {t('eventsDateTentative')}
                    </span>
                  )}
                </p>
              )}
              {ev.location && (
                <p className="mb-2 flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-[15px]">place</span>
                  {ev.location}
                </p>
              )}
              {ev.description && (
                <p className="text-sm leading-relaxed text-on-surface-variant">
                  {ev.description}
                </p>
              )}
              {ev.url && (
                <a
                  href={ev.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  {t('eventsDetails')}
                  <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                </a>
              )}
            </article>
          ))}
        </div>
      )}

      {events.length > 0 && (
        <div className="mt-3 space-y-1">
          <p className="text-xs text-on-surface-variant">{t('eventsDisclaimer')}</p>
          {sources.length > 0 && (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-outline">
              <span className="font-semibold">{t('eventsSources')}</span>
              {sources.map((s, i) => (
                <a
                  key={`${s.url}-${i}`}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {new URL(s.url).hostname.replace(/^www\./, '')}
                </a>
              ))}
            </p>
          )}
          {liveAi && updatedAt && (
            <p className="text-[11px] text-outline">
              {t('eventsUpdated')} {new Date(updatedAt).toLocaleString(lang)}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
