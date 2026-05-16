import 'leaflet/dist/leaflet.css';

import { type RefObject, useMemo, useRef } from 'react';
import { Box } from 'styled-system/jsx';
import { useLeafletMap } from '#/features/plan/hooks/useLeafletMap';
import { useMapInvalidateOnMode } from '#/features/plan/hooks/useMapInvalidateOnMode';
import { useRouteLayers } from '#/features/plan/hooks/useRouteLayers';
import { type PlanMapMode, usePlanFlowStore } from '#/features/plan/store';
import { cleanPlanAddress } from '#/features/plan/utils/helpers';
import type {
  PlanRequest,
  PlanResult,
  PlanStop,
} from '#/shared/plan/contracts';
import { tryResolvePlanCoordinate } from '#/shared/plan/helpers';
import { cx } from '#/styled-system/css';
import { mapChrome } from '#/styled-system/recipes/map-chrome';
import { panel } from '#/styled-system/recipes/panel';
import MapChrome from '../map/MapChrome';
import MapTopBar from '../map/MapTopBar';
import RouteMapEmptyState from '../map/RouteMapEmptyState';

type RouteMapProps = {
  request?: PlanRequest | null;
  result?: PlanResult | null;
  selectedStopId?: string | null;
  revealCount?: number;
  mode?: PlanMapMode;
  onSelectStop?: (id: string) => void;
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
  const { mapRef, leafletRef, mapReady, tilesReady } = useLeafletMap(elRef);

  const visibleStops = useMemo(
    () => getVisibleStops(result, revealCount),
    [result, revealCount],
  );
  const previewGeometry = useMemo(() => getPreviewGeometry(request), [request]);

  useRouteLayers({
    mapRef,
    leafletRef,
    mapReady,
    request,
    result,
    visibleStops,
    previewGeometry,
    selectedStopId,
    onSelectStop,
  });

  useMapInvalidateOnMode(mapRef, mode);

  const isReady = mode === 'ready';
  const chromeClasses = mapChrome({ ready: isReady });
  const mapLabel = getMapLabel(request, result);
  const editPlan = usePlanFlowStore((s) => s.editPlan);

  return (
    <Box
      className={cx(
        panel({ variant: 'map', ready: isReady }),
        chromeClasses.root,
      )}
      aria-label={mapLabel}
      data-map-ready={mapReady ? 'true' : 'false'}
      data-tiles-ready={tilesReady ? 'true' : 'false'}
      role="region"
    >
      <MapViewport
        classes={chromeClasses}
        mapReady={mapReady}
        tilesReady={tilesReady}
        viewportRef={elRef}
      />
      {isReady && result ? (
        <MapTopBar result={result} classes={chromeClasses} onEdit={editPlan} />
      ) : null}
      <MapChrome mode={mode} classes={chromeClasses} />
      {!request && !result ? (
        <RouteMapEmptyState className={chromeClasses.empty} />
      ) : null}
    </Box>
  );
}

type MapChromeClasses = ReturnType<typeof mapChrome>;

function MapViewport({
  classes,
  mapReady,
  tilesReady,
  viewportRef,
}: {
  classes: MapChromeClasses;
  mapReady: boolean;
  tilesReady: boolean;
  viewportRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <>
      <Box
        ref={viewportRef}
        className={classes.viewport}
        data-map-ready={mapReady ? 'true' : 'false'}
      />
      <Box
        aria-hidden="true"
        className={classes.loadingOverlay}
        data-visible={tilesReady ? 'false' : 'true'}
      />
      <Box className={classes.vignette} />
    </>
  );
}

function getVisibleStops(
  result: PlanResult | null | undefined,
  revealCount: number | undefined,
): PlanStop[] {
  if (!result) return [];
  return typeof revealCount === 'number'
    ? result.stops.slice(0, revealCount)
    : result.stops;
}

function getPreviewGeometry(request: PlanRequest | null | undefined) {
  if (!request) return [];
  const fromCoord = tryResolvePlanCoordinate(request.from);
  if (!fromCoord) return [];

  const points = [fromCoord];
  const toCoord = tryResolvePlanCoordinate(request.to);
  if (request.to.full.trim().length > 0 && toCoord) points.push(toCoord);
  return points;
}

function getMapLabel(
  request: PlanRequest | null | undefined,
  result: PlanResult | null | undefined,
) {
  if (result) {
    const from = cleanPlanAddress(result.request.from.full);
    const to = cleanPlanAddress(result.request.to.full);
    return `Route map from ${from} to ${to}`;
  }
  if (request)
    return `Route preview from ${cleanPlanAddress(request.from.full)}`;
  return 'Route preview map';
}
