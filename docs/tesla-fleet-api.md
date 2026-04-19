# Tesla Fleet API — Integration Research

This document captures how `ev-agent` integrates with Tesla's Fleet API using a
**partner-level developer application** to let any Tesla owner connect their
account during onboarding. It is the spec that the scaffold PR in this branch
implements (Clerk userId ↔ encrypted Tesla tokens ↔ Fleet API client).

Primary sources:

- [What is Fleet API?](https://developer.tesla.com/docs/fleet-api/getting-started/what-is-fleet-api)
- [Authentication overview & scopes](https://developer.tesla.com/docs/fleet-api/authentication/overview)
- [Third-Party Tokens](https://developer.tesla.com/docs/fleet-api/authentication/third-party-tokens)
- [Partner Tokens](https://developer.tesla.com/docs/fleet-api/authentication/partner-tokens)
- [Partner Endpoints](https://developer.tesla.com/docs/fleet-api/endpoints/partner-endpoints)
- [Best Practices](https://developer.tesla.com/docs/tesla-fleet-api/best-practices)
- [Regions / base URLs](https://developer.tesla.com/docs/fleet-api/getting-started/regions-countries#base-urls-by-region)

## 1. OAuth flow

We use the **authorization-code** grant documented in Third-Party Tokens. The
app is a confidential client (server holds `client_secret`), but we also send
standard PKCE `code_challenge` / `code_verifier` as defence-in-depth against
redirect-URI hijack + credential compromise. Tesla accepts the PKCE extension
parameters without complaint.

```
┌────────┐                                  ┌───────────────────────────┐
│Browser │                                  │ Tesla (auth.tesla.com)    │
└───┬────┘                                  └───────────┬───────────────┘
    │                                                   │
    │  1. click "Connect Tesla"                         │
    │  GET /api/oauth/tesla/connect (Clerk-protected)   │
    │  server: generate state + PKCE verifier           │
    │  server: sign + drop HttpOnly cookie              │
    │                                                   │
    │  2. 302 → auth.tesla.com/oauth2/v3/authorize      │
    │──────────────────────────────────────────────────>│
    │     response_type=code                            │
    │     client_id=$TESLA_CLIENT_ID                    │
    │     redirect_uri=$OAUTH_BASE_URL/api/oauth/tesla/callback │
    │     scope=openid offline_access vehicle_device_data│
    │     state=$STATE                                  │
    │     code_challenge=$CHAL code_challenge_method=S256│
    │                                                   │
    │  3. user authenticates + consents                 │
    │<──────────────────────────────────────────────────│
    │     302 → $OAUTH_BASE_URL/api/oauth/tesla/callback?code=&state= │
    │                                                   │
    │  4. GET /api/oauth/tesla/callback (Clerk-protected)  │
    │     server: verify signed cookie, state match,    │
    │             clerkUserId match                     │
    │                                                   │
┌───┴────┐         5. POST token exchange     ┌─────────┴──────────────┐
│Server  │────────────────────────────────────▶│fleet-auth.prd.vn.cloud │
│        │   grant_type=authorization_code     │.tesla.com/oauth2/v3/   │
│        │   client_id/secret, code, code_     │token                   │
│        │   verifier, audience, redirect_uri  │                        │
│        │<────────────────────────────────────│ access_token +         │
│        │   {access_token, refresh_token,     │ refresh_token + scope  │
│        │    expires_in, scope, id_token}     │ + expires_in           │
└───┬────┘                                    └────────────────────────┘
    │  6. encrypt(access) + encrypt(refresh) under AES-256-GCM
    │     upsert oauth_accounts row keyed by (provider='tesla', clerkUserId)
    │
    │  7. 302 → /onboarding?connected=tesla
    │          (UI renders "Connected" pill, vehicle picker, next)
```

### Endpoints used

| Step                     | URL                                                                   |
| ------------------------ | --------------------------------------------------------------------- |
| User authorize           | `https://auth.tesla.com/oauth2/v3/authorize`                          |
| Token exchange / refresh | `https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token`           |
| Fleet API (NA)           | `https://fleet-api.prd.na.vn.cloud.tesla.com`                         |
| Fleet API (EU)           | `https://fleet-api.prd.eu.vn.cloud.tesla.com`                         |

The Fleet API base URL for the region is also the `audience` parameter in
token exchange; it must match the region the customer's account is registered
in, otherwise Fleet API calls return `403`.

## 2. Scopes

For the MVP (list vehicles + read odometer + read state-of-charge) the only
scope that grants data access is `vehicle_device_data`. `openid` +
`offline_access` are required to receive an `id_token` and a `refresh_token`
respectively. We deliberately do **not** request `vehicle_cmds`,
`vehicle_charging_cmds`, or `user_data` — users see a shorter consent list
and we avoid the virtual-key pairing step below.

Effective scope string:

```
openid offline_access vehicle_device_data
```

Source: [Authentication overview — Scopes](https://developer.tesla.com/docs/fleet-api/authentication/overview#scopes) lists `vehicle_device_data` as
_"Access vehicle information and state, such as vehicle_data / vehicle_state /
charge_state"_.

### Virtual key pairing (not needed for read-only)

Virtual keys are only required for the command scopes (`vehicle_cmds`,
`vehicle_charging_cmds`). For read-only `vehicle_device_data` Tesla does not
prompt the user for key pairing and we do not pass `show_keypair_step=true`
on the authorize URL.

## 3. Partner domain registration + public key

The user has already provisioned a partner-level Tesla developer app
(client_id + client_secret issued at developer.tesla.com) and completed the
partner registration via `POST /api/1/partner_accounts`. Tesla requires:

- A partner access token minted from `POST /oauth2/v3/token` with
  `grant_type=client_credentials` and `audience=<fleet-api base URL>`.
- Registration body: `{ "domain": "app-host.example.com" }` (must match an
  `allowed_origin` root on developer.tesla.com).
- A PEM-encoded EC public key (secp256r1 / prime256v1) hosted at
  `https://<domain>/.well-known/appspecific/com.tesla.3p.public-key.pem`.
  Mandatory even for read-only integrations; Tesla validates the URL
  returns the PEM with no redirect.

Because this is already done, the scaffold does **not** include tooling for
partner registration. When we ship a second environment (e.g. preview
deploys), we will need to register that domain and host a matching PEM.

## 4. Rate limits + caching strategy

From Tesla's [Best Practices](https://developer.tesla.com/docs/tesla-fleet-api/best-practices):

- Requests are billed per vehicle per day with per-endpoint ceilings. Sustained
  polling above a few requests-per-minute gets throttled to `429 Too Many
  Requests`.
- `vehicle_data` wakes sleeping vehicles; calling it naively drains the
  battery.

Our strategy:

- **On-demand only in the scaffold.** The tRPC `tesla.vehicles` query hits
  Fleet API each time the onboarding UI asks for it. We rely on the user
  only landing on the CONNECT step a handful of times per session.
- **No background poller yet.** A future iteration will move to Fleet
  Telemetry streaming, which is the cost-safe primitive Tesla recommends.
- **Cache in React Query.** The client query stays mounted for the duration
  of the CONNECT step with a short `staleTime` — we never fan out per-tab.
- **Never wake sleeping vehicles on behalf of the UI.** If a vehicle is
  `offline`, we fall back to the `/vehicles` list entry and render it with
  null telemetry rather than issuing a wake command.

## 5. Refresh-token rotation

From the Third-Party Tokens doc:

> The refresh token is single use only and expires after 3 months. […] the
> most recently used refresh token is valid for up to 24 hours.

Our implementation (see `src/server/tesla/client.ts`):

1. Every Fleet API call first loads the encrypted row and decrypts the
   access token.
2. If `expires_at - now < 60s`, we use the decrypted refresh token to call
   `POST /oauth2/v3/token` with `grant_type=refresh_token` and re-encrypt
   both the new access + new refresh token atomically.
3. We always persist the rotated refresh token immediately — Tesla's 24h
   grace on the previous one is our safety net, not our contract.
4. The 3-month ceiling means we need a "re-connect" affordance in the
   dashboard; the scaffold already exposes `oauth.disconnect({ provider: 'tesla' })`.

## 6. Error cases

| Situation                            | What we surface                                              |
| ------------------------------------ | ------------------------------------------------------------ |
| User cancels consent                 | Redirect back with `?tesla=error&reason=access_denied`       |
| `state` missing / invalid / expired  | `?tesla=error&reason=invalid_state|state_mismatch`           |
| Cookie userId ≠ Clerk userId         | `?tesla=error&reason=user_mismatch` (prevents cookie pivot)  |
| `code` expired / reused              | `?tesla=error&reason=invalid_auth_code`                      |
| Refresh token rejected (`401`)       | tRPC `BAD_GATEWAY` + UI prompts user to reconnect             |
| Vehicle offline for `vehicle_data`   | Row falls back to null odometer / SoC (no wake command)      |
| User revokes in Tesla account        | Next refresh returns `invalid_grant` → we delete the row      |
| Fleet API 5xx                        | tRPC `BAD_GATEWAY`; React Query retries with backoff         |

## 7. Security considerations for token storage

Threats we care about:

1. Database compromise (cold storage / backup leak).
2. Application process memory dump.
3. Log aggregation accidentally ingesting a token.
4. Cross-user confusion via cookie pivot during OAuth callback.

Mitigations:

- **AES-256-GCM at rest.** `src/server/tesla/crypto.ts` encrypts both tokens
  with a 32-byte master key from `OAUTH_TOKEN_ENCRYPTION_KEY` (env). Each
  encryption generates a fresh 96-bit IV; the 128-bit GCM auth tag is stored
  alongside and verified on decrypt, so tampering with any of the three
  columns makes decryption throw rather than silently return garbage.
- **Separate storage columns.** Ciphertext, IV, and tag live in three
  dedicated `bytea` columns — not one concatenated blob — so PII scrubbers
  and index scanners don't accidentally wrap sensitive material.
- **Key isolation.** The master key never leaves the server process. The
  encryption helper derives a dedicated HMAC subkey for signing OAuth state
  cookies so cookie MACs can't be confused with token ciphertexts.
- **Rotation story.** Rotating the master key invalidates every stored row,
  so we require a "disconnect" + re-OAuth for affected users. The tRPC
  `oauth.disconnect({ provider: 'tesla' })` mutation supports this by deleting the row.
- **Never log raw tokens.** The OAuth helper throws typed `TeslaOAuthError`
  instances with only the upstream `error` code and `error_description`.
  Access / refresh tokens are never stringified into errors, console logs,
  or PR descriptions.
- **Clerk-bound cookie.** The signed `tesla_oauth_state` cookie carries the
  expected Clerk `userId`. The callback refuses to continue if that doesn't
  match the current session, even if the rest of the state signature is
  valid.
- **No client-side exposure.** Tokens only ever appear on the server; the
  tRPC router returns decoded payloads (odometer, SoC) — never the bearer
  token.

### Why AES-256-GCM (vs. pgcrypto / KMS envelope encryption)

For the scaffold we prioritise:

- **Deterministic dev setup.** A single env-var master key works on every
  developer laptop and in staging without additional infrastructure.
- **AEAD guarantees.** GCM gives us confidentiality + integrity in one pass,
  matching the threat model above.
- **Forward compatibility.** Moving to KMS envelope encryption later is a
  pure swap in `src/server/tesla/crypto.ts` because callers only see the
  `{ ciphertext, iv, tag }` shape.
