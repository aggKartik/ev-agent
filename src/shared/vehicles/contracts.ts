import { z } from 'zod';
import {
  PLAN_DEFAULT_BATTERY_CAPACITY_KWH,
  PLAN_DEFAULT_CONNECTOR_TYPES,
  PLAN_DEFAULT_CONSUMPTION_WH_PER_MILE,
  PLAN_DEFAULT_POST_CHARGE_SOC_PERCENT,
  PLAN_DEFAULT_TARGET_ARRIVAL_SOC_PERCENT,
  PLAN_DEFAULT_USABLE_RANGE_MILES,
} from '#/shared/plan/constants';
import { evConnectorSlugSchema } from '#/shared/plan/contracts';

/**
 * Wire schemas for the persistent **Vehicle** + the read-time
 * **Energy Profile**. Rows are stamped from Fleet-derived identity at onboarding
 * (`vehicle.completeOnboardingFromTesla` → `completeOnboarding` store). Driver
 * updates use `upsertOverrides`. Outputs (`vehicle.get`, `plan.context`)
 * validate through these.
 */

const vehicleIdentitySchema = z.object({
  make: z.string().min(1).max(64),
  model: z.string().min(1).max(64),
  year: z.string().regex(/^\d{4}$/),
  vin: z.string().min(11).max(32).optional(),
  teslaVehicleId: z.string().min(1).max(64).optional(),
});

const vehicleOverridesSchema = z.object({
  usableRangeMiles: z.number().positive().max(500).nullable().optional(),
  batteryCapacityKWh: z.number().positive().max(250).nullable().optional(),
  consumptionWhPerMile: z.number().positive().max(800).nullable().optional(),
  connectorTypes: z.array(evConnectorSlugSchema).min(1).nullable().optional(),
});

export type VehicleOverrides = z.infer<typeof vehicleOverridesSchema>;

const vehiclePreferencesSchema = z.object({
  targetArrivalSocPercent: z
    .number()
    .min(0)
    .max(100)
    .default(PLAN_DEFAULT_TARGET_ARRIVAL_SOC_PERCENT),
  postChargeSocPercent: z
    .number()
    .min(50)
    .max(100)
    .default(PLAN_DEFAULT_POST_CHARGE_SOC_PERCENT),
});

const vehicleEnergyProfileSchema = z.object({
  identity: vehicleIdentitySchema,
  vehicleLabel: z.string().min(1),
  usableRangeMiles: z
    .number()
    .positive()
    .default(PLAN_DEFAULT_USABLE_RANGE_MILES),
  batteryCapacityKWh: z
    .number()
    .positive()
    .default(PLAN_DEFAULT_BATTERY_CAPACITY_KWH),
  consumptionWhPerMile: z
    .number()
    .positive()
    .default(PLAN_DEFAULT_CONSUMPTION_WH_PER_MILE),
  connectorTypes: z
    .array(evConnectorSlugSchema)
    .min(1)
    .default([...PLAN_DEFAULT_CONNECTOR_TYPES]),
  preferences: vehiclePreferencesSchema,
  /** Whether the catalog had a hit for (make, model, year). */
  hasCatalogMatch: z.boolean(),
});

export type VehicleEnergyProfile = z.infer<typeof vehicleEnergyProfileSchema>;

const completeOnboardingInputSchema = vehicleIdentitySchema;
export type CompleteOnboardingInput = z.infer<
  typeof completeOnboardingInputSchema
>;

export const completeOnboardingFromTeslaInputSchema = z.object({
  teslaVehicleId: z.string().min(1).max(64),
});

export const upsertOverridesInputSchema = z.object({
  overrides: vehicleOverridesSchema.optional(),
  preferences: vehiclePreferencesSchema.partial().optional(),
});
export type UpsertOverridesInput = z.infer<typeof upsertOverridesInputSchema>;
