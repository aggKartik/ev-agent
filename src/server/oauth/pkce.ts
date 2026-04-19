import { createHash, randomBytes } from 'node:crypto';

/**
 * PKCE + state helpers (RFC 7636). All values are base64url-encoded so they
 * can be placed in cookies and URLs without further escaping.
 */

export function generateVerifier(): string {
  return randomBytes(32).toString('base64url');
}

export function generateChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

export function generateState(): string {
  return randomBytes(16).toString('base64url');
}
