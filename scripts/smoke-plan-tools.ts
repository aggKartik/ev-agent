#!/usr/bin/env bun
/**
 * Manual smoke test: call each plan agent tool's execute() outside the LLM loop.
 *
 * Usage:
 *   bun run smoke:tools
 *   bun --env-file=.env run scripts/smoke-plan-tools.ts
 *   bun run scripts/smoke-plan-tools.ts --tools=narrate,ocm
 *
 * Simulate plan-stream EV prefetch (`computeEvRoute` → TomTom LDEV):
 *   bun run scripts/smoke-plan-tools.ts --tools=tomtom
 * Verbose LDEV diagnostics (second billed LDEV round-trip when key is set; respects --timeout):
 *   bun --env-file=.env run scripts/smoke-plan-tools.ts --tools=tomtom --verbose
 *   SMOKE_VERBOSE_TOMTOM=1 bun run scripts/smoke-plan-tools.ts --tools=tomtom
 */

import type { Tool } from 'ai';
import {
  type PlanStreamEvent,
  planRequestSchema,
} from '#/features/plan/contracts';
import { makeFindChargingStationsTool } from '#/server/ai/tools/findChargingStations';
import { makeGetDirectionsTool } from '#/server/ai/tools/getDirections';
import { makeNarrateProgressTool } from '#/server/ai/tools/narrateProgress';
import { makeSearchPlacesTool } from '#/server/ai/tools/searchPlaces';
import { computeEvRoute } from '#/server/evRouting/computeEvRoute';
import type { TomTomLdevPrefetchResult } from '#/server/evRouting/tomtomLongDistanceEv';
import { tryTomTomLongDistanceEvRouteDetailed } from '#/server/evRouting/tomtomLongDistanceEv';

const DEFAULT_TIMEOUT_MS = 25_000;

const SF = { lat: 37.7749, lng: -122.4194 };
const OAKLAND = { lat: 37.8044, lng: -122.2712 };

type ToolGroup = 'narrate' | 'ocm' | 'mapbox' | 'tomtom';

function parseArgs(argv: string[]): {
  groups: ReadonlySet<ToolGroup>;
  timeoutMs: number;
  verboseTomTom: boolean;
} {
  let timeoutMs = DEFAULT_TIMEOUT_MS;
  let verboseTomTomFlag = false;
  const groups = new Set<ToolGroup>();

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      console.log(`smoke-plan-tools — exercise plan-agent tool execute() handlers

Usage:
  bun run smoke:tools
  bun run scripts/smoke-plan-tools.ts [options]

Options:
  --tools=a,b,c   Comma list: narrate | ocm | mapbox | tomtom (default: all four)
                  mapbox covers searchPlaces + getDirections;
                  tomtom runs computeEvRoute (server prefetch → TomTom LDEV or straight-line fallback)
  --timeout=ms    Per-request abort for networked tools (${DEFAULT_TIMEOUT_MS})
  --verbose,-v    With --tools=tomtom: print LDEV diagnostics (requires a second billed
                  TomTom HTTP call when TOMTOM_API_KEY is set; first line is probe, then computeEvRoute).
                  Equivalent: env SMOKE_VERBOSE_TOMTOM=1
  -h, --help      This message

Mapbox tools skip with hint when MAPBOX_TOKEN is unset.
TomTom prefetch still runs without TOMTOM_API_KEY (expect straight_line_fallback + empty anchors).
`);
      process.exit(0);
    }
    if (arg.startsWith('--tools=')) {
      const list = arg.slice('--tools='.length).split(',');
      for (const key of list) {
        const k = key.trim().toLowerCase();
        if (k === 'narrate') groups.add('narrate');
        else if (k === 'ocm') groups.add('ocm');
        else if (k === 'mapbox') groups.add('mapbox');
        else if (k === 'tomtom' || k === 'prefetch') groups.add('tomtom');
        else if (k.length > 0) {
          console.error(
            `Unknown --tools segment: "${key}". Use narrate | ocm | mapbox | tomtom`,
          );
          process.exit(2);
        }
      }
      continue;
    }
    if (arg.startsWith('--timeout=')) {
      const n = Number(arg.slice('--timeout='.length));
      if (!Number.isFinite(n) || n <= 0) {
        console.error('--timeout must be a positive number (ms)');
        process.exit(2);
      }
      timeoutMs = n;
      continue;
    }
    if (arg === '--verbose' || arg === '-v') {
      verboseTomTomFlag = true;
      continue;
    }
    console.error(`Unexpected argument: ${arg}`);
    process.exit(2);
  }

  if (groups.size === 0) {
    groups.add('narrate');
    groups.add('ocm');
    groups.add('mapbox');
    groups.add('tomtom');
  }

  const verboseTomTom =
    verboseTomTomFlag ||
    ['1', 'true', 'yes'].includes(
      process.env.SMOKE_VERBOSE_TOMTOM?.trim().toLowerCase() ?? '',
    );

  return { groups, timeoutMs, verboseTomTom };
}

function summarizeTomTomDiag(
  r: TomTomLdevPrefetchResult,
): Record<string, unknown> {
  if (r.ok) {
    return {
      prefetchHttp: 'success',
      geometryPoints: r.data.geometry.length,
      distanceMeters: Math.round(r.data.distanceMeters),
      anchors: r.data.chargeAnchors.length,
    };
  }

  const out: Record<string, unknown> = {
    prefetchFailReason: r.reason,
  };
  if (r.httpStatus !== undefined) out.httpStatus = r.httpStatus;
  if (r.fetchError) out.fetchError = r.fetchError;
  if (r.responsePreview) out.responseBodyPreview = r.responsePreview;
  const parsed = r.parsed;
  const err =
    parsed && typeof parsed === 'object' && 'detailedError' in parsed
      ? (parsed as { detailedError?: unknown }).detailedError
      : undefined;
  if (err !== undefined) out.detailedError = err;

  return out;
}

async function runNarrate(): Promise<void> {
  const events: PlanStreamEvent[] = [];
  const t = makeNarrateProgressTool({
    emit: (e) => {
      events.push(e);
    },
  }) as Tool & {
    execute: (input: unknown, options?: unknown) => Promise<unknown>;
  };

  const out = await t.execute({
    phase: 'CLI smoke',
    detail: 'checking narrateProgress',
  });
  console.log(
    '✓ narrateProgress',
    JSON.stringify({ result: out, events }, null, 2),
  );
}

async function runOcm(signal: AbortSignal): Promise<void> {
  const t = makeFindChargingStationsTool({ signal }) as Tool & {
    execute: (input: unknown, options?: unknown) => Promise<unknown>;
  };

  const result = await t.execute({
    near: SF,
    radiusMiles: 5,
    minPowerKw: 50,
  });
  const data = result as { stations?: unknown[] };
  const stations = data.stations ?? [];
  console.log(
    '✓ findChargingStations',
    JSON.stringify(
      {
        count: stations.length,
        sample: stations.slice(0, 2),
      },
      null,
      2,
    ),
  );
}

async function runSearch(signal: AbortSignal): Promise<void> {
  const token = process.env.MAPBOX_TOKEN?.trim();
  if (!token) {
    console.log(
      '⊙ searchPlaces SKIP — set MAPBOX_TOKEN or use bun --env-file=.env',
    );
    return;
  }
  const t = makeSearchPlacesTool({ signal }) as Tool & {
    execute: (input: unknown, options?: unknown) => Promise<unknown>;
  };

  const result = await t.execute({
    query: 'coffee',
    near: SF,
    radiusMiles: 3,
    category: 'coffee',
  });
  const data = result as { candidates?: unknown[] };
  const candidates = data.candidates ?? [];
  console.log(
    '✓ searchPlaces',
    JSON.stringify(
      {
        count: candidates.length,
        sample: candidates.slice(0, 2),
      },
      null,
      2,
    ),
  );
}

/**
 * Mirrors plan.stream prefetch: hits TomTom when TOMTOM_API_KEY is set, else fallback corridor.
 */
async function runPrefetchEvRoute(
  signal: AbortSignal,
  verboseTomTom: boolean,
): Promise<void> {
  const keySet = !!process.env.TOMTOM_API_KEY?.trim();
  if (!keySet) {
    console.log(
      '⊙ tomtom (computeEvRoute) — TOMTOM_API_KEY unset; expecting straight_line_fallback',
    );
  } else if (verboseTomTom) {
    console.log(
      '! --verbose TomTom: LDEV diagnostics run before computeEvRoute (adds another billed LDEV request when key is set).',
    );
  }

  const request = planRequestSchema.parse({
    from: { full: 'San Francisco, CA', coordinate: SF },
    to: { full: 'Oakland, CA', coordinate: OAKLAND },
    dates: 'Today',
    activities: [{ id: 'coffee', dwellMinutes: 30 }],
    startingSocPercent: 55,
    targetArrivalSocPercent: 20,
    connectorTypes: ['NACS', 'CCS1'] as const,
  });

  if (verboseTomTom) {
    const diag = await tryTomTomLongDistanceEvRouteDetailed({
      request,
      origin: SF,
      destination: OAKLAND,
      signal,
    });
    console.log(
      '! TomTom LDEV raw outcome',
      JSON.stringify(summarizeTomTomDiag(diag), null, 2),
    );
  }

  const plan = await computeEvRoute(request, signal);
  const anchors = plan.chargeStopCandidates;
  console.log(
    `✓ computeEvRoute (prefetch/${plan.source}${keySet ? '' : ', no API key'})`,
    JSON.stringify(
      {
        source: plan.source,
        summaryText: plan.summaryText,
        totalDistanceMiles: plan.totalDistanceMiles,
        corridorPoints: plan.corridorGeometry.length,
        corridorEnds: [
          plan.corridorGeometry.at(0),
          plan.corridorGeometry.at(-1),
        ].filter(Boolean),
        chargeAnchorsCount: anchors.length,
        anchorSample: anchors.slice(0, 3).map((a) => ({
          ordinal: a.ordinal,
          near: { lat: a.coordinate.lat, lng: a.coordinate.lng },
          dwellMin: a.suggestedDwellMinutes,
          uuid: a.vendor?.tomTomChargingParkUuid,
        })),
      },
      null,
      2,
    ),
  );
}

async function runDirections(signal: AbortSignal): Promise<void> {
  const token = process.env.MAPBOX_TOKEN?.trim();
  if (!token) {
    console.log(
      '⊙ getDirections SKIP — set MAPBOX_TOKEN or use bun --env-file=.env',
    );
    return;
  }
  const t = makeGetDirectionsTool({ signal }) as Tool & {
    execute: (input: unknown, options?: unknown) => Promise<unknown>;
  };

  const result = await t.execute({
    waypoints: [SF, OAKLAND],
  });
  const row = result as {
    totalMiles?: number;
    totalMinutes?: number;
    legs?: unknown[];
    geometry?: unknown[];
  };
  const geomLen = Array.isArray(row.geometry) ? row.geometry.length : 0;
  console.log(
    '✓ getDirections',
    JSON.stringify(
      {
        totalMiles: row.totalMiles,
        totalMinutes: row.totalMinutes,
        legsCount: Array.isArray(row.legs) ? row.legs.length : 0,
        geometryPoints: geomLen,
        geometryFirst: Array.isArray(row.geometry)
          ? row.geometry[0]
          : undefined,
      },
      null,
      2,
    ),
  );
}

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
