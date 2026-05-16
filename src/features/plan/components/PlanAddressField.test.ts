/** @vitest-environment jsdom */
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { createElement, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AddressSuggestion } from '#/server/capabilities/addresses/domain/types';
import { PlanAddressField } from './PlanAddressField';

const suggestionForSa: AddressSuggestion = {
  providerId: 'mapbox-sa',
  primary: 'San Antonio',
  secondary: 'Texas, United States',
};
const suggestionsForSa = [suggestionForSa];

const trpcMock = vi.hoisted(() => ({
  useSuggestAddressesQuery: vi.fn(),
  retrieveAddress: vi.fn(),
}));

vi.mock('#/lib/trpc', () => ({
  trpc: {
    plan: {
      suggestAddresses: {
        useQuery: trpcMock.useSuggestAddressesQuery,
      },
    },
    useUtils: () => ({
      plan: {
        retrieveAddress: {
          fetch: trpcMock.retrieveAddress,
        },
      },
    }),
  },
}));

function FieldHarness() {
  const [value, setValue] = useState('Sa');
  return createElement(PlanAddressField, {
    label: 'Start',
    value,
    kind: 'start',
    onChange: setValue,
    onSelect: vi.fn(),
  });
}

describe('PlanAddressField', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    trpcMock.retrieveAddress.mockResolvedValue({
      full: 'San Antonio, Texas, United States',
      primary: 'San Antonio',
      secondary: 'Texas, United States',
      coordinate: { lat: 29.4252, lng: -98.4946 },
    });
    trpcMock.useSuggestAddressesQuery.mockImplementation(({ query }) => {
      if (query === 'Sa') {
        return { data: suggestionsForSa, isFetching: false };
      }

      if (query === 'San') {
        return { data: suggestionsForSa, isFetching: true };
      }

      return { data: undefined, isFetching: false };
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('keeps the listbox mounted while a multi-character edit enters a debounced fetch transition', () => {
    render(createElement(FieldHarness));

    const input = screen.getByRole('combobox', { name: '' });
    fireEvent.focus(input);

    expect(screen.getByRole('listbox')).toBeTruthy();
    expect(screen.getByRole('option', { name: /San Antonio/i })).toBeTruthy();

    fireEvent.change(input, { target: { value: 'San' } });

    expect(screen.getByRole('listbox')).toBeTruthy();
    expect(screen.getByRole('option', { name: /San Antonio/i })).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(trpcMock.useSuggestAddressesQuery).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'San' }),
      expect.objectContaining({ enabled: true }),
    );
    expect(screen.getByRole('listbox')).toBeTruthy();
    expect(screen.getByRole('option', { name: /San Antonio/i })).toBeTruthy();
  });
});
