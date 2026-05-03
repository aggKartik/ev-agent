import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VehicleRow } from '#/server/capabilities/vehicles/domain/types';
import { liveBatteryPercentForPlanContext } from '#/server/modules/plan/liveBatteryForContext';
import { loadTeslaFleetVehiclesProtected } from '#/server/modules/tesla/loadFleetTrpc';
import type { Context } from '#/server/platform/context';

vi.mock('#/server/modules/tesla/loadFleetTrpc', () => ({
  loadTeslaFleetVehiclesProtected: vi.fn(),
}));

type AuthedCtx = Context & { userId: number };

const loadFleetMock = vi.mocked(loadTeslaFleetVehiclesProtected);

function fakeCtx(): AuthedCtx {
  return { userId: 1 } as AuthedCtx;
}

function fakeVehicle(): VehicleRow {
  return {
    id: 1,
    userId: 1,
    make: 'Tesla',
    model: '3',
    year: '2024',
    vin: null,
    teslaVehicleId: 'vid',
    targetArrivalSocPercent: 20,
    postChargeSocPercent: 80,
    overrideUsableRangeMiles: null,
    overrideBatteryCapacityKwh: null,
    overrideConsumptionWhPerMile: null,
    overrideConnectorTypes: null,
  };
}

describe('liveBatteryPercentForPlanContext', () => {
  beforeEach(() => {
    loadFleetMock.mockReset();
  });

  it('returns null when vehicle row is missing', async () => {
    await expect(
      liveBatteryPercentForPlanContext({ ctx: fakeCtx(), vehicle: null }),
    ).resolves.toBeNull();
    expect(loadFleetMock).not.toHaveBeenCalled();
  });

  for (const code of [
    'PRECONDITION_FAILED',
    'PRECONDITION_REQUIRED',
    'BAD_GATEWAY',
  ] as const) {
    it(`returns null on TRPCError ${code}`, async () => {
      loadFleetMock.mockRejectedValue(new TRPCError({ code, message: 'x' }));
      await expect(
        liveBatteryPercentForPlanContext({
          ctx: fakeCtx(),
          vehicle: fakeVehicle(),
        }),
      ).resolves.toBeNull();
    });
  }

  it('rethrows other TRPCError codes', async () => {
    loadFleetMock.mockRejectedValue(
      new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'x' }),
    );
    await expect(
      liveBatteryPercentForPlanContext({
        ctx: fakeCtx(),
        vehicle: fakeVehicle(),
      }),
    ).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
  });
});
