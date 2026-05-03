import type { Tool } from 'ai';
import { makeFindChargingStationsTool } from '#/server/ai/tools/findChargingStations';
import { makeGetDirectionsTool } from '#/server/ai/tools/getDirections';
import { makeNarrateProgressTool } from '#/server/ai/tools/narrateProgress';
import { makeSearchPlacesTool } from '#/server/ai/tools/searchPlaces';
import { computeEvRoute } from '#/server/evRouting/computeEvRoute';
import type { TomTomLdevPrefetchResult } from '#/server/evRouting/tomtom/longDistanceEv';
import { tryTomTomLongDistanceEvRouteDetailed } from '#/server/evRouting/tomtom/longDistanceEv';
import {
  type PlanStreamEvent,
  planRequestSchema,
} from '#/shared/plan/contracts';
import { OAKLAND, SF } from './fixtures';

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

export async function runNarrate(): Promise<void> {
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

export async function runOcm(signal: AbortSignal): Promise<void> {
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

export async function runSearch(signal: AbortSignal): Promise<void> {
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
export async function runPrefetchEvRoute(
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

export async function runDirections(signal: AbortSignal): Promise<void> {
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
