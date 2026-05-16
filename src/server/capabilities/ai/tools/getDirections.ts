import { tool } from 'ai';
import { z } from 'zod';
import type { PlanStreamEvent } from '#/shared/plan/contracts';
import { fetchMapboxJson, requireMapboxToken } from './mapboxHttp';
import { emitPlanToolProgress } from './toolProgress';

type Deps = {
  signal?: AbortSignal;
  emit?: (event: PlanStreamEvent) => void;
};

type Waypoint = { lat: number; lng: number };

type MapboxLeg = {
  distance?: number;
  duration?: number;
};

type MapboxRoute = {
  distance?: number;
  duration?: number;
  legs?: MapboxLeg[];
  geometry?: { type?: string; coordinates?: [number, number][] };
};

type MapboxDirectionsResponse = {
  routes?: MapboxRoute[];
};

type DirectionsResult = {
  totalMiles: number;
  totalMinutes: number;
  legs: { miles: number; driveMinutes: number }[];
  geometry: Waypoint[];
};

const METERS_PER_MILE = 1609.344;

function milesFromMeters(meters: number): number {
  return Math.round((meters / METERS_PER_MILE) * 10) / 10;
}

function minutesFromSeconds(seconds: number): number {
  return Math.round(seconds / 60);
}

function routeNumber(value: number | undefined): number {
  return typeof value === 'number' ? value : 0;
}

function buildDirectionsUrl(waypoints: Waypoint[]): string {
  const coords = waypoints.map(({ lat, lng }) => `${lng},${lat}`).join(';');
  const params = new URLSearchParams({
    geometries: 'geojson',
    overview: 'full',
    access_token: requireMapboxToken('directions'),
  });
  return `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?${params.toString()}`;
}

function parseLeg(leg: MapboxLeg) {
  return {
    miles: milesFromMeters(routeNumber(leg.distance)),
    driveMinutes: minutesFromSeconds(routeNumber(leg.duration)),
  };
}

function isLngLatPair(pair: unknown): pair is [number, number] {
  return (
    Array.isArray(pair) &&
    typeof pair[0] === 'number' &&
    typeof pair[1] === 'number'
  );
}

function parseGeometry(route: MapboxRoute): Waypoint[] {
  return (route.geometry?.coordinates ?? [])
    .filter(isLngLatPair)
    .map(([lng, lat]) => ({ lat, lng }));
}

function parseDirections(data: MapboxDirectionsResponse): DirectionsResult {
  const route = data.routes?.[0];
  if (!route)
    throw new Error('Mapbox returned no routes for the requested waypoints');
  return {
    totalMiles: milesFromMeters(routeNumber(route.distance)),
    totalMinutes: minutesFromSeconds(routeNumber(route.duration)),
    legs: (route.legs ?? []).map(parseLeg),
    geometry: parseGeometry(route),
  };
}

async function fetchDirections(
  waypoints: Waypoint[],
  signal?: AbortSignal,
): Promise<DirectionsResult> {
  const data = await fetchMapboxJson<MapboxDirectionsResponse>(
    buildDirectionsUrl(waypoints),
    'Mapbox directions failed',
    signal,
  );
  return parseDirections(data);
}

function completedMessage(result: DirectionsResult): string {
  const plural = result.legs.length === 1 ? '' : 's';
  return `Directions ready: ${result.totalMiles} mi, ${result.totalMinutes} min, ${result.legs.length} leg${plural}.`;
}

export function makeGetDirectionsTool({ signal, emit }: Deps) {
  return tool({
    description:
      'Get real driving directions between an ordered list of waypoints. Returns total miles, total minutes, per-leg durations, and a polyline (lat/lng array) for the full route. Call this once at the end with all stops in driving order.',
    inputSchema: z.object({
      waypoints: z
        .array(
          z.object({
            lat: z.number().min(-90).max(90),
            lng: z.number().min(-180).max(180),
          }),
        )
        .min(2)
        .max(25),
    }),
    execute: async ({ waypoints }) => {
      emitPlanToolProgress(
        emit,
        'getDirections',
        'started',
        `Finalizing directions across ${waypoints.length} waypoint${waypoints.length === 1 ? '' : 's'}.`,
      );
      try {
        const result = await fetchDirections(waypoints, signal);
        emitPlanToolProgress(
          emit,
          'getDirections',
          'completed',
          completedMessage(result),
        );
        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Directions failed.';
        emitPlanToolProgress(
          emit,
          'getDirections',
          'failed',
          `Direction finalization failed: ${message}`,
        );
        throw error;
      }
    },
  });
}
