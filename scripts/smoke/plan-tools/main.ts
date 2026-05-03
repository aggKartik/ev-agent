#!/usr/bin/env bun
/**
 * Manual smoke test: call each plan agent tool's execute() outside the LLM loop.
 *
 * Usage:
 *   bun run smoke:tools
 *   bun --env-file=.env run scripts/smoke/plan-tools/main.ts
 *   bun run scripts/smoke/plan-tools/main.ts --tools=narrate,ocm
 *
 * Simulate plan-stream EV prefetch (`computeEvRoute` → TomTom LDEV):
 *   bun run scripts/smoke/plan-tools/main.ts --tools=tomtom
 * Verbose LDEV diagnostics (second billed LDEV round-trip when key is set; respects --timeout):
 *   bun --env-file=.env run scripts/smoke/plan-tools/main.ts --tools=tomtom --verbose
 *   SMOKE_VERBOSE_TOMTOM=1 bun run scripts/smoke/plan-tools/main.ts --tools=tomtom
 */

import { parseArgs } from './args';
import {
  runDirections,
  runNarrate,
  runOcm,
  runPrefetchEvRoute,
  runSearch,
} from './runners';

async function main() {
  const { groups, timeoutMs, verboseTomTom } = parseArgs(process.argv);
  const signal = AbortSignal.timeout(timeoutMs);
  let hadError = false;

  console.log(
    `smoke-plan-tools (${[...groups].sort().join(', ')}) timeout=${timeoutMs}ms\n`,
  );

  const tryRun = async (label: string, fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (e) {
      hadError = true;
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`✗ ${label} FAILED: ${msg}`);
    }
  };

  if (groups.has('narrate')) {
    await tryRun('narrateProgress', runNarrate);
  }
  if (groups.has('ocm')) {
    await tryRun('findChargingStations', () => runOcm(signal));
  }
  if (groups.has('mapbox')) {
    await tryRun('searchPlaces', () => runSearch(signal));
    await tryRun('getDirections', () => runDirections(signal));
  }
  if (groups.has('tomtom')) {
    await tryRun('computeEvRoute (TomTom prefetch)', () =>
      runPrefetchEvRoute(signal, verboseTomTom),
    );
  }

  if (hadError) {
    process.exit(1);
  }
  console.log('\nDone.');
}

await main();
