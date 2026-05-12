import { describe, expect, it } from 'vitest';
import type { PlanStop } from '#/shared/plan/contracts';
import { buildStopTimelineItems } from './timelineItems';

function makeStop(id: string, kind: PlanStop['kind']): PlanStop {
  return {
    id,
    kind,
    name: `Stop ${id}`,
    shortName: id,
    iconKey: 'pin',
    coordinate: { lat: 37, lng: -122 },
    driveMinutes: 10,
    miles: 5,
    dwellMinutes: 30,
    arrivalTime: '09:30',
  };
}

function itemIds(stops: PlanStop[]) {
  return buildStopTimelineItems(stops).map((item) => ({
    type: item.type,
    id: item.id,
  }));
}

describe('buildStopTimelineItems', () => {
  describe('paired stops', () => {
    it('groups a charge stop followed by an activity stop', () => {
      const charge = makeStop('charge-1', 'charge');
      const activity = makeStop('activity-1', 'activity');

      expect(buildStopTimelineItems([charge, activity])).toEqual([
        {
          type: 'chargeActivity',
          id: 'charge-1:activity-1',
          charge,
          activity,
          firstStop: charge,
          stopIds: ['charge-1', 'activity-1'],
        },
      ]);
    });

    it('groups an activity stop followed by a charge stop', () => {
      const activity = makeStop('activity-1', 'activity');
      const charge = makeStop('charge-1', 'charge');

      expect(buildStopTimelineItems([activity, charge])).toEqual([
        {
          type: 'chargeActivity',
          id: 'activity-1:charge-1',
          charge,
          activity,
          firstStop: activity,
          stopIds: ['activity-1', 'charge-1'],
        },
      ]);
    });
  });

  describe('standalone stops', () => {
    it('keeps start and end stops standalone', () => {
      expect(
        itemIds([makeStop('start-1', 'start'), makeStop('end-1', 'end')]),
      ).toEqual([
        { type: 'stop', id: 'start-1' },
        { type: 'stop', id: 'end-1' },
      ]);
    });

    it('keeps unpaired charge and activity stops standalone', () => {
      expect(
        itemIds([
          makeStop('activity-1', 'activity'),
          makeStop('start-1', 'start'),
          makeStop('charge-1', 'charge'),
        ]),
      ).toEqual([
        { type: 'stop', id: 'activity-1' },
        { type: 'stop', id: 'start-1' },
        { type: 'stop', id: 'charge-1' },
      ]);
    });
  });

  describe('route ordering', () => {
    it('continues scanning after a standalone stop', () => {
      expect(
        itemIds([
          makeStop('charge-1', 'charge'),
          makeStop('charge-2', 'charge'),
          makeStop('activity-1', 'activity'),
        ]),
      ).toEqual([
        { type: 'stop', id: 'charge-1' },
        { type: 'chargeActivity', id: 'charge-2:activity-1' },
      ]);
    });

    it('preserves route order across multiple pairs', () => {
      expect(
        itemIds([
          makeStop('start-1', 'start'),
          makeStop('charge-1', 'charge'),
          makeStop('activity-1', 'activity'),
          makeStop('activity-2', 'activity'),
          makeStop('charge-2', 'charge'),
          makeStop('end-1', 'end'),
        ]),
      ).toEqual([
        { type: 'stop', id: 'start-1' },
        { type: 'chargeActivity', id: 'charge-1:activity-1' },
        { type: 'chargeActivity', id: 'activity-2:charge-2' },
        { type: 'stop', id: 'end-1' },
      ]);
    });
  });
});
