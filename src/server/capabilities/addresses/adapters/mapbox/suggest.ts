import { mapboxSuggest } from '#/server/integrations/mapbox/searchbox';
import type { AddressSuggestion } from '../../domain/types';

/**
 * Mapbox Search Box adapter for the typeahead suggest call. Maps the
 * vendor-shaped response into the provider-agnostic
 * {@link AddressSuggestion} so the plan router never sees Mapbox types.
 */
export async function suggestAddressesViaMapbox(args: {
  query: string;
  sessionToken: string;
  proximity?: { lat: number; lng: number };
  signal?: AbortSignal;
}): Promise<AddressSuggestion[]> {
  const raw = await mapboxSuggest(args);
  return raw.map((r) => ({
    providerId: r.mapboxId,
    primary: r.primary,
    secondary: r.secondary,
  }));
}
