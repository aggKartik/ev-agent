import { z } from 'zod';

/**
 * Centralized environment validation. Importing `env` (or any module that
 * does) parses `process.env` once and throws if a required key is missing or
 * malformed, so misconfiguration fails at startup rather than deep in a
 * request handler.
 *
 * `envSchema` is exported for unit-testing the validation rules without
 * relying on `process.env`.
 */

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string().url(),

  // Shared OAuth config. Token encryption is provider-agnostic; the base URL
  // is used to derive per-provider callback URIs as
  // `${OAUTH_BASE_URL}/api/oauth/{slug}/callback`.
  OAUTH_TOKEN_ENCRYPTION_KEY: z.string().optional(),
  OAUTH_BASE_URL: z.string().url().optional(),

  // Tesla integration (namespaced; read only by integrations/tesla/config.ts).
  TESLA_CLIENT_ID: z.string().optional(),
  TESLA_CLIENT_SECRET: z.string().optional(),
  TESLA_REGION: z.enum(['na', 'eu']).default('na'),
  /** EC public key PEM served at `/.well-known/appspecific/com.tesla.3p.public-key.pem` for Fleet partner registration. */
  TESLA_FLEET_PUBLIC_KEY_PEM: z.string().optional(),
  /** HTTPS URL for Tesla's official vehicle-command proxy, used for signed vehicle commands. */
  TESLA_COMMAND_PROXY_URL: z
    .string()
    .url()
    .refine(
      (url) => {
        try {
          return new URL(url).protocol === 'https:';
        } catch {
          return false;
        }
      },
      {
        message: 'TESLA_COMMAND_PROXY_URL must use https://.',
      },
    )
    .optional(),

  // Plan agent LLM. Gemini provider; see
  // `src/server/capabilities/ai/orchestration/getPlanModel.ts`.
  GEMINI_API_KEY: z.string().trim().min(1),
  GEMINI_MODEL: z.string().optional(),

  // Mapbox token for places + directions tools.
  MAPBOX_TOKEN: z.string().trim().min(1),

  // TomTom Long Distance EV Routing prefetch.
  TOMTOM_API_KEY: z.string().trim().min(1),

  // OpenChargeMap API key (optional but recommended for higher quotas).
  OPENCHARGEMAP_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
