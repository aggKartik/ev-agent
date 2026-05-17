import { useCallback, useMemo, useState } from 'react';
import { trpc } from '#/lib/trpc';
import type { PlanResult } from '#/shared/plan/contracts';

export type SendItineraryToTeslaState =
  | 'idle'
  | 'pending'
  | 'success'
  | 'error';

function mutationState(args: {
  isPending: boolean;
  isError: boolean;
  successMessage: string | null;
}): SendItineraryToTeslaState {
  if (args.isPending) return 'pending';
  if (args.isError) return 'error';
  if (args.successMessage) return 'success';
  return 'idle';
}

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

  const state = mutationState({
    isPending: mutation.isPending,
    isError: mutation.isError,
    successMessage,
  });

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
