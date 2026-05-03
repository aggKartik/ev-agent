import { useEffect } from 'react';
import type { PlanForm } from '#/features/plan/hooks/usePlanForm';
import type { PlanContextResponse } from '#/shared/plan/contracts';
import { startingSocPercentFromLiveBattery } from '#/shared/plan/vehicleStartingSoc';
import type { VehicleEnergyProfile } from '#/shared/vehicles/contracts';

/**
 * Keeps plan form vehicle fields aligned with `plan.context` when the
 * **Vehicle Energy Profile** or live Tesla SOC refetches.
 */
export function useSyncPlanVehicleFieldsFromContext(
  context: PlanContextResponse<VehicleEnergyProfile | null>,
  form: PlanForm,
): void {
  useEffect(() => {
    const p = context.vehicleProfile;
    if (!p) return;
    const startSoc = startingSocPercentFromLiveBattery(
      context.liveBatteryPercent,
    );
    form.setFieldValue('vehicleLabel', p.vehicleLabel);
    form.setFieldValue('usableRangeMiles', p.usableRangeMiles);
    form.setFieldValue('startingSocPercent', startSoc);
    form.setFieldValue(
      'targetArrivalSocPercent',
      p.preferences.targetArrivalSocPercent,
    );
    form.setFieldValue('batteryCapacityKWh', p.batteryCapacityKWh);
    form.setFieldValue('consumptionWhPerMile', p.consumptionWhPerMile);
    form.setFieldValue('connectorTypes', p.connectorTypes);
    form.setFieldValue(
      'postChargeSocPercent',
      p.preferences.postChargeSocPercent,
    );
  }, [context.vehicleProfile, context.liveBatteryPercent, form]);
}
