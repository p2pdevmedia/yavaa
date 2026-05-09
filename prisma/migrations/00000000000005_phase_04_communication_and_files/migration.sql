DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BookingMessageKind') THEN
    CREATE TYPE "BookingMessageKind" AS ENUM ('USER', 'SYSTEM');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BookingFilePurpose') THEN
    CREATE TYPE "BookingFilePurpose" AS ENUM ('CHAT_ATTACHMENT', 'PROBLEM_PHOTO', 'PAYMENT_PROOF');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "booking_messages" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "booking_id" uuid NOT NULL,
  "sender_user_id" uuid,
  "kind" "BookingMessageKind" NOT NULL DEFAULT 'USER',
  "system_event" text,
  "body" text NOT NULL,
  "created_at" timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz(3) NOT NULL,
  CONSTRAINT "booking_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "booking_files" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "booking_id" uuid NOT NULL,
  "message_id" uuid,
  "uploaded_by_user_id" uuid NOT NULL,
  "purpose" "BookingFilePurpose" NOT NULL DEFAULT 'CHAT_ATTACHMENT',
  "file_name" text NOT NULL,
  "mime_type" text NOT NULL,
  "storage_key" text NOT NULL,
  "storage_url" text,
  "size_bytes" integer,
  "created_at" timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz(3) NOT NULL,
  CONSTRAINT "booking_files_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "booking_files_storage_key_key" ON "booking_files"("storage_key");
CREATE INDEX IF NOT EXISTS "booking_messages_booking_id_idx" ON "booking_messages"("booking_id");
CREATE INDEX IF NOT EXISTS "booking_messages_sender_user_id_idx" ON "booking_messages"("sender_user_id");
CREATE INDEX IF NOT EXISTS "booking_messages_kind_idx" ON "booking_messages"("kind");
CREATE INDEX IF NOT EXISTS "booking_files_booking_id_idx" ON "booking_files"("booking_id");
CREATE INDEX IF NOT EXISTS "booking_files_message_id_idx" ON "booking_files"("message_id");
CREATE INDEX IF NOT EXISTS "booking_files_uploaded_by_user_id_idx" ON "booking_files"("uploaded_by_user_id");
CREATE INDEX IF NOT EXISTS "booking_files_purpose_idx" ON "booking_files"("purpose");

ALTER TABLE "booking_messages"
ADD CONSTRAINT "booking_messages_booking_id_fkey"
FOREIGN KEY ("booking_id")
REFERENCES "bookings"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "booking_messages"
ADD CONSTRAINT "booking_messages_sender_user_id_fkey"
FOREIGN KEY ("sender_user_id")
REFERENCES "users"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "booking_files"
ADD CONSTRAINT "booking_files_booking_id_fkey"
FOREIGN KEY ("booking_id")
REFERENCES "bookings"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "booking_files"
ADD CONSTRAINT "booking_files_message_id_fkey"
FOREIGN KEY ("message_id")
REFERENCES "booking_messages"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "booking_files"
ADD CONSTRAINT "booking_files_uploaded_by_user_id_fkey"
FOREIGN KEY ("uploaded_by_user_id")
REFERENCES "users"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
