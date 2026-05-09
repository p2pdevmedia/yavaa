import { afterAll, describe, expect, it } from 'vitest';

import { getPrismaClient } from '@/lib/prisma';

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const suite = hasDatabaseUrl ? describe : describe.skip;
let prisma: ReturnType<typeof getPrismaClient> | null = null;

suite('database foundation', () => {
  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it('connects and exposes the seeded base tables', async () => {
    prisma = getPrismaClient();
    const rows = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name::text AS table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'users',
          'profiles',
          'roles',
          'user_roles',
          'audit_logs',
          'bookings',
          'emergency_request_candidates',
          'emergency_requests',
          'markets',
          'categories',
          'addresses',
          'work_zones',
          'contractor_profiles',
          'contractor_categories',
          'contractor_work_zones'
        )
      ORDER BY table_name ASC
    `;

    expect(rows.map((row) => row.table_name)).toEqual([
      'addresses',
      'audit_logs',
      'bookings',
      'categories',
      'contractor_categories',
      'contractor_profiles',
      'contractor_work_zones',
      'emergency_request_candidates',
      'emergency_requests',
      'markets',
      'profiles',
      'roles',
      'user_roles',
      'users',
      'work_zones'
    ]);
  });
});
