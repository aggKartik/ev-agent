import { TRPCError } from '@trpc/server';
import type { OAuthError } from '#/server/oauth/errors';

const PARTNER_PRECONDITION_MESSAGE =
  'Tesla Fleet partner is not registered for this domain, or the public key URL is not reachable. Set TESLA_FLEET_PUBLIC_KEY_PEM, verify it is served at /.well-known/appspecific/com.tesla.3p.public-key.pem on the same host as OAUTH_BASE_URL, then run bun run tesla:register-partner.';

function isCommandPreconditionCode(code: string): boolean {
  return (
    code === 'missing_command_proxy' ||
    code.includes('virtual') ||
    code.includes('key') ||
    code.includes('scope') ||
    code.includes('unauthorized') ||
    code.includes('forbidden')
  );
}

export function mapTeslaCommandError(err: OAuthError): TRPCError {
  const code = err.code.toLowerCase();
  if (code === 'http_412') {
    return new TRPCError({
      code: 'PRECONDITION_REQUIRED',
      message: PARTNER_PRECONDITION_MESSAGE,
      cause: err,
    });
  }
  if (isCommandPreconditionCode(code)) {
    return new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: err.message,
      cause: err,
    });
  }
  return new TRPCError({
    code: 'BAD_GATEWAY',
    message: err.message,
    cause: err,
  });
}
