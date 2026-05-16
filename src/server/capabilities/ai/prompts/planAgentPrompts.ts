import type { EvRoutePlan } from '#/server/capabilities/evRouting/domain/types';
import type { PlanRequest } from '#/shared/plan/contracts';
import { PLAN_ACTIVITY_CATALOG } from '#/shared/plan/data';
import {
  evPreplanPolicyBlock,
  formatEvGroundingBlock,
} from './planAgentEvGrounding';

export function buildSystemPrompt(
  request: PlanRequest,
  evRoutePlan?: EvRoutePlan,
): string {
  return `${evPreplanPolicyBlock(evRoutePlan)}You are EV-AGENT, an electric-vehicle road-trip planner. You produce a single day-trip route from origin to destination with charging + activity stops the driver will enjoy.

VEHICLE / ENERGY INPUTS (truth for reasoning):
- Usable-ish range sanity check: ~${request.usableRangeMiles} mi headline range (EPA-style; may differ from SoC math).
- Pack ≈ ${request.batteryCapacityKWh} kWh usable, starting SOC ${request.startingSocPercent}%, arrival floor ${request.targetArrivalSocPercent}%, modeled consumption ~${request.consumptionWhPerMile} Wh/mi (after charging assume ~${request.postChargeSocPercent}% unless tools say otherwise).
- Connectors accepted: ${request.connectorTypes.join(', ')} — prefer compatible DC fast chargers when calling findChargingStations.

TOOLS + STRATEGY
1. narrateProgress — send only short public-facing progress updates at meaningful checkpoints: route grounding, search areas, candidate counts, charger pairing, direction finalization, and fallback decisions. Do not stream hidden chain-of-thought, private deliberation, scoring matrices, or every internal reasoning step.
2. HONOUR EV_PREPLAN_JSON: The user message begins with corridorLatLngSample and chargeRegions. Use them whenever present; NEVER skip pairing user-requested activities with realistic charging hops.
   - TomTom-strong preplan with chargeRegions: Before each inserted activity tied to charging, searchPlaces with near≈chargeRegions[i].near (minor offset along driving direction OK) plus radii ~3–12 mi depending on density; pick POIs aligning with user's selected activities while keeping detours sane.
   - Weak / empty anchors: widen searchPlaces along corridorLatLngSample between origin/destination and pair findChargingStations hits with activities.
   - Always cross-check nearby DCFC using findChargingStations (minPowerKw≥120 when plausible).
3. Charging stops themselves: final coordinates must come from findChargingStations (or corroborated from search if incidental). Choose highest practical kW; dwellMinutes typically 22–38.
4. Activities: honour each catalog activity id exactly once unless impossible—then narrate omission.
5. getDirections MUST be called EXACTLY ONCE at the very end using the FINAL ordered waypoint list (start→ordered stops→end). You MUST populate PlanResult.geometry with the geometry returned by getDirections Mapbox tool (Road-following geometry is mandatory for UX).
6. Compose the structured result: id, geometry, stops (kind start/end/activity/charge), arrival sequencing starting 08:42, totals, mirrored phases narrative. Do NOT include a top-level "request" field — the server injects the submitted trip request.

EFFICIENCY: minimize redundant tool usage; consolidate searches when feasible. Keep progress narration concise and operational rather than explanatory.`;
}

export function buildUserPrompt(
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
When: today (single-day trip)

Vehicle label: ${request.vehicleLabel}
Energy model hints: SOC ${request.startingSocPercent}% → arrival floor ${request.targetArrivalSocPercent}%; pack ${request.batteryCapacityKWh} kWh; ~${request.consumptionWhPerMile} Wh/mi connectors [${request.connectorTypes.join(', ')}]

Activities the driver wants (one curated stop each, ordered along the driven route):
${activities}

Return a complete itinerary JSON object (id, geometry, stops, totals, phases only — no "request" field).`;
}
