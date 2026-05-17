// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SendToTeslaCta from './SendToTeslaCta';

describe('SendToTeslaCta', () => {
  afterEach(() => cleanup());

  it('calls the send handler from the minimal CTA', () => {
    const onSendToTesla = vi.fn();
    render(
      <SendToTeslaCta onSendToTesla={onSendToTesla} sendToTeslaState="idle" />,
    );

    fireEvent.click(screen.getByRole('button', { name: /send to tesla/i }));

    expect(onSendToTesla).toHaveBeenCalledOnce();
  });

  it('disables the CTA when no send handler is available', () => {
    const onSendToTesla = vi.fn();
    render(
      <SendToTeslaCta
        sendToTeslaState="idle"
        sendToTeslaMessage="Send to Tesla is disabled until this deployment verifies command proxy support for navigation waypoints."
      />,
    );

    const button = screen.getByRole('button', {
      name: /send to tesla/i,
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    fireEvent.click(button);

    expect(onSendToTesla).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        'Send to Tesla is disabled until this deployment verifies command proxy support for navigation waypoints.',
      ),
    ).toBeTruthy();
  });

  it('shows pending and success/error feedback from the send hook', () => {
    const { rerender } = render(
      <SendToTeslaCta
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
      <SendToTeslaCta
        onSendToTesla={vi.fn()}
        sendToTeslaState="success"
        sendToTeslaMessage="Sent 2 stops to Roadtrip Car."
      />,
    );

    expect(screen.getByText('Sent 2 stops to Roadtrip Car.')).toBeTruthy();

    rerender(
      <SendToTeslaCta
        onSendToTesla={vi.fn()}
        sendToTeslaState="error"
        sendToTeslaMessage="Tesla account not linked."
      />,
    );

    expect(screen.getByText('Tesla account not linked.')).toBeTruthy();
  });
});
