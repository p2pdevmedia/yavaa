CREATE TABLE IF NOT EXISTS "user_addresses" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "name" text NOT NULL,
  "address_text" text NOT NULL,
  "location_latitude" decimal(9, 6) NOT NULL,
  "location_longitude" decimal(9, 6) NOT NULL,
  "is_primary" boolean NOT NULL DEFAULT false,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "user_addresses_user_id_is_primary_idx" ON "user_addresses"("user_id", "is_primary");
CREATE UNIQUE INDEX IF NOT EXISTS "user_addresses_one_primary_per_user_idx"
  ON "user_addresses"("user_id")
  WHERE "is_primary" = true;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_addresses_user_id_fkey') THEN
    ALTER TABLE "user_addresses"
    ADD CONSTRAINT "user_addresses_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END;
$$;

INSERT INTO "user_addresses" (
  "user_id",
  "name",
  "address_text",
  "location_latitude",
  "location_longitude",
  "is_primary",
  "created_at",
  "updated_at"
)
SELECT
  "user_id",
  'Principal',
  "address_text",
  "location_latitude",
  "location_longitude",
  true,
  NOW(),
  NOW()
FROM "profiles"
WHERE "address_text" IS NOT NULL
  AND "location_latitude" IS NOT NULL
  AND "location_longitude" IS NOT NULL
ON CONFLICT DO NOTHING;
