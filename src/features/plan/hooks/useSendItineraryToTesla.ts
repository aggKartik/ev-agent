import { useCallback, useMemo, useState } from 'react';
import { trpc } from '#/lib/trpc';
import type { PlanResult } from '#/shared/plan/contracts';

export type SendItineraryToTeslaState =
  | 'idle'
  | 'pending'
  | 'success'
  | 'error';

export function useSendItineraryToTesla(result: PlanResult | null) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const mutation = trpc.tesla.sendItinerary.useMutation({
    onMutate: () => {
      setSuccessMessage(null);
    },
    onSuccess: (data) => {
      setSuccessMessage(
        `Sent ${data.stopCount} stops to ${data.vehicleDisplayName ?? 'Tesla'}.`,
      );
    },
  });

  const send = useCallback(() => {
    if (!result || mutation.isPending) return;
    mutation.mutate({ result });
  }, [mutation, result]);

  const state: SendItineraryToTeslaState = mutation.isPending
    ? 'pending'
    : mutation.isError
      ? 'error'
      : successMessage
        ? 'success'
        : 'idle';

  const message = useMemo(() => {
    if (mutation.isError) return mutation.error.message;
    return successMessage ?? 'Send this itinerary to your linked Tesla.';
  }, [mutation.error, mutation.isError, successMessage]);

  return {
    send,
    state,
    message,
    isPending: mutation.isPending,
  };
}
