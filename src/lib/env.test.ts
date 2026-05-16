import { describe, expect, it } from 'vitest';
import { envSchema } from './env';

const baseEnv = {
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/ev_agent',
  GEMINI_API_KEY: 'gemini-test',
  MAPBOX_TOKEN: 'pk.test',
  TOMTOM_API_KEY: 'tomtom-test',
};

describe('envSchema', () => {
  it('parses a minimal valid env using defaults', () => {
    const parsed = envSchema.parse(baseEnv);
    expect(parsed.NODE_ENV).toBe('development');
    expect(parsed.PORT).toBe('3000');
    expect(parsed.TESLA_REGION).toBe('na');
    expect(parsed.GEMINI_API_KEY).toBe('gemini-test');
    expect(parsed.MAPBOX_TOKEN).toBe('pk.test');
    expect(parsed.TOMTOM_API_KEY).toBe('tomtom-test');
  });

  it('throws when DATABASE_URL is missing', () => {
    const { DATABASE_URL: _drop, ...rest } = baseEnv;
    expect(() => envSchema.parse(rest)).toThrow();
  });

  it('throws when GEMINI_API_KEY is missing', () => {
    const { GEMINI_API_KEY: _drop, ...rest } = baseEnv;
    expect(() => envSchema.parse(rest)).toThrow();
  });

  it('throws when MAPBOX_TOKEN is missing', () => {
    const { MAPBOX_TOKEN: _drop, ...rest } = baseEnv;
    expect(() => envSchema.parse(rest)).toThrow();
  });

  it('throws when TOMTOM_API_KEY is missing', () => {
    const { TOMTOM_API_KEY: _drop, ...rest } = baseEnv;
    expect(() => envSchema.parse(rest)).toThrow();
  });

  it('rejects malformed DATABASE_URL', () => {
    expect(() =>
      envSchema.parse({ ...baseEnv, DATABASE_URL: 'not-a-url' }),
    ).toThrow();
  });

  it('rejects an unknown TESLA_REGION', () => {
    expect(() =>
      envSchema.parse({ ...baseEnv, TESLA_REGION: 'asia' }),
    ).toThrow();
  });

  it('rejects an unknown NODE_ENV', () => {
    expect(() =>
      envSchema.parse({ ...baseEnv, NODE_ENV: 'staging' }),
    ).toThrow();
  });

  it('treats GEMINI_MODEL and OPENCHARGEMAP_KEY as optional', () => {
    const parsed = envSchema.parse(baseEnv);
    expect(parsed.GEMINI_MODEL).toBeUndefined();
    expect(parsed.OPENCHARGEMAP_KEY).toBeUndefined();
  });

  it('accepts optional GEMINI_MODEL when provided', () => {
    const parsed = envSchema.parse({
      ...baseEnv,
      GEMINI_MODEL: 'gemini-2.5-flash',
    });
    expect(parsed.GEMINI_MODEL).toBe('gemini-2.5-flash');
  });

  it('rejects empty / whitespace-only required secrets', () => {
    for (const key of [
      'GEMINI_API_KEY',
      'MAPBOX_TOKEN',
      'TOMTOM_API_KEY',
    ] as const) {
      expect(() => envSchema.parse({ ...baseEnv, [key]: '' })).toThrow();
      expect(() => envSchema.parse({ ...baseEnv, [key]: '   ' })).toThrow();
    }
  });
});
