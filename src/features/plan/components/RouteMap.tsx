import 'leaflet/dist/leaflet.css';

import { useMemo, useRef } from 'react';
import { Box } from 'styled-system/jsx';
import { useLeafletMap } from '#/features/plan/hooks/useLeafletMap';
import { useMapInvalidateOnMode } from '#/features/plan/hooks/useMapInvalidateOnMode';
import { useRouteLayers } from '#/features/plan/hooks/useRouteLayers';
import { type PlanMapMode, usePlanFlowStore } from '#/features/plan/store';
import type { PlanRequest, PlanResult } from '#/features/plan/types/contracts';
import {
  cleanPlanAddress,
  resolvePlanCoordinate,
} from '#/features/plan/utils/helpers';
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
  const { mapRef, leafletRef, mapReady } = useLeafletMap(elRef);

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
  const mapLabel = result
    ? `Route map from ${cleanPlanAddress(result.request.from.full)} to ${cleanPlanAddress(result.request.to.full)}`
    : request
      ? `Route preview from ${cleanPlanAddress(request.from.full)}`
      : 'Route preview map';

  const editPlan = usePlanFlowStore((s) => s.editPlan);

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
