import { tool } from 'ai';
import { z } from 'zod';

type Deps = {
  signal?: AbortSignal;
};

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

const METERS_PER_MILE = 1609.344;

export function makeGetDirectionsTool({ signal }: Deps) {
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
      const token = process.env.MAPBOX_TOKEN;
      if (!token) {
        throw new Error(
          'MAPBOX_TOKEN is not set. Configure it in .env to enable directions.',
        );
      }

      const coords = waypoints.map(({ lat, lng }) => `${lng},${lat}`).join(';');
      const params = new URLSearchParams({
        geometries: 'geojson',
        overview: 'full',
        access_token: token,
      });
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?${params.toString()}`;

      const response = await fetch(url, { signal });
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(
          `Mapbox directions failed (${response.status}): ${body.slice(0, 200)}`,
        );
      }

      const data = (await response.json()) as MapboxDirectionsResponse;
      const route = data.routes?.[0];
      if (!route) {
        throw new Error(
          'Mapbox returned no routes for the requested waypoints',
        );
      }

      const totalMeters =
        typeof route.distance === 'number' ? route.distance : 0;
      const totalSeconds =
        typeof route.duration === 'number' ? route.duration : 0;
      const legs = (route.legs ?? []).map((leg) => {
        const meters = typeof leg.distance === 'number' ? leg.distance : 0;
        const seconds = typeof leg.duration === 'number' ? leg.duration : 0;
        return {
          miles: Math.round((meters / METERS_PER_MILE) * 10) / 10,
          driveMinutes: Math.round(seconds / 60),
        };
      });
      const coordinates = route.geometry?.coordinates ?? [];
      const geometry = coordinates
        .filter(
          (pair): pair is [number, number] =>
            Array.isArray(pair) &&
            typeof pair[0] === 'number' &&
            typeof pair[1] === 'number',
        )
        .map(([lng, lat]) => ({ lat, lng }));

      return {
        totalMiles: Math.round((totalMeters / METERS_PER_MILE) * 10) / 10,
        totalMinutes: Math.round(totalSeconds / 60),
        legs,
        geometry,
      };
    },
  });
}
