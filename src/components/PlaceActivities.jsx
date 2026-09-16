import { Link } from 'react-router-dom';
import {
  activitiesForPoi,
  INTANGIBLE_HERITAGE,
  localized,
} from '../data/experienceCatalog';
import { useLang } from '../context/LanguageContext';

export default function PlaceActivities({ poi }) {
  const { lang, t } = useLang();
  const activities = activitiesForPoi(poi);
  const relatedHeritage = INTANGIBLE_HERITAGE.filter((item) =>
    item.poiIds.includes(poi?.id)
  );

  return (
    <section>
      <div className="mb-4 flex items-start gap-3">
        <span className="material-symbols-outlined mt-0.5 text-3xl text-secondary">
          local_activity
        </span>
        <div>
          <h2 className="font-headline text-2xl font-semibold">{t('activitiesTitle')}</h2>
          <p className="text-sm text-on-surface-variant">{t('activitiesSubtitle')}</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {activities.map((activity) => (
          <article
            key={activity.id}
            className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[22px] text-primary">
                {activity.icon}
              </span>
              <h3 className="font-headline font-semibold">
                {localized(activity.title, lang)}
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-on-surface-variant">
              {localized(activity.description, lang)}
            </p>
            <span className="mt-3 inline-block rounded-lg bg-secondary-container px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-on-secondary-container">
              {t(`activityType_${activity.type}`)}
            </span>
          </article>
        ))}
      </div>
      <p className="mt-3 text-xs text-on-surface-variant">{t('activitySafetyNote')}</p>
      {relatedHeritage.length > 0 && (
        <div className="mt-5 rounded-2xl border border-tertiary/20 bg-tertiary/[0.04] p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-tertiary">
            {t('heritageAtThisPlace')}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {relatedHeritage.map((item) => (
              <Link
                key={item.id}
                to={`/heritage#${item.id}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-lowest px-3 py-2 text-sm font-semibold text-primary ring-1 ring-outline-variant/20"
              >
                <span className="material-symbols-outlined text-[17px]">{item.icon}</span>
                {localized(item.title, lang)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
