import type { TeslaVehicleSummary } from './fleet-api';

/**
 * Tiny in-memory cache for Tesla Fleet API responses. Process-local; not
 * intended for multi-replica fan-out. The TTL is intentionally long (10 min,
 * Q13) so we don't keep waking sleeping vehicles every time the dashboard
 * mounts. The dashboard's Refresh button calls `invalidate(userId)` to
 * force a re-fetch.
 *
 * Keyed by internal `userId` so each Driver gets their own slot. Values are
 * the decoded `TeslaVehicleSummary[]` returned by `fetchVehiclesWithState`
 * — the same shape every consumer (dashboard panel, prefill, current
 * location) reads.
 */

const TESLA_TELEMETRY_TTL_MS = 10 * 60_000;

type Entry = {
  fetchedAt: number;
  value: TeslaVehicleSummary[];
};

const cache = new Map<number, Entry>();

export function getCached(userId: number): TeslaVehicleSummary[] | null {
  const entry = cache.get(userId);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > TESLA_TELEMETRY_TTL_MS) {
    cache.delete(userId);
    return null;
  }
  return entry.value;
}

function sweepExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.fetchedAt > TESLA_TELEMETRY_TTL_MS) cache.delete(key);
  }
}

export function setCached(userId: number, value: TeslaVehicleSummary[]): void {
  sweepExpiredEntries();
  cache.set(userId, { fetchedAt: Date.now(), value });
}

export function invalidate(userId: number): void {
  cache.delete(userId);
}
