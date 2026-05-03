import { describe, expect, it } from 'vitest';
import { planRequestSchema } from '#/shared/plan/contracts';
import { recoverPlanResultFromRepairedModelText } from './planAgentModelParse';

const baseRequest = planRequestSchema.parse({
  from: { full: 'Origin St', coordinate: { lat: 37.77, lng: -122.42 } },
  to: { full: 'Dest Blvd', coordinate: { lat: 37.8, lng: -122.27 } },
  activities: [{ id: 'coffee', dwellMinutes: 30 }],
});

describe('recoverPlanResultFromRepairedModelText', () => {
  it('returns null for empty input', async () => {
    await expect(
      recoverPlanResultFromRepairedModelText('  ', baseRequest),
    ).resolves.toBeNull();
  });

  it('returns null for non-JSON text', async () => {
    await expect(
      recoverPlanResultFromRepairedModelText('not json {', baseRequest),
    ).resolves.toBeNull();
  });

  it('parses valid slim JSON and merges request', async () => {
    const slim = {
      id: 'trip-parse-test',
      geometry: [{ lat: 37.77, lng: -122.42 }],
      stops: [
        {
          id: 's0',
          kind: 'start',
          name: 'Start',
          shortName: 'S',
          iconKey: 'pin',
          coordinate: { lat: 37.77, lng: -122.42 },
          driveMinutes: 0,
          miles: 0,
          dwellMinutes: 0,
          arrivalTime: '08:42',
        },
      ],
      totals: {
        miles: 1,
        driveMinutes: 1,
        dwellMinutes: 0,
        chargeStops: 0,
        activityStops: 0,
        arrivalTime: '08:43',
      },
      phases: [{ label: 'Phase', detail: 'Detail' }],
    };
    const raw = JSON.stringify(slim);
    const out = await recoverPlanResultFromRepairedModelText(raw, baseRequest);
    expect(out).not.toBeNull();
    expect(out?.id).toBe('trip-parse-test');
    expect(out?.request.from.full).toBe('Origin St');
    expect(out?.request.to.full).toBe('Dest Blvd');
  });
});
