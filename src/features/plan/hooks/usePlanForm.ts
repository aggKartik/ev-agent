import { useForm } from '@tanstack/react-form';
import type {
  EvConnectorSlug,
  PlanCatalogResponse,
  PlanRequest,
} from '#/features/plan/types/contracts';
import { planRequestSchema } from '#/features/plan/types/contracts';

type UsePlanFormArgs = {
  catalog: PlanCatalogResponse;
  onSubmit: (request: PlanRequest) => void;
};

export type PlanFormValues = {
  from: PlanRequest['from'];
  to: PlanRequest['to'];
  dates: PlanRequest['dates'];
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

export function usePlanForm({ catalog, onSubmit }: UsePlanFormArgs) {
  return useForm({
    defaultValues: {
      from: catalog.carLocation,
      to: { full: '' } as PlanRequest['to'],
      dates: catalog.dateOptions[0] ?? 'Flexible',
      activities: [] as PlanRequest['activities'],
      vehicleLabel: catalog.defaultVehicleLabel,
      usableRangeMiles: catalog.defaultUsableRangeMiles,
      startingSocPercent: catalog.defaultStartingSocPercent,
      targetArrivalSocPercent: catalog.defaultTargetArrivalSocPercent,
      batteryCapacityKWh: catalog.defaultBatteryCapacityKWh,
      consumptionWhPerMile: catalog.defaultConsumptionWhPerMile,
      connectorTypes: [...catalog.defaultConnectorTypes],
      postChargeSocPercent: catalog.defaultPostChargeSocPercent,
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
