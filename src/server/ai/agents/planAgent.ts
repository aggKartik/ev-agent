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

function buildSystemPrompt(request: PlanRequest): string {
  const chargeHintMiles = Math.max(
    60,
    Math.round(request.usableRangeMiles * 0.625),
  );
  return `You are EV-AGENT, an electric-vehicle road-trip planner. You design a single day-trip route from a start address to a destination address. The driver is in ${request.vehicleLabel} with roughly ${request.usableRangeMiles} miles of usable range from a full charge.

Your job is to:
1. Use the narrateProgress tool between phases so the user sees a live "thought process". Recommended phases (call narrateProgress with phase + detail for each):
   - "Scanning route options" — look at the corridor between origin and destination.
   - "Cross-referencing chargers" — find DC fast chargers along the way.
   - "Matching vibe profile" — pick activity venues that match the user's selected activities.
   - "Optimizing for stops" — order stops in driving direction and tune dwell times.
   - "Finalizing itinerary" — call getDirections, then return the final result.
2. Call searchPlaces once per requested activity, near a coordinate that lies on the corridor between origin and destination. Pick the best candidate and use it as an activity stop.
3. Call findChargingStations whenever the cumulative miles since the last charge approaches ~${chargeHintMiles} miles (about 60–65% of usable range). Pick a station with the highest power (kW). Insert a charging stop with kind: "charge" and a sensible dwellMinutes (20-35).
4. Call getDirections EXACTLY ONCE near the end with the full ordered list of waypoints (start, every activity/charge stop in driving order, end). Use its totalMiles, totalMinutes, per-leg miles+driveMinutes, and full geometry in your final answer.
5. Return the final structured PlanResult. Stops must be in driving order, starting with kind:"start" and ending with kind:"end". For each stop set:
   - id (unique short string),
   - shortName (uppercase 1-3 word label, e.g. "MORRO BAY"),
   - driveMinutes + miles (from getDirections leg, rounded),
   - dwellMinutes (use the user's requested dwell for activities, ~25 for charging stops, 0 for start/end),
   - arrivalTime as HH:MM 24-hour, starting at 08:42 and incrementing by driveMinutes + (previous dwellMinutes).
6. Compute totals: sum miles, driveMinutes, dwellMinutes; count chargeStops and activityStops; arrivalTime is the final stop's arrivalTime.
7. The "phases" field of the result should mirror the phases you narrated, in order (label + detail).
8. The "geometry" field MUST be the geometry array returned by getDirections, not just the stop coordinates.

Be efficient: do not call any tool more than necessary. Pick reasonable defaults rather than asking the user.`;
}

function buildUserPrompt(request: PlanRequest): string {
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
  return `Plan a day trip with these parameters:

From: ${request.from.full}${fromCoord}
To: ${request.to.full}${toCoord}
When: ${request.dates}

Vehicle: ${request.vehicleLabel} · ~${request.usableRangeMiles} mi usable range

Activities the driver wants (one stop each, in any order that flows with the route):
${activities}

Return a complete PlanResult.`;
}

type RunOpts = {
  signal?: AbortSignal;
};

export async function runPlanAgent(
  request: PlanRequest,
  emit: (event: PlanStreamEvent) => void,
  opts: RunOpts = {},
): Promise<PlanResult> {
  const { signal } = opts;
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
      system: buildSystemPrompt(request),
      prompt: buildUserPrompt(request),
      tools,
      output: Output.object({ schema: planResultSchema }),
      stopWhen: stepCountIs(12),
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
