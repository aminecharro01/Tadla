import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorBanner, LoadingBlock } from '../components/Feedback';
import TripCard from '../components/TripCard';
import { useLang } from '../context/LanguageContext';
import { categoryLabelKey, categoriesForInterest } from '../i18n/strings';
import {
  getPois,
  getProgramDuration,
  getProgramThemes,
  getTripPrograms,
} from '../services/firestore';

const THEMES = ['all', 'nature', 'history', 'culture', 'family'];

export default function TripPrograms() {
  const { t, daysLabel } = useLang();
  const [programs, setPrograms] = useState([]);
  const [pois, setPois] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('all');
  const [maxPrice, setMaxPrice] = useState('');
  const [duration, setDuration] = useState('all');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [trips, poiList] = await Promise.all([getTripPrograms(), getPois()]);
        if (!cancelled) {
          setPrograms(trips);
          setPois(poiList);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || t('loadTripsFail'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const filtered = useMemo(() => {
    return programs.filter((program) => {
      const themes = getProgramThemes(program, pois);
      const days = getProgramDuration(program);
      const price = Number(program.price) || 0;
      if (theme !== 'all') {
        const allowed = new Set(categoriesForInterest(theme));
        if (!themes.some((th) => allowed.has(th))) return false;
      }
      if (maxPrice !== '' && price > Number(maxPrice)) return false;
      if (duration !== 'all' && days !== Number(duration)) return false;
      return true;
    });
  }, [programs, pois, theme, maxPrice, duration]);

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-10 md:px-16">
      <header className="mb-8">
        <h1 className="font-headline mb-3 text-4xl font-bold tracking-tight md:text-5xl">
          {t('tripPrograms')}
        </h1>
        <p className="max-w-2xl text-lg text-on-surface-variant">{t('tripsSubtitle')}</p>
      </header>

      <div className="mb-8 flex flex-wrap gap-4 rounded-2xl border border-outline-variant/20 bg-surface p-4 shadow-sm">
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
          {t('theme')}
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="min-w-[9rem] rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2.5 text-sm font-normal text-on-surface"
          >
            {THEMES.map((th) => (
              <option key={th} value={th}>
                {th === 'all' ? t('themeAll') : t(categoryLabelKey(th))}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
          {t('maxPrice')}
          <input
            type="number"
            min={0}
            placeholder={t('any')}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="min-w-[9rem] rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2.5 text-sm font-normal text-on-surface"
          />
        </label>
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
          {t('duration')}
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="min-w-[9rem] rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2.5 text-sm font-normal text-on-surface"
          >
            <option value="all">{t('any')}</option>
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <option key={d} value={d}>
                {daysLabel(d)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={error} />
        </div>
      )}

      {loading ? (
        <LoadingBlock label={t('loadingTrips')} />
      ) : programs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface p-10 text-center">
          <p className="mb-2 text-on-surface-variant">{t('noTripsYet')}</p>
          <Link to="/partner" className="font-semibold text-primary">
            {t('createInGuide')}
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-on-surface-variant">{t('noTripsMatch')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((program) => (
            <TripCard key={program.id} program={program} pois={pois} />
          ))}
        </div>
      )}
    </div>
  );
}
