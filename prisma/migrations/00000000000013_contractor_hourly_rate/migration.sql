ALTER TABLE "contractor_profiles"
ADD COLUMN IF NOT EXISTS "hourly_rate_cents" INTEGER;
