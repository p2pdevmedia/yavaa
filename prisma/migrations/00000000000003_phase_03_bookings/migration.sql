DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BookingStatus') THEN
    CREATE TYPE "BookingStatus" AS ENUM (
      'PENDING_ACCEPTANCE',
      'ACCEPTED',
      'REJECTED_BY_CONTRACTOR',
      'CANCELLED_BY_CLIENT',
      'RESCHEDULE_REQUESTED'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "bookings" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "client_user_id" uuid NOT NULL,
  "contractor_profile_id" uuid NOT NULL,
  "category_id" uuid NOT NULL,
  "address_id" uuid NOT NULL,
  "scheduled_for" timestamptz(3) NOT NULL,
  "description" text NOT NULL,
  "status" "BookingStatus" NOT NULL DEFAULT 'PENDING_ACCEPTANCE',
  "contractor_note" text,
  "decision_reason" text,
  "reschedule_requested_at" timestamptz(3),
  "accepted_at" timestamptz(3),
  "rejected_at" timestamptz(3),
  "cancelled_at" timestamptz(3),
  "created_at" timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz(3) NOT NULL,
  CONSTRAINT "bookings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bookings_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "bookings_contractor_profile_id_fkey" FOREIGN KEY ("contractor_profile_id") REFERENCES "contractor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "bookings_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "bookings_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "bookings_client_user_id_idx" ON "bookings"("client_user_id");
CREATE INDEX IF NOT EXISTS "bookings_contractor_profile_id_idx" ON "bookings"("contractor_profile_id");
CREATE INDEX IF NOT EXISTS "bookings_status_idx" ON "bookings"("status");
CREATE INDEX IF NOT EXISTS "bookings_scheduled_for_idx" ON "bookings"("scheduled_for");
