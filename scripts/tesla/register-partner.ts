/**
 * One-shot Tesla Fleet partner registration for the current deployment domain.
 *
 * @see docs/tesla-fleet-api.md
 *
 * Usage:
 *   bun run tesla:register-partner
 *   bun run tesla:register-partner -- app.example.com
 *   bun run tesla:register-partner -- --domain=app.example.com
 */

import { env } from '#/lib/env';
import { readTeslaConfig } from '#/server/integrations/tesla/config';
import {
  mintPartnerAccessToken,
  registerPartnerDomain,
} from '#/server/integrations/tesla/fleet/partner';
import { OAuthError } from '#/server/oauth/errors';

function printHelp(): void {
  console.log(`Tesla Fleet — register partner domain

Reads TESLA_CLIENT_ID, TESLA_CLIENT_SECRET, TESLA_REGION from the environment
(typically via --env-file=.env).

Domain resolution:
  1) --domain=HOST or first positional argument
  2) hostname of OAUTH_BASE_URL

The public key must already be served at:
  https://<HOST>/.well-known/appspecific/com.tesla.3p.public-key.pem

Options:
  --domain=HOST   Register this hostname (no scheme)
  -h, --help      Show this help
`);
}

function parseArgs(argv: string[]): { domain?: string; help: boolean } {
  let domain: string | undefined;
  let help = false;
  for (const a of argv) {
    if (a === '-h' || a === '--help') {
      help = true;
      continue;
    }
    if (a.startsWith('--domain=')) {
      domain = a.slice('--domain='.length).trim();
      continue;
    }
    if (!a.startsWith('-') && domain === undefined) {
      domain = a.trim();
    }
  }
  return { domain, help };
}

function isNonPublicHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost')) return true;
  if (h === '127.0.0.1' || h === '::1') return true;
  if (h.endsWith('.local')) return true;
  return false;
}

function resolveDomain(explicit?: string): string {
  if (explicit && explicit.length > 0) {
    try {
      if (explicit.includes('://')) {
        return new URL(explicit).hostname;
      }
    } catch {
      throw new Error(`Invalid --domain URL: ${explicit}`);
    }
    return explicit.replace(/^\./, '');
  }
  const base = env.OAUTH_BASE_URL;
  if (!base) {
    throw new Error(
      'Set OAUTH_BASE_URL or pass a hostname: bun run tesla:register-partner -- app.example.com',
    );
  }
  return new URL(base).hostname;
}

async function main(): Promise<void> {
  const { domain: argDomain, help } = parseArgs(process.argv.slice(2));
  if (help) {
    printHelp();
    return;
  }

  let hostname: string;
  try {
    hostname = resolveDomain(argDomain);
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }

  if (isNonPublicHost(hostname)) {
    console.error(
      `Refusing to register non-public hostname "${hostname}". Tesla cannot validate localhost or .local. Use your production URL or a tunnel, and pass --domain= if it differs from OAUTH_BASE_URL.`,
    );
    process.exit(1);
  }

  const config = readTeslaConfig();
  if (!config) {
    console.error('TESLA_CLIENT_ID and TESLA_CLIENT_SECRET must be set.');
    process.exit(1);
  }

  console.log(
    `Registering partner domain "${hostname}" (region ${config.region})…`,
  );

  try {
    const { accessToken } = await mintPartnerAccessToken({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      region: config.region,
    });
    await registerPartnerDomain({
      accessToken,
      region: config.region,
      domain: hostname,
    });
  } catch (e) {
    if (e instanceof OAuthError) {
      console.error(`Tesla error [${e.code}]: ${e.message}`);
      process.exit(1);
    }
    throw e;
  }

  console.log('Partner registration succeeded.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
