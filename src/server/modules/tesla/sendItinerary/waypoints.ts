import { TRPCError } from '@trpc/server';
import type { PlanResult } from '#/shared/plan/contracts';

export type TeslaNavigationWaypoint = {
  lat: number;
  lon: number;
  order: number;
  name: string;
};

function isFiniteCoordinate(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng);
}

export function itineraryStopsToTeslaWaypoints(
  result: PlanResult,
): TeslaNavigationWaypoint[] {
  const waypoints = result.stops
    .filter((stop) =>
      isFiniteCoordinate(stop.coordinate.lat, stop.coordinate.lng),
    )
    .map((stop, index) => ({
      lat: stop.coordinate.lat,
      lon: stop.coordinate.lng,
      order: index + 1,
      name: stop.name,
    }));

  if (waypoints.length < 2) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message:
        'Tesla navigation needs at least a start and destination waypoint.',
    });
  }

  return waypoints;
}
