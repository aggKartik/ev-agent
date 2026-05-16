import { runPlanAgent } from '#/server/capabilities/ai/orchestration/planAgent';
import { computeEvRoute } from '#/server/capabilities/evRouting/domain/computeEvRoute';
import type { EvRoutePlan } from '#/server/capabilities/evRouting/domain/types';
import type { PlanRequest } from '#/shared/plan/contracts';
import type { ProgressEmitter } from './streamProgressEvents';

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
