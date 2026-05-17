import type { TRPCError } from '@trpc/server';
import type { Kysely } from 'kysely';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OAuthError } from '#/server/oauth/errors';
import type { Database } from '#/server/platform/db/types';
import { makePlanResult } from '#/shared/plan/testFactories';
import { teslaRouter } from './router';

const mocks = vi.hoisted(() => ({
  getVehicle: vi.fn(),
  loadFleet: vi.fn(),
  getLinkedStatus: vi.fn(),
  getFreshAccessToken: vi.fn(),
  sendWaypoints: vi.fn(),
}));

vi.mock('#/server/capabilities/vehicles/store', () => ({
  getVehicle: mocks.getVehicle,
}));

vi.mock('#/server/modules/tesla/loadFleetTrpc', () => ({
  loadTeslaFleetVehiclesProtected: mocks.loadFleet,
}));

vi.mock('#/server/oauth/store', () => ({
  getLinkedStatus: mocks.getLinkedStatus,
  getFreshAccessToken: mocks.getFreshAccessToken,
}));

vi.mock('#/server/integrations/tesla/fleet/vehicleCommands', () => ({
  sendTeslaNavigationWaypoints: mocks.sendWaypoints,
}));

function caller() {
  return teslaRouter.createCaller({
    clerkUserId: 'clerk_123',
    db: {} as Kysely<Database>,
    getUserId: async () => 42,
    headers: new Headers(),
    userId: null,
  });
}

describe('teslaRouter.sendItinerary', () => {
  beforeEach(() => {
    mocks.getVehicle.mockReset();
    mocks.loadFleet.mockReset();
    mocks.getLinkedStatus.mockReset();
    mocks.getFreshAccessToken.mockReset();
    mocks.sendWaypoints.mockReset();

    mocks.getLinkedStatus.mockResolvedValue({
      linked: true,
      scope: 'openid offline_access vehicle_device_data vehicle_cmds',
      expiresAt: new Date(),
    });
    mocks.getVehicle.mockResolvedValue({
      teslaVehicleId: 'vehicle-1',
      vin: '5YJ3E1EA7PF000001',
    });
    mocks.loadFleet.mockResolvedValue([
      {
        id: 'vehicle-1',
        vin: '5YJ3E1EA7PF000001',
        displayName: 'Roadtrip Car',
      },
    ]);
    mocks.getFreshAccessToken.mockResolvedValue('fresh-token');
    mocks.sendWaypoints.mockResolvedValue({
      command: 'navigation_waypoints_request',
    });
  });

  it('rejects unlinked Tesla accounts', async () => {
    mocks.getLinkedStatus.mockResolvedValue({
      linked: false,
      scope: null,
      expiresAt: null,
    });

    await expect(
      caller().sendItinerary({ result: makePlanResult() }),
    ).rejects.toMatchObject({
      code: 'PRECONDITION_FAILED',
      message: 'Tesla account not linked.',
    } satisfies Partial<TRPCError>);
  });

  it('requires the vehicle_cmds OAuth scope', async () => {
    mocks.getLinkedStatus.mockResolvedValue({
      linked: true,
      scope: 'openid offline_access vehicle_device_data',
      expiresAt: new Date(),
    });

    await expect(
      caller().sendItinerary({ result: makePlanResult() }),
    ).rejects.toMatchObject({
      code: 'PRECONDITION_FAILED',
      message:
        'Tesla account must be reconnected with vehicle command access before sending navigation.',
    } satisfies Partial<TRPCError>);
  });

  it('requires a VIN for the selected vehicle', async () => {
    mocks.loadFleet.mockResolvedValue([
      { id: 'vehicle-1', vin: null, displayName: 'Roadtrip Car' },
    ]);

    await expect(
      caller().sendItinerary({ result: makePlanResult() }),
    ).rejects.toMatchObject({
      code: 'PRECONDITION_FAILED',
      message: 'Selected Tesla vehicle is missing a VIN.',
    } satisfies Partial<TRPCError>);
  });

  it('sends ordered waypoints to the selected Tesla', async () => {
    await expect(
      caller().sendItinerary({ result: makePlanResult() }),
    ).resolves.toEqual({
      sent: true,
      vehicleDisplayName: 'Roadtrip Car',
      vinSuffix: '000001',
      stopCount: 2,
      command: 'navigation_waypoints_request',
    });

    expect(mocks.getFreshAccessToken).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ slug: 'tesla' }),
      42,
    );
    expect(mocks.sendWaypoints).toHaveBeenCalledWith({
      accessToken: 'fresh-token',
      vin: '5YJ3E1EA7PF000001',
      waypoints: [
        { lat: 37.1, lon: -122.1, order: 1, name: 'Start' },
        { lat: 38.1, lon: -121.1, order: 2, name: 'End' },
      ],
    });
  });

  it('maps command sender failures to BAD_GATEWAY', async () => {
    mocks.sendWaypoints.mockRejectedValue(
      new OAuthError('vehicle_offline', 'Vehicle is offline.'),
    );

    await expect(
      caller().sendItinerary({ result: makePlanResult() }),
    ).rejects.toMatchObject({
      code: 'BAD_GATEWAY',
      message: 'Vehicle is offline.',
    } satisfies Partial<TRPCError>);
  });
});
