import { afterEach, describe, expect, it, vi } from 'vitest';
import { navigateBackToDashboard, parsePlanSearch } from './navigation';

describe('parsePlanSearch', () => {
  it('keeps the dashboard marker used when dashboard opens plan', () => {
    expect(parsePlanSearch({ from: '/dashboard' })).toEqual({
      from: '/dashboard',
    });
  });

  it('ignores non-dashboard origins', () => {
    expect(parsePlanSearch({ from: '/onboarding' })).toEqual({
      from: undefined,
    });
    expect(parsePlanSearch({ from: 'https://example.test/dashboard' })).toEqual(
      {
        from: undefined,
      },
    );
  });
});

const originalWindow = globalThis.window;

afterEach(() => {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: originalWindow,
    writable: true,
  });
});

function setWindowHistory(history: Pick<History, 'back' | 'length'>) {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { history },
    writable: true,
  });
}

describe('navigateBackToDashboard', () => {
  it('uses browser history when dashboard navigates to plan', () => {
    const navigate = vi.fn();
    const back = vi.fn();
    setWindowHistory({ back, length: 2 });

    navigateBackToDashboard(navigate, '/dashboard');

    expect(back).toHaveBeenCalledOnce();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('falls back to dashboard for a direct plan load', () => {
    const navigate = vi.fn();
    setWindowHistory({ back: vi.fn(), length: 1 });

    navigateBackToDashboard(navigate, undefined);

    expect(navigate).toHaveBeenCalledWith({ to: '/dashboard' });
  });
});
