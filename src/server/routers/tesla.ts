import { TRPCError } from '@trpc/server';
import {
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
          code: 'FAILED_PRECONDITION',
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
});
