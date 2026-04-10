import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import { env } from '#/lib/env';
import type { Database } from './types';

const { Pool } = pg;

const int8TypeId = 20;

pg.types.setTypeParser(int8TypeId, (value) => {
  return Number.parseInt(value, 10);
});

function createDb() {
  return new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: env.DATABASE_URL,
      }),
    }),
    plugins: [new CamelCasePlugin()],
  });
}

export { createDb };

declare global {
  var __kyselyDb__: Kysely<Database> | undefined;
}

export const db = globalThis.__kyselyDb__ ?? createDb();

if (env.NODE_ENV !== 'production') {
  globalThis.__kyselyDb__ = db;
}
