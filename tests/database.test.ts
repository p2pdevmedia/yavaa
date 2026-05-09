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
          'booking_files',
          'booking_messages',
          'notifications',
          'emergency_request_candidates',
          'emergency_requests',
          'markets',
          'categories',
          'commission_debts',
          'addresses',
          'work_zones',
          'contractor_profiles',
          'contractor_categories',
          'contractor_work_zones',
          'user_debt_limits'
        )
      ORDER BY table_name ASC
    `;

    expect(rows.map((row) => row.table_name)).toEqual([
      'addresses',
      'audit_logs',
      'booking_files',
      'booking_messages',
      'bookings',
      'categories',
      'commission_debts',
      'contractor_categories',
      'contractor_profiles',
      'contractor_work_zones',
      'emergency_request_candidates',
      'emergency_requests',
      'markets',
      'notifications',
      'profiles',
      'roles',
      'user_debt_limits',
      'user_roles',
      'users',
      'work_zones'
    ]);
  });

  it('exposes debt ledger timestamp defaults and indexes', async () => {
    prisma = getPrismaClient();

    const columns = await prisma.$queryRaw<
      Array<{ table_name: string; column_name: string; column_default: string | null }>
    >`
      SELECT table_name::text AS table_name,
        column_name::text AS column_name,
        column_default::text AS column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('commission_debts', 'user_debt_limits')
        AND column_name = 'updated_at'
      ORDER BY table_name ASC
    `;

    const updatedAtDefaults = new Map(
      columns.map((column) => [column.table_name, column.column_default?.toLowerCase() ?? ''])
    );

    expect(updatedAtDefaults.get('commission_debts')).toContain('current_timestamp');
    expect(updatedAtDefaults.get('user_debt_limits')).toContain('current_timestamp');

    const indexes = await prisma.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname::text AS indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('commission_debts', 'user_debt_limits')
        AND indexname IN (
          'commission_debts_user_id_status_idx',
          'commission_debts_created_by_user_id_idx',
          'commission_debts_source_type_source_id_idx',
          'commission_debts_created_at_idx',
          'user_debt_limits_set_by_user_id_idx'
        )
      ORDER BY indexname ASC
    `;

    expect(indexes.map((index) => index.indexname)).toEqual([
      'commission_debts_created_at_idx',
      'commission_debts_created_by_user_id_idx',
      'commission_debts_source_type_source_id_idx',
      'commission_debts_user_id_status_idx',
      'user_debt_limits_set_by_user_id_idx'
    ]);
  });
});
