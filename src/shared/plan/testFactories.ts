import type { PlanResult, PlanStop } from './contracts';

export const testPlanStop = {
  id: 'start',
  kind: 'start',
  name: 'Start',
  shortName: 'Start',
  iconKey: 'start',
  coordinate: { lat: 37.1, lng: -122.1 },
  driveMinutes: 0,
  miles: 0,
  dwellMinutes: 0,
  arrivalTime: '09:00',
} satisfies PlanStop;

export function makePlanStop(partial: Partial<PlanStop> = {}): PlanStop {
  return { ...testPlanStop, ...partial };
}

export function makePlanResult(stops?: PlanStop[]): PlanResult {
  return {
    id: 'plan-1',
    request: {
      from: {
        full: 'Start',
        coordinate: { lat: 37.1, lng: -122.1 },
      },
      to: {
        full: 'End',
        coordinate: { lat: 38.1, lng: -121.1 },
      },
      activities: [
        {
          id: 'coffee',
          dwellMinutes: 30,
          targetRoutePercent: 50,
        },
      ],
      vehicleLabel: 'Tesla Model 3',
      usableRangeMiles: 280,
      startingSocPercent: 80,
      targetArrivalSocPercent: 20,
      batteryCapacityKWh: 75,
      consumptionWhPerMile: 250,
      connectorTypes: ['NACS'],
      postChargeSocPercent: 80,
    },
    stops: stops ?? [
      testPlanStop,
      makePlanStop({
        id: 'end',
        kind: 'end',
        name: 'End',
        shortName: 'End',
        coordinate: { lat: 38.1, lng: -121.1 },
      }),
    ],
    geometry: [],
    totals: {
      miles: 100,
      driveMinutes: 120,
      dwellMinutes: 30,
      chargeStops: 0,
      activityStops: 0,
      arrivalTime: '12:00',
    },
    phases: [],
  };
}
