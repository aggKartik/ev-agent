import { TRPCError } from '@trpc/server';
import {
  decodeTeslaVin,
  fetchVehiclesWithState,
  teslaProvider,
  teslaRegion,
} from '#/server/integrations/tesla';
import { NotLinkedError, OAuthError } from '#/server/oauth/errors';
import { getFreshAccessToken } from '#/server/oauth/store';
import { protectedProcedure, router } from '../trpc';

/**
 * Tesla-specific data procedures. Lifecycle (connect / status / disconnect)
 * is handled generically by `oauthRouter`.
 *
 * `vehicles` transparently refreshes the stored access token when it is
 * near expiry — the refresh logic lives in `getFreshAccessToken` so it is
 * exercised by every Fleet API call, not just the ones in this router.
 */
export const teslaRouter = router({
  vehicles: protectedProcedure.query(async ({ ctx }) => {
    let accessToken: string;
    try {
      accessToken = await getFreshAccessToken(
        ctx.db,
        teslaProvider,
        ctx.userId,
      );
    } catch (err) {
      if (err instanceof NotLinkedError) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Tesla account not linked.',
        });
      }
      if (err instanceof OAuthError) {
        throw new TRPCError({
          code: 'BAD_GATEWAY',
          message: err.message,
          cause: err,
        });
      }
      throw err;
    }

    try {
      return await fetchVehiclesWithState({
        accessToken,
        region: teslaRegion(),
      });
    } catch (err) {
      if (err instanceof OAuthError) {
        throw new TRPCError({
          code: 'BAD_GATEWAY',
          message: err.message,
          cause: err,
        });
      }
      throw err;
    }
  }),

  /**
   * Prefill hint for onboarding: if Tesla is linked, returns decoded
   * make/model/year for the first vehicle. Returns `{ linked: false }` when
   * not linked so the client can branch without handling a thrown error.
   * Upstream Tesla failures still throw BAD_GATEWAY so the UI can surface
   * the problem.
   */
  vehiclePrefill: protectedProcedure.query(async ({ ctx }) => {
    let accessToken: string;
    try {
      accessToken = await getFreshAccessToken(
        ctx.db,
        teslaProvider,
        ctx.userId,
      );
    } catch (err) {
      if (err instanceof NotLinkedError) {
        return { linked: false as const };
      }
      if (err instanceof OAuthError) {
        throw new TRPCError({
          code: 'BAD_GATEWAY',
          message: err.message,
          cause: err,
        });
      }
      throw err;
    }

    let vehicles: Awaited<ReturnType<typeof fetchVehiclesWithState>>;
    try {
      vehicles = await fetchVehiclesWithState({
        accessToken,
        region: teslaRegion(),
      });
    } catch (err) {
      if (err instanceof OAuthError) {
        throw new TRPCError({
          code: 'BAD_GATEWAY',
          message: err.message,
          cause: err,
        });
      }
      throw err;
    }

    const first = vehicles[0];
    if (!first) {
      return { linked: true as const, vehicle: null };
    }

    const decoded = decodeTeslaVin(first.vin);
    return {
      linked: true as const,
      vehicle: {
        id: first.id,
        vin: first.vin,
        displayName: first.displayName,
        make: 'Tesla',
        model: decoded.model,
        year: decoded.year,
      },
    };
  }),
});
