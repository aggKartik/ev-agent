/**
 * Vitest global setup: ensure required env vars exist before any module under
 * test imports `#/lib/env`. Real values are not needed — the schema only
 * checks shape — so we use harmless test-only stubs.
 *
 * Do NOT add real secrets here.
 */

const TEST_ENV: Record<string, string> = {
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  GEMINI_API_KEY: 'test-gemini-key',
  MAPBOX_TOKEN: 'test-mapbox-token',
  TOMTOM_API_KEY: 'test-tomtom-key',
};

for (const [key, value] of Object.entries(TEST_ENV)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}
