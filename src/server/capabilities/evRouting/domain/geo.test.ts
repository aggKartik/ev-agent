import { describe, expect, it } from 'vitest';
import type { Coordinate } from '#/lib/geoTypes';
import {
  cumulativeMilesAlong,
  interpolateAtMiles,
  interpolateStraightLine,
  metersToRouteMiles,
  milesBetween,
  subsampleCorridor,
  totalPolylineMiles,
} from './geo';

const SAN_FRANCISCO: Coordinate = { lat: 37.7749, lng: -122.4194 };
const LOS_ANGELES: Coordinate = { lat: 34.0522, lng: -118.2437 };

describe('metersToRouteMiles', () => {
  it('converts a kilometer-scale length using the international mile', () => {
    expect(metersToRouteMiles(1609.344)).toBeCloseTo(1, 6);
    expect(metersToRouteMiles(0)).toBe(0);
  });
});

describe('milesBetween', () => {
  it('returns 0 for identical coordinates', () => {
    expect(milesBetween(SAN_FRANCISCO, SAN_FRANCISCO)).toBeCloseTo(0, 6);
  });

  it('returns the SF→LA great-circle distance to within 1 mile', () => {
    // Real great-circle distance is ~347 mi.
    const d = milesBetween(SAN_FRANCISCO, LOS_ANGELES);
    expect(d).toBeGreaterThan(345);
    expect(d).toBeLessThan(350);
  });

  it('is symmetric', () => {
    const a = milesBetween(SAN_FRANCISCO, LOS_ANGELES);
    const b = milesBetween(LOS_ANGELES, SAN_FRANCISCO);
    expect(a).toBeCloseTo(b, 9);
  });
});

describe('totalPolylineMiles', () => {
  it('returns 0 for less than two points', () => {
    expect(totalPolylineMiles([])).toBe(0);
    expect(totalPolylineMiles([SAN_FRANCISCO])).toBe(0);
  });

  it('sums leg distances along a polyline', () => {
    const mid: Coordinate = { lat: 36, lng: -120.5 };
    const total = totalPolylineMiles([SAN_FRANCISCO, mid, LOS_ANGELES]);
    const leg1 = milesBetween(SAN_FRANCISCO, mid);
    const leg2 = milesBetween(mid, LOS_ANGELES);
    expect(total).toBeCloseTo(leg1 + leg2, 6);
  });
});

describe('subsampleCorridor', () => {
  const corridor: Coordinate[] = Array.from({ length: 11 }, (_, i) => ({
    lat: 37 + i * 0.1,
    lng: -122,
  }));

  it('returns input unchanged when shorter than the cap', () => {
    expect(subsampleCorridor(corridor, 50)).toEqual(corridor);
  });

  it('returns exactly maxPoints points and preserves first + last', () => {
    const out = subsampleCorridor(corridor, 5);
    expect(out).toHaveLength(5);
    expect(out[0]).toEqual(corridor[0]);
    expect(out[out.length - 1]).toEqual(corridor[corridor.length - 1]);
  });
});

describe('interpolateStraightLine', () => {
  it('emits at least 2 points and includes endpoints', () => {
    const line = interpolateStraightLine(SAN_FRANCISCO, LOS_ANGELES, 4);
    expect(line).toHaveLength(4);
    expect(line[0]).toEqual(SAN_FRANCISCO);
    expect(line[line.length - 1]).toEqual(LOS_ANGELES);
  });

  it('clamps the segment count to a minimum of 2', () => {
    const line = interpolateStraightLine(SAN_FRANCISCO, LOS_ANGELES, 1);
    expect(line).toHaveLength(2);
  });
});

describe('cumulativeMilesAlong + interpolateAtMiles', () => {
  const corridor: Coordinate[] = [
    { lat: 37, lng: -122 },
    { lat: 37, lng: -121 },
    { lat: 37, lng: -120 },
  ];

  it('produces a non-decreasing cumulative array starting at 0', () => {
    const cum = cumulativeMilesAlong(corridor);
    expect(cum[0]).toBe(0);
    expect(cum[1]).toBeGreaterThan(0);
    expect(cum[2]).toBeGreaterThan(cum[1]);
  });

  it('returns the start point at mile 0 and end point at total miles', () => {
    const cum = cumulativeMilesAlong(corridor);
    const total = cum[cum.length - 1];
    expect(interpolateAtMiles(corridor, cum, 0)).toEqual(corridor[0]);
    expect(interpolateAtMiles(corridor, cum, total)).toEqual(
      corridor[corridor.length - 1],
    );
    // Above total → still last point.
    expect(interpolateAtMiles(corridor, cum, total * 2)).toEqual(
      corridor[corridor.length - 1],
    );
  });

  it('interpolates linearly inside a segment', () => {
    const cum = cumulativeMilesAlong(corridor);
    const half = cum[1] / 2;
    const point = interpolateAtMiles(corridor, cum, half);
    // Halfway between (37,-122) and (37,-121).
    expect(point.lat).toBeCloseTo(37, 6);
    expect(point.lng).toBeCloseTo(-121.5, 6);
  });
});
