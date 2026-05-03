import { safeParseJSON } from '@ai-sdk/provider-utils';
import { jsonrepair } from 'jsonrepair';
import {
  type PlanRequest,
  type PlanResult,
  planAgentModelResultSchema,
  planResultSchema,
} from '#/features/plan/contracts';

/**
 * Deterministic path: repair almost-JSON from the model, parse, validate slim
 * shape, merge the known `request` from the subscription input.
 */
export async function recoverPlanResultFromRepairedModelText(
  rawText: string,
  request: PlanRequest,
): Promise<PlanResult | null> {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return null;
  }

  let repaired: string;
  try {
    repaired = jsonrepair(trimmed);
  } catch {
    return null;
  }

  const jsonParsed = await safeParseJSON({ text: repaired });
  if (!jsonParsed.success) {
    return null;
  }

  const slim = planAgentModelResultSchema.safeParse(jsonParsed.value);
  if (!slim.success) {
    return null;
  }

  const merged = planResultSchema.safeParse({ ...slim.data, request });
  return merged.success ? merged.data : null;
}
