import EventEmitter, { on } from 'node:events';
import { tracked } from '@trpc/server';
import {
  addressSuggestSchema,
  type PlanStreamEvent,
  planRequestSchema,
} from '#/features/plan/contracts';
import { getPlanCatalog, suggestPlanAddresses } from '#/features/plan/helpers';
import { runPlanAgent } from '#/server/ai/agents';
import { computeEvRoute } from '#/server/evRouting/computeEvRoute';
import type { EvRoutePlan } from '#/server/evRouting/types';
import { publicProcedure, router } from '../trpc';

export const planRouter = router({
  catalog: publicProcedure.query(() => getPlanCatalog()),

  suggestAddresses: publicProcedure
    .input(addressSuggestSchema)
    .query(({ input }) => suggestPlanAddresses(input.query)),

  stream: publicProcedure
    .input(planRequestSchema)
    .subscription(async function* ({ input, signal }) {
      const ee = new EventEmitter();
      const finished = new AbortController();
      const iterSignal = signal
        ? AbortSignal.any([signal, finished.signal])
        : finished.signal;

      const agentDone = (async () => {
        let evRoutePlan: EvRoutePlan | undefined;
        try {
          evRoutePlan = await computeEvRoute(input, signal);
        } catch {
          evRoutePlan = undefined;
        }
        return runPlanAgent(
          input,
          (event: PlanStreamEvent) => ee.emit('event', event),
          { signal, evRoutePlan },
        );
      })()
        .catch(() => undefined)
        .finally(() => finished.abort());

      let id = 0;
      try {
        for await (const [event] of on(ee, 'event', { signal: iterSignal })) {
          id += 1;
          yield tracked(String(id), event as PlanStreamEvent);
        }
      } catch (err) {
        if (!finished.signal.aborted) throw err;
      } finally {
        await agentDone;
      }
    }),
});
