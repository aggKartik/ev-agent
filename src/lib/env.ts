import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string().url(),

  // Shared OAuth config. Token encryption is provider-agnostic; the base URL
  // is used to derive per-provider callback URIs as
  // `${OAUTH_BASE_URL}/-api/oauth/{slug}/callback`.
  OAUTH_TOKEN_ENCRYPTION_KEY: z.string().optional(),
  OAUTH_BASE_URL: z.string().url().optional(),

  // Tesla integration (namespaced; read only by integrations/tesla/config.ts).
  TESLA_CLIENT_ID: z.string().optional(),
  TESLA_CLIENT_SECRET: z.string().optional(),
  TESLA_REGION: z.enum(['na', 'eu']).default('na'),
});

export const env = envSchema.parse(process.env);
