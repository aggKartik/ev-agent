import { describe, expect, it, vi } from 'vitest';
import type { Coordinate } from '#/lib/geoTypes';

vi.mock('../../domain/decodePolyline', () => ({
  decodeGoogleEncodedPolyline: vi.fn<() => Coordinate[]>(() => {
    throw new Error('bad polyline');
  }),
}));

describe('corridorCoordsFromTomTomLegs decode fallback', () => {
  it('uses raw points when encoded polyline decoding fails', async () => {
    const { corridorCoordsFromTomTomLegs } = await import('./legs');

    const corridor = corridorCoordsFromTomTomLegs([
      {
        encodedPolyline: 'malformed',
        points: [
          { latitude: 37.7749, longitude: -122.4194 },
          { latitude: 37.8044, longitude: -122.2712 },
        ],
      },
    ]);

    expect(corridor).toEqual([
      { lat: 37.7749, lng: -122.4194 },
      { lat: 37.8044, lng: -122.2712 },
    ]);
  });
});
