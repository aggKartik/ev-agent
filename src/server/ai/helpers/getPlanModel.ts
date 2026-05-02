import { anthropic } from '@ai-sdk/anthropic';

export function getPlanModel() {
  const raw = process.env.AI_PROVIDER?.trim();
  const provider =
    raw === undefined || raw === '' ? 'anthropic' : raw.toLowerCase();

  if (provider === 'anthropic') {
    return anthropic('claude-sonnet-4-5');
  }

  if (provider === 'openai') {
    throw new Error(
      'AI_PROVIDER=openai requires @ai-sdk/openai; not yet wired',
    );
  }

  throw new Error(
    `Unsupported AI_PROVIDER="${raw ?? ''}". Use "anthropic" (default). "openai" is not wired yet.`,
  );
}
