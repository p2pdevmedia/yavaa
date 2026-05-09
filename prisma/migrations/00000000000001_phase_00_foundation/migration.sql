DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CategoryStatus') THEN
    CREATE TYPE "CategoryStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING_REVIEW');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "markets" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "slug" text NOT NULL,
  "country" text NOT NULL,
  "province" text NOT NULL,
  "city" text NOT NULL,
  "is_primary" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz(3) NOT NULL,
  CONSTRAINT "markets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "markets_slug_key" ON "markets"("slug");

CREATE TABLE IF NOT EXISTS "categories" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "category_group" text,
  "status" "CategoryStatus" NOT NULL DEFAULT 'ACTIVE',
  "is_initial" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz(3) NOT NULL,
  CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "categories_slug_key" ON "categories"("slug");
CREATE INDEX IF NOT EXISTS "categories_status_idx" ON "categories"("status");
CREATE INDEX IF NOT EXISTS "categories_category_group_idx" ON "categories"("category_group");
