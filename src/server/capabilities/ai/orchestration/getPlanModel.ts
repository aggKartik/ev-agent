import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { env } from '#/lib/env';

const DEFAULT_MODEL = 'gemini-2.5-pro';

export function getPlanModel() {
  const apiKey = env.GEMINI_API_KEY.trim();
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is required for the plan agent. Create a Gemini API key in Google AI Studio: https://aistudio.google.com/app/apikey',
    );
  }

  const modelId = env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const google = createGoogleGenerativeAI({ apiKey });

  return google(modelId);
}
