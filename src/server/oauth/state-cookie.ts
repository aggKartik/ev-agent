import { createHmac, timingSafeEqual } from 'node:crypto';
import { resolveMasterKey } from './crypto';
import { InvalidStateError } from './errors';

/**
 * Signed HttpOnly cookie carrying the OAuth state + PKCE verifier + Clerk
 * userId across the authorize→callback round-trip. Signed with HMAC-SHA256
 * over a subkey derived from the master encryption key so cookie MACs can
 * never be confused with token ciphertexts.
 */

const COOKIE_NAME = 'oauth_state';
const TTL_SECONDS = 60 * 10; // 10 minutes

export type StateCookiePayload = {
  provider: string;
  state: string;
  codeVerifier: string;
  clerkUserId: string;
  issuedAt: number;
};

function signingKey(options?: { key?: string }): Buffer {
  const master = resolveMasterKey(options?.key);
  return createHmac('sha256', master).update('oauth.state').digest();
}

function sign(payload: string, options?: { key?: string }): string {
  return createHmac('sha256', signingKey(options))
    .update(payload)
    .digest('base64url');
}

function verify(
  payload: string,
  signature: string,
  options?: { key?: string },
): boolean {
  const expected = Buffer.from(sign(payload, options));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length) {
    return false;
  }
  return timingSafeEqual(expected, actual);
}

function parseCookieHeader(header: string | null): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    out[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return out;
}

/**
 * Build a `Set-Cookie` header value carrying the signed state payload. The
 * cookie is HttpOnly + SameSite=Lax (so the OAuth callback redirect from
 * Tesla keeps the cookie) + Secure in production.
 */
export function buildStateCookie(
  payload: Omit<StateCookiePayload, 'issuedAt'>,
): string {
  const body: StateCookiePayload = { ...payload, issuedAt: Date.now() };
  const encoded = Buffer.from(JSON.stringify(body), 'utf8').toString(
    'base64url',
  );
  const signature = sign(encoded);
  const value = `${encoded}.${signature}`;
  const attrs = [
    `${COOKIE_NAME}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${TTL_SECONDS}`,
  ];
  if (process.env.NODE_ENV === 'production') {
    attrs.push('Secure');
  }
  return attrs.join('; ');
}

/**
 * Parse and verify the state cookie from the incoming request.
 *
 * Throws {@link InvalidStateError} on missing / tampered / expired /
 * provider-mismatched cookies. The caller is responsible for further binding
 * checks (e.g. state param match, Clerk userId match).
 */
export function readStateCookie(
  request: Request,
  expectedProvider: string,
): StateCookiePayload {
  const cookies = parseCookieHeader(request.headers.get('cookie'));
  const raw = cookies[COOKIE_NAME];
  if (!raw) {
    throw new InvalidStateError('missing');
  }

  const dot = raw.lastIndexOf('.');
  if (dot === -1) {
    throw new InvalidStateError('signature');
  }
  const encoded = raw.slice(0, dot);
  const signature = raw.slice(dot + 1);
  if (!verify(encoded, signature)) {
    throw new InvalidStateError('signature');
  }

  let parsed: StateCookiePayload;
  try {
    parsed = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    ) as StateCookiePayload;
  } catch {
    throw new InvalidStateError('signature');
  }

  if (
    typeof parsed.provider !== 'string' ||
    typeof parsed.state !== 'string' ||
    typeof parsed.codeVerifier !== 'string' ||
    typeof parsed.clerkUserId !== 'string' ||
    typeof parsed.issuedAt !== 'number'
  ) {
    throw new InvalidStateError('signature');
  }

  if (parsed.provider !== expectedProvider) {
    throw new InvalidStateError('provider_mismatch');
  }

  if (Date.now() - parsed.issuedAt > TTL_SECONDS * 1000) {
    throw new InvalidStateError('ttl');
  }

  return parsed;
}

export function clearStateCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
