import { z } from 'zod';
import { PLAN_ACTIVITY_IDS } from './data';

export const coordinateSchema = z.object({
  lat: z.number(),
  lng: z.number(),
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

export const planRequestSchema = z.object({
  from: planAddressSchema,
  to: planAddressSchema,
  dates: z.string().min(1),
  activities: z.array(planActivitySelectionSchema).min(1),
});

export const addressSuggestSchema = z.object({
  query: z.string().optional(),
});

export type Coordinate = z.infer<typeof coordinateSchema>;
export type PlanAddress = z.infer<typeof planAddressSchema>;
export type PlanActivitySelection = z.infer<typeof planActivitySelectionSchema>;
export type PlanRequest = z.infer<typeof planRequestSchema>;

export type PlanCatalogResponse = {
  activities: {
    id: PlanActivitySelection['id'];
    label: string;
    color: string;
    description: string;
  }[];
  dateOptions: string[];
  carLocation: PlanAddress;
};

export type PlanStopKind = 'start' | 'activity' | 'charge' | 'end';

export type PlanStop = {
  id: string;
  kind: PlanStopKind;
  name: string;
  shortName: string;
  sub?: string;
  detail?: string;
  activityId?: PlanActivitySelection['id'];
  iconKey: string;
  color?: string;
  coordinate: Coordinate;
  driveMinutes: number;
  miles: number;
  dwellMinutes: number;
  arrivalTime: string;
};

export type PlanPhase = {
  label: string;
  detail: string;
};

export type PlanResult = {
  id: string;
  request: PlanRequest;
  geometry: Coordinate[];
  stops: PlanStop[];
  totals: {
    miles: number;
    driveMinutes: number;
    dwellMinutes: number;
    chargeStops: number;
    activityStops: number;
    arrivalTime: string;
  };
  phases: PlanPhase[];
};
