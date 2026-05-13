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
          'job_posts',
          'job_offers',
          'job_offer_messages',
          'job_payments'
        )
      ORDER BY table_name ASC
    `;

    expect(rows.map((row) => row.table_name)).toEqual([
      'job_offer_messages',
      'job_offers',
      'job_payments',
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
          'accepted_offer_id',
          'title',
          'category',
          'description',
          'address_text',
          'desired_time',
          'photo_pathnames',
          'status',
          'created_at',
          'updated_at'
        )
      ORDER BY column_name ASC
    `;

    expect(jobPostColumns.map((row) => row.column_name)).toEqual([
      'accepted_offer_id',
      'address_text',
      'category',
      'client_id',
      'created_at',
      'description',
      'desired_time',
      'id',
      'photo_pathnames',
      'status',
      'title',
      'updated_at'
    ]);

    const jobPostStatusValues = await prisma.$queryRaw<Array<{ enum_label: string }>>`
      SELECT pg_enum.enumlabel::text AS enum_label
      FROM pg_enum
      INNER JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
      WHERE pg_type.typname = 'JobPostStatus'
      ORDER BY pg_enum.enumsortorder ASC
    `;

    expect(jobPostStatusValues.map((row) => row.enum_label)).toEqual([
      'DRAFT',
      'PUBLISHED',
      'IN_PROGRESS',
      'READY_FOR_REVIEW',
      'CLOSED',
      'CANCELLED'
    ]);

    const acceptedOfferForeignKeys = await prisma.$queryRaw<
      Array<{
        constraint_name: string;
        constrained_columns: string[];
        referenced_columns: string[];
      }>
    >`
      WITH accepted_offer_fk AS (
        SELECT
          pg_constraint.oid,
          pg_constraint.conname,
          pg_constraint.conrelid,
          pg_constraint.confrelid,
          pg_constraint.conkey,
          pg_constraint.confkey
        FROM pg_constraint
        WHERE pg_constraint.contype = 'f'
          AND pg_constraint.conrelid = 'job_posts'::regclass
          AND pg_constraint.confrelid = 'job_offers'::regclass
      )
      SELECT
        accepted_offer_fk.conname::text AS constraint_name,
        array_agg(source_attribute.attname::text ORDER BY column_pair.ordinality)::text[] AS constrained_columns,
        array_agg(target_attribute.attname::text ORDER BY column_pair.ordinality)::text[] AS referenced_columns
      FROM accepted_offer_fk
      INNER JOIN LATERAL unnest(accepted_offer_fk.conkey, accepted_offer_fk.confkey)
        WITH ORDINALITY AS column_pair(source_attnum, target_attnum, ordinality) ON TRUE
      INNER JOIN pg_attribute source_attribute
        ON source_attribute.attrelid = accepted_offer_fk.conrelid
        AND source_attribute.attnum = column_pair.source_attnum
      INNER JOIN pg_attribute target_attribute
        ON target_attribute.attrelid = accepted_offer_fk.confrelid
        AND target_attribute.attnum = column_pair.target_attnum
      GROUP BY accepted_offer_fk.conname
      HAVING array_agg(source_attribute.attname::text ORDER BY column_pair.ordinality) = ARRAY['accepted_offer_id', 'id']::text[]
        AND array_agg(target_attribute.attname::text ORDER BY column_pair.ordinality) = ARRAY['id', 'job_post_id']::text[]
    `;

    expect(acceptedOfferForeignKeys).toEqual([
      {
        constraint_name: 'job_posts_accepted_offer_id_fkey',
        constrained_columns: ['accepted_offer_id', 'id'],
        referenced_columns: ['id', 'job_post_id']
      }
    ]);
  });
});
