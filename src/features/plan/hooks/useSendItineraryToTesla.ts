import { useCallback, useState } from 'react';
import { trpc } from '#/lib/trpc';
import type { PlanResult } from '#/shared/plan/contracts';

export type SendItineraryToTeslaState =
  | 'idle'
  | 'pending'
  | 'success'
  | 'error';

type CapabilityState = {
  available: boolean;
  reason: string | null;
} | null;

type SendMutation = {
  error: { message: string } | null;
  isError: boolean;
  isPending: boolean;
  mutate: (input: { result: PlanResult }) => void;
};

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

function canSendToTesla(capability: CapabilityState): boolean {
  return capability?.available === true;
}

function mutationErrorMessage(
  mutation: Pick<SendMutation, 'error' | 'isError'>,
): string | null {
  if (!mutation.isError) return null;
  return mutation.error?.message ?? null;
}

function capabilityReason(capability: CapabilityState): string | null {
  return capability?.reason ?? null;
}

function sendToTeslaMessage(args: {
  capabilityReason: string | null;
  mutationErrorMessage: string | null;
  successMessage: string | null;
}): string {
  return (
    args.mutationErrorMessage ??
    args.capabilityReason ??
    args.successMessage ??
    'Send this itinerary to your linked Tesla.'
  );
}

function submitItineraryToTesla(
  result: PlanResult | null,
  mutation: Pick<SendMutation, 'isPending' | 'mutate'>,
): void {
  if (!result || mutation.isPending) return;
  mutation.mutate({ result });
}

export function useSendItineraryToTesla(result: PlanResult | null) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const capability = trpc.tesla.sendItineraryCapability.useQuery(undefined, {
    staleTime: 60_000,
  });
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
    submitItineraryToTesla(result, mutation);
  }, [mutation, result]);

  const state = mutationState({
    isPending: mutation.isPending,
    isError: mutation.isError,
    successMessage,
  });

  const message = sendToTeslaMessage({
    capabilityReason: capabilityReason(capability.data ?? null),
    mutationErrorMessage: mutationErrorMessage(mutation),
    successMessage,
  });

  return {
    send,
    canSend: canSendToTesla(capability.data ?? null),
    state,
    message,
    isPending: mutation.isPending,
  };
}
