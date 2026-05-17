import type { Kysely } from 'kysely';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Database } from '#/server/platform/db/types';
import { makePlanResult } from '#/shared/plan/testFactories';
import { teslaRouter } from './router';
import { sendItineraryToTesla } from './sendItinerary/service';

vi.mock('./sendItinerary/service', () => ({
  sendItineraryToTesla: vi.fn(),
}));

const sendItineraryMock = vi.mocked(sendItineraryToTesla);

function caller() {
  return teslaRouter.createCaller({
    clerkUserId: 'clerk_123',
    db: {} as Kysely<Database>,
    getUserId: async () => 42,
    headers: new Headers(),
    userId: null,
  });
}

describe('teslaRouter', () => {
  beforeEach(() => {
    sendItineraryMock.mockReset();
  });

  it('delegates sendItinerary to the service', async () => {
    sendItineraryMock.mockResolvedValue({
      sent: true,
      vehicleDisplayName: 'Roadtrip Car',
      vinSuffix: '000001',
      stopCount: 2,
      command: 'navigation_waypoints_request',
    });
    const result = makePlanResult();

    await expect(caller().sendItinerary({ result })).resolves.toMatchObject({
      sent: true,
      stopCount: 2,
    });

    expect(sendItineraryMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 42 }),
      { result },
    );
  });
});
