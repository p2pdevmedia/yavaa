ALTER TYPE "JobPostStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS' AFTER 'PUBLISHED';
ALTER TYPE "JobPostStatus" ADD VALUE IF NOT EXISTS 'READY_FOR_REVIEW' AFTER 'IN_PROGRESS';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_offer_status') THEN
    CREATE TYPE "job_offer_status" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
  END IF;
END;
$$;

ALTER TABLE "job_posts"
ADD COLUMN IF NOT EXISTS "accepted_offer_id" uuid;

CREATE TABLE IF NOT EXISTS "job_offers" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "job_post_id" uuid NOT NULL,
  "worker_id" uuid NOT NULL,
  "amount_cents" integer NOT NULL,
  "status" "job_offer_status" NOT NULL DEFAULT 'PENDING',
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "job_offers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "job_offer_messages" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "offer_id" uuid NOT NULL,
  "author_id" uuid NOT NULL,
  "body" text NOT NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "job_offer_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "job_payments" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "offer_id" uuid NOT NULL,
  "created_by_id" uuid NOT NULL,
  "amount_cents" integer NOT NULL,
  "paid_at" timestamp(3) NOT NULL,
  "description" text NOT NULL,
  "receipt_pathname" text,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "job_payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "job_posts_accepted_offer_id_key" ON "job_posts"("accepted_offer_id");
CREATE UNIQUE INDEX IF NOT EXISTS "job_posts_accepted_offer_id_id_key" ON "job_posts"("accepted_offer_id", "id");
CREATE INDEX IF NOT EXISTS "job_posts_status_created_at_idx" ON "job_posts"("status", "created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "job_offers_job_post_id_worker_id_key" ON "job_offers"("job_post_id", "worker_id");
CREATE UNIQUE INDEX IF NOT EXISTS "job_offers_id_job_post_id_key" ON "job_offers"("id", "job_post_id");
CREATE INDEX IF NOT EXISTS "job_offers_worker_id_status_idx" ON "job_offers"("worker_id", "status");
CREATE INDEX IF NOT EXISTS "job_offers_job_post_id_status_idx" ON "job_offers"("job_post_id", "status");
CREATE INDEX IF NOT EXISTS "job_offer_messages_offer_id_created_at_idx" ON "job_offer_messages"("offer_id", "created_at");
CREATE INDEX IF NOT EXISTS "job_payments_offer_id_paid_at_idx" ON "job_payments"("offer_id", "paid_at");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_offers_job_post_id_fkey') THEN
    ALTER TABLE "job_offers"
    ADD CONSTRAINT "job_offers_job_post_id_fkey"
    FOREIGN KEY ("job_post_id") REFERENCES "job_posts"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_offers_worker_id_fkey') THEN
    ALTER TABLE "job_offers"
    ADD CONSTRAINT "job_offers_worker_id_fkey"
    FOREIGN KEY ("worker_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_posts_accepted_offer_id_fkey') THEN
    ALTER TABLE "job_posts"
    ADD CONSTRAINT "job_posts_accepted_offer_id_fkey"
    FOREIGN KEY ("accepted_offer_id", "id") REFERENCES "job_offers"("id", "job_post_id")
    ON DELETE NO ACTION ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_offer_messages_offer_id_fkey') THEN
    ALTER TABLE "job_offer_messages"
    ADD CONSTRAINT "job_offer_messages_offer_id_fkey"
    FOREIGN KEY ("offer_id") REFERENCES "job_offers"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_offer_messages_author_id_fkey') THEN
    ALTER TABLE "job_offer_messages"
    ADD CONSTRAINT "job_offer_messages_author_id_fkey"
    FOREIGN KEY ("author_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_payments_offer_id_fkey') THEN
    ALTER TABLE "job_payments"
    ADD CONSTRAINT "job_payments_offer_id_fkey"
    FOREIGN KEY ("offer_id") REFERENCES "job_offers"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_payments_created_by_id_fkey') THEN
    ALTER TABLE "job_payments"
    ADD CONSTRAINT "job_payments_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END;
$$;
