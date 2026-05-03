import type * as Leaflet from 'leaflet';
import { type RefObject, useEffect, useRef } from 'react';
import type {
  Coordinate,
  PlanRequest,
  PlanResult,
  PlanStop,
} from '#/features/plan/contracts';
import {
  cleanPlanAddress,
  resolvePlanCoordinate,
} from '#/features/plan/helpers';
import {
  type LeafletModule,
  makePinIcon,
  makeWaypointIcon,
  PLAN_COLORS,
  toLatLngs,
} from './icons';

type LayerState = {
  route?: Leaflet.Polyline;
  halo?: Leaflet.Polyline;
  markers: Leaflet.Marker[];
};

type UseRouteLayersArgs = {
  mapRef: RefObject<Leaflet.Map | null>;
  leafletRef: RefObject<LeafletModule | null>;
  mapReady: boolean;
  request?: PlanRequest | null;
  result?: PlanResult | null;
  visibleStops: PlanStop[];
  previewGeometry: Coordinate[];
  selectedStopId?: string | null;
  onSelectStop?: (id: string) => void;
};

/**
 * Reconciles the set of polylines + markers on the map with the currently
 * visible stops or preview geometry, and keeps the viewport fitted to them.
 */
export function useRouteLayers({
  mapRef,
  leafletRef,
  mapReady,
  request,
  result,
  visibleStops,
  previewGeometry,
  selectedStopId,
  onSelectStop,
}: UseRouteLayersArgs) {
  const layersRef = useRef<LayerState>({ markers: [] });
  const lastPointsKeyRef = useRef<string>('');

  useEffect(() => {
    const leaflet = leafletRef.current;
    const map = mapRef.current;
    if (!mapReady || !leaflet || !map) return;

    clearLayers(map, layersRef.current);

    const geometryReady = Boolean(result && result.geometry.length >= 2);
    /** Road polyline; falls back to stop-to-stop chords when geometry is missing. */
    const routePolyline: Coordinate[] = result
      ? geometryReady
        ? result.geometry
        : visibleStops.map((stop) => stop.coordinate)
      : previewGeometry;

    /** Bounding set: ride along road plus markers so endpoints stay in view. */
    const viewportFitPoints =
      geometryReady && result
        ? [...result.geometry, ...visibleStops.map((s) => s.coordinate)]
        : routePolyline;

    if (routePolyline.length >= 2) {
      layersRef.current.halo = leaflet
        .polyline(toLatLngs(routePolyline), {
          color: PLAN_COLORS.end,
          weight: 14,
          opacity: 0.18,
          lineCap: 'round',
          lineJoin: 'round',
          interactive: false,
        })
        .addTo(map);
      layersRef.current.route = leaflet
        .polyline(toLatLngs(routePolyline), {
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
      addPreviewMarkers(leaflet, map, request, layersRef.current);
    }

    const pointsKey = viewportFitPoints
      .map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`)
      .join('|');
    if (pointsKey !== lastPointsKeyRef.current) {
      fitViewport(leaflet, map, viewportFitPoints);
      lastPointsKeyRef.current = pointsKey;
    }
  }, [
    leafletRef,
    mapRef,
    mapReady,
    request,
    result,
    visibleStops,
    previewGeometry,
    selectedStopId,
    onSelectStop,
  ]);
}

function clearLayers(map: Leaflet.Map, layers: LayerState) {
  if (layers.route) map.removeLayer(layers.route);
  if (layers.halo) map.removeLayer(layers.halo);
  for (const marker of layers.markers) map.removeLayer(marker);
  layers.route = undefined;
  layers.halo = undefined;
  layers.markers = [];
}

function fitViewport(
  leaflet: LeafletModule,
  map: Leaflet.Map,
  points: Coordinate[],
) {
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
}

function addPreviewMarkers(
  leaflet: LeafletModule,
  map: Leaflet.Map,
  request: PlanRequest,
  layers: LayerState,
) {
  const from = resolvePlanCoordinate(request.from);
  const previewMarkers: Array<
    Pick<PlanStop, 'color' | 'iconKey' | 'kind' | 'name'> & {
      coordinate: Coordinate;
    }
  > = [
    {
      coordinate: from,
      color: PLAN_COLORS.start,
      iconKey: 'crosshair',
      name: cleanPlanAddress(request.from.full),
      kind: 'start',
    },
  ];
  if (request.to.full.trim().length > 0) {
    previewMarkers.push({
      coordinate: resolvePlanCoordinate(request.to),
      color: PLAN_COLORS.end,
      iconKey: 'flag',
      name: cleanPlanAddress(request.to.full),
      kind: 'end',
    });
  }
  for (const marker of previewMarkers) {
    layers.markers.push(
      leaflet
        .marker([marker.coordinate.lat, marker.coordinate.lng], {
          icon: makePinIcon(leaflet, marker),
        })
        .addTo(map),
    );
  }
}
