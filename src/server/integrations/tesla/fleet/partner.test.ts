import { afterEach, describe, expect, it, vi } from 'vitest';
import { OAuthError } from '#/server/oauth/errors';
import { mintPartnerAccessToken, registerPartnerDomain } from './partner';

describe('mintPartnerAccessToken', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns access_token on success', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: 'partner-at',
          token_type: 'Bearer',
          expires_in: 3600,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const out = await mintPartnerAccessToken({
      clientId: 'id',
      clientSecret: 'secret',
      region: 'na',
    });
    expect(out.accessToken).toBe('partner-at');
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0] as [string, RequestInit];
    expect(url).toContain('fleet-auth');
    expect(init.method).toBe('POST');
    expect(init.body).toContain('grant_type=client_credentials');
    expect(init.body).toContain(
      'audience=https%3A%2F%2Ffleet-api.prd.na.vn.cloud.tesla.com',
    );
  });

  it('throws OAuthError when token endpoint returns error JSON', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: 'unauthorized_client',
          error_description: 'Bad secret',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    await expect(
      mintPartnerAccessToken({
        clientId: 'id',
        clientSecret: 'wrong',
        region: 'eu',
      }),
    ).rejects.toMatchObject({
      name: 'OAuthError',
      code: 'unauthorized_client',
    });
  });
});

describe('registerPartnerDomain', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('POSTs domain to regional partner_accounts', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response('{}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await registerPartnerDomain({
      accessToken: 'pt',
      region: 'eu',
      domain: 'app.example.com',
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://fleet-api.prd.eu.vn.cloud.tesla.com/api/1/partner_accounts',
    );
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer pt',
      'Content-Type': 'application/json',
    });
    expect(init.body).toBe(JSON.stringify({ domain: 'app.example.com' }));
  });

  it('throws OAuthError with Fleet error body on failure', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: 'invalid_domain',
          error_description: 'PEM not found',
        }),
        { status: 412, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    try {
      await registerPartnerDomain({
        accessToken: 'pt',
        region: 'na',
        domain: 'bad.example',
      });
      expect.fail('expected throw');
    } catch (e) {
      expect(e).toBeInstanceOf(OAuthError);
      const err = e as OAuthError;
      expect(err.code).toBe('invalid_domain');
      expect(err.message).toContain('PEM');
    }
  });
});
