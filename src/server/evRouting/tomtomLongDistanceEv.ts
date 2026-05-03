import type { Coordinate, PlanRequest } from '#/features/plan/contracts';
import { decodeGoogleEncodedPolyline } from '#/server/evRouting/decodePolyline';
import type { EvChargeStopCandidate } from '#/server/evRouting/types';

/** kWh consumed per 100 km from average traction Wh/mile (steady-state approximation). */
export function consumptionWhPerMileToInkWhPerHundredKm(
  whPerMile: number,
): number {
  return (whPerMile * 100) / (1.609_344 * 1000);
}

type ConnectorSlug = PlanRequest['connectorTypes'][number];

type TomTomPlugType = string;

/** Map planner connector slug → TomTom `plugTypes` literals (subset of official docs). */
export function connectorSlugsToTomTomDcPlugTypes(
  slugs: ConnectorSlug[],
): TomTomPlugType[] {
  const set = new Set<TomTomPlugType>();

  const addMaybe = (
    slug: ConnectorSlug,
    plugs: readonly TomTomPlugType[],
  ): void => {
    if (!slugs.includes(slug)) return;
    for (const p of plugs) set.add(p);
  };

  addMaybe('NACS', [
    'Tesla_Connector',
    'IEC_62196_Type_2_Connector_Cable_Attached',
  ]);
  addMaybe('CCS1', [
    'Combo_to_IEC_62196_Type_1_Base',
    'IEC_62196_Type_1_Connector_Cable_Attached',
  ]);
  addMaybe('J1772', ['SAE_J1772']);
  addMaybe('TYPE_2', [
    'IEC_62196_Type_2_Outlet',
    'IEC_62196_Type_2_Connector_Cable_Attached',
    'Combo_to_IEC_62196_Type_2_Base',
  ]);
  addMaybe('CHADEMO', ['CHAdeMO']);

  /* Default if unknown mapping edge case */
  if (set.size === 0) {
    set.add('Combo_to_IEC_62196_Type_1_Base').add('Tesla_Connector');
  }

  return [...set];
}

/**
 * Charging connector model for POST `chargingParameters` (DC-focused; adds Type-1/J1772 AC when selected).
 */
export function buildTomTomChargingConnectorBlocks(
  slugs: ConnectorSlug[],
): object[] {
  const dcPlugTypes = connectorSlugsToTomTomDcPlugTypes(slugs);
  const connectors: object[] = [];

  const wantsAc = slugs.includes('J1772') || slugs.includes('TYPE_2');

  if (wantsAc) {
    const acPlugs: TomTomPlugType[] = [];
    if (slugs.includes('TYPE_2')) {
      acPlugs.push(
        'IEC_62196_Type_2_Outlet',
        'IEC_62196_Type_2_Connector_Cable_Attached',
        'Combo_to_IEC_62196_Type_2_Base',
      );
    }
    if (slugs.includes('J1772') || slugs.includes('CCS1')) {
      acPlugs.push('SAE_J1772');
    }
    if (acPlugs.length === 0) {
      acPlugs.push(
        'IEC_62196_Type_2_Outlet',
        'IEC_62196_Type_2_Connector_Cable_Attached',
      );
    }

    connectors.push({
      currentType: 'AC3',
      plugTypes: [...new Set(acPlugs)],
      efficiency: 0.92,
      maxPowerInkW: 11,
    });
  }

  connectors.push({
    currentType: 'DC',
    plugTypes: [...new Set(dcPlugTypes)],
    voltageRange: { minVoltageInV: 0, maxVoltageInV: 500 },
    efficiency: 0.92,
    maxPowerInkW: 250,
  });
  connectors.push({
    currentType: 'DC',
    plugTypes: [...new Set(dcPlugTypes)],
    voltageRange: { minVoltageInV: 500, maxVoltageInV: 2000 },
    efficiency: 0.92,
    baseLoadInkW: 0.3,
    maxPowerInkW: 0,
  });

  return connectors;
}

/** Optional extra timeout when caller signal has no bounded deadline */
const FALLBACK_ROUTE_MS = 18_000;

type TomTomPoint = { latitude?: number; longitude?: number };

function isPoint(o: unknown): o is TomTomPoint {
  if (!o || typeof o !== 'object') return false;
  const p = o as TomTomPoint;
  return typeof p.latitude === 'number' && typeof p.longitude === 'number';
}

function pointToCoord(p: TomTomPoint): Coordinate {
  return { lat: p.latitude ?? 0, lng: p.longitude ?? 0 };
}

type ChargingInfoLeg = {
  chargingTimeInSeconds?: number;
  chargingParkUuid?: string;
  chargingParkName?: string;
  chargingParkLocation?: {
    coordinate?: TomTomPoint;
  };
};

export type TomTomLeg = {
  summary?: {
    chargingInformationAtEndOfLeg?: ChargingInfoLeg;
    lengthInMeters?: number;
    encodedPolyline?: string;
    encodedPolylinePrecision?: number;
  };
  /** TomTom LDEV commonly places polyline here (same as Routing API), not always under `summary`. */
  encodedPolyline?: string;
  encodedPolylinePrecision?: number;
  points?: TomTomPoint[];
};

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

/** Concatenate decoded coordinates from LDEV routing legs into one corridor. */
export function corridorCoordsFromTomTomLegs(legs: TomTomLeg[]): Coordinate[] {
  const geom: Coordinate[] = [];
  for (const leg of legs) appendTomTomLegGeometry(geom, leg);
  return geom;
}

/** Decode leg geometry: encoded polyline (summary or leg root), else point list. */
function appendTomTomLegGeometry(points: Coordinate[], leg: TomTomLeg): void {
  const enc = leg.summary?.encodedPolyline ?? leg.encodedPolyline;
  const precRaw =
    leg.summary?.encodedPolylinePrecision ?? leg.encodedPolylinePrecision;
  if (typeof enc === 'string' && enc.length >= 2) {
    /** TomTom Routing/LDEV: omission means `coordinatePrecision=default` → polyline divisor 10^5. */
    const prec =
      typeof precRaw === 'number' && precRaw >= 4 && precRaw <= 10
        ? precRaw
        : 5;
    const decoded = decodeGoogleEncodedPolyline(enc, prec);
    for (const pt of decoded) appendPoint(points, pt);
    return;
  }
  const raw = leg.points;
  if (Array.isArray(raw)) {
    for (const p of raw) {
      if (isPoint(p)) appendPoint(points, pointToCoord(p));
    }
  }
}

function appendPoint(points: Coordinate[], p: Coordinate): void {
  const prev = points[points.length - 1];
  if (
    prev &&
    Math.abs(prev.lat - p.lat) < 1e-8 &&
    Math.abs(prev.lng - p.lng) < 1e-8
  )
    return;
  points.push(p);
}

/** Extract chargers from LDEV legs (one per leg ending with charging summary). */
export function extractChargeAnchorsFromTomTomLegs(
  legs: TomTomLeg[],
): EvChargeStopCandidate[] {
  const out: EvChargeStopCandidate[] = [];
  let ordinal = 0;
  const seen = new Set<string>();

  for (const leg of legs) {
    const info = leg.summary?.chargingInformationAtEndOfLeg;
    const coordRaw = info?.chargingParkLocation?.coordinate;
    if (!info || !isPoint(coordRaw)) continue;
    ordinal += 1;
    const key = `${coordRaw.latitude?.toFixed(5)},${coordRaw.longitude?.toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const minutes =
      typeof info.chargingTimeInSeconds === 'number'
        ? Math.min(240, Math.max(5, Math.ceil(info.chargingTimeInSeconds / 60)))
        : 28;

    const name = info.chargingParkName?.slice(0, 80);

    const candidate: EvChargeStopCandidate = {
      ordinal,
      coordinate: pointToCoord(coordRaw),
      rationale: [
        'TomTom LDEV charging waypoint',
        name ? ` — ${name}` : '',
      ].join(''),
      suggestedDwellMinutes: minutes,
    };
    if (
      typeof info.chargingParkUuid === 'string' &&
      info.chargingParkUuid.length > 0
    ) {
      candidate.vendor = {
        tomTomChargingParkUuid: info.chargingParkUuid,
      };
    }
    out.push(candidate);
  }
  return out;
}

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

  let bodyTextForDiag = '';
  const text = await res.text();
  bodyTextForDiag = truncatePreview(text);

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
