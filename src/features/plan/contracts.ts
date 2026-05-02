import { z } from 'zod';
import {
  PLAN_ACTIVITY_IDS,
  PLAN_DEFAULT_USABLE_RANGE_MILES,
  PLAN_DEFAULT_VEHICLE_LABEL,
} from './data';

export const coordinateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const planActivityIdSchema = z.enum(PLAN_ACTIVITY_IDS);

export const planAddressSchema = z.object({
  full: z.string().min(1),
  primary: z.string().min(1).optional(),
  secondary: z.string().optional(),
  coordinate: coordinateSchema.optional(),
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
  dates: z.string().min(1),
  activities: z.array(planActivitySelectionSchema).min(1),
  vehicleLabel: z.string().min(1).default(PLAN_DEFAULT_VEHICLE_LABEL),
  usableRangeMiles: z
    .number()
    .positive()
    .max(500)
    .default(PLAN_DEFAULT_USABLE_RANGE_MILES),
});

export const addressSuggestSchema = z.object({
  query: z.string().optional(),
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

export type Coordinate = z.infer<typeof coordinateSchema>;
export type PlanAddress = z.infer<typeof planAddressSchema>;
export type PlanActivitySelection = z.infer<typeof planActivitySelectionSchema>;
export type PlanRequest = z.infer<typeof planRequestSchema>;
export type PlanStopKind = z.infer<typeof planStopKindSchema>;
export type PlanStop = z.infer<typeof planStopSchema>;
export type PlanPhase = z.infer<typeof planPhaseSchema>;
export type PlanResult = z.infer<typeof planResultSchema>;

export type PlanCatalogResponse = {
  activities: {
    id: PlanActivitySelection['id'];
    label: string;
    color: string;
    description: string;
  }[];
  dateOptions: string[];
  carLocation: PlanAddress;
  defaultVehicleLabel: string;
  defaultUsableRangeMiles: number;
};

export type PlanStreamEvent =
  | { type: 'phase'; label: string; detail: string }
  | { type: 'narration'; message: string }
  | { type: 'stop'; stop: PlanStop }
  | { type: 'result'; result: PlanResult }
  | { type: 'error'; message: string };
