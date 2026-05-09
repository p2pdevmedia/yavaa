DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CommissionDebtStatus') THEN
    CREATE TYPE "CommissionDebtStatus" AS ENUM ('OPEN', 'PAID', 'CANCELLED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CommissionDebtSourceType') THEN
    CREATE TYPE "CommissionDebtSourceType" AS ENUM ('ADMIN_ADJUSTMENT', 'BOOKING_COMMISSION');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "commission_debts" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "source_type" "CommissionDebtSourceType" NOT NULL DEFAULT 'ADMIN_ADJUSTMENT',
  "source_id" text,
  "amount_cents" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'ARS',
  "status" "CommissionDebtStatus" NOT NULL DEFAULT 'OPEN',
  "reason" text NOT NULL,
  "created_by_user_id" uuid,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  CONSTRAINT "commission_debts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_debt_limits" (
  "user_id" uuid NOT NULL,
  "limit_cents" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'ARS',
  "set_by_user_id" uuid NOT NULL,
  "reason" text NOT NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  CONSTRAINT "user_debt_limits_pkey" PRIMARY KEY ("user_id")
);

CREATE INDEX IF NOT EXISTS "commission_debts_user_id_status_idx"
  ON "commission_debts"("user_id", "status");

CREATE INDEX IF NOT EXISTS "commission_debts_created_by_user_id_idx"
  ON "commission_debts"("created_by_user_id");

CREATE INDEX IF NOT EXISTS "commission_debts_source_type_source_id_idx"
  ON "commission_debts"("source_type", "source_id");

CREATE INDEX IF NOT EXISTS "commission_debts_created_at_idx"
  ON "commission_debts"("created_at");

CREATE INDEX IF NOT EXISTS "user_debt_limits_set_by_user_id_idx"
  ON "user_debt_limits"("set_by_user_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'commission_debts_user_id_fkey'
  ) THEN
    ALTER TABLE "commission_debts"
    ADD CONSTRAINT "commission_debts_user_id_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "users"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'commission_debts_created_by_user_id_fkey'
  ) THEN
    ALTER TABLE "commission_debts"
    ADD CONSTRAINT "commission_debts_created_by_user_id_fkey"
    FOREIGN KEY ("created_by_user_id")
    REFERENCES "users"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_debt_limits_user_id_fkey'
  ) THEN
    ALTER TABLE "user_debt_limits"
    ADD CONSTRAINT "user_debt_limits_user_id_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "users"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_debt_limits_set_by_user_id_fkey'
  ) THEN
    ALTER TABLE "user_debt_limits"
    ADD CONSTRAINT "user_debt_limits_set_by_user_id_fkey"
    FOREIGN KEY ("set_by_user_id")
    REFERENCES "users"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
  END IF;
END $$;
