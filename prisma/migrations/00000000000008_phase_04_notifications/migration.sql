CREATE TABLE IF NOT EXISTS "notifications" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "recipient_user_id" uuid NOT NULL,
  "actor_user_id" uuid,
  "booking_id" uuid,
  "type" text NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "metadata" jsonb,
  "is_read" boolean NOT NULL DEFAULT false,
  "read_at" timestamp(3),
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "notifications_recipient_user_id_is_read_created_at_idx"
  ON "notifications"("recipient_user_id", "is_read", "created_at");

CREATE INDEX IF NOT EXISTS "notifications_booking_id_idx"
  ON "notifications"("booking_id");

CREATE INDEX IF NOT EXISTS "notifications_type_idx"
  ON "notifications"("type");

ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_recipient_user_id_fkey"
FOREIGN KEY ("recipient_user_id")
REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_actor_user_id_fkey"
FOREIGN KEY ("actor_user_id")
REFERENCES "users"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_booking_id_fkey"
FOREIGN KEY ("booking_id")
REFERENCES "bookings"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
