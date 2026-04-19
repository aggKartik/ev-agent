/**
 * Typed errors emitted by the OAuth core. Handlers map these to HTTP
 * responses; tRPC procedures map them to TRPCError codes. Never include
 * raw token material in an error message.
 */

export class OAuthError extends Error {
  readonly code: string;

  constructor(code: string, description: string) {
    super(description || code);
    this.name = 'OAuthError';
    this.code = code;
  }
}

export class NotLinkedError extends Error {
  readonly provider: string;

  constructor(provider: string) {
    super(`No ${provider} account linked for this user.`);
    this.name = 'NotLinkedError';
    this.provider = provider;
  }
}

export type InvalidStateReason =
  | 'missing'
  | 'signature'
  | 'ttl'
  | 'state_mismatch'
  | 'user_mismatch'
  | 'provider_mismatch';

export class InvalidStateError extends Error {
  readonly reason: InvalidStateReason;

  constructor(reason: InvalidStateReason) {
    super(`Invalid OAuth state cookie: ${reason}`);
    this.name = 'InvalidStateError';
    this.reason = reason;
  }
}

export class UnknownProviderError extends Error {
  readonly slug: string;

  constructor(slug: string) {
    super(`No OAuth provider registered for slug "${slug}".`);
    this.name = 'UnknownProviderError';
    this.slug = slug;
  }
}
