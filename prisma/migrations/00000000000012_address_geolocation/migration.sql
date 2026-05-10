ALTER TABLE "addresses"
ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;

ALTER TABLE "addresses"
ADD CONSTRAINT "addresses_latitude_range_check"
CHECK ("latitude" IS NULL OR ("latitude" >= -90 AND "latitude" <= 90));

ALTER TABLE "addresses"
ADD CONSTRAINT "addresses_longitude_range_check"
CHECK ("longitude" IS NULL OR ("longitude" >= -180 AND "longitude" <= 180));
