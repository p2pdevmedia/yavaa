CREATE TYPE "onboarding_role" AS ENUM ('jefe', 'trabajador');

CREATE TYPE "identity_verification_status" AS ENUM (
  'NOT_STARTED',
  'PENDING',
  'VERIFIED',
  'REJECTED'
);

ALTER TABLE "profiles"
  ADD COLUMN "onboarding_role" "onboarding_role",
  ADD COLUMN "worker_onboarding_completed_at" TIMESTAMPTZ(6),
  ADD COLUMN "jefe_onboarding_completed_at" TIMESTAMPTZ(6),
  ADD COLUMN "identity_verification_status" "identity_verification_status" NOT NULL DEFAULT 'NOT_STARTED',
  ADD COLUMN "dni_number" TEXT,
  ADD COLUMN "worker_categories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "worker_hourly_rate_cents" INTEGER,
  ADD COLUMN "address_text" TEXT,
  ADD COLUMN "location_latitude" DECIMAL(9, 6),
  ADD COLUMN "location_longitude" DECIMAL(9, 6);
