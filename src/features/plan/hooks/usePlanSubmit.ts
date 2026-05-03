import { skipToken } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  useActiveRequest,
  usePlanFlowStore,
  useStatus,
} from '#/features/plan/store';
import type {
  PlanRequest,
  PlanStreamEvent,
} from '#/features/plan/types/contracts';
import { trpc } from '#/lib/trpc';

export function usePlanSubmit() {
  const status = useStatus();

  const submit = useCallback((request: PlanRequest) => {
    usePlanFlowStore.getState().startPlanning(request);
  }, []);

  return { submit, isSubmitting: status === 'planning' };
}

function dispatchStreamEvent(event: PlanStreamEvent) {
  const store = usePlanFlowStore.getState();
  switch (event.type) {
    case 'phase':
      store.setPhase({ label: event.label, detail: event.detail });
      return;
    case 'narration':
      store.appendNarration(event.message);
      return;
    case 'stop':
      store.appendStop(event.stop);
      return;
    case 'result':
      store.applyResult(event.result);
      return;
    case 'error':
      store.failPlanning(event.message);
      return;
    default: {
      const _exhaustive: never = event;
      void _exhaustive;
    }
  }
}

export function usePlanStreamSubscription() {
  const status = useStatus();
  const activeRequest = useActiveRequest();

  const shouldStream = status === 'planning' && activeRequest !== null;

  trpc.plan.stream.useSubscription(shouldStream ? activeRequest : skipToken, {
    onData: (envelope) => {
      dispatchStreamEvent(envelope.data);
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : 'Connection error while planning.';
      usePlanFlowStore.getState().failPlanning(message);
    },
  });
}
