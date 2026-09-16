/**
 * Shared Leaflet map: OSM tiles, POI markers, optional route polyline.
 */
import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useLang } from '../context/LanguageContext';
import { categoryLabelKey } from '../i18n/strings';
import { getStreetViewPlace } from '../data/landingPanos';
import { samplePlaceCover } from '../utils/sampleMedia';
import { resolvePoiCoverUrl } from '../utils/googleMapsMedia';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export const REGION_CENTER = [32.45, -6.0];
export const REGION_ZOOM = 8;

function escapeAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function poiPhotoUrl(poi) {
  return resolvePoiCoverUrl(poi, getStreetViewPlace(poi));
}

function numberedIcon(label) {
  return L.divIcon({
    className: 'map-stop-icon',
    html: `<span>${label}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

/** Photo thumbnail beside a brand pin (landing / discover). */
function photoPinIcon(poi, { highlighted = false } = {}) {
  const photo = poiPhotoUrl(poi);
  const size = highlighted ? 56 : 44;
  const pin = highlighted ? 16 : 12;
  const src = photo ? escapeAttr(photo) : '';
  const name = escapeAttr(poi.name || '');

  const media = photo
    ? `<img class="map-photo-pin__img" src="${src}" alt="${name}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${escapeAttr(samplePlaceCover(poi.category) || '/samples/places/1.jpg')}';" />`
    : `<span class="map-photo-pin__placeholder">◇</span>`;

  return L.divIcon({
    className: `map-photo-pin-wrap${highlighted ? ' is-highlighted' : ''}`,
    html: `<div class="map-photo-pin${photo ? '' : ' is-fallback'}" title="${name}">
      <div class="map-photo-pin__shot">${media}</div>
      <span class="map-photo-pin__dot" aria-hidden="true"></span>
    </div>`,
    iconSize: [size + pin * 0.35, size + 6],
    iconAnchor: [(size + pin * 0.35) / 2, size + 4],
    popupAnchor: [0, -(size / 2)],
  });
}

function FitBounds({ pois }) {
  const map = useMap();

  useEffect(() => {
    if (!pois?.length) {
      map.setView(REGION_CENTER, REGION_ZOOM);
      return;
    }

    if (pois.length === 1) {
      map.setView([pois[0].lat, pois[0].lng], 12);
      return;
    }

    const bounds = L.latLngBounds(pois.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
  }, [map, pois]);

  return null;
}

/** Leaflet often mounts at 0×0 in grid layouts — force a size refresh. */
function InvalidateSize({ deps = [] }) {
  const map = useMap();
  useEffect(() => {
    const id = window.setTimeout(() => {
      map.invalidateSize({ animate: false });
    }, 80);
    const id2 = window.setTimeout(() => {
      map.invalidateSize({ animate: false });
    }, 320);
    return () => {
      window.clearTimeout(id);
      window.clearTimeout(id2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps passed by caller
  }, [map, ...deps]);
  return null;
}

function toCoord(value) {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {object} props
 * @param {boolean} [props.scrollWheelZoom=true]
 * @param {boolean} [props.interactive=true]
 * @param {boolean} [props.photoMarkers=false] - show place photo next to each pin
 * @param {string|null} [props.highlightId] - enlarge one POI pin
 */
export default function MapView({
  pois = [],
  routeStops = null,
  drawRoute,
  height = '420px',
  showPopupLinks = true,
  className = '',
  scrollWheelZoom = true,
  interactive = true,
  photoMarkers = false,
  highlightId = null,
}) {
  const { t } = useLang();

  const validPois = useMemo(
    () =>
      pois
        .map((p) => {
          const lat = toCoord(p?.lat);
          const lng = toCoord(p?.lng);
          if (lat == null || lng == null) return null;
          return { ...p, lat, lng };
        })
        .filter(Boolean),
    [pois]
  );

  const orderedRoute = useMemo(() => {
    const source = routeStops ?? (drawRoute ? validPois : null);
    if (!source) return [];
    return source
      .map((p) => {
        const lat = toCoord(p?.lat);
        const lng = toCoord(p?.lng);
        if (lat == null || lng == null) return null;
        return { ...p, lat, lng };
      })
      .filter(Boolean);
  }, [routeStops, drawRoute, validPois]);

  const shouldDrawRoute = drawRoute ?? orderedRoute.length > 1;
  const fitTargets = orderedRoute.length ? orderedRoute : validPois;
  const useNumberedStops = orderedRoute.length > 0;

  const photoIcons = useMemo(() => {
    if (!photoMarkers || useNumberedStops) return null;
    const map = new Map();
    for (const poi of validPois) {
      map.set(poi.id, photoPinIcon(poi, { highlighted: poi.id === highlightId }));
    }
    return map;
  }, [photoMarkers, useNumberedStops, validPois, highlightId]);

  return (
    <div className={`map-view ${className}`} style={{ height, minHeight: height }}>
      <MapContainer
        center={REGION_CENTER}
        zoom={REGION_ZOOM}
        scrollWheelZoom={interactive && scrollWheelZoom}
        dragging={interactive}
        doubleClickZoom={interactive}
        touchZoom={interactive}
        boxZoom={interactive}
        keyboard={interactive}
        className="map-view__canvas"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <InvalidateSize deps={[height, validPois.length, orderedRoute.length, highlightId]} />
        <FitBounds pois={fitTargets} />

        {shouldDrawRoute && orderedRoute.length > 1 && (
          <Polyline
            positions={orderedRoute.map((p) => [p.lat, p.lng])}
            pathOptions={{
              color: '#003580',
              weight: 4,
              opacity: 0.85,
              dashArray: '8 10',
            }}
          />
        )}

        {useNumberedStops
          ? orderedRoute.map((poi, index) => (
              <Marker
                key={`${poi.id}-${index}`}
                position={[poi.lat, poi.lng]}
                icon={numberedIcon(index + 1)}
              >
                <Popup>
                  <strong>
                    {t('mapStopLabel', { n: index + 1, name: poi.name })}
                  </strong>
                  <br />
                  <span className="map-view__category">
                    {t(categoryLabelKey(poi.category))}
                  </span>
                  {showPopupLinks && (
                    <>
                      <br />
                      <Link to={`/poi/${poi.id}`}>{t('mapViewDetails')}</Link>
                      <br />
                      <Link to={`/poi/${poi.id}#stays`}>{t('mapStaysNearby')}</Link>
                    </>
                  )}
                </Popup>
              </Marker>
            ))
          : validPois.map((poi) => {
              const photo = poiPhotoUrl(poi);
              const icon = photoIcons?.get(poi.id);
              return (
                <Marker
                  key={poi.id}
                  position={[poi.lat, poi.lng]}
                  {...(icon ? { icon } : {})}
                >
                  <Popup>
                    {photo && (
                      <img
                        src={photo}
                        alt=""
                        className="map-view__popup-photo"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <strong>{poi.name}</strong>
                    <br />
                    <span className="map-view__category">
                      {t(categoryLabelKey(poi.category))}
                    </span>
                    {showPopupLinks && (
                      <>
                        <br />
                        <Link to={`/poi/${poi.id}`}>{t('mapViewDetails')}</Link>
                        <br />
                        <Link to={`/poi/${poi.id}#stays`}>{t('mapStaysNearby')}</Link>
                      </>
                    )}
                  </Popup>
                </Marker>
              );
            })}
      </MapContainer>
    </div>
  );
}
