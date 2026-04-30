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
import { cx } from '../../../styled-system/css';
import { mapChrome } from '../../../styled-system/recipes/map-chrome';
import { panel } from '../../../styled-system/recipes/panel';

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

const PLAN_COLORS = {
  start: 'var(--colors-peach-400)',
  end: 'var(--colors-magenta-400)',
};

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
        attributionControl: true,
      });
      map.setView([36.7, -120.5], 6);

      leaflet
        .tileLayer(
          'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
          {
            subdomains: 'abcd',
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
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
          color: PLAN_COLORS.end,
          weight: 14,
          opacity: 0.18,
          lineCap: 'round',
          lineJoin: 'round',
          interactive: false,
        })
        .addTo(map);
      layersRef.current.route = leaflet
        .polyline(toLatLngs(points), {
          color: PLAN_COLORS.start,
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
          color: PLAN_COLORS.start,
          iconKey: 'crosshair',
          shortName: 'START',
          name: cleanPlanAddress(request.from.full),
          kind: 'start' as const,
        },
      ];
      if (request.to.full.trim().length > 0) {
        previewMarkers.push({
          coordinate: resolvePlanCoordinate(request.to),
          color: PLAN_COLORS.end,
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

  const isReady = mode === 'ready';
  const chromeClasses = mapChrome({ ready: isReady });
  const mapLabel = result
    ? `Route map from ${cleanPlanAddress(result.request.from.full)} to ${cleanPlanAddress(result.request.to.full)}`
    : request
      ? `Route preview from ${cleanPlanAddress(request.from.full)}`
      : 'Route preview map';

  return (
    <Box
      className={cx(
        panel({ variant: 'map', ready: isReady }),
        chromeClasses.root,
      )}
      aria-label={mapLabel}
      role="region"
    >
      <Box ref={elRef} className={chromeClasses.viewport} />
      <Box className={chromeClasses.vignette} />
      <Box className={chromeClasses.chrome}>
        <Box className={chromeClasses.pill}>
          <Box className={chromeClasses.statusDot} />
          LIVE MAP
        </Box>
        <Box className={chromeClasses.pill}>
          {mode === 'building'
            ? 'ROUTING · LIVE'
            : mode === 'ready'
              ? 'ITINERARY · READY'
              : 'PREVIEW · ROUTE WILL OPTIMIZE'}
        </Box>
      </Box>
      {!request && !result ? (
        <Box className={chromeClasses.empty}>
          SELECT A DESTINATION TO PREVIEW
        </Box>
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
  const color =
    stop.color ?? (stop.kind === 'end' ? PLAN_COLORS.end : PLAN_COLORS.start);
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
  const color = stop.color ?? PLAN_COLORS.start;
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
