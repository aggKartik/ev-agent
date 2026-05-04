import { env } from '#/lib/env';
import type { Coordinate } from '#/lib/geoTypes';
import type { PlanRequest } from '#/shared/plan/contracts';
import type { EvChargeStopCandidate } from '../../domain/types';
import {
  buildTomTomChargingConnectorBlocks,
  consumptionWhPerMileToInkWhPerHundredKm,
} from './chargingParams';
import {
  corridorCoordsFromTomTomLegs,
  extractChargeAnchorsFromTomTomLegs,
  type TomTomLeg,
} from './legs';

/** Optional extra timeout when caller signal has no bounded deadline */
const FALLBACK_ROUTE_MS = 18_000;

type TomTomRoute = {
  summary?: {
    lengthInMeters?: number;
  };
  legs?: TomTomLeg[];
};

type TomTomLdevResponse =
  | {
      routes?: TomTomRoute[];
      detailedError?: { code?: string; message?: string };
    }
  | undefined;

export type TomTomLdevAttempt = {
  geometry: Coordinate[];
  distanceMeters: number;
  chargeAnchors: EvChargeStopCandidate[];
};

/** Non-throwing LDEV outcome for logging / smoke diagnostics. */
export type TomTomLdevPrefetchResult =
  | { ok: true; data: TomTomLdevAttempt }
  | {
      ok: false;
      reason:
        | 'no_api_key'
        | 'fetch_aborted_or_network'
        | 'http_error'
        | 'json_parse_error'
        | 'detailed_route_error'
        | 'missing_routes_or_empty_geometry';
      /** HTTP status when `reason` is `http_error`; may be set when TomTom embeds failures in JSON. */
      httpStatus?: number;
      /** First ~900 chars of response body text (truncated); never contains full API key. */
      responsePreview?: string;
      parsed?: TomTomLdevResponse;
      fetchError?: string;
    };

type LdevRequestOpts = {
  request: PlanRequest;
  origin: Coordinate;
  destination: Coordinate;
  signal?: AbortSignal;
};

function truncatePreview(s: string, max = 900): string {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function clampPercent(p: number): number {
  return Math.min(100, Math.max(0, p));
}

/** Pure energy/charging math derived from the plan request. */
function energyParamsFromRequest(request: PlanRequest) {
  const pack = Math.max(request.batteryCapacityKWh, 10);
  const currentInkWh = (clampPercent(request.startingSocPercent) / 100) * pack;
  const maxInkWh = pack;
  const minDestInkWh =
    (clampPercent(request.targetArrivalSocPercent) / 100) * maxInkWh;
  const criticalMinDest = Math.min(
    minDestInkWh * 0.55,
    Math.max(1.6, maxInkWh * 0.04),
  );
  /** ~5% SOC floor approaching charging stops unless TomTom clamps further. */
  const minChargeStopsInkWh = Math.min(maxInkWh * 0.065, maxInkWh * 0.5);
  return {
    currentInkWh,
    maxInkWh,
    minDestInkWh,
    criticalMinDest,
    minChargeStopsInkWh,
  };
}

function buildConsumptionPairs(consumptionWhPerMile: number): string {
  const cons = consumptionWhPerMileToInkWhPerHundredKm(
    Math.min(780, Math.max(60, consumptionWhPerMile)),
  );
  /** Two speed pairs mimic TomTom sample; tweak highway upward slightly */
  const consHigh =
    Math.round((cons + cons * Math.min((110 - 50) / 85, 0.45)) * 1000) / 1000;
  return `${50},${round3(cons)}:110,${round3(consHigh)}`;
}

function buildLdevRequestUrl(
  apiKey: string,
  request: PlanRequest,
  origin: Coordinate,
  destination: Coordinate,
): string {
  const energy = energyParamsFromRequest(request);
  const pairs = buildConsumptionPairs(request.consumptionWhPerMile);
  const loc = `${qCoord(origin.lat)},${qCoord(origin.lng)}:${qCoord(destination.lat)},${qCoord(destination.lng)}`;
  const qp = new URLSearchParams({
    key: apiKey,
    vehicleEngineType: 'electric',
    constantSpeedConsumptionInkWhPerHundredkm: pairs,
    currentChargeInkWh: qKwh(energy.currentInkWh),
    maxChargeInkWh: qKwh(energy.maxInkWh),
    minChargeAtDestinationInkWh: qKwh(energy.minDestInkWh),
    criticalMinChargeAtDestinationInkWh: qKwh(energy.criticalMinDest),
    minChargeAtChargingStopsInkWh: qKwh(
      Math.max(3, energy.minChargeStopsInkWh),
    ),
    routeRepresentation: 'encodedPolyline',
    chargingStopsStrategy: 'automaticFastest',
    traffic: 'false',
  });
  return `https://api.tomtom.com/routing/1/calculateLongDistanceEVRoute/${loc}/json?${qp.toString()}`;
}

function buildLdevRequestBody(request: PlanRequest): string {
  return JSON.stringify({
    chargingParameters: {
      batteryCurve: [] as [],
      chargingConnectors: buildTomTomChargingConnectorBlocks(
        request.connectorTypes,
      ),
      chargingTimeOffsetInSec: 90,
    },
  });
}

function combineSignals(userSignal?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(FALLBACK_ROUTE_MS);
  return userSignal ? AbortSignal.any([timeout, userSignal]) : timeout;
}

function describeFetchError(e: unknown): string {
  if (e instanceof DOMException || e instanceof Error) {
    return `${e.name}: ${e.message}`;
  }
  return String(e);
}

async function fetchLdev(
  url: string,
  body: string,
  signal: AbortSignal,
): Promise<{ res: Response } | TomTomLdevPrefetchResult> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal,
    });
    return { res };
  } catch (e) {
    return {
      ok: false,
      reason: 'fetch_aborted_or_network',
      fetchError: describeFetchError(e),
    };
  }
}

function parseLdevBody(
  text: string,
): { parsed: TomTomLdevResponse } | { error: 'json_parse_error' } {
  try {
    const parsed = (
      text.length > 0 ? JSON.parse(text) : {}
    ) as TomTomLdevResponse;
    return { parsed };
  } catch {
    return { error: 'json_parse_error' };
  }
}

function hasDetailedError(data: TomTomLdevResponse): boolean {
  return Boolean(
    data &&
      typeof data === 'object' &&
      Object.hasOwn(data, 'detailedError') &&
      data.detailedError != null &&
      typeof data.detailedError === 'object',
  );
}

function firstRoute(data: TomTomLdevResponse): TomTomRoute | undefined {
  if (!Array.isArray(data?.routes) || data.routes.length === 0)
    return undefined;
  const r = data.routes[0];
  return typeof r === 'object' && r !== null ? r : undefined;
}

function planarMeters(a: Coordinate, b: Coordinate): number {
  const latMid = ((a.lat + b.lat) * Math.PI) / 360;
  const dy = ((b.lat - a.lat) * Math.PI * 6_371_000) / 180;
  const dx = (((b.lng - a.lng) * Math.PI * 6_371_000) / 180) * Math.cos(latMid);
  return Math.sqrt(dx * dx + dy * dy);
}

function distanceFromGeometry(geom: Coordinate[]): number {
  let cum = 0;
  for (let i = 1; i < geom.length; i += 1)
    cum += planarMeters(geom[i - 1], geom[i]);
  return cum;
}

function distanceFromLegs(legs: TomTomLeg[]): number {
  return legs.reduce(
    (acc, leg) =>
      typeof leg.summary?.lengthInMeters === 'number'
        ? acc + leg.summary.lengthInMeters
        : acc,
    0,
  );
}

function resolveDistanceMeters(route: TomTomRoute, geom: Coordinate[]): number {
  const summaryDist = route.summary?.lengthInMeters ?? 0;
  if (summaryDist > 10) return summaryDist;
  const legsDist = distanceFromLegs(route.legs ?? []);
  if (legsDist > 10) return legsDist;
  return distanceFromGeometry(geom);
}

function buildAttempt(
  data: TomTomLdevResponse,
  bodyTextForDiag: string,
): TomTomLdevPrefetchResult {
  const route = firstRoute(data);
  if (!route) {
    return {
      ok: false,
      reason: 'missing_routes_or_empty_geometry',
      parsed: data,
      responsePreview: truncatePreview(JSON.stringify(data)),
    };
  }
  const geom = corridorCoordsFromTomTomLegs(route.legs ?? []);
  if (geom.length < 2) {
    return {
      ok: false,
      reason: 'missing_routes_or_empty_geometry',
      parsed: data,
      responsePreview: bodyTextForDiag || truncatePreview(JSON.stringify(data)),
    };
  }
  return {
    ok: true,
    data: {
      geometry: geom,
      distanceMeters: resolveDistanceMeters(route, geom),
      chargeAnchors: extractChargeAnchorsFromTomTomLegs(route.legs ?? []),
    },
  };
}

/**
 * Attempt Long Distance EV Routing; unlike `tryTomTomLongDistanceEvRoute`, preserves why it failed.
 */
export async function tryTomTomLongDistanceEvRouteDetailed(
  opts: LdevRequestOpts,
): Promise<TomTomLdevPrefetchResult> {
  const key = env.TOMTOM_API_KEY.trim();
  if (!key) return { ok: false, reason: 'no_api_key' };

  const { request, origin, destination, signal: userSignal } = opts;
  const url = buildLdevRequestUrl(key, request, origin, destination);
  const body = buildLdevRequestBody(request);
  const signal = combineSignals(userSignal);

  const fetched = await fetchLdev(url, body, signal);
  if ('ok' in fetched) return fetched;
  const { res } = fetched;

  const text = await res.text();
  const bodyTextForDiag = truncatePreview(text);

  if (!res.ok) {
    return {
      ok: false,
      reason: 'http_error',
      httpStatus: res.status,
      responsePreview: bodyTextForDiag || undefined,
    };
  }

  const parsedResult = parseLdevBody(text);
  if ('error' in parsedResult) {
    return {
      ok: false,
      reason: 'json_parse_error',
      httpStatus: res.status,
      responsePreview: bodyTextForDiag || undefined,
    };
  }

  const data = parsedResult.parsed;
  if (hasDetailedError(data) && !firstRoute(data)) {
    return {
      ok: false,
      reason: 'detailed_route_error',
      parsed: data,
      responsePreview: truncatePreview(JSON.stringify(data)),
    };
  }

  return buildAttempt(data, bodyTextForDiag);
}

export async function tryTomTomLongDistanceEvRoute(
  opts: LdevRequestOpts,
): Promise<TomTomLdevAttempt | null> {
  const r = await tryTomTomLongDistanceEvRouteDetailed(opts);
  return r.ok ? r.data : null;
}

function qCoord(n: number): string {
  if (!Number.isFinite(n)) return '0';
  return String(Number(n.toFixed(6)));
}

function qKwh(n: number): string {
  if (!Number.isFinite(n)) return '0';
  return String(Number(n.toPrecision(12)));
}

function round3(x: number): number {
  return Math.round(Math.min(520, Math.max(4, x)) * 1000) / 1000;
}
