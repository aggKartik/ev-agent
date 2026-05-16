import { describe, expect, it } from 'vitest';
import { planRequestSchema } from './contracts';

const baseRequestInput = {
  from: {
    full: 'San Francisco, CA',
    coordinate: { lat: 37.7749, lng: -122.4194 },
  },
  to: { full: 'Los Angeles, CA', coordinate: { lat: 34.0522, lng: -118.2437 } },
  activities: [{ id: 'coffee', dwellMinutes: 45 }],
};

describe('planRequestSchema activity selections', () => {
  it('defaults targetRoutePercent to the route midpoint', () => {
    const parsed = planRequestSchema.parse(baseRequestInput);

    expect(parsed.activities[0]).toMatchObject({
      id: 'coffee',
      dwellMinutes: 45,
      targetRoutePercent: 50,
    });
  });

  it('accepts explicit targetRoutePercent values within the route corridor bounds', () => {
    const parsed = planRequestSchema.parse({
      ...baseRequestInput,
      activities: [{ id: 'coffee', dwellMinutes: 45, targetRoutePercent: 75 }],
    });

    expect(parsed.activities[0]?.targetRoutePercent).toBe(75);
  });
});
