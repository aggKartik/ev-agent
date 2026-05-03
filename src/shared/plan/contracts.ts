import { z } from 'zod';
import { type Coordinate, coordinateSchema } from '#/lib/geoTypes';
import {
  PLAN_ACTIVITY_IDS,
  PLAN_DEFAULT_BATTERY_CAPACITY_KWH,
  PLAN_DEFAULT_CONNECTOR_TYPES,
  PLAN_DEFAULT_CONSUMPTION_WH_PER_MILE,
  PLAN_DEFAULT_POST_CHARGE_SOC_PERCENT,
  PLAN_DEFAULT_STARTING_SOC_PERCENT,
  PLAN_DEFAULT_TARGET_ARRIVAL_SOC_PERCENT,
  PLAN_DEFAULT_USABLE_RANGE_MILES,
  PLAN_DEFAULT_VEHICLE_LABEL,
} from './constants';

export { coordinateSchema, type Coordinate };

export const evConnectorSlugSchema = z.enum([
  'NACS',
  'CCS1',
  'J1772',
  'TYPE_2',
  'CHADEMO',
]);

export const planActivityIdSchema = z.enum(PLAN_ACTIVITY_IDS);

/**
 * Loose draft shape used by the plan form while the **Driver** is still
 * typing. The autocomplete supplies the `coordinate` only when a real
 * suggestion is selected; submission is gated by `planAddressSchema`
 * below, which requires it.
 */
export const planAddressDraftSchema = z.object({
  full: z.string(),
  primary: z.string().optional(),
  secondary: z.string().optional(),
  coordinate: coordinateSchema.optional(),
});

/**
 * Strict shape required at plan submit time — the **Driver** must pick
 * from autocomplete (or paste a coordinate) so EV routing has a real
 * start/destination to ground against. Free-text addresses with no
 * resolved coordinate are blocked by `planRequestSchema.safeParse` in
 * the form's `canPlan` check.
 */
export const planAddressSchema = z.object({
  full: z.string().min(1),
  primary: z.string().min(1).optional(),
  secondary: z.string().optional(),
  coordinate: coordinateSchema,
});

export const planActivitySelectionSchema = z.object({
  id: planActivityIdSchema,
  dwellMinutes: z.number().int().min(15).max(180),
});

export const planArrivalTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected 24h HH:MM');

export const planRequestSchema = z.object({
  from: planAddressSchema,
  to: planAddressSchema,
  activities: z.array(planActivitySelectionSchema).min(1),
  vehicleLabel: z.string().min(1).default(PLAN_DEFAULT_VEHICLE_LABEL),
  usableRangeMiles: z
    .number()
    .positive()
    .max(500)
    .default(PLAN_DEFAULT_USABLE_RANGE_MILES),
  /** Current pack state-of-charge (0–100) when the trip begins. */
  startingSocPercent: z
    .number()
    .min(0)
    .max(100)
    .default(PLAN_DEFAULT_STARTING_SOC_PERCENT),
  /** Minimum desired SOC % when arriving at the destination. */
  targetArrivalSocPercent: z
    .number()
    .min(0)
    .max(100)
    .default(PLAN_DEFAULT_TARGET_ARRIVAL_SOC_PERCENT),
  /** Approximate usable battery capacity (kWh). */
  batteryCapacityKWh: z
    .number()
    .positive()
    .max(250)
    .default(PLAN_DEFAULT_BATTERY_CAPACITY_KWH),
  /** Average traction energy use (Wh per mile); used when grounding charge spacing. */
  consumptionWhPerMile: z
    .number()
    .positive()
    .max(800)
    .default(PLAN_DEFAULT_CONSUMPTION_WH_PER_MILE),
  /** Connectors the vehicle accepts; forwarded to routing providers when supported. */
  connectorTypes: z
    .array(evConnectorSlugSchema)
    .min(1)
    .default([...PLAN_DEFAULT_CONNECTOR_TYPES]),
  /** Rough SOC target after each DC fast charge (for spacing subsequent legs). */
  postChargeSocPercent: z
    .number()
    .min(50)
    .max(100)
    .default(PLAN_DEFAULT_POST_CHARGE_SOC_PERCENT),
});

export const addressSuggestSchema = z.object({
  query: z.string(),
  sessionToken: z.string().min(1),
  proximity: coordinateSchema.optional(),
});

export const addressRetrieveSchema = z.object({
  providerId: z.string().min(1),
  sessionToken: z.string().min(1),
});

export const addressReverseGeocodeSchema = z.object({
  coordinate: coordinateSchema,
});

export const planStopKindSchema = z.enum([
  'start',
  'activity',
  'charge',
  'end',
]);

export const planStopSchema = z.object({
  id: z.string().min(1),
  kind: planStopKindSchema,
  name: z.string().min(1),
  shortName: z.string().min(1),
  sub: z.string().optional(),
  detail: z.string().optional(),
  activityId: planActivityIdSchema.optional(),
  iconKey: z.string().min(1),
  color: z.string().optional(),
  coordinate: coordinateSchema,
  driveMinutes: z.number().min(0),
  miles: z.number().min(0),
  dwellMinutes: z.number().min(0),
  arrivalTime: planArrivalTimeSchema,
});

export const planTotalsSchema = z.object({
  miles: z.number().min(0),
  driveMinutes: z.number().min(0),
  dwellMinutes: z.number().min(0),
  chargeStops: z.number().int().min(0),
  activityStops: z.number().int().min(0),
  arrivalTime: planArrivalTimeSchema,
});

export const planPhaseSchema = z.object({
  label: z.string().min(1),
  detail: z.string().min(1),
});

export const planResultSchema = z.object({
  id: z.string().min(1),
  request: planRequestSchema,
  geometry: z.array(coordinateSchema),
  stops: z.array(planStopSchema),
  totals: planTotalsSchema,
  phases: z.array(planPhaseSchema),
});

/** Model-facing structured output: same as PlanResult but `request` is injected server-side. */
export const planAgentModelResultSchema = planResultSchema.omit({
  request: true,
});

export type PlanAgentModelResult = z.infer<typeof planAgentModelResultSchema>;

export type PlanAddress = z.infer<typeof planAddressSchema>;
export type PlanAddressDraft = z.infer<typeof planAddressDraftSchema>;
export type PlanActivitySelection = z.infer<typeof planActivitySelectionSchema>;
export type PlanRequest = z.infer<typeof planRequestSchema>;
export type PlanStopKind = z.infer<typeof planStopKindSchema>;
export type PlanStop = z.infer<typeof planStopSchema>;
export type PlanPhase = z.infer<typeof planPhaseSchema>;
export type PlanResult = z.infer<typeof planResultSchema>;

export function mergePlanResultFromAgentOutput(
  output: PlanAgentModelResult,
  request: PlanRequest,
): PlanResult {
  return planResultSchema.parse({ ...output, request });
}
export type EvConnectorSlug = z.infer<typeof evConnectorSlugSchema>;

export type PlanActivityCatalog = {
  id: PlanActivitySelection['id'];
  label: string;
  color: string;
  description: string;
}[];

/**
 * The `plan.context` payload. Resolves the persistent **Vehicle Energy
 * Profile** server-side (catalog + overrides + driver preferences) so the
 * client form always boots from the **Driver**'s saved car. `currentLocation`
 * is `null` here — the client `useCurrentLocation` hook fills it from
 * Tesla GPS or `navigator.geolocation`.
 *
 * The full profile shape is re-exported from `#/shared/vehicles/contracts`
 * to avoid pulling vehicles into every plan-feature import.
 */
export type PlanContextResponse<TProfile> = {
  activities: PlanActivityCatalog;
  vehicleProfile: TProfile;
};

export type PlanStreamEvent =
  | { type: 'phase'; label: string; detail: string }
  | { type: 'narration'; message: string }
  | { type: 'stop'; stop: PlanStop }
  | { type: 'result'; result: PlanResult }
  | { type: 'error'; message: string };
