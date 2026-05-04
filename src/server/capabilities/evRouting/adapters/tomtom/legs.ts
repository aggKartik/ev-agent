import type { Coordinate } from '#/lib/geoTypes';
import { decodeGoogleEncodedPolyline } from '../../domain/decodePolyline';
import type { EvChargeStopCandidate } from '../../domain/types';

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

/**
 * TomTom Routing/LDEV: omission means `coordinatePrecision=default` → polyline divisor 10^5.
 * Anything outside [4, 10] is treated as default.
 */
function legPolylinePrecision(precRaw: number | undefined): number {
  if (typeof precRaw !== 'number') return 5;
  if (precRaw < 4 || precRaw > 10) return 5;
  return precRaw;
}

function tryAppendEncodedPolyline(
  points: Coordinate[],
  leg: TomTomLeg,
): boolean {
  const enc = leg.summary?.encodedPolyline ?? leg.encodedPolyline;
  if (typeof enc !== 'string' || enc.length < 2) return false;
  const prec = legPolylinePrecision(
    leg.summary?.encodedPolylinePrecision ?? leg.encodedPolylinePrecision,
  );
  for (const pt of decodeGoogleEncodedPolyline(enc, prec)) {
    appendPoint(points, pt);
  }
  return true;
}

function appendRawPoints(points: Coordinate[], leg: TomTomLeg): void {
  if (!Array.isArray(leg.points)) return;
  for (const p of leg.points) {
    if (isPoint(p)) appendPoint(points, pointToCoord(p));
  }
}

/** Decode leg geometry: encoded polyline (summary or leg root), else point list. */
function appendTomTomLegGeometry(points: Coordinate[], leg: TomTomLeg): void {
  if (tryAppendEncodedPolyline(points, leg)) return;
  appendRawPoints(points, leg);
}

/** Concatenate decoded coordinates from LDEV routing legs into one corridor. */
export function corridorCoordsFromTomTomLegs(legs: TomTomLeg[]): Coordinate[] {
  const geom: Coordinate[] = [];
  for (const leg of legs) appendTomTomLegGeometry(geom, leg);
  return geom;
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
