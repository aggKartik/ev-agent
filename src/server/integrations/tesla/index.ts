import { registerProvider } from '#/server/oauth/registry';
import { teslaProvider } from './provider';

// Side-effect registration: importing this module registers the provider
// with the global OAuth registry. `src/server/routers/index.ts` imports it
// once so registration runs before any request arrives.
registerProvider(teslaProvider);

export { teslaProvider };
export {
  readTeslaConfig,
  type TeslaRegion,
  teslaFleetBaseUrl,
  teslaRegion,
} from './config';
export * from './fleet-api';
export * from './vin';
