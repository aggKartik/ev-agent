import { tool } from 'ai';
import { z } from 'zod';

type Deps = {
  signal?: AbortSignal;
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

export function makeSearchPlacesTool({ signal }: Deps) {
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
      const token = process.env.MAPBOX_TOKEN;
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
        .map((feature) => {
          const lngLat =
            feature.geometry?.coordinates ??
            (feature.properties?.coordinates
              ? ([
                  feature.properties.coordinates.longitude,
                  feature.properties.coordinates.latitude,
                ] as [number | undefined, number | undefined])
              : undefined);
          if (
            !lngLat ||
            typeof lngLat[0] !== 'number' ||
            typeof lngLat[1] !== 'number'
          ) {
            return null;
          }
          const name =
            feature.properties?.name ??
            feature.text ??
            feature.place_name ??
            '';
          if (!name) return null;
          const sub =
            feature.properties?.context?.neighborhood?.name ??
            feature.properties?.context?.place?.name ??
            undefined;
          const address =
            feature.properties?.full_address ??
            feature.properties?.place_formatted ??
            feature.properties?.address ??
            feature.place_name ??
            undefined;
          return {
            name,
            sub,
            coordinate: { lat: lngLat[1], lng: lngLat[0] },
            address,
          };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null);

      return { candidates };
    },
  });
}
