import { useForm } from '@tanstack/react-form';
import {
  PLAN_DEFAULT_BATTERY_CAPACITY_KWH,
  PLAN_DEFAULT_CONNECTOR_TYPES,
  PLAN_DEFAULT_CONSUMPTION_WH_PER_MILE,
  PLAN_DEFAULT_POST_CHARGE_SOC_PERCENT,
  PLAN_DEFAULT_TARGET_ARRIVAL_SOC_PERCENT,
  PLAN_DEFAULT_USABLE_RANGE_MILES,
  PLAN_DEFAULT_VEHICLE_LABEL,
} from '#/shared/plan/constants';
import type {
  EvConnectorSlug,
  PlanAddressDraft,
  PlanContextResponse,
  PlanRequest,
} from '#/shared/plan/contracts';
import { planRequestSchema } from '#/shared/plan/contracts';
import { startingSocPercentFromLiveBattery } from '#/shared/plan/vehicleStartingSoc';
import type { VehicleEnergyProfile } from '#/shared/vehicles/contracts';

type UsePlanFormArgs = {
  context: PlanContextResponse<VehicleEnergyProfile | null>;
  onSubmit: (request: PlanRequest) => void;
};

export type PlanFormValues = {
  from: PlanAddressDraft;
  to: PlanAddressDraft;
  activities: PlanRequest['activities'];
  vehicleLabel: PlanRequest['vehicleLabel'];
  usableRangeMiles: PlanRequest['usableRangeMiles'];
  startingSocPercent: PlanRequest['startingSocPercent'];
  targetArrivalSocPercent: PlanRequest['targetArrivalSocPercent'];
  batteryCapacityKWh: PlanRequest['batteryCapacityKWh'];
  consumptionWhPerMile: PlanRequest['consumptionWhPerMile'];
  connectorTypes: PlanRequest['connectorTypes'];
  postChargeSocPercent: PlanRequest['postChargeSocPercent'];
  fromLocked: boolean;
};

/** UI chip order matches common US EV configs first. */
export const CONNECTOR_OPTION_ORDER: EvConnectorSlug[] = [
  'NACS',
  'CCS1',
  'J1772',
  'TYPE_2',
  'CHADEMO',
];

/**
 * Plan form factory. Defaults derive from the resolved
 * **Vehicle Energy Profile** the server passed in `plan.context` so the
 * Driver never re-enters their car. When no profile is present (the
 * `/plan` route normally redirects to onboarding before that happens) the
 * platform `PLAN_DEFAULT_*` constants carry. Starting SOC prefers live Tesla
 * Fleet `liveBatteryPercent` when `plan.context` includes it.
 */
export function usePlanForm({ context, onSubmit }: UsePlanFormArgs) {
  const profile = context.vehicleProfile;
  const startingSocPercent = startingSocPercentFromLiveBattery(
    context.liveBatteryPercent,
  );
  return useForm({
    defaultValues: {
      from: { full: '' } as PlanAddressDraft,
      to: { full: '' } as PlanAddressDraft,
      activities: [] as PlanRequest['activities'],
      vehicleLabel: profile?.vehicleLabel ?? PLAN_DEFAULT_VEHICLE_LABEL,
      usableRangeMiles:
        profile?.usableRangeMiles ?? PLAN_DEFAULT_USABLE_RANGE_MILES,
      startingSocPercent,
      targetArrivalSocPercent:
        profile?.preferences.targetArrivalSocPercent ??
        PLAN_DEFAULT_TARGET_ARRIVAL_SOC_PERCENT,
      batteryCapacityKWh:
        profile?.batteryCapacityKWh ?? PLAN_DEFAULT_BATTERY_CAPACITY_KWH,
      consumptionWhPerMile:
        profile?.consumptionWhPerMile ?? PLAN_DEFAULT_CONSUMPTION_WH_PER_MILE,
      connectorTypes: profile?.connectorTypes ?? [
        ...PLAN_DEFAULT_CONNECTOR_TYPES,
      ],
      postChargeSocPercent:
        profile?.preferences.postChargeSocPercent ??
        PLAN_DEFAULT_POST_CHARGE_SOC_PERCENT,
      fromLocked: true as boolean,
    } satisfies PlanFormValues,
    onSubmit: ({ value }) => {
      const parsed = planRequestSchema.safeParse(value);
      if (!parsed.success) return;
      onSubmit(parsed.data);
    },
  });
}

export type PlanForm = ReturnType<typeof usePlanForm>;
