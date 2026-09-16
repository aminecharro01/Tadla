import { googleStreetViewEmbedSrc } from '../data/landingPanos';
import { useLang } from '../context/LanguageContext';

/**
 * Inline Google Street View / Photo Sphere for a regional place.
 */
export default function GoogleStreetViewEmbed({ place, title }) {
  const { t } = useLang();
  const src = googleStreetViewEmbedSrc(place);

  if (!place || !src) {
    return (
      <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface px-4 py-8 text-center text-sm text-on-surface-variant">
        {t('panoLoading')}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-[#1a1a1a]">
      <iframe
        key={place.poiId || `${place.lat},${place.lng}`}
        title={title || place.fallbackName}
        src={src}
        className="h-[min(52vh,420px)] w-full border-0 md:h-[480px]"
        allow="accelerometer; gyroscope; fullscreen"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/20 bg-surface px-4 py-3">
        <p className="text-sm font-semibold text-on-surface">
          {title || place.fallbackName}
        </p>
        {place.mapsUrl ? (
          <a
            href={place.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-tertiary hover:underline"
          >
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            {t('openInGoogleMaps')}
          </a>
        ) : null}
      </div>
    </div>
  );
}
