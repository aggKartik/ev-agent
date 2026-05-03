import type { Coordinate } from '#/lib/geoTypes';

/** International mile per meter (survey / statute). */
const METERS_PER_MILE = 1609.344;

const EARTH_RADIUS_MILES = 3958.7613;

export function metersToRouteMiles(meters: number): number {
  return meters / METERS_PER_MILE;
}

/** Haversine distance in miles between two coordinates. */
export function milesBetween(a: Coordinate, b: Coordinate): number {
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return EARTH_RADIUS_MILES * c;
}

export function totalPolylineMiles(points: Coordinate[]): number {
  if (points.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < points.length; i += 1) {
    sum += milesBetween(points[i - 1], points[i]);
  }
  return sum;
}

/** Evenly subsample a polyline for prompt size (keeps first and last). */
export function subsampleCorridor(
  points: Coordinate[],
  maxPoints: number,
): Coordinate[] {
  if (points.length <= maxPoints) return points;
  const out: Coordinate[] = [];
  const step = (points.length - 1) / (maxPoints - 1);
  for (let i = 0; i < maxPoints; i += 1) {
    const idx = Math.round(i * step);
    out.push(points[Math.min(idx, points.length - 1)]);
  }
  return out;
}

export function interpolateStraightLine(
  from: Coordinate,
  to: Coordinate,
  segments: number,
): Coordinate[] {
  const n = Math.max(2, segments);
  const out: Coordinate[] = [];
  for (let i = 0; i < n; i += 1) {
    const t = i / (n - 1);
    out.push({
      lat: from.lat + (to.lat - from.lat) * t,
      lng: from.lng + (to.lng - from.lng) * t,
    });
  }
  return out;
}

/** Cumulative mile marker at each polyline vertex. */
export function cumulativeMilesAlong(corridor: Coordinate[]): number[] {
  const cum: number[] = [0];
  for (let i = 1; i < corridor.length; i += 1) {
    cum.push(cum[i - 1] + milesBetween(corridor[i - 1], corridor[i]));
  }
  return cum;
}

/** Point `milesFromStart` along the polyline using linear interpolation inside segments. */
export function interpolateAtMiles(
  corridor: Coordinate[],
  cumMi: number[],
  milesFromStart: number,
): Coordinate {
  const total = cumMi[cumMi.length - 1];
  const m = Math.max(0, Math.min(milesFromStart, total));
  if (m <= 0) return corridor[0];
  if (m >= total) return corridor[corridor.length - 1];
  let i = cumMi.findIndex((c) => c >= m);
  if (i <= 0) i = 1;
  const a = corridor[i - 1];
  const b = corridor[i];
  const d0 = cumMi[i - 1];
  const d1 = cumMi[i];
  const span = Math.max(d1 - d0, Number.EPSILON);
  const t = (m - d0) / span;
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  };
}
