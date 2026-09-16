import { useEffect, useMemo, useState } from 'react';
import { useLang } from '../context/LanguageContext';
import { buildStayOffers } from '../utils/stayOffers';
import IconButton from './IconButton';

/**
 * Nearby Booking.com offers only — offer cards (no full-site embed, no Airbnb).
 */
export default function StayOffersPanel({ place, compact = false, defaultOpen = true }) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(defaultOpen);

  const data = useMemo(() => buildStayOffers(place, lang), [place, lang]);

  useEffect(() => {
    setOpen(defaultOpen);
  }, [place?.id, place?.name, defaultOpen]);

  if (!place) return null;

  return (
    <section
      id="stays"
      className={`rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm ${
        compact ? 'p-4' : 'p-5 md:p-6'
      }`}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-primary">
            Booking.com
          </p>
          <h3 className="font-headline text-xl font-semibold md:text-2xl">
            {t('stayOffersTitle')}
          </h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            {t('stayOffersNear', { place: place.name || data.query })}
          </p>
        </div>
        <IconButton
          icon={open ? 'expand_less' : 'expand_more'}
          label={open ? t('stayHide') : t('stayShow')}
          variant="ghost"
          onClick={() => setOpen((v) => !v)}
        />
      </div>

      {open && (
        <>
          <p className="mb-3 font-dossier text-xs text-on-surface-variant">{data.query}</p>

          <ul className={`grid gap-3 ${compact ? '' : 'sm:grid-cols-3'}`}>
            {data.offers.map((offer) => (
              <li key={offer.id}>
                <a
                  href={offer.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-full flex-col rounded-xl border border-outline-variant/20 bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-secondary hover:shadow-md"
                >
                  <span className="material-symbols-outlined mb-2 text-[28px] text-primary">
                    {offer.icon}
                  </span>
                  <span className="font-headline text-base font-semibold text-on-surface">
                    {t(offer.titleKey)}
                  </span>
                  <span className="mt-1 flex-1 text-sm text-on-surface-variant">
                    {t(offer.hintKey)}
                  </span>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-secondary">
                    {t('stayViewOffers')}
                    <span className="material-symbols-outlined text-[18px]">arrow_outward</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <a
            href={data.bookingUrl || data.allUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary"
          >
            {t('stayOpenBooking')}
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          </a>
        </>
      )}
    </section>
  );
}
