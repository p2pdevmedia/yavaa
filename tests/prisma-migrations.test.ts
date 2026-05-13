import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const migrationsDir = join(projectRoot, 'prisma', 'migrations');

describe('Prisma migrations', () => {
  it('keeps a post-marketplace backfill for accepted job post statuses', () => {
    const backfillMigrations = readdirSync(migrationsDir)
      .filter((migrationName) => migrationName > '20260513173000_worker_offers_marketplace')
      .map((migrationName) => readFileSync(join(migrationsDir, migrationName, 'migration.sql'), 'utf8'));

    expect(backfillMigrations.join('\n')).toContain(
      `ALTER TYPE "JobPostStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS'`
    );
    expect(backfillMigrations.join('\n')).toContain(
      `ALTER TYPE "JobPostStatus" ADD VALUE IF NOT EXISTS 'READY_FOR_REVIEW'`
    );
  });
});
