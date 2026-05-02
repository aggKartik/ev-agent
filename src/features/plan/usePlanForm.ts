import { useForm } from '@tanstack/react-form';
import type {
  PlanCatalogResponse,
  PlanRequest,
} from '#/features/plan/contracts';
import { planRequestSchema } from '#/features/plan/contracts';

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
  fromLocked: boolean;
};

export function usePlanForm({ catalog, onSubmit }: UsePlanFormArgs) {
  return useForm({
    defaultValues: {
      from: catalog.carLocation,
      to: { full: '' } as PlanRequest['to'],
      dates: catalog.dateOptions[0] ?? 'Flexible',
      activities: [] as PlanRequest['activities'],
      vehicleLabel: catalog.defaultVehicleLabel,
      usableRangeMiles: catalog.defaultUsableRangeMiles,
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
