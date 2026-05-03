import {
  mapboxRetrieve,
  mapboxReverseGeocode,
} from '#/server/integrations/mapbox/searchbox';
import type { ResolvedAddress } from '../../domain/types';

export async function retrieveAddressViaMapbox(args: {
  providerId: string;
  sessionToken: string;
  signal?: AbortSignal;
}): Promise<ResolvedAddress | null> {
  const result = await mapboxRetrieve({
    mapboxId: args.providerId,
    sessionToken: args.sessionToken,
    signal: args.signal,
  });
  return result;
}

export async function reverseGeocodeViaMapbox(args: {
  coordinate: { lat: number; lng: number };
  signal?: AbortSignal;
}): Promise<ResolvedAddress | null> {
  return mapboxReverseGeocode({
    coordinate: args.coordinate,
    signal: args.signal,
  });
}
