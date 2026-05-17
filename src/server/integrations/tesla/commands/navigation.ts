import type { TeslaNavigationWaypoint } from '#/server/modules/tesla/sendItinerary/waypoints';
import { OAuthError } from '#/server/oauth/errors';
import { teslaCommandProxyUrl } from '../config';

export const TESLA_NAVIGATION_WAYPOINTS_COMMAND =
  'navigation_waypoints_request' as const;

export const TESLA_COMMAND_PROXY_TIMEOUT_MS = 10_000;

type FleetCommandResponse<T> = {
  response?: T;
  error?: string;
  error_description?: string;
};

type TeslaCommandResult = {
  result?: boolean;
  reason?: string;
};

export type SendNavigationWaypointsResult = {
  command: typeof TESLA_NAVIGATION_WAYPOINTS_COMMAND;
};

function requireTeslaCommandProxyUrl(): string {
  const url = teslaCommandProxyUrl();
  if (!url) {
    throw new OAuthError(
      'missing_command_proxy',
      'TESLA_COMMAND_PROXY_URL is required to send signed Tesla vehicle commands.',
    );
  }
  return url;
}

function parseCommandResponse<T>(
  text: string,
  status: number,
): FleetCommandResponse<T> {
  try {
    return JSON.parse(text) as FleetCommandResponse<T>;
  } catch {
    throw new OAuthError(
      'invalid_command_response',
      `Tesla command proxy returned non-JSON body (status ${status}).`,
    );
  }
}

function commandErrorMessage(body: FleetCommandResponse<TeslaCommandResult>) {
  const messages = [
    body.error_description,
    body.error,
    body.response?.reason,
  ].filter((message): message is string => Boolean(message));
  return messages[0] ?? 'Tesla command was rejected.';
}

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

export async function sendTeslaNavigationWaypoints(args: {
  accessToken: string;
  proxyUrl?: string;
  vin: string;
  waypoints: TeslaNavigationWaypoint[];
}): Promise<SendNavigationWaypointsResult> {
  const proxyUrl =
    args.proxyUrl?.replace(/\/+$/, '') ?? requireTeslaCommandProxyUrl();
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    TESLA_COMMAND_PROXY_TIMEOUT_MS,
  );
  let response: Response;

  try {
    response = await fetch(
      `${proxyUrl}/api/1/vehicles/${encodeURIComponent(
        args.vin,
      )}/command/${TESLA_NAVIGATION_WAYPOINTS_COMMAND}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${args.accessToken}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ waypoints: args.waypoints }),
        signal: controller.signal,
      },
    );
  } catch (err) {
    if (isAbortError(err)) {
      throw new OAuthError(
        'command_proxy_timeout',
        'Tesla command proxy timed out while sending navigation waypoints.',
      );
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  const body = parseCommandResponse<TeslaCommandResult>(text, response.status);

  if (!response.ok || typeof body.error === 'string') {
    const code =
      typeof body.error === 'string' ? body.error : `http_${response.status}`;
    throw new OAuthError(code, commandErrorMessage(body));
  }

  if (body.response === undefined) {
    throw new OAuthError(
      'invalid_command_response',
      'Tesla command proxy response was missing the `response` field.',
    );
  }

  if (body.response.result === false) {
    throw new OAuthError('command_rejected', commandErrorMessage(body));
  }

  return { command: TESLA_NAVIGATION_WAYPOINTS_COMMAND };
}
