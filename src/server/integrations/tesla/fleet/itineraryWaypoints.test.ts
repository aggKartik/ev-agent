import { describe, expect, it } from 'vitest';
import {
  makePlanResult,
  makePlanStop,
  testPlanStop,
} from '#/shared/plan/testFactories';
import { itineraryStopsToTeslaWaypoints } from './itineraryWaypoints';

const endStop = makePlanStop({
  id: 'end',
  kind: 'end',
  name: 'End',
  coordinate: { lat: 38.1, lng: -121.1 },
});

describe('itineraryStopsToTeslaWaypoints', () => {
  it('preserves itinerary order and includes charge stops', () => {
    const waypoints = itineraryStopsToTeslaWaypoints(
      makePlanResult([
        testPlanStop,
        makePlanStop({
          id: 'charge',
          kind: 'charge',
          name: 'Fast Charge',
          coordinate: { lat: 37.5, lng: -121.5 },
        }),
        endStop,
      ]),
    );

    expect(waypoints).toEqual([
      { lat: 37.1, lon: -122.1, order: 1, name: 'Start' },
      { lat: 37.5, lon: -121.5, order: 2, name: 'Fast Charge' },
      { lat: 38.1, lon: -121.1, order: 3, name: 'End' },
    ]);
  });

  it('filters non-finite coordinates before ordering', () => {
    const waypoints = itineraryStopsToTeslaWaypoints(
      makePlanResult([
        testPlanStop,
        makePlanStop({
          id: 'bad',
          name: 'Bad coordinate',
          coordinate: { lat: Number.NaN, lng: -121.5 },
        }),
        endStop,
      ]),
    );

    expect(waypoints).toEqual([
      { lat: 37.1, lon: -122.1, order: 1, name: 'Start' },
      { lat: 38.1, lon: -121.1, order: 2, name: 'End' },
    ]);
  });

  it('rejects itineraries without at least two valid waypoints', () => {
    expect(() =>
      itineraryStopsToTeslaWaypoints(makePlanResult([testPlanStop])),
    ).toThrow(/at least a start and destination/);
  });
});
