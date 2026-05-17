import { TRPCError } from '@trpc/server';
import type { Kysely } from 'kysely';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TeslaVehicleSummary } from '#/server/integrations/tesla/fleet/fleet-api';
import type { Database } from '#/server/platform/db/types';
import {
  getTeslaCurrentLocation,
  getTeslaVehiclePrefill,
  listTeslaVehicles,
  refreshTeslaVehicles,
} from './fleetProcedures';

const mocks = vi.hoisted(() => ({
  getVehicle: vi.fn(),
  invalidate: vi.fn(),
  loadFleet: vi.fn(),
}));

vi.mock('#/server/capabilities/vehicles/store', () => ({
  getVehicle: mocks.getVehicle,
}));

vi.mock('#/server/integrations/tesla/fleet/cache', () => ({
  invalidate: mocks.invalidate,
}));

vi.mock('#/server/modules/tesla/loadFleetTrpc', () => ({
  loadTeslaFleetVehiclesProtected: mocks.loadFleet,
}));

const vehicleOne: TeslaVehicleSummary = {
  id: 'vehicle-1',
  vin: '5YJ3E1EA7PF000001',
  displayName: 'Primary',
  state: 'online',
  odometerMi: null,
  batteryLevel: null,
  usableBatteryLevel: null,
  chargeLimitSoc: null,
  batteryRangeMi: null,
  latitude: 37.1,
  longitude: -122.1,
  gpsAsOf: '2026-05-17T12:00:00.000Z',
};

const vehicleTwo: TeslaVehicleSummary = {
  ...vehicleOne,
  id: 'vehicle-2',
  vin: '5YJ3E1EA7PF000002',
  displayName: 'Selected',
  latitude: 38.2,
  longitude: -121.2,
  gpsAsOf: '2026-05-17T12:05:00.000Z',
};

function ctx() {
  return {
    clerkUserId: 'clerk_123',
    db: {} as Kysely<Database>,
    getUserId: async () => 42,
    headers: new Headers(),
    userId: 42,
  };
}

describe('tesla fleet procedures', () => {
  beforeEach(() => {
    mocks.getVehicle.mockReset();
    mocks.invalidate.mockReset();
    mocks.loadFleet.mockReset();

    mocks.getVehicle.mockResolvedValue(null);
    mocks.loadFleet.mockResolvedValue([vehicleOne, vehicleTwo]);
  });

  it('decorates vehicles for the client list', async () => {
    await expect(listTeslaVehicles(ctx())).resolves.toEqual([
      {
        ...vehicleOne,
        onboardingIdentity: expect.objectContaining({
          id: 'vehicle-1',
          make: 'Tesla',
        }),
      },
      {
        ...vehicleTwo,
        onboardingIdentity: expect.objectContaining({
          id: 'vehicle-2',
          make: 'Tesla',
        }),
      },
    ]);
  });

  it('invalidates cache before refreshing vehicles', async () => {
    await expect(refreshTeslaVehicles(ctx())).resolves.toMatchObject({
      vehicles: [{ id: 'vehicle-1' }, { id: 'vehicle-2' }],
      refreshedAt: expect.any(String),
    });

    expect(mocks.invalidate).toHaveBeenCalledWith(42);
    expect(mocks.loadFleet).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 42 }),
    );
  });

  it('returns null current location when Tesla is not linked', async () => {
    mocks.loadFleet.mockRejectedValue(
      new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Tesla account not linked.',
      }),
    );

    await expect(getTeslaCurrentLocation(ctx())).resolves.toBeNull();
  });

  it('rethrows current location upstream errors', async () => {
    mocks.loadFleet.mockRejectedValue(
      new TRPCError({
        code: 'BAD_GATEWAY',
        message: 'Fleet API failed.',
      }),
    );

    await expect(getTeslaCurrentLocation(ctx())).rejects.toMatchObject({
      code: 'BAD_GATEWAY',
    });
  });

  it('returns the selected vehicle current location', async () => {
    mocks.getVehicle.mockResolvedValue({
      teslaVehicleId: 'vehicle-2',
      vin: '5YJ3E1EA7PF000002',
    });

    await expect(getTeslaCurrentLocation(ctx())).resolves.toEqual({
      lat: 38.2,
      lng: -121.2,
      asOf: '2026-05-17T12:05:00.000Z',
    });
  });

  it('returns null current location when the selected vehicle has no GPS fix', async () => {
    mocks.loadFleet.mockResolvedValue([
      { ...vehicleOne, latitude: null, longitude: -122.1 },
    ]);

    await expect(getTeslaCurrentLocation(ctx())).resolves.toBeNull();
  });

  it('reports vehicle prefill as unlinked for unlinked Tesla accounts', async () => {
    mocks.loadFleet.mockRejectedValue(
      new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Tesla account not linked.',
      }),
    );

    await expect(getTeslaVehiclePrefill(ctx())).resolves.toEqual({
      linked: false,
    });
  });

  it('returns linked prefill with no vehicle when Fleet has no vehicles', async () => {
    mocks.loadFleet.mockResolvedValue([]);

    await expect(getTeslaVehiclePrefill(ctx())).resolves.toEqual({
      linked: true,
      vehicle: null,
    });
  });

  it('returns prefill for the selected vehicle', async () => {
    mocks.getVehicle.mockResolvedValue({
      teslaVehicleId: 'vehicle-2',
      vin: '5YJ3E1EA7PF000002',
    });

    await expect(getTeslaVehiclePrefill(ctx())).resolves.toMatchObject({
      linked: true,
      vehicle: {
        id: 'vehicle-2',
        vin: '5YJ3E1EA7PF000002',
        displayName: 'Selected',
        make: 'Tesla',
      },
    });
  });
});
