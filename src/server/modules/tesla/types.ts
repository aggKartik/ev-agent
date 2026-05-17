import type { Context } from '#/server/platform/context';

export type TeslaAuthedContext = Context & { userId: number };
