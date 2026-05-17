import { TRPCError } from '@trpc/server';
import { getVehicle } from '#/server/capabilities/vehicles/store';
import { teslaProvider } from '#/server/integrations/tesla/auth/provider';
import { sendTeslaNavigationWaypoints } from '#/server/integrations/tesla/commands/navigation';
import type { TeslaVehicleSummary } from '#/server/integrations/tesla/fleet/fleet-api';
import { OAuthError } from '#/server/oauth/errors';
import { getFreshAccessToken, getLinkedStatus } from '#/server/oauth/store';
import { pickTeslaVehicleForIdentity } from '#/shared/vehicles/teslaPick';
import { loadTeslaFleetVehiclesProtected } from '../loadFleetTrpc';
import type { TeslaAuthedContext } from '../types';
import { getSendItineraryCapability } from './capability';
import type { SendItineraryInput, SendItineraryResult } from './contracts';
import { mapTeslaCommandError } from './errors';
import { itineraryStopsToTeslaWaypoints } from './waypoints';

function hasOAuthScope(scope: string | null, expected: string): boolean {
  return scope?.split(/\s+/).includes(expected) ?? false;
}

function vinSuffix(vin: string): string {
  return vin.slice(-6);
}

async function assertTeslaCommandScope(ctx: TeslaAuthedContext): Promise<void> {
  const status = await getLinkedStatus(ctx.db, teslaProvider.slug, ctx.userId);
  if (!status.linked) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'Tesla account not linked.',
    });
  }
  if (!hasOAuthScope(status.scope, 'vehicle_cmds')) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message:
        'Tesla account must be reconnected with vehicle command access before sending navigation.',
    });
  }
}

async function resolveCommandVehicle(
  ctx: TeslaAuthedContext,
  vehicleId: string | undefined,
): Promise<TeslaVehicleSummary & { vin: string }> {
  const vehicles = await loadTeslaFleetVehiclesProtected(ctx);
  const persistedVehicle = await getVehicle(ctx.db, ctx.userId);
  let target: TeslaVehicleSummary | null;
  if (vehicleId) {
    target = vehicles.find((vehicle) => vehicle.id === vehicleId) ?? null;
  } else {
    target =
      pickTeslaVehicleForIdentity(vehicles, persistedVehicle) ??
      vehicles[0] ??
      null;
  }
  if (!target) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'No Tesla vehicle found for this account.',
    });
  }
  if (!target.vin) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'Selected Tesla vehicle is missing a VIN.',
    });
  }
  return { ...target, vin: target.vin };
}

export async function sendItineraryToTesla(
  ctx: TeslaAuthedContext,
  input: SendItineraryInput,
): Promise<SendItineraryResult> {
  const capability = getSendItineraryCapability();
  if (!capability.available) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message:
        capability.reason ??
        'Send to Tesla is not enabled for this deployment.',
    });
  }

  await assertTeslaCommandScope(ctx);
  const target = await resolveCommandVehicle(ctx, input.vehicleId);
  const waypoints = itineraryStopsToTeslaWaypoints(input.result);
  const accessToken = await getFreshAccessToken(
    ctx.db,
    teslaProvider,
    ctx.userId,
  );

  try {
    const command = await sendTeslaNavigationWaypoints({
      accessToken,
      vin: target.vin,
      waypoints,
    });
    return {
      sent: true,
      vehicleDisplayName: target.displayName,
      vinSuffix: vinSuffix(target.vin),
      stopCount: waypoints.length,
      command: command.command,
    };
  } catch (err) {
    if (err instanceof OAuthError) {
      throw mapTeslaCommandError(err);
    }
    throw err;
  }
}
