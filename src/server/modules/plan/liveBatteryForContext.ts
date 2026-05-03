import { TRPCError } from '@trpc/server';
import type { VehicleRow } from '#/server/capabilities/vehicles/domain/types';
import { loadTeslaFleetVehiclesProtected } from '#/server/modules/tesla/loadFleetTrpc';
import type { Context } from '#/server/platform/context';
import { pickTeslaVehicleForIdentity } from '#/shared/vehicles/teslaPick';

type AuthedCtx = Context & { userId: number };

const LIVE_BATTERY_TRPC_SILENT_CODES = new Set<string>([
  'PRECONDITION_FAILED',
  'PRECONDITION_REQUIRED',
  'BAD_GATEWAY',
]);

/**
 * Best-effort pack SOC % from Tesla Fleet for the Driver's persisted vehicle.
 * Returns `null` when Tesla is not linked or telemetry is missing.
 */
export async function liveBatteryPercentForPlanContext(args: {
  ctx: AuthedCtx;
  vehicle: VehicleRow | null;
}): Promise<number | null> {
  if (!args.vehicle) return null;
  try {
    const fleet = await loadTeslaFleetVehiclesProtected(args.ctx);
    const target =
      pickTeslaVehicleForIdentity(fleet, args.vehicle) ?? fleet[0] ?? null;
    return target?.usableBatteryLevel ?? target?.batteryLevel ?? null;
  } catch (err) {
    if (
      err instanceof TRPCError &&
      LIVE_BATTERY_TRPC_SILENT_CODES.has(err.code)
    ) {
      return null;
    }
    throw err;
  }
}
