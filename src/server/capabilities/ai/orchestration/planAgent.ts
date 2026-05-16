import { NoObjectGeneratedError, Output, stepCountIs, streamText } from 'ai';
import type { EvRoutePlan } from '#/server/capabilities/evRouting/domain/types';
import {
  mergePlanResultFromAgentOutput,
  type PlanAgentModelResult,
  type PlanRequest,
  type PlanResult,
  type PlanStreamEvent,
  planAgentModelResultSchema,
} from '#/shared/plan/contracts';
import { recoverPlanResultAfterNoObjectError } from '../parsing/planAgentRecovery';
import {
  buildSystemPrompt,
  buildUserPrompt,
} from '../prompts/planAgentPrompts';
import { makeFindChargingStationsTool } from '../tools/findChargingStations';
import { makeGetDirectionsTool } from '../tools/getDirections';
import { makeNarrateProgressTool } from '../tools/narrateProgress';
import { makeSearchPlacesTool } from '../tools/searchPlaces';
import { getPlanModel } from './getPlanModel';
import {
  PLAN_AGENT_MAX_OUTPUT_TOKENS,
  PLAN_AGENT_MAX_STEPS,
} from './planAgentConstants';

type RunOpts = {
  signal?: AbortSignal;
  evRoutePlan?: EvRoutePlan;
};

type Emit = (event: PlanStreamEvent) => void;

function startPlanAgentStream(request: PlanRequest, emit: Emit, opts: RunOpts) {
  const { signal, evRoutePlan } = opts;
  return streamText({
    model: getPlanModel(),
    system: buildSystemPrompt(request, evRoutePlan),
    prompt: buildUserPrompt(request, evRoutePlan),
    tools: {
      narrateProgress: makeNarrateProgressTool({ emit }),
      searchPlaces: makeSearchPlacesTool({ signal, emit }),
      findChargingStations: makeFindChargingStationsTool({ signal, emit }),
      getDirections: makeGetDirectionsTool({ signal, emit }),
    },
    output: Output.object({ schema: planAgentModelResultSchema }),
    stopWhen: stepCountIs(PLAN_AGENT_MAX_STEPS),
    maxOutputTokens: PLAN_AGENT_MAX_OUTPUT_TOKENS,
    abortSignal: signal,
  });
}

type StreamHandle = ReturnType<typeof startPlanAgentStream>;

function readStopId(stop: unknown): string | null {
  if (!stop || typeof stop !== 'object') return null;
  const id = (stop as { id?: unknown }).id;
  return typeof id === 'string' ? id : null;
}

/** Validate one streamed stop and emit it the first time we see its id. */
function emitStopOnce(stop: unknown, seen: Set<string>, emit: Emit): void {
  const id = readStopId(stop);
  if (id === null || seen.has(id)) return;
  const parsed = planAgentModelResultSchema.shape.stops.element.safeParse(stop);
  if (!parsed.success) return;
  seen.add(parsed.data.id);
  emit({ type: 'stop', stop: parsed.data });
}

/** Each partial stop the agent streams becomes a `stop` event the first time we see its id. */
async function emitNewStopsFromStream(
  stream: StreamHandle,
  emit: Emit,
): Promise<void> {
  const seenStopIds = new Set<string>();
  for await (const partial of stream.partialOutputStream) {
    const stops = partial?.stops;
    if (!Array.isArray(stops)) continue;
    for (const stop of stops) emitStopOnce(stop, seenStopIds, emit);
  }
}

async function awaitStreamOutput(
  stream: StreamHandle,
  request: PlanRequest,
  emit: Emit,
  signal: AbortSignal | undefined,
): Promise<PlanAgentModelResult | { recovered: PlanResult }> {
  try {
    return await stream.output;
  } catch (error) {
    if (!NoObjectGeneratedError.isInstance(error)) throw error;
    const recovered = await recoverPlanResultAfterNoObjectError(
      error,
      request,
      signal,
    );
    if (recovered) {
      emit({ type: 'result', result: recovered });
      return { recovered };
    }
    throw error;
  }
}

export async function runPlanAgent(
  request: PlanRequest,
  emit: Emit,
  opts: RunOpts = {},
): Promise<PlanResult> {
  try {
    const stream = startPlanAgentStream(request, emit, opts);

    await emitNewStopsFromStream(stream, emit);

    const output = await awaitStreamOutput(stream, request, emit, opts.signal);
    if ('recovered' in output) return output.recovered;

    const finalResult = mergePlanResultFromAgentOutput(output, request);
    emit({ type: 'result', result: finalResult });
    return finalResult;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Plan agent failed';
    emit({ type: 'error', message });
    throw error;
  }
}
