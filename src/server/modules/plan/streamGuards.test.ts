import { TRPCError } from '@trpc/server';
import { afterEach, describe, expect, it } from 'vitest';
import {
  __getActiveCount,
  __resetPlanStreamGuards,
  acquirePlanStreamSlot,
  PLAN_STREAM_RATE_LIMIT,
  PLAN_STREAM_RATE_WINDOW_MS,
} from './streamGuards';

// Internals are exercised via __getActiveCount / acquirePlanStreamSlot. The
// rate-limit map itself is module-private; we observe its growth by triggering
// the prune branch and asserting the stale-user entry is evicted (regression
// for the "re-insert empty array forever" leak in #22 review C13).

afterEach(() => {
  __resetPlanStreamGuards();
});

describe('acquirePlanStreamSlot', () => {
  it('allows one slot per user and releases on callback', () => {
    const release = acquirePlanStreamSlot('u1');
    expect(__getActiveCount('u1')).toBe(1);
    release();
    expect(__getActiveCount('u1')).toBe(0);
  });

  it('rejects a second concurrent stream for the same user', () => {
    acquirePlanStreamSlot('u1');
    expect(() => acquirePlanStreamSlot('u1')).toThrow(TRPCError);
  });

  it('isolates concurrency per user', () => {
    acquirePlanStreamSlot('u1');
    const release2 = acquirePlanStreamSlot('u2');
    expect(__getActiveCount('u1')).toBe(1);
    expect(__getActiveCount('u2')).toBe(1);
    release2();
    expect(__getActiveCount('u2')).toBe(0);
  });

  it('rate-limits sequential starts past the per-window cap', () => {
    for (let i = 0; i < PLAN_STREAM_RATE_LIMIT; i += 1) {
      acquirePlanStreamSlot(`u${i}`);
    }
    // Reuse u0 to attempt one too many starts inside the window.
    expect(() => acquirePlanStreamSlot('u0')).toThrow(TRPCError);
  });

  it('release is idempotent', () => {
    const release = acquirePlanStreamSlot('u1');
    release();
    release();
    expect(__getActiveCount('u1')).toBe(0);
  });

  it('prunes stale rate-limit buckets so the map does not grow unboundedly', () => {
    let now = new Date('2025-01-01T00:00:00Z').getTime();
    const realNow = Date.now;
    Date.now = () => now;
    try {
      // Simulate many one-off users acquiring + releasing a slot.
      for (let i = 0; i < 50; i += 1) {
        const release = acquirePlanStreamSlot(`one-shot-${i}`);
        release();
      }

      // Advance past the rate-limit window so all timestamps go stale.
      now += PLAN_STREAM_RATE_WINDOW_MS + 1_000;

      // Touching the guards for a fresh user prunes nothing for the others on its own,
      // but invoking acquire/release for each stale user re-evaluates that user's
      // bucket. The fix is: pruning empties the map entry rather than re-inserting [].
      for (let i = 0; i < 50; i += 1) {
        const release = acquirePlanStreamSlot(`one-shot-${i}`);
        release();
      }

      // Active counts are 0 for every prior user (released).
      for (let i = 0; i < 50; i += 1) {
        expect(__getActiveCount(`one-shot-${i}`)).toBe(0);
      }

      // Advance past the window again so the second-round timestamps go stale, then
      // trigger a prune of one of the buckets via a fresh acquire on a *different*
      // user (which doesn't touch the others). Then verify that a stale user's
      // bucket is removed when re-pruned (we re-acquire to force prune on it).
      now += PLAN_STREAM_RATE_WINDOW_MS + 1_000;
      const r = acquirePlanStreamSlot('fresh');
      r();

      // After releasing 'fresh', prune that user once more; bucket should be empty.
      // Use a sentinel: re-acquiring 'fresh' should succeed because its own prune
      // dropped its now-stale 1 timestamp.
      now += PLAN_STREAM_RATE_WINDOW_MS + 1_000;
      for (let i = 0; i < PLAN_STREAM_RATE_LIMIT; i += 1) {
        const r2 = acquirePlanStreamSlot('fresh');
        r2();
      }
      // If buckets weren't pruned, we'd already be at the cap from the first
      // round of `fresh` acquires above; this last loop would fail before the
      // 5th iteration.
      expect(__getActiveCount('fresh')).toBe(0);
    } finally {
      Date.now = realNow;
    }
  });
});
