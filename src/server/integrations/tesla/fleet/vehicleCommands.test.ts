import { afterEach, describe, expect, it, vi } from 'vitest';
import type { OAuthError } from '#/server/oauth/errors';
import {
  sendTeslaNavigationWaypoints,
  TESLA_NAVIGATION_WAYPOINTS_COMMAND,
} from './vehicleCommands';

const fetchMock = vi.fn();

vi.stubGlobal('fetch', fetchMock);

const waypoints = [
  { lat: 37.1, lon: -122.1, order: 1, name: 'Start' },
  { lat: 38.1, lon: -121.1, order: 2, name: 'End' },
];

describe('sendTeslaNavigationWaypoints', () => {
  afterEach(() => {
    fetchMock.mockReset();
  });

  it('posts waypoints to the configured command proxy with bearer auth', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ response: { result: true } }), {
        status: 200,
      }),
    );

    await expect(
      sendTeslaNavigationWaypoints({
        accessToken: 'access-token',
        proxyUrl: 'https://proxy.example.test/',
        vin: '5YJ3E1EA7PF000001',
        waypoints,
      }),
    ).resolves.toEqual({ command: TESLA_NAVIGATION_WAYPOINTS_COMMAND });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://proxy.example.test/api/1/vehicles/5YJ3E1EA7PF000001/command/navigation_waypoints_request',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ waypoints }),
      }),
    );
  });

  it('maps Tesla proxy errors to OAuthError without exposing tokens', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          response: null,
          error: 'vehicle_offline',
          error_description: 'Vehicle is offline.',
        }),
        { status: 408 },
      ),
    );

    await expect(
      sendTeslaNavigationWaypoints({
        accessToken: 'secret-token',
        proxyUrl: 'https://proxy.example.test',
        vin: 'VIN',
        waypoints,
      }),
    ).rejects.toMatchObject({
      name: 'OAuthError',
      code: 'vehicle_offline',
      message: 'Vehicle is offline.',
    } satisfies Partial<OAuthError>);
  });

  it('rejects malformed proxy responses', async () => {
    fetchMock.mockResolvedValue(new Response('not-json', { status: 200 }));

    await expect(
      sendTeslaNavigationWaypoints({
        accessToken: 'access-token',
        proxyUrl: 'https://proxy.example.test',
        vin: 'VIN',
        waypoints,
      }),
    ).rejects.toMatchObject({
      code: 'invalid_command_response',
    });
  });
});
