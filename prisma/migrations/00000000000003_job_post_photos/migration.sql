ALTER TABLE "job_posts"
ADD COLUMN IF NOT EXISTS "photo_pathnames" text[] NOT NULL DEFAULT ARRAY[]::text[];
