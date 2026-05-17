import { env } from '#/lib/env';

/**
 * Tesla-specific env + regional configuration. The only module that reads
 * TESLA_* env vars — everything else in the integration receives a resolved
 * {@link TeslaConfig} or the `region` it needs.
 */

export type TeslaRegion = 'na' | 'eu';

const FLEET_API_BASE_URLS: Record<TeslaRegion, string> = {
  na: 'https://fleet-api.prd.na.vn.cloud.tesla.com',
  eu: 'https://fleet-api.prd.eu.vn.cloud.tesla.com',
};

export const TESLA_AUTHORIZE_URL = 'https://auth.tesla.com/oauth2/v3/authorize';

export const TESLA_TOKEN_URL =
  'https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token';

/**
 * Minimal read-only scope set. `openid` + `offline_access` are required to
 * receive a refresh token; `vehicle_device_data` grants read access to
 * vehicle_state / charge_state (odometer + SoC).
 */
export const TESLA_DEFAULT_SCOPES = [
  'openid',
  'offline_access',
  'vehicle_device_data',
  'vehicle_cmds',
] as const;

export type TeslaConfig = {
  clientId: string;
  clientSecret: string;
  region: TeslaRegion;
};

/**
 * Returns the configured Tesla credentials, or null if the env isn't set.
 * Callers should throw a user-facing error rather than starting OAuth when
 * this returns null, so the integration never constructs half-valid URLs.
 */
export function readTeslaConfig(): TeslaConfig | null {
  if (!env.TESLA_CLIENT_ID || !env.TESLA_CLIENT_SECRET) {
    return null;
  }
  return {
    clientId: env.TESLA_CLIENT_ID,
    clientSecret: env.TESLA_CLIENT_SECRET,
    region: env.TESLA_REGION,
  };
}

export function teslaRegion(): TeslaRegion {
  return env.TESLA_REGION;
}

export function teslaFleetBaseUrl(region: TeslaRegion = teslaRegion()): string {
  return FLEET_API_BASE_URLS[region];
}

export function teslaCommandProxyUrl(): string | null {
  return env.TESLA_COMMAND_PROXY_URL?.replace(/\/+$/, '') ?? null;
}

export function teslaSendItineraryEnabled(): boolean {
  return env.TESLA_SEND_ITINERARY_ENABLED;
}

export function teslaAudience(region: TeslaRegion = teslaRegion()): string {
  return teslaFleetBaseUrl(region);
}
