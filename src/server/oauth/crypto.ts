import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * AES-256-GCM encryption for OAuth tokens.
 *
 * Every call to {@link encryptToken} generates a fresh 96-bit IV so the same
 * plaintext never produces the same ciphertext. The 128-bit auth tag is
 * stored alongside the ciphertext + IV and is verified on decrypt —
 * tampering with any of the three columns will throw.
 *
 * Master key is resolved lazily from `OAUTH_TOKEN_ENCRYPTION_KEY`. Accepts
 * either a base64-encoded 32-byte key (preferred) or a 64-char hex string.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const KEY_BYTES = 32;

export type EncryptedPayload = {
  ciphertext: Buffer;
  iv: Buffer;
  tag: Buffer;
};

function decodeMasterKey(raw: string): Buffer {
  const trimmed = raw.trim();

  if (/^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length === KEY_BYTES * 2) {
    return Buffer.from(trimmed, 'hex');
  }

  const fromBase64 = Buffer.from(trimmed, 'base64');
  if (fromBase64.length === KEY_BYTES) {
    return fromBase64;
  }

  throw new Error(
    'OAUTH_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes (base64 or hex).',
  );
}

export function resolveMasterKey(override?: string): Buffer {
  const raw = override ?? process.env.OAUTH_TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      'OAUTH_TOKEN_ENCRYPTION_KEY is not set; refusing to encrypt or decrypt OAuth tokens.',
    );
  }
  return decodeMasterKey(raw);
}

export function encryptToken(
  plaintext: string,
  options?: { key?: string },
): EncryptedPayload {
  const key = resolveMasterKey(options?.key);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return { ciphertext, iv, tag };
}

export function decryptToken(
  payload: EncryptedPayload,
  options?: { key?: string },
): string {
  const key = resolveMasterKey(options?.key);
  const decipher = createDecipheriv(ALGORITHM, key, payload.iv);
  decipher.setAuthTag(payload.tag);
  const plaintext = Buffer.concat([
    decipher.update(payload.ciphertext),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}
