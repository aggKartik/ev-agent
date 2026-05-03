/**
 * In-memory guards for the `plan.stream` subscription.
 *
 * Lives in a separate file so the limits are unit-testable and so the router
 * stays focused on event wiring.
 */

import { TRPCError } from '@trpc/server';

/** Max simultaneous plan streams per user. */
export const PLAN_STREAM_MAX_CONCURRENT = 1;

/** Max plan stream starts per user inside `PLAN_STREAM_RATE_WINDOW_MS`. */
export const PLAN_STREAM_RATE_LIMIT = 5;
export const PLAN_STREAM_RATE_WINDOW_MS = 60_000;

/** Maximum wall-clock duration of a single plan stream. */
export const PLAN_STREAM_TIMEOUT_MS = 90_000;

const activeStreamsByUser = new Map<string, number>();
const recentStartsByUser = new Map<string, number[]>();

/** Visible-for-testing reset of all guard state. */
export function __resetPlanStreamGuards(): void {
  activeStreamsByUser.clear();
  recentStartsByUser.clear();
}

/** Visible-for-testing read of the current concurrent count. */
export function __getActiveCount(userId: string): number {
  return activeStreamsByUser.get(userId) ?? 0;
}

function pruneRecentStarts(userId: string, now: number): number[] {
  const cutoff = now - PLAN_STREAM_RATE_WINDOW_MS;
  const existing = recentStartsByUser.get(userId) ?? [];
  const fresh = existing.filter((ts) => ts > cutoff);
  if (fresh.length === 0) {
    recentStartsByUser.delete(userId);
  } else {
    recentStartsByUser.set(userId, fresh);
  }
  return fresh;
}

/**
 * Reserve one plan-stream slot for `userId`. Throws a `TRPCError` if the user
 * is already at the concurrency or rate-limit cap.
 *
 * Returns a `release` callback the caller MUST invoke (in a `finally`) when
 * the stream finishes — successful or not — so the slot is freed.
 */
export function acquirePlanStreamSlot(userId: string): () => void {
  const now = Date.now();
  const recent = pruneRecentStarts(userId, now);
  if (recent.length >= PLAN_STREAM_RATE_LIMIT) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Too many plan requests; max ${PLAN_STREAM_RATE_LIMIT} per ${PLAN_STREAM_RATE_WINDOW_MS / 1000}s.`,
    });
  }

  const active = activeStreamsByUser.get(userId) ?? 0;
  if (active >= PLAN_STREAM_MAX_CONCURRENT) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message:
        'A plan is already streaming for this user; finish or cancel it before starting another.',
    });
  }

  activeStreamsByUser.set(userId, active + 1);
  recent.push(now);
  recentStartsByUser.set(userId, recent);

  let released = false;
  return () => {
    if (released) return;
    released = true;
    const current = activeStreamsByUser.get(userId) ?? 0;
    if (current <= 1) {
      activeStreamsByUser.delete(userId);
    } else {
      activeStreamsByUser.set(userId, current - 1);
    }
  };
}
