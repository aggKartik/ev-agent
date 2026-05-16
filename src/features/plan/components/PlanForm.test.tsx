// @vitest-environment jsdom

import { useStore } from '@tanstack/react-form';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CurrentLocation } from '#/features/plan/hooks/useCurrentLocation';
import { usePlanForm } from '#/features/plan/hooks/usePlanForm';
import type { PlanContextResponse } from '#/shared/plan/contracts';
import { PLAN_ACTIVITY_CATALOG } from '#/shared/plan/data';
import PlanForm from './PlanForm';

const currentLocationMock = vi.hoisted(() => ({
  value: {
    address: null,
    source: null,
    asOf: null,
    isPending: false,
  } as CurrentLocation,
}));

vi.mock('#/features/plan/hooks/useCurrentLocation', () => ({
  useCurrentLocation: () => currentLocationMock.value,
}));

vi.mock('#/lib/trpc', () => ({
  trpc: {
    plan: {
      suggestAddresses: {
        useQuery: () => ({ data: [] }),
      },
    },
    useUtils: () => ({
      plan: {
        retrieveAddress: {
          fetch: vi.fn(),
        },
      },
    }),
  },
}));

const context = {
  activities: PLAN_ACTIVITY_CATALOG.slice(0, 1),
  vehicleProfile: null,
  liveBatteryPercent: null,
} satisfies PlanContextResponse<null>;

function FormProbe({ children }: { children?: ReactNode }) {
  const form = usePlanForm({ context, onSubmit: vi.fn() });
  const from = useStore(form.store, (state) => state.values.from);
  const fromLocked = useStore(form.store, (state) => state.values.fromLocked);

  return (
    <>
      <PlanForm context={context} form={form} />
      <output data-testid="from-json">{JSON.stringify(from)}</output>
      <output data-testid="from-locked">{String(fromLocked)}</output>
      {children}
    </>
  );
}

function startInput() {
  return screen.getAllByRole('combobox')[0] as HTMLInputElement;
}

function setResolvedCurrentLocation(full: string) {
  currentLocationMock.value = {
    address: {
      full,
      coordinate: { lat: 37.492, lng: -121.944 },
    },
    source: 'tesla',
    asOf: '2026-05-14T00:00:00.000Z',
    isPending: false,
  };
}

describe('PlanForm current location start field', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    currentLocationMock.value = {
      address: null,
      source: null,
      asOf: null,
      isPending: false,
    };
  });

  it('fills the empty start field when current location resolves after mount', async () => {
    const { rerender } = render(<FormProbe />);

    expect(startInput().value).toBe('');

    setResolvedCurrentLocation('123 Auto Way, Fremont, CA');
    rerender(<FormProbe />);

    await waitFor(() => {
      expect(startInput().value).toBe('123 Auto Way, Fremont, CA');
    });
    expect(screen.getByTestId('from-json').textContent).toContain('37.492');
  });

  it('does not overwrite the start field after the user types a custom address', async () => {
    const { rerender } = render(<FormProbe />);

    fireEvent.change(startInput(), { target: { value: 'My driveway' } });

    await waitFor(() => {
      expect(screen.getByTestId('from-locked').textContent).toBe('false');
    });

    setResolvedCurrentLocation('123 Auto Way, Fremont, CA');
    rerender(<FormProbe />);

    await waitFor(() => {
      expect(startInput().value).toBe('My driveway');
    });
    expect(screen.getByTestId('from-json').textContent).toBe(
      JSON.stringify({ full: 'My driveway' }),
    );
  });

  it('writes a coordinate-backed fallback address when the Crosshair is clicked', async () => {
    currentLocationMock.value = {
      address: {
        full: 'Tesla GPS fix',
        coordinate: { lat: 40.7128, lng: -74.006 },
      },
      source: 'tesla',
      asOf: '2026-05-14T00:00:00.000Z',
      isPending: false,
    };
    render(<FormProbe />);

    fireEvent.change(startInput(), { target: { value: 'Manual start' } });
    await waitFor(() => {
      expect(screen.getByTestId('from-locked').textContent).toBe('false');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Use car location' }));

    await waitFor(() => {
      expect(startInput().value).toBe('Tesla GPS fix');
    });
    expect(screen.getByTestId('from-json').textContent).toBe(
      JSON.stringify({
        full: 'Tesla GPS fix',
        coordinate: { lat: 40.7128, lng: -74.006 },
      }),
    );
    expect(screen.getByTestId('from-locked').textContent).toBe('true');
  });
});
