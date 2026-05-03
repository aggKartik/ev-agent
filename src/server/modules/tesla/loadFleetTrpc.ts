import { TRPCError } from '@trpc/server';
import { loadTeslaFleetVehiclesForInternalUser } from '#/server/integrations/tesla/fleet/loadUserFleet';
import { NotLinkedError, OAuthError } from '#/server/oauth/errors';
import type { Context } from '#/server/platform/context';

type FleetCtx = Context & { userId: number };

function mapOAuthToTrpc(err: OAuthError): TRPCError {
  if (err.code.toLowerCase() === 'http_412') {
    return new TRPCError({
      code: 'PRECONDITION_REQUIRED',
      message:
        'Tesla Fleet partner is not registered for this domain, or the public key URL is not reachable. Set TESLA_FLEET_PUBLIC_KEY_PEM, verify it is served at /.well-known/appspecific/com.tesla.3p.public-key.pem on the same host as OAUTH_BASE_URL, then run bun run tesla:register-partner.',
      cause: err,
    });
  }
  return new TRPCError({
    code: 'BAD_GATEWAY',
    message: err.message,
    cause: err,
  });
}

/** Fleet load mapped to {@link TRPCError} codes for authenticated procedures. */
export async function loadTeslaFleetVehiclesProtected(
  ctx: FleetCtx,
): Promise<Awaited<ReturnType<typeof loadTeslaFleetVehiclesForInternalUser>>> {
  try {
    return await loadTeslaFleetVehiclesForInternalUser({
      db: ctx.db,
      userId: ctx.userId,
    });
  } catch (err) {
    if (err instanceof NotLinkedError) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Tesla account not linked.',
      });
    }
    if (err instanceof OAuthError) {
      throw mapOAuthToTrpc(err);
    }
    throw err;
  }
}
