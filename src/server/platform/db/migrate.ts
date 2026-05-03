import { promises as fs } from 'node:fs';
import path from 'node:path';
import { FileMigrationProvider, type MigrationResult, Migrator } from 'kysely';
import { createDb } from './index';

function logResult(result: MigrationResult) {
  if (result.status === 'Success') {
    console.log(`migration "${result.migrationName}" executed successfully`);
    return;
  }

  if (result.status === 'Error') {
    console.error(`migration "${result.migrationName}" failed`);
    return;
  }

  console.log(`migration "${result.migrationName}" skipped`);
}

async function migrateToLatest() {
  const db = createDb();
  const migrationFolder = path.resolve(
    process.cwd(),
    'src/server/platform/db/migrations',
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

    const { error, results } = await migrator.migrateToLatest();

    if (results) {
      for (const result of results) {
        logResult(result);
      }
    }

    if (error) {
      throw error;
    }

    if (!results || results.length === 0) {
      console.log('No pending migrations.');
    }
  } finally {
    await db.destroy();
  }
}

migrateToLatest().catch((error) => {
  console.error('Failed to run migrations.');
  console.error(error);
  process.exit(1);
});
