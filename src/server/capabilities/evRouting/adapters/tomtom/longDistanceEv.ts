import type { PlanRequest } from '#/features/plan/contracts';
import type { Coordinate } from '#/lib/geoTypes';
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

function truncatePreview(s: string, max = 900): string {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

/**
 * Attempt Long Distance EV Routing; unlike `tryTomTomLongDistanceEvRoute`, preserves why it failed.
 */
export async function tryTomTomLongDistanceEvRouteDetailed(opts: {
  request: PlanRequest;
  origin: Coordinate;
  destination: Coordinate;
  signal?: AbortSignal;
}): Promise<TomTomLdevPrefetchResult> {
  const key = process.env.TOMTOM_API_KEY?.trim();
  if (!key) return { ok: false, reason: 'no_api_key' };

  const { request, origin, destination, signal: userSignal } = opts;

  const timeout = AbortSignal.timeout(FALLBACK_ROUTE_MS);
  const signal = userSignal ? AbortSignal.any([timeout, userSignal]) : timeout;

  const pack = Math.max(request.batteryCapacityKWh, 10);
  const currentInkWh =
    (Math.min(100, Math.max(0, request.startingSocPercent)) / 100) * pack;
  const maxInkWh = pack;
  const minDestInkWh =
    (Math.min(100, Math.max(0, request.targetArrivalSocPercent)) / 100) *
    maxInkWh;
  const criticalMinDest = Math.min(
    minDestInkWh * 0.55,
    Math.max(1.6, maxInkWh * 0.04),
  );

  /** ~5% SOC floor approaching charging stops unless TomTom clamps further. */
  const minChargeStopsInkWh = Math.min(maxInkWh * 0.065, maxInkWh * 0.5);

  const cons = consumptionWhPerMileToInkWhPerHundredKm(
    Math.min(780, Math.max(60, request.consumptionWhPerMile)),
  );
  /** Two speed pairs mimic TomTom sample; tweak highway upward slightly */
  const consHigh =
    Math.round((cons + cons * Math.min((110 - 50) / 85, 0.45)) * 1000) / 1000;
  const pairs = `${50},${round3(cons)}:110,${round3(consHigh)}`;

  const loc = `${qCoord(origin.lat)},${qCoord(origin.lng)}:${qCoord(destination.lat)},${qCoord(destination.lng)}`;

  const qp = new URLSearchParams({
    key,
    vehicleEngineType: 'electric',
    constantSpeedConsumptionInkWhPerHundredkm: pairs,
    currentChargeInkWh: qKwh(currentInkWh),
    maxChargeInkWh: qKwh(maxInkWh),
    minChargeAtDestinationInkWh: qKwh(minDestInkWh),
    criticalMinChargeAtDestinationInkWh: qKwh(criticalMinDest),
    minChargeAtChargingStopsInkWh: qKwh(Math.max(3, minChargeStopsInkWh)),
    routeRepresentation: 'encodedPolyline',
    chargingStopsStrategy: 'automaticFastest',
    traffic: 'false',
  });

  const body = JSON.stringify({
    chargingParameters: {
      batteryCurve: [] as [],
      chargingConnectors: buildTomTomChargingConnectorBlocks(
        request.connectorTypes,
      ),
      chargingTimeOffsetInSec: 90,
    },
  });

  const url = `https://api.tomtom.com/routing/1/calculateLongDistanceEVRoute/${loc}/json?${qp.toString()}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal,
    });
  } catch (e) {
    const msg =
      e instanceof DOMException
        ? `${e.name}: ${e.message}`
        : e instanceof Error
          ? `${e.name}: ${e.message}`
          : String(e);
    return { ok: false, reason: 'fetch_aborted_or_network', fetchError: msg };
  }

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

  let parsed: unknown;
  try {
    parsed = text.length > 0 ? JSON.parse(text) : {};
  } catch {
    return {
      ok: false,
      reason: 'json_parse_error',
      httpStatus: res.status,
      responsePreview: bodyTextForDiag || undefined,
    };
  }

  const data = parsed as TomTomLdevResponse;

  const hasDetailedErr =
    data &&
    typeof data === 'object' &&
    Object.hasOwn(data, 'detailedError') &&
    data.detailedError != null &&
    typeof data.detailedError === 'object';

  const routeExists =
    Array.isArray(data?.routes) &&
    typeof data.routes[0] === 'object' &&
    data.routes[0];

  if (hasDetailedErr && !routeExists) {
    return {
      ok: false,
      reason: 'detailed_route_error',
      parsed: data,
      responsePreview: truncatePreview(JSON.stringify(data)),
    };
  }

  const route =
    Array.isArray(data?.routes) && data.routes.length > 0
      ? data.routes[0]
      : undefined;

  if (!route) {
    return {
      ok: false,
      reason: 'missing_routes_or_empty_geometry',
      parsed: data,
      responsePreview: truncatePreview(JSON.stringify(parsed)),
    };
  }

  const geom = corridorCoordsFromTomTomLegs(route.legs ?? []);

  if (geom.length < 2) {
    return {
      ok: false,
      reason: 'missing_routes_or_empty_geometry',
      parsed: data,
      responsePreview:
        bodyTextForDiag || truncatePreview(JSON.stringify(parsed)),
    };
  }

  let distanceM = route.summary?.lengthInMeters ?? 0;
  if (!(distanceM > 10)) {
    distanceM = (route.legs ?? []).reduce(
      (acc, leg) =>
        typeof leg.summary?.lengthInMeters === 'number'
          ? acc + leg.summary.lengthInMeters
          : acc,
      0,
    );
  }
  if (!(distanceM > 10)) {
    let cum = 0;
    for (let i = 1; i < geom.length; i += 1) {
      cum += horizonMeters(geom[i - 1], geom[i]);
    }
    distanceM = cum;
  }

  const anchors = extractChargeAnchorsFromTomTomLegs(route.legs ?? []);

  return {
    ok: true,
    data: {
      geometry: geom,
      distanceMeters: distanceM,
      chargeAnchors: anchors,
    },
  };
}

export async function tryTomTomLongDistanceEvRoute(opts: {
  request: PlanRequest;
  origin: Coordinate;
  destination: Coordinate;
  signal?: AbortSignal;
}): Promise<TomTomLdevAttempt | null> {
  const r = await tryTomTomLongDistanceEvRouteDetailed(opts);
  return r.ok ? r.data : null;
}

/** Fast small-segment planar distance approximation in meters */
function horizonMeters(a: Coordinate, b: Coordinate): number {
  const latMid = ((a.lat + b.lat) * Math.PI) / 360;
  const dy = ((b.lat - a.lat) * Math.PI * 6_371_000) / 180;
  const dx = (((b.lng - a.lng) * Math.PI * 6_371_000) / 180) * Math.cos(latMid);
  return Math.sqrt(dx * dx + dy * dy);
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
