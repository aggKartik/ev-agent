import { env } from '#/lib/env';

export function requireMapboxToken(capability: string): string {
  if (env.MAPBOX_TOKEN) return env.MAPBOX_TOKEN;
  throw new Error(
    `MAPBOX_TOKEN is not set. Configure it in .env to enable ${capability}.`,
  );
}

export async function fetchMapboxJson<T>(
  url: string,
  failureLabel: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `${failureLabel} (${response.status}): ${body.slice(0, 200)}`,
    );
  }
  return (await response.json()) as T;
}
