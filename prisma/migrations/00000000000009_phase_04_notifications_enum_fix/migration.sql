DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
    CREATE TYPE "NotificationType" AS ENUM (
      'BOOKING_CREATED',
      'BOOKING_MESSAGE',
      'BOOKING_STATUS_CHANGED',
      'BOOKING_FILE_UPLOADED'
    );
  END IF;
END $$;

ALTER TABLE "notifications"
ALTER COLUMN "type" TYPE "NotificationType"
USING "type"::text::"NotificationType";
