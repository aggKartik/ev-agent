/** @vitest-environment jsdom */
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
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

describe('PlanAddressField', () => {
  beforeEach(() => {
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
        return { data: undefined, isFetching: true };
      }

      return { data: undefined, isFetching: false };
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('keeps the listbox mounted while a multi-character edit enters a debounced fetch transition', async () => {
    let value = 'Sa';
    const onSelect = vi.fn();
    let view: ReturnType<typeof render>;

    const onChange = (nextValue: string) => {
      value = nextValue;
      view.rerender(
        <PlanAddressField
          label="Start"
          value={value}
          kind="start"
          onChange={onChange}
          onSelect={onSelect}
        />,
      );
    };

    view = render(
      <PlanAddressField
        label="Start"
        value={value}
        kind="start"
        onChange={onChange}
        onSelect={onSelect}
      />,
    );

    const input = screen.getByRole('combobox', { name: '' });
    fireEvent.focus(input);

    expect(screen.getByRole('listbox')).toBeTruthy();
    expect(screen.getByRole('option', { name: /San Antonio/i })).toBeTruthy();

    fireEvent.change(input, { target: { value: 'San' } });
    expect(screen.getByRole('listbox')).toBeTruthy();

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 160));
    });

    expect(screen.getByRole('listbox')).toBeTruthy();
    expect(screen.getByRole('option', { name: /San Antonio/i })).toBeTruthy();
  });
});
