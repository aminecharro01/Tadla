import { useEffect, useRef, useState } from 'react';
import { FLAGSHIP_PANO } from '../data/flagshipPano';
import { useLang } from '../context/LanguageContext';
import 'pannellum/build/pannellum.css';
import './PanoViewer.css';

/**
 * Pannellum equirectangular viewer with info hotspots.
 * Loaded only for the single flagship POI.
 */
export default function PanoViewer({
  imageUrl = FLAGSHIP_PANO.imageUrl,
  hotspots = FLAGSHIP_PANO.hotspots,
  title,
  compact = false,
}) {
  const { t } = useLang();
  const resolvedTitle = title || t('landingPanoTitle');
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setStatus('loading');
      setError(null);

      try {
        await import('pannellum/build/pannellum.js');
        if (cancelled || !containerRef.current) return;

        const pannellumApi = window.pannellum;
        if (!pannellumApi?.viewer) {
          throw new Error(t('panoLoadFail'));
        }

        if (viewerRef.current) {
          viewerRef.current.destroy();
          viewerRef.current = null;
        }

        viewerRef.current = pannellumApi.viewer(containerRef.current, {
          type: 'equirectangular',
          panorama: imageUrl,
          autoLoad: true,
          showControls: true,
          compass: false,
          mouseZoom: true,
          hotSpots: (hotspots || []).map((h) => ({
            id: h.id,
            pitch: h.pitch,
            yaw: h.yaw,
            type: h.type || 'info',
            text: h.text,
          })),
        });

        setStatus('ready');
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setError(
            err?.message ||
              t('panoLoadFail')
          );
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch {
          /* ignore */
        }
        viewerRef.current = null;
      }
    };
  }, [imageUrl, hotspots]);

  return (
    <div className={`pano-viewer ${compact ? 'pano-viewer--compact' : ''}`}>
      {!compact && (
        <div className="pano-viewer__head">
          <h2>{resolvedTitle}</h2>
          <p>{t('panoDragHint')}</p>
        </div>
      )}

      {status === 'error' && (
        <p className="pano-viewer__error" role="alert">
          {error}
        </p>
      )}

      <div
        ref={containerRef}
        className="pano-viewer__canvas"
        role="img"
        aria-label={resolvedTitle}
      />

      {status === 'loading' && (
        <p className="pano-viewer__loading">{t('panoLoading')}</p>
      )}
    </div>
  );
}
