import { useForm } from '@tanstack/react-form';
import { useEffect } from 'react';
import type {
  PlanCatalogResponse,
  PlanRequest,
} from '#/features/plan/contracts';
import { planRequestSchema } from '#/features/plan/contracts';

type UsePlanFormArgs = {
  catalog: PlanCatalogResponse;
  onSubmit: (request: PlanRequest) => void;
  onDraftChange?: (request: PlanRequest | null) => void;
};

export type PlanFormValues = {
  from: PlanRequest['from'];
  to: PlanRequest['to'];
  dates: PlanRequest['dates'];
  activities: PlanRequest['activities'];
};

export function usePlanForm({
  catalog,
  onSubmit,
  onDraftChange,
}: UsePlanFormArgs) {
  const form = useForm({
    defaultValues: {
      from: catalog.carLocation,
      to: { full: '' } as PlanRequest['to'],
      dates: catalog.dateOptions[0] ?? 'Flexible',
      activities: [] as PlanRequest['activities'],
    } satisfies PlanFormValues,
    onSubmit: ({ value }) => {
      const parsed = planRequestSchema.safeParse(value);
      if (!parsed.success) return;
      onSubmit(parsed.data);
    },
  });

  useEffect(() => {
    if (!onDraftChange) return;
    const publish = (values: PlanFormValues) => {
      if (values.from.full.trim().length === 0) {
        onDraftChange(null);
        return;
      }
      onDraftChange(values as PlanRequest);
    };
    publish(form.store.state.values);
    const subscription = form.store.subscribe(() => {
      publish(form.store.state.values);
    });
    return () => subscription.unsubscribe();
  }, [form, onDraftChange]);

  return form;
}
