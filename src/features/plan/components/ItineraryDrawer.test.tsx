// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makePlanResult } from '#/shared/plan/testFactories';
import ItineraryDrawer from './ItineraryDrawer';

describe('ItineraryDrawer Send to Tesla action', () => {
  afterEach(() => cleanup());

  it('calls the send handler from the minimal CTA', () => {
    const onSendToTesla = vi.fn();
    render(
      <ItineraryDrawer
        result={makePlanResult()}
        onSelectStop={vi.fn()}
        onSendToTesla={onSendToTesla}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /send to tesla/i }));

    expect(onSendToTesla).toHaveBeenCalledOnce();
  });

  it('shows pending and success/error feedback from the send hook', () => {
    const { rerender } = render(
      <ItineraryDrawer
        result={makePlanResult()}
        onSelectStop={vi.fn()}
        onSendToTesla={vi.fn()}
        sendToTeslaState="pending"
        sendToTeslaMessage="Sending route"
      />,
    );

    expect(
      (screen.getByRole('button', { name: /sending/i }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(screen.getByText('Sending route')).toBeTruthy();

    rerender(
      <ItineraryDrawer
        result={makePlanResult()}
        onSelectStop={vi.fn()}
        onSendToTesla={vi.fn()}
        sendToTeslaState="success"
        sendToTeslaMessage="Sent 2 stops to Roadtrip Car."
      />,
    );

    expect(screen.getByText('Sent 2 stops to Roadtrip Car.')).toBeTruthy();

    rerender(
      <ItineraryDrawer
        result={makePlanResult()}
        onSelectStop={vi.fn()}
        onSendToTesla={vi.fn()}
        sendToTeslaState="error"
        sendToTeslaMessage="Tesla account not linked."
      />,
    );

    expect(screen.getByText('Tesla account not linked.')).toBeTruthy();
  });
});
