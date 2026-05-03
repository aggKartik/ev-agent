/**
 * Encoded polylines (Google / TomTom / Mapbox) via @mapbox/polyline.
 * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */

import polyline from '@mapbox/polyline';

import type { Coordinate } from '#/features/plan/contracts';

/**
 * Decode to `{ lat, lng }`; `precision` is polyline fractional digits (typically `5`; use `7` for TomTom max precision routes).
 */
export function decodeGoogleEncodedPolyline(
  encoded: string,
  precision = 5,
): Coordinate[] {
  return polyline.decode(encoded, precision).map(([lat, lng]) => ({
    lat,
    lng,
  }));
}
