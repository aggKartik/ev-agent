import type { EvRoutePlan } from '#/server/evRouting/types';

export function formatEvGroundingBlock(plan?: EvRoutePlan): string {
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
export function evPreplanPolicyBlock(plan?: EvRoutePlan): string {
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
