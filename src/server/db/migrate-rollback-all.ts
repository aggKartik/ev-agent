import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  FileMigrationProvider,
  type MigrationResult,
  Migrator,
  NO_MIGRATIONS,
} from 'kysely';
import { createDb } from './index';

function logResult(result: MigrationResult) {
  if (result.status === 'Success') {
    console.log(`migration "${result.migrationName}" rolled back successfully`);
    return;
  }

  if (result.status === 'Error') {
    console.error(`migration "${result.migrationName}" rollback failed`);
    return;
  }

  console.log(`migration "${result.migrationName}" skipped`);
}

async function rollbackAllMigrations() {
  const db = createDb();
  const migrationFolder = path.resolve(
    process.cwd(),
    'src/server/db/migrations',
  );

  try {
    const migrator = new Migrator({
      db,
      provider: new FileMigrationProvider({
        fs,
        path,
        migrationFolder,
      }),
    });

    const { error, results } = await migrator.migrateTo(NO_MIGRATIONS);

    if (results) {
      for (const result of results) {
        logResult(result);
      }
    }

    if (error) {
      throw error;
    }

    if (!results || results.length === 0) {
      console.log('No applied migrations to roll back.');
    }
  } finally {
    await db.destroy();
  }
}

rollbackAllMigrations().catch((error) => {
  console.error('Failed to roll back migrations.');
  console.error(error);
  process.exit(1);
});
