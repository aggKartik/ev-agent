import { describe, expect, it } from 'vitest';
import { envSchema } from './env';

const baseEnv = {
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/ev_agent',
  OPENAI_API_KEY: 'sk-or-test',
  MAPBOX_TOKEN: 'pk.test',
  TOMTOM_API_KEY: 'tomtom-test',
};

describe('envSchema', () => {
  it('parses a minimal valid env using defaults', () => {
    const parsed = envSchema.parse(baseEnv);
    expect(parsed.NODE_ENV).toBe('development');
    expect(parsed.PORT).toBe('3000');
    expect(parsed.TESLA_REGION).toBe('na');
    expect(parsed.OPENAI_API_KEY).toBe('sk-or-test');
    expect(parsed.MAPBOX_TOKEN).toBe('pk.test');
    expect(parsed.TOMTOM_API_KEY).toBe('tomtom-test');
  });

  it('throws when DATABASE_URL is missing', () => {
    const { DATABASE_URL: _drop, ...rest } = baseEnv;
    expect(() => envSchema.parse(rest)).toThrow();
  });

  it('throws when OPENAI_API_KEY is missing', () => {
    const { OPENAI_API_KEY: _drop, ...rest } = baseEnv;
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

  it('accepts optional OPENAI_BASE_URL only when it is a valid URL', () => {
    expect(() =>
      envSchema.parse({ ...baseEnv, OPENAI_BASE_URL: 'not-a-url' }),
    ).toThrow();
    const parsed = envSchema.parse({
      ...baseEnv,
      OPENAI_BASE_URL: 'https://api.openai.com/v1',
    });
    expect(parsed.OPENAI_BASE_URL).toBe('https://api.openai.com/v1');
  });

  it('treats OPENAI_MODEL and OPENCHARGEMAP_KEY as optional', () => {
    const parsed = envSchema.parse(baseEnv);
    expect(parsed.OPENAI_MODEL).toBeUndefined();
    expect(parsed.OPENCHARGEMAP_KEY).toBeUndefined();
  });

  it('rejects empty / whitespace-only required secrets', () => {
    for (const key of [
      'OPENAI_API_KEY',
      'MAPBOX_TOKEN',
      'TOMTOM_API_KEY',
    ] as const) {
      expect(() => envSchema.parse({ ...baseEnv, [key]: '' })).toThrow();
      expect(() => envSchema.parse({ ...baseEnv, [key]: '   ' })).toThrow();
    }
  });
});
