import { Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { DARIJA_PHRASES, EMERGENCY_CONTACTS } from '../data/touristGuide';

/**
 * Traveler essentials — emergency, Darija, offline checklist.
 */
export default function EssentialsPage() {
  const { t } = useLang();

  return (
    <section className="mx-auto max-w-3xl px-5 py-10 md:px-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
        {t('landingEyebrow')}
      </p>
      <h1 className="font-headline mb-3 text-3xl font-bold md:text-4xl">{t('essentialsTitle')}</h1>
      <p className="mb-10 text-on-surface-variant">{t('essentialsSub')}</p>

      <div className="mb-10 rounded-[24px] border border-tertiary/25 bg-tertiary/[0.04] p-5 md:p-6">
        <h2 className="font-headline mb-1 text-xl font-semibold">{t('emergencyTitle')}</h2>
        <p className="mb-4 text-sm text-on-surface-variant">{t('emergencySub')}</p>
        <ul className="space-y-2">
          {EMERGENCY_CONTACTS.map((c) => (
            <li key={c.id}>
              <a
                href={`tel:${c.dial}`}
                className="flex items-center gap-3 rounded-xl bg-white px-3 py-3 shadow-sm"
              >
                <span className="material-symbols-outlined text-tertiary">{c.icon}</span>
                <span className="flex-1 font-semibold">{t(c.labelKey)}</span>
                <span className="font-headline text-lg font-bold text-primary">{c.dial}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-10">
        <h2 className="font-headline mb-2 text-xl font-semibold">{t('darijaTitle')}</h2>
        <p className="mb-4 text-sm text-on-surface-variant">{t('darijaSub')}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {DARIJA_PHRASES.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest px-3 py-3"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-primary">{t(p.key)}</p>
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

      <div className="mb-10 rounded-[24px] border border-outline-variant/20 bg-surface-container-lowest p-5">
        <h2 className="font-headline mb-3 text-xl font-semibold">{t('offlineTitle')}</h2>
        <ul className="space-y-2 text-sm text-on-surface-variant">
          <li className="flex gap-2">
            <span className="material-symbols-outlined text-[18px] text-secondary">download</span>
            {t('offlineTip1')}
          </li>
          <li className="flex gap-2">
            <span className="material-symbols-outlined text-[18px] text-secondary">map</span>
            {t('offlineTip2')}
          </li>
          <li className="flex gap-2">
            <span className="material-symbols-outlined text-[18px] text-secondary">forum</span>
            {t('offlineTip3')}
          </li>
        </ul>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/discover"
          className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-on-primary"
        >
          {t('landingCtaDiscover')}
        </Link>
        <Link
          to="/ask"
          className="rounded-full bg-tertiary px-5 py-3 text-sm font-semibold text-on-tertiary"
        >
          {t('ragTitle')}
        </Link>
      </div>
    </section>
  );
}
