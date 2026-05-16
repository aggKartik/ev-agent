import type { PlanStreamEvent } from '#/shared/plan/contracts';

type Emit = (event: PlanStreamEvent) => void;

export function emitPlanToolProgress(
  emit: Emit | undefined,
  tool: string,
  status: 'started' | 'completed' | 'failed',
  message: string,
): void {
  emit?.({ type: 'toolProgress', tool, status, message });
}
