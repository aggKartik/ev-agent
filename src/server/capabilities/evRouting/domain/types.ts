import type { Coordinate } from '#/lib/geoTypes';

export type EvRoutePlanSource = 'tomtom_ld_ev' | 'straight_line_fallback';

export type EvChargeStopVendor = {
  tomTomChargingParkUuid?: string;
};

export type EvChargeStopCandidate = {
  ordinal: number;
  coordinate: Coordinate;
  rationale: string;
  suggestedDwellMinutes?: number;
  arrivingSocApprox?: number;
  departingSocApprox?: number;
  vendor?: EvChargeStopVendor;
};

export type EvRoutePlan = {
  source: EvRoutePlanSource;
  totalDistanceMiles: number;
  /** Route shape for corridor reasoning (may be subsampled in prompts). */
  corridorGeometry: Coordinate[];
  chargeStopCandidates: EvChargeStopCandidate[];
  /** Human + model context; keep concise. */
  summaryText: string;
};
