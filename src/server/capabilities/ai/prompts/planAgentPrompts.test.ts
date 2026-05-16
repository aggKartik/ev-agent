import { describe, expect, it } from 'vitest';
import type { EvRoutePlan } from '#/server/capabilities/evRouting/domain/types';
import { planRequestSchema } from '#/shared/plan/contracts';
import {
  buildSystemPrompt,
  buildUserPrompt,
  formatRequestedActivities,
} from './planAgentPrompts';

const request = planRequestSchema.parse({
  from: {
    full: 'San Francisco, CA',
    coordinate: { lat: 37.7749, lng: -122.4194 },
  },
  to: { full: 'Los Angeles, CA', coordinate: { lat: 34.0522, lng: -118.2437 } },
  activities: [
    { id: 'coffee', dwellMinutes: 45, targetRoutePercent: 75 },
    { id: 'scenic', dwellMinutes: 30 },
  ],
});

const evRoutePlan = {
  source: 'tomtom_ld_ev',
  totalDistanceMiles: 380,
  corridorGeometry: [
    { lat: 37.7749, lng: -122.4194 },
    { lat: 34.0522, lng: -118.2437 },
  ],
  chargeStopCandidates: [
    {
      ordinal: 3,
      coordinate: { lat: 35.5, lng: -119.5 },
      rationale: 'later charge region',
    },
    {
      ordinal: 1,
      coordinate: { lat: 36.8, lng: -121.2 },
      rationale: 'early charge region',
    },
    {
      ordinal: 2,
      coordinate: { lat: 36.1, lng: -120.2 },
      rationale: 'middle charge region',
    },
  ],
  summaryText: 'test route',
} satisfies EvRoutePlan;

describe('plan agent prompt activity route timing', () => {
  it('formats requested activities with targetRoutePercent and closest ordered charge region', () => {
    expect(formatRequestedActivities(request, evRoutePlan)).toContain(
      'coffee (Coffee roasters) · dwell 45 min · target 75% into route · prefer chargeRegion ordinal 3 (~75% corridor) before searchPlaces',
    );
    expect(formatRequestedActivities(request, evRoutePlan)).toContain(
      'scenic (Scenic overlooks) · dwell 30 min · target 50% into route · prefer chargeRegion ordinal 2 (~50% corridor) before searchPlaces',
    );
  });

  it('includes target route timing in the user prompt', () => {
    const prompt = buildUserPrompt(request, evRoutePlan);

    expect(prompt).toContain('target 75% into route');
    expect(prompt).toContain('prefer chargeRegion ordinal 3');
  });

  it('instructs the model to default to midpoint-ish feasible regions and honor explicit targets', () => {
    const prompt = buildSystemPrompt(request, evRoutePlan);

    expect(prompt).toContain('midpoint-ish feasible charging region');
    expect(prompt).toContain("activity's targetRoutePercent");
    expect(prompt).toContain(
      'matching route-percent corridor / feasible charge region',
    );
  });
});
