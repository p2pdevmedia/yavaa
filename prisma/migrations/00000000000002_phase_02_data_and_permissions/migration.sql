DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContractorApprovalStatus') THEN
    CREATE TYPE "ContractorApprovalStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AddressType') THEN
    CREATE TYPE "AddressType" AS ENUM ('HOME', 'WORK', 'OTHER');
  END IF;
END $$;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "supabase_auth_id" text;

CREATE UNIQUE INDEX IF NOT EXISTS "users_supabase_auth_id_key" ON "users"("supabase_auth_id");

CREATE TABLE IF NOT EXISTS "addresses" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "market_id" uuid,
  "label" text NOT NULL,
  "line_1" text NOT NULL,
  "line_2" text,
  "city" text NOT NULL,
  "province" text NOT NULL,
  "postal_code" text,
  "notes" text,
  "address_type" "AddressType" NOT NULL DEFAULT 'HOME',
  "is_default" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz(3) NOT NULL,
  CONSTRAINT "addresses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "addresses_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "markets"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "addresses_user_id_idx" ON "addresses"("user_id");
CREATE INDEX IF NOT EXISTS "addresses_market_id_idx" ON "addresses"("market_id");

CREATE TABLE IF NOT EXISTS "work_zones" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "market_id" uuid NOT NULL,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "created_at" timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz(3) NOT NULL,
  CONSTRAINT "work_zones_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "work_zones_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "markets"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "work_zones_market_id_slug_key" ON "work_zones"("market_id", "slug");
CREATE INDEX IF NOT EXISTS "work_zones_market_id_idx" ON "work_zones"("market_id");

CREATE TABLE IF NOT EXISTS "contractor_profiles" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "address_id" uuid,
  "approval_status" "ContractorApprovalStatus" NOT NULL DEFAULT 'DRAFT',
  "dni_number" text,
  "dni_front_url" text,
  "dni_back_url" text,
  "profile_photo_url" text,
  "review_notes" text,
  "submitted_at" timestamptz(3),
  "reviewed_at" timestamptz(3),
  "reviewed_by_user_id" uuid,
  "created_at" timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz(3) NOT NULL,
  CONSTRAINT "contractor_profiles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "contractor_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "contractor_profiles_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "contractor_profiles_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "contractor_profiles_user_id_key" ON "contractor_profiles"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "contractor_profiles_address_id_key" ON "contractor_profiles"("address_id");
CREATE UNIQUE INDEX IF NOT EXISTS "contractor_profiles_dni_number_key" ON "contractor_profiles"("dni_number");
CREATE INDEX IF NOT EXISTS "contractor_profiles_approval_status_idx" ON "contractor_profiles"("approval_status");
CREATE INDEX IF NOT EXISTS "contractor_profiles_reviewed_by_user_id_idx" ON "contractor_profiles"("reviewed_by_user_id");

CREATE TABLE IF NOT EXISTS "contractor_categories" (
  "contractor_profile_id" uuid NOT NULL,
  "category_id" uuid NOT NULL,
  "is_primary" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "contractor_categories_pkey" PRIMARY KEY ("contractor_profile_id", "category_id"),
  CONSTRAINT "contractor_categories_contractor_profile_id_fkey" FOREIGN KEY ("contractor_profile_id") REFERENCES "contractor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "contractor_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "contractor_categories_category_id_idx" ON "contractor_categories"("category_id");

CREATE TABLE IF NOT EXISTS "contractor_work_zones" (
  "contractor_profile_id" uuid NOT NULL,
  "work_zone_id" uuid NOT NULL,
  "created_at" timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "contractor_work_zones_pkey" PRIMARY KEY ("contractor_profile_id", "work_zone_id"),
  CONSTRAINT "contractor_work_zones_contractor_profile_id_fkey" FOREIGN KEY ("contractor_profile_id") REFERENCES "contractor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "contractor_work_zones_work_zone_id_fkey" FOREIGN KEY ("work_zone_id") REFERENCES "work_zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "contractor_work_zones_work_zone_id_idx" ON "contractor_work_zones"("work_zone_id");
