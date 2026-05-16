import { runPlanAgent } from '#/server/capabilities/ai/orchestration/planAgent';
import { computeEvRoute } from '#/server/capabilities/evRouting/domain/computeEvRoute';
import type { EvRoutePlan } from '#/server/capabilities/evRouting/domain/types';
import type { PlanRequest, PlanStreamEvent } from '#/shared/plan/contracts';
import {
  advancePlanProgress,
  PLAN_COMPLETE_PROGRESS_PERCENT,
  PLAN_START_PROGRESS_PERCENT,
} from '#/shared/plan/progress';

type Emit = (event: PlanStreamEvent) => void;

type ProgressEmitter = {
  emitAgentEvent: Emit;
  emitProgress: (percent: number, label: string, detail: string) => void;
  seedProgress: (percent: number) => void;
};

export const PREFLIGHT_EVENTS = [
  {
    type: 'progress',
    percent: PLAN_START_PROGRESS_PERCENT,
    label: 'Route preflight',
    detail: 'Grounding EV corridor and charge anchors.',
  },
  {
    type: 'phase',
    label: 'Route preflight',
    detail: 'Grounding EV corridor and charge anchors',
  },
  {
    type: 'narration',
    message:
      'Computing EV route corridor (TomTom prefetch may take a few seconds)…',
  },
] satisfies PlanStreamEvent[];

export function createProgressEmitter(emit: Emit): ProgressEmitter {
  let highest = 0;
  let sawFirstStop = false;

  const emitProgress = (percent: number, label: string, detail: string) => {
    highest = advancePlanProgress(highest, percent);
    emit({ type: 'progress', percent: highest, label, detail });
  };

  const emitFirstStopProgress = () => {
    if (sawFirstStop) return;
    sawFirstStop = true;
    emitProgress(62, 'First stop streamed', 'Itinerary skeleton is visible.');
  };

  const emitResultProgress = () => {
    emitProgress(88, 'Directions and finalization', 'Sealing route totals.');
    emitProgress(
      PLAN_COMPLETE_PROGRESS_PERCENT,
      'Result complete',
      'Your EV trip plan is ready.',
    );
  };

  const emitAgentEvent = (event: PlanStreamEvent) => {
    switch (event.type) {
      case 'progress':
        emitProgress(event.percent, event.label ?? '', event.detail ?? '');
        return;
      case 'stop':
        emitFirstStopProgress();
        break;
      case 'result':
        emitResultProgress();
        break;
    }
    emit(event);
  };

  return {
    emitAgentEvent,
    emitProgress,
    seedProgress: (percent) => {
      highest = advancePlanProgress(highest, percent);
    },
  };
}

export async function runPlanAgentWithProgress({
  emitAgentEvent,
  emitProgress,
  request,
  signal,
}: {
  request: PlanRequest;
  signal: AbortSignal;
} & Pick<ProgressEmitter, 'emitAgentEvent' | 'emitProgress'>) {
  let evRoutePlan: EvRoutePlan | undefined;
  try {
    evRoutePlan = await computeEvRoute(request, signal);
    emitProgress(28, 'EV route prefetch done', 'EV corridor anchors ready.');
  } catch {
    evRoutePlan = undefined;
    emitProgress(
      28,
      'EV route prefetch skipped',
      'Using fallback route tools.',
    );
  }

  emitProgress(40, 'Agent started', 'Searching stops and chargers.');
  return runPlanAgent(request, emitAgentEvent, { signal, evRoutePlan });
}
