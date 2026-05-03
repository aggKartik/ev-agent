/**
 * Provider-agnostic address types. Mapbox-specific shapes live in
 * `src/server/integrations/mapbox/searchbox.ts`; this file is what the
 * `plan` router and clients see, so swapping geocoders later is a
 * single-adapter change.
 */

export type AddressSuggestion = {
  /** Opaque id the adapter uses to retrieve the full feature. */
  providerId: string;
  primary: string;
  secondary: string;
};

export type ResolvedAddress = {
  full: string;
  primary: string;
  secondary: string;
  coordinate: { lat: number; lng: number };
};
