import { afterAll, describe, expect, it } from 'vitest';

import { getPrismaClient } from '@/lib/prisma';

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const suite = hasDatabaseUrl ? describe : describe.skip;
let prisma: ReturnType<typeof getPrismaClient> | null = null;

suite('database foundation', () => {
  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it('connects and exposes only the minimal auth tables', async () => {
    prisma = getPrismaClient();
    const rows = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name::text AS table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'users',
          'profiles',
          'roles',
          'user_roles'
        )
      ORDER BY table_name ASC
    `;

    expect(rows.map((row) => row.table_name)).toEqual([
      'profiles',
      'roles',
      'user_roles',
      'users'
    ]);
  });
});
