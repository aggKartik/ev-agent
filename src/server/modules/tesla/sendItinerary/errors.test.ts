import type { TRPCError } from '@trpc/server';
import { describe, expect, it } from 'vitest';
import { OAuthError } from '#/server/oauth/errors';
import { mapTeslaCommandError } from './errors';

describe('mapTeslaCommandError', () => {
  it('maps known command precondition codes to PRECONDITION_FAILED', () => {
    for (const code of [
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
    ]) {
      const err = mapTeslaCommandError(new OAuthError(code, code));
      expect(err).toMatchObject({
        code: 'PRECONDITION_FAILED',
        message: code,
      } satisfies Partial<TRPCError>);
    }
  });

  it('maps partner registration preconditions separately', () => {
    expect(
      mapTeslaCommandError(new OAuthError('http_412', 'Fleet API 412.')),
    ).toMatchObject({
      code: 'PRECONDITION_REQUIRED',
      message: expect.stringContaining('Tesla Fleet partner is not registered'),
    } satisfies Partial<TRPCError>);
  });

  it('does not classify unrelated substring matches as preconditions', () => {
    expect(
      mapTeslaCommandError(
        new OAuthError('keynote_failure', 'Unexpected command failure.'),
      ),
    ).toMatchObject({
      code: 'BAD_GATEWAY',
      message: 'Unexpected command failure.',
    } satisfies Partial<TRPCError>);
  });
});
