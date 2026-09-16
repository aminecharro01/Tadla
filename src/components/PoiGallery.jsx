import { useCallback, useEffect, useRef, useState } from 'react';
import { useLang } from '../context/LanguageContext';
import { fallbackGalleryImages } from '../utils/googleMapsMedia';
import './PoiGallery.css';

/**
 * Manual photo gallery / carousel for a place detail page.
 * Skips broken URLs; if none remain, switches to public/samples fallbacks.
 */
export default function PoiGallery({
  images = [],
  placeName = '',
  categoryLabel = '',
  hoursLabel = '',
  badges = null,
  category = null,
}) {
  const { t } = useLang();
  const [valid, setValid] = useState(() => (Array.isArray(images) ? images.filter(Boolean) : []));
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const touchX = useRef(null);
  const usedSamplesRef = useRef(false);

  useEffect(() => {
    setValid(Array.isArray(images) ? images.filter(Boolean) : []);
    setIndex(0);
    usedSamplesRef.current = false;
  }, [images]);

  const count = valid.length;
  const current = count ? valid[((index % count) + count) % count] : null;

  const go = useCallback(
    (delta) => {
      if (!count) return;
      setIndex((i) => (i + delta + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (!lightbox && count <= 1) return undefined;
    function onKey(e) {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'Escape') setLightbox(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, lightbox, count]);

  function markBroken(src) {
    setValid((list) => {
      const next = list.filter((u) => u !== src);
      if (!next.length && !usedSamplesRef.current) {
        usedSamplesRef.current = true;
        setIndex(0);
        return fallbackGalleryImages({ category });
      }
      setIndex((i) => (next.length ? Math.min(i, next.length - 1) : 0));
      return next;
    });
  }

  function onTouchStart(e) {
    touchX.current = e.changedTouches[0]?.clientX ?? null;
  }

  function onTouchEnd(e) {
    if (touchX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 40) return;
    go(dx < 0 ? 1 : -1);
  }

  return (
    <div className="poi-gallery">
      <div
        className="poi-gallery__stage"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {current ? (
          <button
            type="button"
            className="poi-gallery__main-btn"
            onClick={() => setLightbox(true)}
            aria-label={t('galleryOpen')}
          >
            <img
              key={current}
              src={current}
              alt={placeName ? `${placeName} — ${index + 1}` : ''}
              className="poi-gallery__main"
              onError={() => markBroken(current)}
            />
          </button>
        ) : (
          <div className="poi-gallery__empty">
            <span className="material-symbols-outlined">add_photo_alternate</span>
            <p>{t('galleryEmpty')}</p>
            <p className="poi-gallery__empty-hint">{t('galleryEmptyHint')}</p>
          </div>
        )}

        <div className="poi-gallery__scrim" />

        <div className="poi-gallery__caption">
          {categoryLabel && (
            <p className="poi-gallery__eyebrow">{categoryLabel}</p>
          )}
          {placeName && <h1 className="poi-gallery__title">{placeName}</h1>}
          {hoursLabel && <p className="poi-gallery__hours">{hoursLabel}</p>}
          {badges}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              className="poi-gallery__nav poi-gallery__nav--prev"
              onClick={() => go(-1)}
              aria-label={t('galleryPrev')}
              title={t('galleryPrev')}
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button
              type="button"
              className="poi-gallery__nav poi-gallery__nav--next"
              onClick={() => go(1)}
              aria-label={t('galleryNext')}
              title={t('galleryNext')}
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
            <div className="poi-gallery__counter" aria-live="polite">
              {index + 1} / {count}
            </div>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="poi-gallery__thumbs" role="list">
          {valid.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              role="listitem"
              className={`poi-gallery__thumb ${i === index ? 'is-active' : ''}`}
              onClick={() => setIndex(i)}
              aria-label={t('galleryGoto', { n: i + 1 })}
              aria-current={i === index ? 'true' : undefined}
            >
              <img src={src} alt="" onError={() => markBroken(src)} />
            </button>
          ))}
        </div>
      )}

      {lightbox && current && (
        <div
          className="poi-gallery__lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={t('galleryOpen')}
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            className="poi-gallery__lightbox-close"
            onClick={() => setLightbox(false)}
            aria-label={t('close')}
            title={t('close')}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          {count > 1 && (
            <>
              <button
                type="button"
                className="poi-gallery__nav poi-gallery__nav--prev poi-gallery__nav--lb"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                aria-label={t('galleryPrev')}
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                type="button"
                className="poi-gallery__nav poi-gallery__nav--next poi-gallery__nav--lb"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                aria-label={t('galleryNext')}
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </>
          )}
          <img
            src={current}
            alt={placeName}
            className="poi-gallery__lightbox-img"
            onClick={(e) => e.stopPropagation()}
            onError={() => markBroken(current)}
          />
          <p className="poi-gallery__lightbox-count">
            {index + 1} / {count}
          </p>
        </div>
      )}
    </div>
  );
}
