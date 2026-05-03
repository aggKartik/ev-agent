import { createFileRoute } from '@tanstack/react-router';
import { env } from '#/lib/env';

/**
 * Tesla Fleet partner verification fetches this URL (no redirects).
 *
 * @see https://developer.tesla.com/docs/fleet-api/endpoints/partner-endpoints
 */
export const Route = createFileRoute(
  '/.well-known/appspecific/com.tesla.3p.public-key.pem',
)({
  server: {
    handlers: {
      GET: async () => {
        const pem = env.TESLA_FLEET_PUBLIC_KEY_PEM;
        if (typeof pem !== 'string' || pem.trim().length === 0) {
          return new Response('Tesla Fleet public key is not configured.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        }
        const body = pem.endsWith('\n') ? pem : `${pem}\n`;
        return new Response(body, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      },
    },
  },
});
