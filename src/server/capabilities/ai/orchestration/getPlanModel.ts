import { createOpenAI } from '@ai-sdk/openai';
import { env } from '#/lib/env';

const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'openai/gpt-oss-120b:free';

export function getPlanModel() {
  const apiKey = env.OPENAI_API_KEY.trim();
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY is required for the plan agent. For OpenRouter (free tiers), create a key at https://openrouter.ai/keys',
    );
  }

  const baseURL = env.OPENAI_BASE_URL?.trim() || DEFAULT_BASE_URL;
  const modelFromEnv = env.OPENAI_MODEL?.trim();
  if (!modelFromEnv && baseURL !== DEFAULT_BASE_URL) {
    throw new Error(
      'OPENAI_MODEL is required when OPENAI_BASE_URL is not the default OpenRouter URL.',
    );
  }
  const modelId = modelFromEnv || DEFAULT_MODEL;

  const openai = createOpenAI({
    baseURL,
    apiKey,
  });

  // Use `.chat()` so requests hit `/chat/completions` (OpenRouter); the default
  // `openai(modelId)` uses the Responses API, which OpenRouter rejects here.
  return openai.chat(modelId);
}
