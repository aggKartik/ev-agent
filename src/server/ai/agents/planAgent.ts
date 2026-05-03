import { NoObjectGeneratedError, Output, stepCountIs, streamText } from 'ai';
import {
  mergePlanResultFromAgentOutput,
  type PlanAgentModelResult,
  type PlanRequest,
  type PlanResult,
  type PlanStreamEvent,
  planAgentModelResultSchema,
} from '#/features/plan/contracts';
import { getPlanModel } from '#/server/ai/helpers';
import { makeFindChargingStationsTool } from '#/server/ai/tools/findChargingStations';
import { makeGetDirectionsTool } from '#/server/ai/tools/getDirections';
import { makeNarrateProgressTool } from '#/server/ai/tools/narrateProgress';
import { makeSearchPlacesTool } from '#/server/ai/tools/searchPlaces';
import type { EvRoutePlan } from '#/server/evRouting/types';
import {
  PLAN_AGENT_MAX_OUTPUT_TOKENS,
  PLAN_AGENT_MAX_STEPS,
} from './planAgentConstants';
import { buildSystemPrompt, buildUserPrompt } from './planAgentPrompts';
import { recoverPlanResultAfterNoObjectError } from './planAgentRecovery';

type RunOpts = {
  signal?: AbortSignal;
  evRoutePlan?: EvRoutePlan;
};

export async function runPlanAgent(
  request: PlanRequest,
  emit: (event: PlanStreamEvent) => void,
  opts: RunOpts = {},
): Promise<PlanResult> {
  const { signal, evRoutePlan } = opts;
  const seenStopIds = new Set<string>();
  const tools = {
    narrateProgress: makeNarrateProgressTool({ emit }),
    searchPlaces: makeSearchPlacesTool({ signal }),
    findChargingStations: makeFindChargingStationsTool({ signal }),
    getDirections: makeGetDirectionsTool({ signal }),
  };

  try {
    const result = streamText({
      model: getPlanModel(),
      system: buildSystemPrompt(request, evRoutePlan),
      prompt: buildUserPrompt(request, evRoutePlan),
      tools,
      output: Output.object({ schema: planAgentModelResultSchema }),
      stopWhen: stepCountIs(PLAN_AGENT_MAX_STEPS),
      maxOutputTokens: PLAN_AGENT_MAX_OUTPUT_TOKENS,
      abortSignal: signal,
    });

    for await (const partial of result.partialOutputStream) {
      const stops = partial?.stops;
      if (!Array.isArray(stops)) continue;
      for (const stop of stops) {
        if (!stop || typeof stop !== 'object') continue;
        const candidate = stop as { id?: string };
        if (typeof candidate.id !== 'string') continue;
        if (seenStopIds.has(candidate.id)) continue;
        const parsed =
          planAgentModelResultSchema.shape.stops.element.safeParse(stop);
        if (!parsed.success) continue;
        seenStopIds.add(parsed.data.id);
        emit({ type: 'stop', stop: parsed.data });
      }
    }

    let slimOutput: PlanAgentModelResult;
    try {
      slimOutput = await result.output;
    } catch (error) {
      if (!NoObjectGeneratedError.isInstance(error)) {
        throw error;
      }
      const recovered = await recoverPlanResultAfterNoObjectError(
        error,
        request,
        signal,
      );
      if (recovered) {
        emit({ type: 'result', result: recovered });
        return recovered;
      }
      throw error;
    }

    const finalResult = mergePlanResultFromAgentOutput(slimOutput, request);
    emit({ type: 'result', result: finalResult });
    return finalResult;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Plan agent failed';
    emit({ type: 'error', message });
    throw error;
  }
}
