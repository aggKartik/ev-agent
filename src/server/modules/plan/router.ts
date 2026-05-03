import EventEmitter, { on } from 'node:events';
import { tracked } from '@trpc/server';
import {
  getPlanCatalog,
  suggestPlanAddresses,
} from '#/features/plan/utils/helpers';
import { runPlanAgent } from '#/server/capabilities/ai/orchestration/planAgent';
import { computeEvRoute } from '#/server/capabilities/evRouting/domain/computeEvRoute';
import type { EvRoutePlan } from '#/server/capabilities/evRouting/domain/types';
import { protectedProcedure, router } from '#/server/platform/trpc/procedures';
import {
  addressSuggestSchema,
  type PlanStreamEvent,
  planRequestSchema,
} from '#/shared/plan/contracts';
import { acquirePlanStreamSlot, PLAN_STREAM_TIMEOUT_MS } from './streamGuards';

export const planRouter = router({
  catalog: protectedProcedure.query(() => getPlanCatalog()),

  suggestAddresses: protectedProcedure
    .input(addressSuggestSchema)
    .query(({ input }) => suggestPlanAddresses(input.query)),

  stream: protectedProcedure
    .input(planRequestSchema)
    .subscription(async function* ({ ctx, input, signal }) {
      const release = acquirePlanStreamSlot(String(ctx.userId));

      const ee = new EventEmitter();
      const finished = new AbortController();
      const timeout = AbortSignal.timeout(PLAN_STREAM_TIMEOUT_MS);
      const iterSignal = AbortSignal.any(
        [signal, finished.signal, timeout].filter(Boolean) as AbortSignal[],
      );

      const agentDone = (async () => {
        let evRoutePlan: EvRoutePlan | undefined;
        try {
          evRoutePlan = await computeEvRoute(input, iterSignal);
        } catch {
          evRoutePlan = undefined;
        }
        return runPlanAgent(
          input,
          (event: PlanStreamEvent) => ee.emit('event', event),
          { signal: iterSignal, evRoutePlan },
        );
      })()
        .catch(() => undefined)
        .finally(() => finished.abort());

      let id = 0;
      id += 1;
      yield tracked(String(id), {
        type: 'phase',
        label: 'Route preflight',
        detail: 'Grounding EV corridor and charge anchors',
      });
      id += 1;
      yield tracked(String(id), {
        type: 'narration',
        message:
          'Computing EV route corridor (TomTom prefetch may take a few seconds)…',
      });

      try {
        for await (const [event] of on(ee, 'event', { signal: iterSignal })) {
          id += 1;
          yield tracked(String(id), event as PlanStreamEvent);
        }
      } catch (err) {
        if (finished.signal.aborted || signal?.aborted || timeout.aborted) {
          return;
        }
        throw err;
      } finally {
        await agentDone;
        release();
      }
    }),
});
