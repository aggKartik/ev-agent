import { Output, stepCountIs, streamText } from 'ai';
import {
  type PlanRequest,
  type PlanResult,
  type PlanStreamEvent,
  planResultSchema,
} from '#/features/plan/contracts';
import { PLAN_ACTIVITY_CATALOG } from '#/features/plan/data';
import { getPlanModel } from '#/server/ai/helpers';
import { makeFindChargingStationsTool } from '#/server/ai/tools/findChargingStations';
import { makeGetDirectionsTool } from '#/server/ai/tools/getDirections';
import { makeNarrateProgressTool } from '#/server/ai/tools/narrateProgress';
import { makeSearchPlacesTool } from '#/server/ai/tools/searchPlaces';
import type { EvRoutePlan } from '#/server/evRouting/types';

function formatEvGroundingBlock(plan?: EvRoutePlan): string {
  if (!plan) {
    return `EV_PREPLAN_JSON: {}
Note: TomTom prefetch did not produce a grounding block (missing TOMTOM_API_KEY or request error); rely on usableRangeMiles + corridor hints + aggressive findChargingStations/searchPlaces pairing.`;
  }

  const corridor = plan.corridorGeometry.map((p) => ({
    lat: Math.round(p.lat * 10000) / 10000,
    lng: Math.round(p.lng * 10000) / 10000,
  }));

  const anchors = plan.chargeStopCandidates.map((c) => ({
    ordinal: c.ordinal,
    near: {
      lat: Math.round(c.coordinate.lat * 10000) / 10000,
      lng: Math.round(c.coordinate.lng * 10000) / 10000,
    },
    rationale: c.rationale.slice(0, 220),
    suggestedDwellMinutes: c.suggestedDwellMinutes ?? 28,
    arrivingSocApprox: c.arrivingSocApprox,
    departingSocApprox: c.departingSocApprox,
    ...(c.vendor?.tomTomChargingParkUuid
      ? { tomTomChargingParkUuid: c.vendor.tomTomChargingParkUuid }
      : {}),
  }));

  return `EV_PREPLAN_JSON:
${JSON.stringify(
  {
    source: plan.source,
    totalDistanceMiles: Math.round(plan.totalDistanceMiles * 10) / 10,
    summaryText: plan.summaryText,
    corridorLatLngSample: corridor,
    chargeRegions: anchors,
  },
  null,
  2,
)}`;
}

/** EV preplan behavioural differences: TomTom LDEV anchors vs weak straight-line prefetch. */
function evPreplanPolicyBlock(plan?: EvRoutePlan): string {
  if (
    plan &&
    plan.source === 'tomtom_ld_ev' &&
    plan.chargeStopCandidates.length > 0
  ) {
    return `EV PREPLAN POLICY — TomTom LDEV
- chargeRegions[].near coordinates are LONG-DISTANCE EV ROUTING grounding (energy feasibility + suggested charging locality). Treat each as REQUIRED when picking DCFC-linked activity stops unless tools expose a contradiction in that vicinity (explain briefly and reconcile nearby).
`;
  }

  return `EV PREPLAN POLICY — WEAK CORRIDOR (no prefetch data)
- chargeRegions may be EMPTY or absent: do NOT pretend specific charging miles exist beyond user's usableRangeMiles × SoC sanity.
- You MUST proactively place chargers using findChargingStations(minPowerKw≥120 when corridors allow) keyed off corridorLatLngSample and origin/destination, then anchor searchPlaces for each catalog activity adjacent to whichever DCFC hops you validated.
`;
}

function buildSystemPrompt(
  request: PlanRequest,
  evRoutePlan?: EvRoutePlan,
): string {
  return `${evPreplanPolicyBlock(evRoutePlan)}You are EV-AGENT, an electric-vehicle road-trip planner. You produce a single day-trip route from origin to destination with charging + activity stops the driver will enjoy.

VEHICLE / ENERGY INPUTS (truth for reasoning):
- Usable-ish range sanity check: ~${request.usableRangeMiles} mi headline range (EPA-style; may differ from SoC math).
- Pack ≈ ${request.batteryCapacityKWh} kWh usable, starting SOC ${request.startingSocPercent}%, arrival floor ${request.targetArrivalSocPercent}%, modeled consumption ~${request.consumptionWhPerMile} Wh/mi (after charging assume ~${request.postChargeSocPercent}% unless tools say otherwise).
- Connectors accepted: ${request.connectorTypes.join(', ')} — prefer compatible DC fast chargers when calling findChargingStations.

TOOLS + STRATEGY
1. narrateProgress — call across phases ("EV route grounded", "Pairing stops at chargers", "Activity search fallback", "Finalizing itinerary").
2. HONOUR EV_PREPLAN_JSON: The user message begins with corridorLatLngSample and chargeRegions. Use them whenever present; NEVER skip pairing user-requested activities with realistic charging hops.
   - TomTom-strong preplan with chargeRegions: Before each inserted activity tied to charging, searchPlaces with near≈chargeRegions[i].near (minor offset along driving direction OK) plus radii ~3–12 mi depending on density; pick POIs aligning with user's selected activities while keeping detours sane.
   - Weak / empty anchors: widen searchPlaces along corridorLatLngSample between origin/destination and pair findChargingStations hits with activities.
   - Always cross-check nearby DCFC using findChargingStations (minPowerKw≥120 when plausible).
3. Charging stops themselves: final coordinates must come from findChargingStations (or corroborated from search if incidental). Choose highest practical kW; dwellMinutes typically 22–38.
4. Activities: honour each catalog activity id exactly once unless impossible—then narrate omission.
5. getDirections MUST be called EXACTLY ONCE at the very end using the FINAL ordered waypoint list (start→ordered stops→end). You MUST populate PlanResult.geometry with the geometry returned by getDirections Mapbox tool (Road-following geometry is mandatory for UX).
6. Compose PlanResult totals, stops (kind start/end/activity/charge), arrival sequencing starting 08:42, totals, mirrored phases narrative.

EFFICIENCY: minimize redundant tool usage; consolidate searches when feasible.`;
}

function buildUserPrompt(
  request: PlanRequest,
  evRoutePlan?: EvRoutePlan,
): string {
  const fromCoord = request.from.coordinate
    ? ` (${request.from.coordinate.lat.toFixed(4)}, ${request.from.coordinate.lng.toFixed(4)})`
    : '';
  const toCoord = request.to.coordinate
    ? ` (${request.to.coordinate.lat.toFixed(4)}, ${request.to.coordinate.lng.toFixed(4)})`
    : '';
  const activities = request.activities
    .map((selection) => {
      const catalog = PLAN_ACTIVITY_CATALOG.find((c) => c.id === selection.id);
      return `- ${selection.id} (${catalog?.label ?? selection.id}) · dwell ${selection.dwellMinutes} min`;
    })
    .join('\n');

  return `${formatEvGroundingBlock(evRoutePlan)}

Plan a day trip with these parameters:

From: ${request.from.full}${fromCoord}
To: ${request.to.full}${toCoord}
When: ${request.dates}

Vehicle label: ${request.vehicleLabel}
Energy model hints: SOC ${request.startingSocPercent}% → arrival floor ${request.targetArrivalSocPercent}%; pack ${request.batteryCapacityKWh} kWh; ~${request.consumptionWhPerMile} Wh/mi connectors [${request.connectorTypes.join(', ')}]

Activities the driver wants (one curated stop each, ordered along the driven route):
${activities}

Return a complete PlanResult.`;
}

type RunOpts = {
  signal?: AbortSignal;
  evRoutePlan?: EvRoutePlan;
};

export async function runPlanAgent(
  request: PlanRequest,
  emit: (event: PlanStreamEvent) => void,
  opts: RunOpts = {},
): Promise<PlanResult> {
  const { signal, evRoutePlan } = opts;
  const seenStopIds = new Set<string>();
  const tools = {
    narrateProgress: makeNarrateProgressTool({ emit }),
    searchPlaces: makeSearchPlacesTool({ signal }),
    findChargingStations: makeFindChargingStationsTool({ signal }),
    getDirections: makeGetDirectionsTool({ signal }),
  };

  try {
    const result = streamText({
      model: getPlanModel(),
      system: buildSystemPrompt(request, evRoutePlan),
      prompt: buildUserPrompt(request, evRoutePlan),
      tools,
      output: Output.object({ schema: planResultSchema }),
      stopWhen: stepCountIs(14),
      abortSignal: signal,
    });

    for await (const partial of result.partialOutputStream) {
      const stops = partial?.stops;
      if (!Array.isArray(stops)) continue;
      for (const stop of stops) {
        if (!stop || typeof stop !== 'object') continue;
        const candidate = stop as { id?: string };
        if (typeof candidate.id !== 'string') continue;
        if (seenStopIds.has(candidate.id)) continue;
        const parsed = planResultSchema.shape.stops.element.safeParse(stop);
        if (!parsed.success) continue;
        seenStopIds.add(parsed.data.id);
        emit({ type: 'stop', stop: parsed.data });
      }
    }

    const finalResult = await result.output;
    emit({ type: 'result', result: finalResult });
    return finalResult;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Plan agent failed';
    emit({ type: 'error', message });
    throw error;
  }
}
