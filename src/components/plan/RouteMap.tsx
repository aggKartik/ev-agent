import 'leaflet/dist/leaflet.css';

import type * as Leaflet from 'leaflet';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Box } from 'styled-system/jsx';
import type {
  Coordinate,
  PlanRequest,
  PlanResult,
} from '#/features/plan/contracts';
import {
  cleanPlanAddress,
  resolvePlanCoordinate,
} from '#/features/plan/helpers';
import { css } from '../../../styled-system/css';

type LeafletModule = typeof import('leaflet');

type RouteMapProps = {
  request?: PlanRequest | null;
  result?: PlanResult | null;
  selectedStopId?: string | null;
  revealCount?: number;
  mode?: 'preview' | 'building' | 'ready';
  onSelectStop?: (id: string) => void;
};

type LayerState = {
  route?: Leaflet.Polyline;
  halo?: Leaflet.Polyline;
  markers: Leaflet.Marker[];
};

const mapWrapClass = css({
  position: 'relative',
  width: 'full',
  height: 'full',
  minHeight: { base: '420px', lg: '500px' },
  borderRadius: '20px',
  overflow: 'hidden',
  borderWidth: '1px',
  borderColor: 'alpha.cream.18',
  background: 'night.500',
  boxShadow: '0 24px 80px -35px rgba(0, 0, 0, 0.8)',
  '&[data-mode=ready]': {
    minHeight: 'full',
    borderRadius: { base: '20px', lg: '0' },
    borderWidth: { lg: '0' },
    boxShadow: { lg: 'none' },
  },
  '& .leaflet-container': {
    background: '#0f0a24',
    fontFamily: 'inherit',
  },
  '& .evagent-tiles': {
    filter: 'hue-rotate(-12deg) saturate(1.1) contrast(1.05) brightness(0.82)',
  },
  '& .evagent-labels': {
    filter: 'hue-rotate(-12deg) saturate(0.4) brightness(1.1)',
    mixBlendMode: 'screen',
  },
  '& .evagent-pin, & .evagent-wp': {
    background: 'transparent',
    border: 'none',
  },
  '& .pin-halo, & .wp-halo': {
    position: 'absolute',
    top: '-16px',
    left: '-16px',
    width: '72px',
    height: '72px',
    borderRadius: 'full',
    background:
      'radial-gradient(circle, color-mix(in srgb, var(--c) 40%, transparent), transparent 70%)',
    opacity: 0.85,
    animation: 'wpPulse 2.4s ease-in-out infinite',
  },
  '& .pin-core, & .wp-dot': {
    position: 'absolute',
    top: '4px',
    left: '4px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '999px',
    color: 'var(--c)',
    background: 'rgba(15, 10, 36, 0.9)',
    border: '3px solid var(--c)',
    boxShadow: '0 0 18px color-mix(in srgb, var(--c) 45%, transparent)',
  },
  '& .wp-halo': {
    top: '-10px',
    left: '-10px',
    width: '56px',
    height: '56px',
    opacity: 0,
    animation: 'none',
  },
  '& .wp-dot': {
    top: '5px',
    left: '5px',
    width: '26px',
    height: '26px',
    borderWidth: '2px',
  },
  '& .pin-label, & .wp-label': {
    position: 'absolute',
    left: '50%',
    top: '38px',
    transform: 'translateX(-50%)',
    whiteSpace: 'nowrap',
    color: 'var(--c)',
    padding: 0,
    fontSize: '9px',
    lineHeight: '1.6',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    textAlign: 'center',
    textShadow: '0 0 8px #0f0a24, 0 0 3px #0f0a24',
    pointerEvents: 'none',
  },
  '& .pin-label b': {
    display: 'block',
    fontFamily: 'display',
    fontSize: '12px',
    color: 'cream.200',
    letterSpacing: 0,
    fontWeight: 600,
    marginTop: '2px',
  },
  '& .wp-label': {
    top: '34px',
    color: 'cream.200',
    letterSpacing: '0.14em',
    opacity: 0.72,
  },
  '& .wp-dot.sel, & .pin-core.end': {
    background: 'rgba(245, 234, 208, 0.92)',
    color: '#0f0a24',
  },
  '& .wp-halo.sel': {
    opacity: 0.35,
    animation: 'wpPulse 2s ease-in-out infinite',
  },
  '& .evagent-route': {
    strokeDasharray: 2000,
    strokeDashoffset: 2000,
    animation: 'routeDraw 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
    filter: 'drop-shadow(0 0 6px rgba(255, 149, 102, 0.7))',
  },
});

const mapElClass = css({
  position: 'absolute',
  inset: 0,
  zIndex: 0,
});

const chromeClass = css({
  position: 'absolute',
  zIndex: 2,
  top: '14px',
  left: '14px',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1.5',
  pointerEvents: 'none',
  '&[data-mode=ready]': {
    display: 'none',
  },
});

const pillClass = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1.5',
  px: '2.5',
  py: '1.5',
  borderRadius: 'full',
  borderWidth: '1px',
  borderColor: 'alpha.cream.14',
  background: 'rgba(15, 10, 36, 0.72)',
  color: 'cream.200',
  textStyle: 'mono-meta',
  fontSize: '9px',
  letterSpacing: '0.22em',
  backdropFilter: 'blur(10px)',
});

const statusDotClass = css({
  width: '6px',
  height: '6px',
  borderRadius: 'full',
  background: 'lime.300',
  boxShadow: '0 0 10px {colors.lime.300}',
});

const vignetteClass = css({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 1,
  background:
    'radial-gradient(circle at 20% 15%, rgba(255,149,102,0.18), transparent 30%), linear-gradient(180deg, rgba(15,10,36,0.12), rgba(15,10,36,0.38))',
});

const emptyClass = css({
  position: 'absolute',
  inset: 0,
  zIndex: 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'cream.600',
  textStyle: 'mono-meta',
  letterSpacing: '0.18em',
  pointerEvents: 'none',
});

const iconSvg = {
  bolt: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3 5 13h6l-1 8 9-11h-6l1-7Z"/></svg>',
  crosshair:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
  flag: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4"/><path d="M5 4h10l-1.5 3L15 10H5Z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>',
};

export default function RouteMap({
  request,
  result,
  selectedStopId,
  revealCount,
  mode = 'preview',
  onSelectStop,
}: RouteMapProps) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const layersRef = useRef<LayerState>({ markers: [] });
  const [mapReady, setMapReady] = useState(false);

  const visibleStops = useMemo(() => {
    if (!result) return [];
    return typeof revealCount === 'number'
      ? result.stops.slice(0, revealCount)
      : result.stops;
  }, [result, revealCount]);

  const previewGeometry = useMemo(() => {
    if (!request) return [];
    const points = [resolvePlanCoordinate(request.from)];
    if (request.to.full.trim().length > 0) {
      points.push(resolvePlanCoordinate(request.to));
    }
    return points;
  }, [request]);

  useEffect(() => {
    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;
    let resizeHandler: (() => void) | null = null;

    async function mountMap() {
      if (!elRef.current || mapRef.current) return;
      const leaflet = await import('leaflet');
      if (disposed || !elRef.current) return;

      leafletRef.current = leaflet;
      const map = leaflet.map(elRef.current, {
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true,
      });
      map.setView([36.7, -120.5], 6);

      leaflet
        .tileLayer(
          'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
          {
            subdomains: 'abcd',
            maxZoom: 19,
            attribution: 'OpenStreetMap, CARTO',
            className: 'evagent-tiles',
          },
        )
        .addTo(map);
      leaflet
        .tileLayer(
          'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
          {
            subdomains: 'abcd',
            maxZoom: 19,
            opacity: 0.65,
            className: 'evagent-labels',
          },
        )
        .addTo(map);

      leaflet.control.zoom({ position: 'bottomright' }).addTo(map);
      mapRef.current = map;

      const invalidate = () => map.invalidateSize();
      resizeHandler = invalidate;
      resizeObserver = new ResizeObserver(invalidate);
      resizeObserver.observe(elRef.current);
      window.addEventListener('resize', invalidate);
      for (const delay of [60, 200, 500, 1000]) {
        window.setTimeout(invalidate, delay);
      }
      setMapReady(true);
    }

    void mountMap();

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      mapRef.current?.remove();
      mapRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    const leaflet = leafletRef.current;
    const map = mapRef.current;
    if (!mapReady || !leaflet || !map) return;

    clearLayers(map, layersRef.current);
    const points = result
      ? visibleStops.map((stop) => stop.coordinate)
      : previewGeometry;

    if (points.length >= 2) {
      layersRef.current.halo = leaflet
        .polyline(toLatLngs(points), {
          color: '#e94a8c',
          weight: 14,
          opacity: 0.18,
          lineCap: 'round',
          lineJoin: 'round',
          interactive: false,
        })
        .addTo(map);
      layersRef.current.route = leaflet
        .polyline(toLatLngs(points), {
          color: '#ff9566',
          weight: 4,
          opacity: 1,
          lineCap: 'round',
          lineJoin: 'round',
          className: 'evagent-route',
          interactive: false,
        })
        .addTo(map);
    }

    if (result) {
      for (const stop of visibleStops) {
        const isEndpoint = stop.kind === 'start' || stop.kind === 'end';
        const marker = leaflet
          .marker([stop.coordinate.lat, stop.coordinate.lng], {
            icon: isEndpoint
              ? makePinIcon(leaflet, stop)
              : makeWaypointIcon(leaflet, stop, selectedStopId === stop.id),
          })
          .addTo(map);
        marker.on('click', () => onSelectStop?.(stop.id));
        layersRef.current.markers.push(marker);
      }
    } else if (request) {
      const from = resolvePlanCoordinate(request.from);
      const previewMarkers = [
        {
          coordinate: from,
          color: '#ff9566',
          iconKey: 'crosshair',
          shortName: 'START',
          name: cleanPlanAddress(request.from.full),
          kind: 'start' as const,
        },
      ];
      if (request.to.full.trim().length > 0) {
        previewMarkers.push({
          coordinate: resolvePlanCoordinate(request.to),
          color: '#e94a8c',
          iconKey: 'flag',
          shortName: 'DESTINATION',
          name: cleanPlanAddress(request.to.full),
          kind: 'end' as const,
        });
      }
      for (const marker of previewMarkers) {
        layersRef.current.markers.push(
          leaflet
            .marker([marker.coordinate.lat, marker.coordinate.lng], {
              icon: makePinIcon(leaflet, {
                ...marker,
                id: marker.kind,
                driveMinutes: 0,
                miles: 0,
                dwellMinutes: 0,
                arrivalTime: '',
              }),
            })
            .addTo(map),
        );
      }
    }

    if (points.length >= 2) {
      map.fitBounds(leaflet.latLngBounds(toLatLngs(points)), {
        padding: [80, 80],
        maxZoom: 10,
        animate: true,
      });
    } else if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 9, { animate: true });
    } else {
      map.setView([36.7, -120.5], 6);
    }
  }, [
    request,
    result,
    selectedStopId,
    visibleStops,
    previewGeometry,
    onSelectStop,
    mapReady,
  ]);

  useEffect(() => {
    if (!mode) return undefined;
    const timeout = window.setTimeout(
      () => mapRef.current?.invalidateSize(),
      240,
    );
    return () => window.clearTimeout(timeout);
  }, [mode]);

  return (
    <Box className={mapWrapClass} data-mode={mode}>
      <Box ref={elRef} className={mapElClass} />
      <Box className={vignetteClass} />
      <Box className={chromeClass} data-mode={mode}>
        <Box className={pillClass}>
          <Box className={statusDotClass} />
          LIVE MAP
        </Box>
        <Box className={pillClass}>
          {mode === 'building'
            ? 'ROUTING · LIVE'
            : mode === 'ready'
              ? 'ITINERARY · READY'
              : 'PREVIEW · ROUTE WILL OPTIMIZE'}
        </Box>
      </Box>
      {!request && !result ? (
        <Box className={emptyClass}>SELECT A DESTINATION TO PREVIEW</Box>
      ) : null}
    </Box>
  );
}

function clearLayers(map: Leaflet.Map, layers: LayerState) {
  if (layers.route) map.removeLayer(layers.route);
  if (layers.halo) map.removeLayer(layers.halo);
  for (const marker of layers.markers) map.removeLayer(marker);
  layers.route = undefined;
  layers.halo = undefined;
  layers.markers = [];
}

function toLatLngs(points: Coordinate[]): Leaflet.LatLngTuple[] {
  return points.map((point) => [point.lat, point.lng]);
}

function makePinIcon(
  leaflet: LeafletModule,
  stop: Pick<
    PlanResult['stops'][number],
    'color' | 'iconKey' | 'kind' | 'name'
  >,
) {
  const color = stop.color ?? (stop.kind === 'end' ? '#e94a8c' : '#ff9566');
  return leaflet.divIcon({
    className: 'evagent-pin',
    html: `<div class="pin-halo" style="--c:${color}"></div><div class="pin-core ${stop.kind}" style="--c:${color}">${iconSvg[stop.iconKey as keyof typeof iconSvg] ?? iconSvg.pin}</div><div class="pin-label">${stop.kind === 'end' ? 'DESTINATION' : 'START'}<br/><b>${escapeHtml(stop.name)}</b></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function makeWaypointIcon(
  leaflet: LeafletModule,
  stop: PlanResult['stops'][number],
  selected: boolean,
) {
  const color = stop.color ?? '#ff9566';
  return leaflet.divIcon({
    className: 'evagent-wp',
    html: `<div class="wp-halo${selected ? ' sel' : ''}" style="--c:${color}"></div><div class="wp-dot${selected ? ' sel' : ''}" style="--c:${color}">${iconSvg[stop.iconKey as keyof typeof iconSvg] ?? iconSvg.pin}</div><div class="wp-label">${escapeHtml(stop.shortName)}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char] ?? char,
  );
}
