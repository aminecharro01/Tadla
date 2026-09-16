import { Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { categoryLabelKey } from '../i18n/strings';
import {
  getProgramDuration,
  getProgramThemes,
} from '../services/firestore';

/**
 * Compact trip card — image from first POI, tight meta, one CTA.
 */
export default function TripCard({ program, pois = [] }) {
  const { t, daysLabel } = useLang();
  const themes = getProgramThemes(program, pois);
  const days = getProgramDuration(program);
  const dates = Array.isArray(program.availableDates) ? program.availableDates.length : 0;

  const stopIds = (program.days || []).flatMap((d) => d.poiIds || []);
  const firstPoi = pois.find((p) => stopIds.includes(p.id));
  const cover = program.coverImage || firstPoi?.images?.[0] || null;
  const stopCount = new Set(stopIds).size;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
      <Link to={`/trips/${program.id}`} className="relative block aspect-[16/10] overflow-hidden bg-surface-container-high">
        {cover ? (
          <img
            src={cover}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-secondary-container to-surface-container">
            <span className="material-symbols-outlined text-4xl text-primary/40">hiking</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-on-surface/70 to-transparent p-3 pt-10">
          <p className="font-dossier text-sm text-white">
            <span className="font-semibold">{program.price}</span> {t('mad')}
          </p>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <h2 className="font-headline mb-1 line-clamp-2 text-lg font-semibold leading-snug">
          <Link to={`/trips/${program.id}`} className="text-on-surface hover:text-primary">
            {program.title}
          </Link>
        </h2>
        <p className="mb-3 line-clamp-2 text-sm text-on-surface-variant">
          {program.description}
        </p>

        <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 font-dossier text-xs text-on-surface-variant">
          <span>{daysLabel(days)}</span>
          <span>{t('maxGroup', { n: program.maxGroupSize || '—' })}</span>
          {stopCount > 0 && <span>{t('stopsCount', { n: stopCount })}</span>}
          {dates > 0 && <span>{t('datesAvailable', { n: dates })}</span>}
        </div>

        {themes.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {themes.slice(0, 3).map((th) => (
              <span
                key={th}
                className="rounded-md bg-secondary-container px-2 py-0.5 text-[11px] font-semibold capitalize text-on-secondary-container"
              >
                {t(categoryLabelKey(th))}
              </span>
            ))}
          </div>
        )}

        <Link
          to={`/trips/${program.id}`}
          className="mt-auto inline-flex justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-all active:scale-95"
        >
          {t('viewBook')}
        </Link>
      </div>
    </article>
  );
}
