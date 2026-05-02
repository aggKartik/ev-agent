import { useEffect } from 'react';
import { usePlanFlowStore } from '#/features/plan/store';

const PHASE_TICK_MS = 720;
const FINISH_DELAY_MS = 500;

/**
 * While `status === 'planning'`, advance `phaseIndex` on a fixed cadence
 * and finalize the flow once all phases have played. Owns nothing else.
 */
export function usePlanPhaseTicker() {
  const status = usePlanFlowStore((s) => s.status);
  const phasesLength = usePlanFlowStore((s) => s.result?.phases.length ?? 0);

  useEffect(() => {
    if (status !== 'planning' || phasesLength === 0) return;

    const interval = window.setInterval(() => {
      const { phaseIndex, advancePhase, finishPlanning } =
        usePlanFlowStore.getState();
      if (phaseIndex >= phasesLength - 1) {
        window.clearInterval(interval);
        window.setTimeout(finishPlanning, FINISH_DELAY_MS);
        return;
      }
      advancePhase();
    }, PHASE_TICK_MS);

    return () => window.clearInterval(interval);
  }, [status, phasesLength]);
}
