import { tool } from 'ai';
import { z } from 'zod';
import { env } from '#/lib/env';
import type { PlanStreamEvent } from '#/shared/plan/contracts';

type Deps = {
  signal?: AbortSignal;
  emit?: (event: PlanStreamEvent) => void;
};

const MILES_PER_DEGREE_LAT = 69;

type MapboxFeature = {
  properties?: {
    name?: string;
    place_formatted?: string;
    full_address?: string;
    address?: string;
    context?: { neighborhood?: { name?: string }; place?: { name?: string } };
    coordinates?: { latitude?: number; longitude?: number };
  };
  geometry?: { coordinates?: [number, number] };
  text?: string;
  place_name?: string;
  center?: [number, number];
};

type MapboxResponse = {
  features?: MapboxFeature[];
};

type Candidate = {
  name: string;
  sub: string | undefined;
  coordinate: { lat: number; lng: number };
  address: string | undefined;
};

function extractCoordinate(
  feature: MapboxFeature,
): { lat: number; lng: number } | null {
  const geom = feature.geometry?.coordinates;
  if (geom && typeof geom[0] === 'number' && typeof geom[1] === 'number') {
    return { lat: geom[1], lng: geom[0] };
  }
  const propCoord = feature.properties?.coordinates;
  if (
    propCoord &&
    typeof propCoord.latitude === 'number' &&
    typeof propCoord.longitude === 'number'
  ) {
    return { lat: propCoord.latitude, lng: propCoord.longitude };
  }
  return null;
}

function extractName(feature: MapboxFeature): string {
  return feature.properties?.name ?? feature.text ?? feature.place_name ?? '';
}

function extractSub(feature: MapboxFeature): string | undefined {
  const ctx = feature.properties?.context;
  return ctx?.neighborhood?.name ?? ctx?.place?.name ?? undefined;
}

function extractAddress(feature: MapboxFeature): string | undefined {
  const props = feature.properties;
  return (
    props?.full_address ??
    props?.place_formatted ??
    props?.address ??
    feature.place_name ??
    undefined
  );
}

function featureToCandidate(feature: MapboxFeature): Candidate | null {
  const coordinate = extractCoordinate(feature);
  if (!coordinate) return null;
  const name = extractName(feature);
  if (!name) return null;
  return {
    name,
    sub: extractSub(feature),
    coordinate,
    address: extractAddress(feature),
  };
}

function formatCoordinate({ lat, lng }: { lat: number; lng: number }): string {
  return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
}

export function makeSearchPlacesTool({ signal, emit }: Deps) {
  return tool({
    description:
      'Find real points of interest along a route. Pass a free-text query (e.g. "specialty coffee" or "scenic overlook") and a coordinate to search around. Returns up to 5 candidates with names + coordinates.',
    inputSchema: z.object({
      query: z.string().min(1),
      near: z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      }),
      radiusMiles: z.number().min(1).max(200),
      category: z
        .string()
        .optional()
        .describe('Optional Mapbox category slug (e.g. "coffee", "park").'),
    }),
    execute: async ({ query, near, radiusMiles, category }) => {
      emit?.({
        type: 'toolProgress',
        tool: 'searchPlaces',
        status: 'started',
        message: `Searching places for “${query}” near ${formatCoordinate(near)} within ${radiusMiles} mi${category ? ` (${category})` : ''}.`,
      });

      try {
        const token = env.MAPBOX_TOKEN;
        if (!token) {
          throw new Error(
            'MAPBOX_TOKEN is not set. Configure it in .env to enable place search.',
          );
        }

        const dLat = radiusMiles / MILES_PER_DEGREE_LAT;
        const dLng =
          radiusMiles /
          (MILES_PER_DEGREE_LAT *
            Math.max(Math.cos((near.lat * Math.PI) / 180), 0.01));
        const bbox = [
          near.lng - dLng,
          near.lat - dLat,
          near.lng + dLng,
          near.lat + dLat,
        ].join(',');

        const params = new URLSearchParams({
          q: category ? `${category} ${query}` : query,
          access_token: token,
          proximity: `${near.lng},${near.lat}`,
          bbox,
          limit: '5',
        });
        const url = `https://api.mapbox.com/search/searchbox/v1/forward?${params.toString()}`;

        const response = await fetch(url, { signal });
        if (!response.ok) {
          const body = await response.text().catch(() => '');
          throw new Error(
            `Mapbox search failed (${response.status}): ${body.slice(0, 200)}`,
          );
        }
        const data = (await response.json()) as MapboxResponse;
        const features = Array.isArray(data.features) ? data.features : [];

        const candidates = features
          .map(featureToCandidate)
          .filter((c): c is Candidate => c !== null);

        emit?.({
          type: 'toolProgress',
          tool: 'searchPlaces',
          status: 'completed',
          message: `Found ${candidates.length} place candidate${candidates.length === 1 ? '' : 's'} for “${query}”.`,
        });

        return { candidates };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Place search failed.';
        emit?.({
          type: 'toolProgress',
          tool: 'searchPlaces',
          status: 'failed',
          message: `Place search failed for “${query}”: ${message}`,
        });
        throw error;
      }
    },
  });
}
