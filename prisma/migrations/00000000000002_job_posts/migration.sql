DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'JobPostStatus') THEN
    CREATE TYPE "JobPostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'CANCELLED');
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS "job_posts" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "client_id" uuid NOT NULL,
  "title" text NOT NULL,
  "category" text NOT NULL,
  "description" text NOT NULL,
  "address_text" text NOT NULL,
  "desired_time" timestamp(3),
  "status" "JobPostStatus" NOT NULL DEFAULT 'PUBLISHED',
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "job_posts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "job_posts_client_id_created_at_idx" ON "job_posts"("client_id", "created_at");
CREATE INDEX IF NOT EXISTS "job_posts_category_status_idx" ON "job_posts"("category", "status");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_posts_client_id_fkey') THEN
    ALTER TABLE "job_posts"
    ADD CONSTRAINT "job_posts_client_id_fkey"
    FOREIGN KEY ("client_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END;
$$;
