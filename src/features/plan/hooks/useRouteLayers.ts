import type * as Leaflet from 'leaflet';
import { type RefObject, useEffect, useRef } from 'react';
import {
  type LeafletModule,
  makePinIcon,
  makeWaypointIcon,
  PLAN_COLORS,
  toLatLngs,
} from '#/features/plan/map/icons';
import { cleanPlanAddress } from '#/features/plan/utils/helpers';
import type {
  Coordinate,
  PlanRequest,
  PlanResult,
  PlanStop,
} from '#/shared/plan/contracts';
import { tryResolvePlanCoordinate } from '#/shared/plan/helpers';

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

    const { polyline, fitPoints } = pickRouteGeometry({
      result,
      visibleStops,
      previewGeometry,
    });

    drawRoutePolyline(leaflet, map, polyline, layersRef.current);
    drawMarkers({
      leaflet,
      map,
      result,
      request,
      visibleStops,
      selectedStopId,
      onSelectStop,
      layers: layersRef.current,
    });
    maybeFitViewport(leaflet, map, fitPoints, lastPointsKeyRef);
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

/** Decide which polyline to draw and which points the viewport should fit. */
function pickRouteGeometry(args: {
  result: PlanResult | null | undefined;
  visibleStops: PlanStop[];
  previewGeometry: Coordinate[];
}): { polyline: Coordinate[]; fitPoints: Coordinate[] } {
  const { result, visibleStops, previewGeometry } = args;
  if (!result) {
    return { polyline: previewGeometry, fitPoints: previewGeometry };
  }
  const stopCoords = visibleStops.map((s) => s.coordinate);
  if (result.geometry.length >= 2) {
    return {
      polyline: result.geometry,
      fitPoints: [...result.geometry, ...stopCoords],
    };
  }
  return { polyline: stopCoords, fitPoints: stopCoords };
}

function drawRoutePolyline(
  leaflet: LeafletModule,
  map: Leaflet.Map,
  routePolyline: Coordinate[],
  layers: LayerState,
) {
  if (routePolyline.length < 2) return;
  layers.halo = leaflet
    .polyline(toLatLngs(routePolyline), {
      color: PLAN_COLORS.end,
      weight: 14,
      opacity: 0.18,
      lineCap: 'round',
      lineJoin: 'round',
      interactive: false,
    })
    .addTo(map);
  layers.route = leaflet
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

function drawMarkers(args: {
  leaflet: LeafletModule;
  map: Leaflet.Map;
  result: PlanResult | null | undefined;
  request: PlanRequest | null | undefined;
  visibleStops: PlanStop[];
  selectedStopId: string | null | undefined;
  onSelectStop?: (id: string) => void;
  layers: LayerState;
}) {
  const {
    leaflet,
    map,
    result,
    request,
    visibleStops,
    selectedStopId,
    onSelectStop,
    layers,
  } = args;
  if (result) {
    for (const stop of visibleStops) {
      addStopMarker(leaflet, map, stop, selectedStopId, onSelectStop, layers);
    }
    return;
  }
  if (request) addPreviewMarkers(leaflet, map, request, layers);
}

function addStopMarker(
  leaflet: LeafletModule,
  map: Leaflet.Map,
  stop: PlanStop,
  selectedStopId: string | null | undefined,
  onSelectStop: ((id: string) => void) | undefined,
  layers: LayerState,
) {
  const isEndpoint = stop.kind === 'start' || stop.kind === 'end';
  const marker = leaflet
    .marker([stop.coordinate.lat, stop.coordinate.lng], {
      icon: isEndpoint
        ? makePinIcon(leaflet, stop)
        : makeWaypointIcon(leaflet, stop, selectedStopId === stop.id),
    })
    .addTo(map);
  marker.on('click', () => onSelectStop?.(stop.id));
  layers.markers.push(marker);
}

function maybeFitViewport(
  leaflet: LeafletModule,
  map: Leaflet.Map,
  points: Coordinate[],
  lastKeyRef: { current: string },
) {
  const key = points
    .map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`)
    .join('|');
  if (key === lastKeyRef.current) return;
  fitViewport(leaflet, map, points);
  lastKeyRef.current = key;
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
  const from = tryResolvePlanCoordinate(request.from);
  if (!from) return;
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
  const to = tryResolvePlanCoordinate(request.to);
  if (request.to.full.trim().length > 0 && to) {
    previewMarkers.push({
      coordinate: to,
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
