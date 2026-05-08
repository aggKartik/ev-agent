import { env } from '#/lib/env';

/**
 * Thin client for Mapbox Search Box API. The Search Box API is a two-call
 * flow specifically priced for autocomplete:
 *
 *   1. `suggest` - cheap (free under a session token) typeahead lookup
 *   2. `retrieve` - billed; produces the canonical feature with coordinates
 *
 * A **session token** (caller-provided UUID) groups N suggest calls + the
 * single retrieve into one billable session, so we never charge for the
 * suggestions a user typed but never picked. Callers should generate a
 * UUID per address-field focus and forward the same token to both calls.
 *
 * No DB, no caching here — the router layer wraps these. Pure I/O over
 * `fetch`, abortable via the `AbortSignal` parameter.
 */

const BASE_URL = 'https://api.mapbox.com/search/searchbox/v1';
const SEARCH_LIMIT = 5;
const MAPBOX_FETCH_TIMEOUT_MS = 15_000;

async function mapboxFetch(
  input: string,
  init: RequestInit & { signal?: AbortSignal },
): Promise<Response> {
  const { signal: external } = init;
  const merged = new AbortController();
  const timer = setTimeout(() => merged.abort(), MAPBOX_FETCH_TIMEOUT_MS);
  const forward = () => merged.abort();
  if (external) {
    if (external.aborted) {
      clearTimeout(timer);
      merged.abort();
    } else {
      external.addEventListener('abort', forward, { once: true });
    }
  }
  try {
    return await fetch(input, { ...init, signal: merged.signal });
  } finally {
    clearTimeout(timer);
    if (external) external.removeEventListener('abort', forward);
  }
}

type RawMapboxFeature = {
  id?: string;
  mapbox_id?: string;
  name?: string;
  text?: string;
  place_formatted?: string;
  full_address?: string;
  feature_type?: string;
};

type SuggestResponse = {
  suggestions?: RawMapboxFeature[];
};

type RetrieveResponse = {
  features?: Array<{
    properties?: {
      mapbox_id?: string;
      name?: string;
      place_formatted?: string;
      full_address?: string;
      context?: {
        place?: { name?: string };
        region?: { name?: string };
      };
    };
    geometry?: {
      type?: string;
      coordinates?: [number, number];
    };
  }>;
};

export type MapboxSuggestion = {
  mapboxId: string;
  primary: string;
  secondary: string;
};

export type MapboxRetrievedAddress = {
  full: string;
  primary: string;
  secondary: string;
  coordinate: { lat: number; lng: number };
};

export type SuggestArgs = {
  query: string;
  sessionToken: string;
  proximity?: { lat: number; lng: number };
  signal?: AbortSignal;
};

export type RetrieveArgs = {
  mapboxId: string;
  sessionToken: string;
  signal?: AbortSignal;
};

export type ReverseGeocodeArgs = {
  coordinate: { lat: number; lng: number };
  signal?: AbortSignal;
};

export async function mapboxSuggest({
  query,
  sessionToken,
  proximity,
  signal,
}: SuggestArgs): Promise<MapboxSuggestion[]> {
  if (query.trim().length < 2) return [];
  const params = new URLSearchParams({
    q: query,
    access_token: env.MAPBOX_TOKEN,
    session_token: sessionToken,
    limit: String(SEARCH_LIMIT),
    types: 'address,place,poi',
    country: 'us',
  });
  if (proximity) {
    params.set('proximity', `${proximity.lng},${proximity.lat}`);
  }

  const response = await mapboxFetch(
    `${BASE_URL}/suggest?${params.toString()}`,
    {
      signal,
    },
  );
  if (!response.ok) {
    throw new Error(
      `Mapbox suggest failed (${response.status}): ${(
        await response.text().catch(() => '')
      ).slice(0, 200)}`,
    );
  }
  const data = (await response.json()) as SuggestResponse;
  const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];

  return suggestions
    .map((s) => {
      const id = s.mapbox_id ?? s.id;
      const primary = s.name ?? s.text ?? s.full_address ?? '';
      if (!id || !primary) return null;
      return {
        mapboxId: id,
        primary,
        secondary: s.place_formatted ?? s.full_address ?? '',
      } satisfies MapboxSuggestion;
    })
    .filter((s): s is MapboxSuggestion => s !== null);
}

type RetrieveFeature = NonNullable<RetrieveResponse['features']>[number];

function extractRetrieveCoordinate(
  feature: RetrieveFeature,
): { lat: number; lng: number } | null {
  const coords = feature.geometry?.coordinates;
  if (
    !coords ||
    typeof coords[0] !== 'number' ||
    typeof coords[1] !== 'number'
  ) {
    return null;
  }
  return { lat: coords[1], lng: coords[0] };
}

function extractRetrieveAddress(
  feature: RetrieveFeature,
): { full: string; primary: string; secondary: string } | null {
  const props = feature.properties;
  const primary = props?.name ?? props?.full_address ?? '';
  if (!primary) return null;
  const secondary = props?.place_formatted ?? props?.full_address ?? '';
  const full = props?.full_address
    ? props.full_address
    : `${primary}${secondary ? `, ${secondary}` : ''}`;
  return { full, primary, secondary };
}

function featureToRetrievedAddress(
  feature: RetrieveFeature,
): MapboxRetrievedAddress | null {
  const coordinate = extractRetrieveCoordinate(feature);
  if (!coordinate) return null;
  const address = extractRetrieveAddress(feature);
  if (!address) return null;
  return { ...address, coordinate };
}

export async function mapboxRetrieve({
  mapboxId,
  sessionToken,
  signal,
}: RetrieveArgs): Promise<MapboxRetrievedAddress | null> {
  const params = new URLSearchParams({
    access_token: env.MAPBOX_TOKEN,
    session_token: sessionToken,
  });

  const response = await mapboxFetch(
    `${BASE_URL}/retrieve/${encodeURIComponent(mapboxId)}?${params.toString()}`,
    { signal },
  );
  if (!response.ok) {
    throw new Error(
      `Mapbox retrieve failed (${response.status}): ${(
        await response.text().catch(() => '')
      ).slice(0, 200)}`,
    );
  }
  const data = (await response.json()) as RetrieveResponse;
  const feature = data.features?.[0];
  if (!feature) return null;
  return featureToRetrievedAddress(feature);
}

/**
 * Reverse geocode a coordinate to a human-readable address using the
 * classic geocoding endpoint (Search Box API doesn't expose reverse).
 * Used by `useCurrentLocation` to label the auto-filled START field.
 */
export async function mapboxReverseGeocode({
  coordinate,
  signal,
}: ReverseGeocodeArgs): Promise<MapboxRetrievedAddress | null> {
  const params = new URLSearchParams({
    access_token: env.MAPBOX_TOKEN,
    limit: '1',
    types: 'address,place,poi',
  });
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinate.lng},${coordinate.lat}.json?${params.toString()}`;
  const response = await mapboxFetch(url, { signal });
  if (!response.ok) return null;
  const data = (await response.json()) as {
    features?: Array<{
      place_name?: string;
      text?: string;
      context?: Array<{ id?: string; text?: string }>;
      center?: [number, number];
    }>;
  };
  const feature = data.features?.[0];
  if (!feature?.place_name || !feature.center) return null;
  const place = feature.context?.find((c) => c.id?.startsWith('place'))?.text;
  const region = feature.context?.find((c) => c.id?.startsWith('region'))?.text;
  const secondary = [place, region].filter(Boolean).join(', ');
  return {
    full: feature.place_name,
    primary: feature.text ?? feature.place_name,
    secondary,
    coordinate,
  };
}
