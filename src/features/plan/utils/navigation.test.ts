import { describe, expect, it } from 'vitest';
import { getPlanBackNavigation, parsePlanSearch } from './navigation';

const origin = 'https://ev-agent.test';

describe('parsePlanSearch', () => {
  it('keeps the dashboard origin marker used when dashboard opens plan', () => {
    expect(parsePlanSearch({ from: '/dashboard' })).toEqual({
      from: '/dashboard',
    });
  });

  it('rejects external or plan self references', () => {
    expect(parsePlanSearch({ from: 'https://example.test/dashboard' })).toEqual(
      {
        from: undefined,
      },
    );
    expect(parsePlanSearch({ from: '/plan' })).toEqual({ from: undefined });
  });
});

describe('getPlanBackNavigation', () => {
  it('uses browser history when dashboard navigates to plan', () => {
    expect(
      getPlanBackNavigation({
        currentPath: '/plan',
        from: '/dashboard',
        historyLength: 2,
        origin,
      }),
    ).toEqual({ type: 'history', fallback: { to: '/dashboard' } });
  });

  it('falls back to dashboard for a direct plan load', () => {
    expect(
      getPlanBackNavigation({
        currentPath: '/plan',
        historyLength: 1,
        origin,
      }),
    ).toEqual({ type: 'fallback', fallback: { to: '/dashboard' } });
  });
});
