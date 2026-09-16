import { useCallback, useEffect, useRef, useState } from 'react';
import { useLang } from '../context/LanguageContext';
import { fallbackGalleryImages } from '../utils/googleMapsMedia';
import './PhotoCarousel.css';

/**
 * Modern fluid photo carousel: autoplay, swipe, crossfade + ken-burns.
 * Falls back to public/samples when listed images are missing.
 */
export default function PhotoCarousel({
  images = [],
  title = '',
  autoplayMs = 4500,
  className = '',
  aspect = 'wide',
  showThumbs = true,
  mapsUrl = null,
  category = null,
}) {
  const { t } = useLang();
  const [valid, setValid] = useState(() =>
    Array.isArray(images) ? images.filter(Boolean) : []
  );
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const touchX = useRef(null);
  const startRef = useRef(0);
  const rafRef = useRef(0);
  const usedSamplesRef = useRef(false);

  useEffect(() => {
    setValid(Array.isArray(images) ? images.filter(Boolean) : []);
    setIndex(0);
    setProgress(0);
    startRef.current = performance.now();
    usedSamplesRef.current = false;
  }, [images]);

  const count = valid.length;
  const current = count ? valid[((index % count) + count) % count] : null;

  const go = useCallback(
    (delta) => {
      if (!count) return;
      setIndex((i) => (i + delta + count) % count);
      setProgress(0);
      startRef.current = performance.now();
    },
    [count]
  );

  const goTo = useCallback((i) => {
    setIndex(i);
    setProgress(0);
    startRef.current = performance.now();
  }, []);

  useEffect(() => {
    if (paused || count <= 1 || autoplayMs <= 0) {
      cancelAnimationFrame(rafRef.current);
      return undefined;
    }

    startRef.current = performance.now();

    function tick(now) {
      const elapsed = now - startRef.current;
      const p = Math.min(1, elapsed / autoplayMs);
      setProgress(p);
      if (p >= 1) {
        setIndex((i) => (i + 1) % count);
        startRef.current = now;
        setProgress(0);
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [paused, count, autoplayMs, index]);

  function markBroken(src) {
    setValid((list) => {
      const next = list.filter((u) => u !== src);
      if (!next.length && !usedSamplesRef.current) {
        usedSamplesRef.current = true;
        setIndex(0);
        setProgress(0);
        startRef.current = performance.now();
        return fallbackGalleryImages({ category });
      }
      setIndex((i) => (next.length ? Math.min(i, next.length - 1) : 0));
      return next;
    });
  }

  function onTouchStart(e) {
    touchX.current = e.changedTouches[0]?.clientX ?? null;
    setPaused(true);
  }

  function onTouchEnd(e) {
    if (touchX.current == null) {
      setPaused(false);
      return;
    }
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
    touchX.current = null;
    setPaused(false);
    if (Math.abs(dx) < 48) return;
    go(dx < 0 ? 1 : -1);
  }

  if (!count) {
    return (
      <div className={`photo-carousel photo-carousel--empty ${className}`}>
        <span className="material-symbols-outlined">add_photo_alternate</span>
        <p>{t('galleryEmpty')}</p>
        <p className="photo-carousel__hint">{t('galleryEmptyHint')}</p>
      </div>
    );
  }

  return (
    <div
      className={`photo-carousel photo-carousel--${aspect} ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="photo-carousel__stage" role="region" aria-roledescription="carousel" aria-label={title || t('galleryOpen')}>
        {valid.map((src, i) => {
          const active = i === index;
          return (
            <div
              key={`${src}-${i}`}
              className={`photo-carousel__slide${active ? ' is-active' : ''}`}
              aria-hidden={!active}
            >
              <img
                src={src}
                alt={title ? `${title} — ${i + 1}` : ''}
                className="photo-carousel__img"
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                onError={() => markBroken(src)}
                draggable={false}
              />
            </div>
          );
        })}

        <div className="photo-carousel__scrim" aria-hidden />

        {title ? (
          <div className="photo-carousel__caption">
            <p className="photo-carousel__caption-title">{title}</p>
          </div>
        ) : null}

        {count > 1 && (
          <>
            <button
              type="button"
              className="photo-carousel__nav photo-carousel__nav--prev"
              onClick={() => go(-1)}
              aria-label={t('galleryPrev')}
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button
              type="button"
              className="photo-carousel__nav photo-carousel__nav--next"
              onClick={() => go(1)}
              aria-label={t('galleryNext')}
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>

            <div className="photo-carousel__dots" role="tablist" aria-label={t('galleryOpen')}>
              {valid.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  className={`photo-carousel__dot${i === index ? ' is-active' : ''}`}
                  onClick={() => goTo(i)}
                  aria-label={t('galleryGoto', { n: i + 1 })}
                >
                  {i === index ? (
                    <span
                      className="photo-carousel__dot-fill"
                      style={{ transform: `scaleX(${progress})` }}
                    />
                  ) : null}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {showThumbs && count > 1 && (
        <div className="photo-carousel__thumbs" role="list">
          {valid.map((src, i) => (
            <button
              key={`t-${src}-${i}`}
              type="button"
              role="listitem"
              className={`photo-carousel__thumb${i === index ? ' is-active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={t('galleryGoto', { n: i + 1 })}
              aria-current={i === index ? 'true' : undefined}
            >
              <img src={src} alt="" loading="lazy" onError={() => markBroken(src)} />
            </button>
          ))}
        </div>
      )}

      {mapsUrl ? (
        <div className="photo-carousel__footer">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="photo-carousel__maps-link"
          >
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            {t('openInGoogleMaps')}
          </a>
        </div>
      ) : null}
    </div>
  );
}
