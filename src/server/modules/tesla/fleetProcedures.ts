import { TRPCError } from '@trpc/server';
import { getVehicle } from '#/server/capabilities/vehicles/store';
import { invalidate } from '#/server/integrations/tesla/fleet/cache';
import type { TeslaVehicleSummary } from '#/server/integrations/tesla/fleet/fleet-api';
import {
  fleetVehicleWithOnboardingIdentity,
  teslaPrefillVehicleFromFleetSummary,
} from '#/server/integrations/tesla/onboardingIdentity';
import { pickTeslaVehicleForIdentity } from '#/shared/vehicles/teslaPick';
import { loadTeslaFleetVehiclesProtected } from './loadFleetTrpc';
import type { TeslaAuthedContext } from './types';

async function loadVehiclesOrNullWhenUnlinked(
  ctx: TeslaAuthedContext,
): Promise<TeslaVehicleSummary[] | null> {
  try {
    return await loadTeslaFleetVehiclesProtected(ctx);
  } catch (err) {
    if (err instanceof TRPCError && err.code === 'PRECONDITION_FAILED') {
      return null;
    }
    throw err;
  }
}

async function pickDriverVehicle(
  ctx: TeslaAuthedContext,
  vehicles: TeslaVehicleSummary[],
): Promise<TeslaVehicleSummary | null> {
  const row = await getVehicle(ctx.db, ctx.userId);
  return pickTeslaVehicleForIdentity(vehicles, row) ?? vehicles[0] ?? null;
}

function hasVehicleLocation(
  vehicle: TeslaVehicleSummary | null,
): vehicle is TeslaVehicleSummary & {
  latitude: number;
  longitude: number;
} {
  if (!vehicle) {
    return false;
  }
  return vehicle.latitude !== null && vehicle.longitude !== null;
}

export async function listTeslaVehicles(ctx: TeslaAuthedContext) {
  const list = await loadTeslaFleetVehiclesProtected(ctx);
  return list.map(fleetVehicleWithOnboardingIdentity);
}

export async function refreshTeslaVehicles(ctx: TeslaAuthedContext) {
  invalidate(ctx.userId);
  const vehicles = await loadTeslaFleetVehiclesProtected(ctx);
  return {
    vehicles: vehicles.map(fleetVehicleWithOnboardingIdentity),
    refreshedAt: new Date().toISOString(),
  };
}

export async function getTeslaCurrentLocation(ctx: TeslaAuthedContext) {
  const vehicles = await loadVehiclesOrNullWhenUnlinked(ctx);
  if (!vehicles) {
    return null;
  }

  const target = await pickDriverVehicle(ctx, vehicles);
  if (!hasVehicleLocation(target)) {
    return null;
  }

  return {
    lat: target.latitude,
    lng: target.longitude,
    asOf: target.gpsAsOf,
  };
}

export async function getTeslaVehiclePrefill(ctx: TeslaAuthedContext) {
  const vehicles = await loadVehiclesOrNullWhenUnlinked(ctx);
  if (!vehicles) {
    return { linked: false as const };
  }

  const target = await pickDriverVehicle(ctx, vehicles);
  if (!target) {
    return { linked: true as const, vehicle: null };
  }

  return {
    linked: true as const,
    vehicle: teslaPrefillVehicleFromFleetSummary(target),
  };
}
