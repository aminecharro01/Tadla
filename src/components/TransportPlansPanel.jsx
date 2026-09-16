import { useLang } from '../context/LanguageContext';

/**
 * No-car transport options with indicative MAD estimates for an itinerary.
 */
export default function TransportPlansPanel({ transport }) {
  const { t } = useLang();
  if (!transport?.plans?.length) return null;

  return (
    <section className="no-print rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm md:p-5">
      <div className="mb-3 flex items-start gap-2">
        <span className="material-symbols-outlined text-primary">commute</span>
        <div>
          <h3 className="font-headline text-lg font-semibold md:text-xl">
            {t('transportTitle')}
          </h3>
          <p className="text-sm text-on-surface-variant">{t('transportBody')}</p>
          <p className="mt-1 font-dossier text-xs text-on-surface-variant">
            {t('transportRouteMeta', {
              km: transport.roadKm,
              stops: transport.stopCount,
              days: transport.days,
            })}
          </p>
        </div>
      </div>

      <p className="mb-4 rounded-xl bg-tertiary-container/40 px-3 py-2 text-xs text-on-tertiary-container">
        {t('transportEstimateNote')}
      </p>

      <ul className="grid gap-3 sm:grid-cols-2">
        {transport.plans.map((plan) => (
          <li
            key={plan.id}
            className={`flex flex-col rounded-xl border p-4 ${
              plan.recommended
                ? 'border-primary/50 bg-primary/5 shadow-sm'
                : 'border-outline-variant/20 bg-surface'
            }`}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[26px] text-primary">
                  {plan.icon}
                </span>
                <div>
                  <p className="font-headline text-base font-semibold">{t(plan.titleKey)}</p>
                  {plan.recommended && (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-primary">
                      {t('transportSuggested')}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-end">
                <p className="text-sm font-bold text-on-surface">
                  {plan.priceMin}–{plan.priceMax} {t('mad')}
                </p>
                <p className="text-[10px] text-on-surface-variant">
                  {t('transportForGroup', { n: transport.people })}
                </p>
              </div>
            </div>

            <p className="mb-2 flex-1 text-sm text-on-surface-variant">{t(plan.hintKey)}</p>

            {plan.perPersonMin != null && (
              <p className="mb-2 text-xs text-on-surface-variant">
                {t('transportPerPerson', {
                  min: plan.perPersonMin,
                  max: plan.perPersonMax,
                })}
              </p>
            )}

            <dl className="mt-auto space-y-1 border-t border-outline-variant/20 pt-2 text-xs text-on-surface-variant">
              <div className="flex justify-between gap-2">
                <dt>{t('transportBestFor')}</dt>
                <dd className="font-semibold text-on-surface">{t(plan.bestForKey)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>{t('transportPace')}</dt>
                <dd className="font-semibold text-on-surface">{t(plan.timeKey)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>{t('transportReach')}</dt>
                <dd className="text-end font-semibold text-on-surface">
                  {t(plan.coverageKey)}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}
