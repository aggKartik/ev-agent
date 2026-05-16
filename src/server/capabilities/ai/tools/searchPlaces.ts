import { tool } from 'ai';
import { z } from 'zod';
import type { PlanStreamEvent } from '#/shared/plan/contracts';
import { fetchMapboxJson, requireMapboxToken } from './mapboxHttp';
import { emitPlanToolProgress } from './toolProgress';

type Deps = {
  signal?: AbortSignal;
  emit?: (event: PlanStreamEvent) => void;
};

const MILES_PER_DEGREE_LAT = 69;

type SearchInput = {
  query: string;
  near: { lat: number; lng: number };
  radiusMiles: number;
  category?: string;
};

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
  if (!propCoord) return null;
  if (typeof propCoord.latitude !== 'number') return null;
  if (typeof propCoord.longitude !== 'number') return null;
  return { lat: propCoord.latitude, lng: propCoord.longitude };
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

function searchBbox({ near, radiusMiles }: SearchInput): string {
  const dLat = radiusMiles / MILES_PER_DEGREE_LAT;
  const dLng =
    radiusMiles /
    (MILES_PER_DEGREE_LAT *
      Math.max(Math.cos((near.lat * Math.PI) / 180), 0.01));
  return [
    near.lng - dLng,
    near.lat - dLat,
    near.lng + dLng,
    near.lat + dLat,
  ].join(',');
}

function buildSearchUrl(input: SearchInput): string {
  const params = new URLSearchParams({
    q: input.category ? `${input.category} ${input.query}` : input.query,
    access_token: requireMapboxToken('place search'),
    proximity: `${input.near.lng},${input.near.lat}`,
    bbox: searchBbox(input),
    limit: '5',
  });
  return `https://api.mapbox.com/search/searchbox/v1/forward?${params.toString()}`;
}

function parseCandidates(data: MapboxResponse): Candidate[] {
  const features = Array.isArray(data.features) ? data.features : [];
  return features
    .map(featureToCandidate)
    .filter((candidate): candidate is Candidate => candidate !== null);
}

async function fetchCandidates(
  input: SearchInput,
  signal?: AbortSignal,
): Promise<Candidate[]> {
  const data = await fetchMapboxJson<MapboxResponse>(
    buildSearchUrl(input),
    'Mapbox search failed',
    signal,
  );
  return parseCandidates(data);
}

function startedMessage({
  query,
  near,
  radiusMiles,
  category,
}: SearchInput): string {
  const categoryLabel = category ? ` (${category})` : '';
  return `Searching places for “${query}” near ${formatCoordinate(near)} within ${radiusMiles} mi${categoryLabel}.`;
}

function completedMessage(query: string, count: number): string {
  return `Found ${count} place candidate${count === 1 ? '' : 's'} for “${query}”.`;
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
    execute: async (input) => {
      emitPlanToolProgress(
        emit,
        'searchPlaces',
        'started',
        startedMessage(input),
      );
      try {
        const candidates = await fetchCandidates(input, signal);
        emitPlanToolProgress(
          emit,
          'searchPlaces',
          'completed',
          completedMessage(input.query, candidates.length),
        );
        return { candidates };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Place search failed.';
        emitPlanToolProgress(
          emit,
          'searchPlaces',
          'failed',
          `Place search failed for “${input.query}”: ${message}`,
        );
        throw error;
      }
    },
  });
}
