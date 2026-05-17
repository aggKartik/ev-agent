import { TRPCError } from '@trpc/server';
import type { OAuthError } from '#/server/oauth/errors';

const PARTNER_PRECONDITION_MESSAGE =
  'Tesla Fleet partner is not registered for this domain, or the public key URL is not reachable. Set TESLA_FLEET_PUBLIC_KEY_PEM, verify it is served at /.well-known/appspecific/com.tesla.3p.public-key.pem on the same host as OAUTH_BASE_URL, then run bun run tesla:register-partner.';

const COMMAND_PRECONDITION_CODES = new Set([
  'missing_command_proxy',
  'missing_key',
  'virtual_key_missing',
  'virtual_key_not_installed',
  'vehicle_cmds_scope_missing',
  'insufficient_scope',
  'unauthorized',
  'forbidden',
  'http_401',
  'http_403',
]);

function isCommandPreconditionCode(code: string): boolean {
  return COMMAND_PRECONDITION_CODES.has(code);
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
