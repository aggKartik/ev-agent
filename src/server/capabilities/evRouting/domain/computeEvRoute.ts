import type { PlanRequest } from '#/features/plan/contracts';
import { resolvePlanCoordinate } from '#/features/plan/helpers';
import type { Coordinate } from '#/lib/geoTypes';
import { tryTomTomLongDistanceEvRoute } from '../adapters/tomtom/longDistanceEv';
import {
  interpolateStraightLine,
  metersToRouteMiles,
  subsampleCorridor,
  totalPolylineMiles,
} from './geo';
import type {
  EvChargeStopCandidate,
  EvRoutePlan,
  EvRoutePlanSource,
} from './types';

/**
 * EV corridor prefetch: TomTom Long Distance EV Routing only; fallback straight polyline without anchors.
 *
 * Charging waypoints (`chargeRegions` in prompts) flow from LDEV + tools handle POI pairing.
 */
export async function computeEvRoute(
  request: PlanRequest,
  signal?: AbortSignal,
): Promise<EvRoutePlan> {
  const origin = resolvePlanCoordinate(request.from);
  const destination = resolvePlanCoordinate(request.to);

  const tomtom = await tryTomTomLongDistanceEvRoute({
    request,
    origin,
    destination,
    signal,
  });

  let geometry: Coordinate[] = [];
  let distanceMiles = milesBetweenRough(origin, destination);
  let source: EvRoutePlanSource = 'straight_line_fallback';
  let chargeStopCandidates: EvChargeStopCandidate[] = [];

  if (tomtom && tomtom.geometry.length >= 2) {
    geometry = tomtom.geometry;
    distanceMiles =
      tomtom.distanceMeters > 5
        ? metersToRouteMiles(tomtom.distanceMeters)
        : totalPolylineMiles(tomtom.geometry);
    source = 'tomtom_ld_ev';
    chargeStopCandidates = tomtom.chargeAnchors;
  } else {
    geometry = interpolateStraightLine(origin, destination, 32);
    distanceMiles = totalPolylineMiles(geometry);
    source = 'straight_line_fallback';
    chargeStopCandidates = [];
  }

  const corridorForPrompt =
    geometry.length > 480 ? densampleByCount(geometry, 400) : geometry;

  const corridorSample =
    corridorForPrompt.length > 120
      ? subsampleCorridor(corridorForPrompt, 120)
      : corridorForPrompt;

  const summaryParts = [
    `source=${source}`,
    distanceLine(source, distanceMiles),
    `startingSOC=${request.startingSocPercent}% arrivalFloor=${request.targetArrivalSocPercent}%`,
    `pack=${request.batteryCapacityKWh}kWh @ ${request.consumptionWhPerMile}Wh/mi`,
    `chargeAnchors=${chargeStopCandidates.length}`,
    `connectors=${request.connectorTypes.join(',')}`,
  ];

  return {
    source,
    totalDistanceMiles: distanceMiles,
    corridorGeometry: corridorSample,
    chargeStopCandidates,
    summaryText: summaryParts.join(' · '),
  };
}

function distanceLine(
  sourceType: EvRoutePlanSource,
  distanceMiles: number,
): string {
  return `totalDistanceMiles≈${distanceMiles.toFixed(1)} (${sourceType === 'tomtom_ld_ev' ? 'TomTom LDEV' : 'haversine'})`;
}

function milesBetweenRough(a: Coordinate, b: Coordinate): number {
  return totalPolylineMiles([a, b]);
}

/** Uniformly reduce vertices (provider may return ultra-dense polylines). */
function densampleByCount(points: Coordinate[], target: number): Coordinate[] {
  if (points.length <= target) return points;
  const out: Coordinate[] = [];
  const step = (points.length - 1) / (target - 1);
  for (let i = 0; i < target; i += 1) {
    const idx = Math.round(i * step);
    out.push(points[Math.min(idx, points.length - 1)]);
  }
  return out;
}
