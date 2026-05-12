import { afterAll, describe, expect, it } from 'vitest';

import { getPrismaClient } from '@/lib/prisma';

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const suite = hasDatabaseUrl ? describe : describe.skip;
let prisma: ReturnType<typeof getPrismaClient> | null = null;

suite('database foundation', () => {
  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it('connects and exposes the auth and stage 5 marketplace tables', async () => {
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
          'job_posts'
        )
      ORDER BY table_name ASC
    `;

    expect(rows.map((row) => row.table_name)).toEqual([
      'job_posts',
      'profiles',
      'roles',
      'user_roles',
      'users'
    ]);

    const profileColumns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name::text AS column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name IN (
          'onboarding_role',
          'worker_onboarding_completed_at',
          'jefe_onboarding_completed_at',
          'identity_verification_status',
          'dni_number',
          'worker_categories',
          'worker_hourly_rate_cents',
          'address_text',
          'location_latitude',
          'location_longitude'
        )
      ORDER BY column_name ASC
    `;

    expect(profileColumns.map((row) => row.column_name)).toEqual([
      'address_text',
      'dni_number',
      'identity_verification_status',
      'jefe_onboarding_completed_at',
      'location_latitude',
      'location_longitude',
      'onboarding_role',
      'worker_categories',
      'worker_hourly_rate_cents',
      'worker_onboarding_completed_at'
    ]);

    const jobPostColumns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name::text AS column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'job_posts'
        AND column_name IN (
          'id',
          'client_id',
          'title',
          'category',
          'description',
          'address_text',
          'desired_time',
          'status',
          'created_at',
          'updated_at'
        )
      ORDER BY column_name ASC
    `;

    expect(jobPostColumns.map((row) => row.column_name)).toEqual([
      'address_text',
      'category',
      'client_id',
      'created_at',
      'description',
      'desired_time',
      'id',
      'status',
      'title',
      'updated_at'
    ]);
  });
});
