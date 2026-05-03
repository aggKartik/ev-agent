import { OAuthError } from '#/server/oauth/errors';
import {
  TESLA_TOKEN_URL,
  type TeslaRegion,
  teslaFleetBaseUrl,
} from '../config';

type TokenEndpointJson = {
  access_token?: unknown;
  error?: unknown;
  error_description?: unknown;
};

type FleetApiEnvelope = {
  error?: string;
  error_description?: string;
};

function parseFleetFailure(
  status: number,
  text: string,
): { code: string; detail: string } {
  try {
    const body = JSON.parse(text) as FleetApiEnvelope;
    const code = typeof body.error === 'string' ? body.error : `http_${status}`;
    const detail =
      typeof body.error_description === 'string'
        ? body.error_description
        : `Fleet API responded ${status}.`;
    return { code, detail };
  } catch {
    return {
      code: `http_${status}`,
      detail: `Fleet API returned non-JSON body (status ${status}).`,
    };
  }
}

/**
 * Mint a **partner** access token (`client_credentials`) for Fleet API admin
 * calls such as `POST /api/1/partner_accounts`.
 *
 * @see https://developer.tesla.com/docs/fleet-api/authentication/partner-tokens
 */
export async function mintPartnerAccessToken(config: {
  clientId: string;
  clientSecret: string;
  region: TeslaRegion;
}): Promise<{ accessToken: string }> {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    audience: teslaFleetBaseUrl(config.region),
  });

  const response = await fetch(TESLA_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  });

  const text = await response.text();
  let json: TokenEndpointJson;
  try {
    json = JSON.parse(text) as TokenEndpointJson;
  } catch {
    throw new OAuthError(
      'invalid_token_response',
      `Tesla token endpoint returned non-JSON body (status ${response.status}).`,
    );
  }

  if (!response.ok) {
    const code =
      typeof json.error === 'string' ? json.error : `http_${response.status}`;
    const detail =
      typeof json.error_description === 'string'
        ? json.error_description
        : `Tesla token endpoint responded ${response.status}.`;
    throw new OAuthError(code, detail);
  }

  if (typeof json.access_token !== 'string' || json.access_token.length === 0) {
    throw new OAuthError(
      'invalid_token_response',
      'Tesla token endpoint returned no access_token for client_credentials.',
    );
  }

  return { accessToken: json.access_token };
}

/**
 * Register this app's domain with Tesla Fleet (partner account).
 * Requires the public key PEM to already be served at the well-known URL.
 *
 * @see https://developer.tesla.com/docs/fleet-api/endpoints/partner-endpoints#register
 */
export async function registerPartnerDomain(args: {
  accessToken: string;
  region: TeslaRegion;
  domain: string;
}): Promise<void> {
  const res = await fetch(
    `${teslaFleetBaseUrl(args.region)}/api/1/partner_accounts`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${args.accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ domain: args.domain }),
    },
  );

  const text = await res.text();
  if (!res.ok) {
    const { code, detail } = parseFleetFailure(res.status, text);
    throw new OAuthError(code, detail);
  }
}
