import { anthropic } from '@ai-sdk/anthropic';

export function getPlanModel() {
  const provider = process.env.AI_PROVIDER ?? 'anthropic';
  if (provider === 'openai') {
    throw new Error(
      'AI_PROVIDER=openai requires @ai-sdk/openai; not yet wired',
    );
  }
  return anthropic('claude-sonnet-4-5');
}
