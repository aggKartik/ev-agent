import type { Kysely } from 'kysely';
import { teslaProvider } from '#/server/integrations/tesla/auth/provider';
import { teslaRegion } from '#/server/integrations/tesla/config';
import { getCached, setCached } from '#/server/integrations/tesla/fleet/cache';
import {
  fetchVehiclesWithState,
  type TeslaVehicleSummary,
} from '#/server/integrations/tesla/fleet/fleet-api';
import { getFreshAccessToken } from '#/server/oauth/store';
import type { Database } from '#/server/platform/db/types';

/**
 * Loads the linked Driver's Fleet vehicle list using the OAuth access token,
 * honoring the shared in-memory cache. Propagates token / HTTP errors from
 * `getFreshAccessToken` / `fetchVehiclesWithState`.
 */
export async function loadTeslaFleetVehiclesForInternalUser(args: {
  db: Kysely<Database>;
  userId: number;
}): Promise<TeslaVehicleSummary[]> {
  const cached = getCached(args.userId);
  if (cached) return cached;

  const accessToken = await getFreshAccessToken(
    args.db,
    teslaProvider,
    args.userId,
  );

  const vehicles = await fetchVehiclesWithState({
    accessToken,
    region: teslaRegion(),
  });

  setCached(args.userId, vehicles);
  return vehicles;
}
