import { generateText, type NoObjectGeneratedError, Output } from 'ai';
import {
  type PlanRequest,
  type PlanResult,
  planAgentModelResultSchema,
  planResultSchema,
} from '#/features/plan/contracts';
import { getPlanModel } from '../orchestration/getPlanModel';
import {
  PLAN_AGENT_REPAIR_MAX_OUTPUT_TOKENS,
  PLAN_AGENT_REPAIR_SNIPPET_MAX_CHARS,
} from '../orchestration/planAgentConstants';
import { recoverPlanResultFromRepairedModelText } from './planAgentModelParse';

function logNoObjectError(error: NoObjectGeneratedError): void {
  const text = error.text;
  console.error('[planAgent] NoObjectGeneratedError', {
    finishReason: error.finishReason,
    cause: error.cause,
    textLength: text?.length,
    textPreview: text?.slice(0, 800),
  });
}

async function tryLlmRepair(
  rawText: string,
  request: PlanRequest,
  signal?: AbortSignal,
): Promise<PlanResult | null> {
  const snippet =
    rawText.length > PLAN_AGENT_REPAIR_SNIPPET_MAX_CHARS
      ? rawText.slice(0, PLAN_AGENT_REPAIR_SNIPPET_MAX_CHARS)
      : rawText;

  const repair = await generateText({
    model: getPlanModel(),
    abortSignal: signal,
    maxOutputTokens: PLAN_AGENT_REPAIR_MAX_OUTPUT_TOKENS,
    system:
      'You repair broken JSON. Output must be a single JSON object only (no markdown). ' +
      'Keys required: id, geometry, stops, totals, phases. Do NOT include a "request" field.',
    prompt: `The text below was meant to be that JSON object but is invalid or truncated. Return one valid JSON object with the same keys.

---
${snippet}
---`,
    output: Output.object({ schema: planAgentModelResultSchema }),
  });

  const slim = await repair.output;
  const merged = planResultSchema.safeParse({ ...slim, request });
  return merged.success ? merged.data : null;
}

export async function recoverPlanResultAfterNoObjectError(
  error: NoObjectGeneratedError,
  request: PlanRequest,
  signal?: AbortSignal,
): Promise<PlanResult | null> {
  logNoObjectError(error);

  const raw = error.text ?? '';
  if (!raw.trim()) {
    return null;
  }

  const fromJson = await recoverPlanResultFromRepairedModelText(raw, request);
  if (fromJson) {
    return fromJson;
  }

  try {
    return await tryLlmRepair(raw, request, signal);
  } catch (repairError) {
    console.error('[planAgent] LLM repair failed', repairError);
    return null;
  }
}
