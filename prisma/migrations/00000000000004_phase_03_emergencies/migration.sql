-- CreateEnum
CREATE TYPE "EmergencyRequestStatus" AS ENUM ('OPEN', 'DISPATCHING', 'ACCEPTED', 'CANCELLED_BY_CLIENT', 'REASSIGNMENT_NEEDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "EmergencyRequestCandidateStatus" AS ENUM ('NOTIFIED', 'ACCEPTED', 'IGNORED', 'EXPIRED', 'REVOKED');

-- AlterTable
ALTER TABLE "contractor_profiles"
ADD COLUMN "accepts_emergencies" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "emergency_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "client_user_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "address_id" UUID NOT NULL,
    "assigned_contractor_profile_id" UUID,
    "description" TEXT NOT NULL,
    "status" "EmergencyRequestStatus" NOT NULL DEFAULT 'DISPATCHING',
    "dispatch_round" INTEGER NOT NULL DEFAULT 1,
    "expires_at" timestamptz(3) NOT NULL,
    "accepted_at" timestamptz(3),
    "cancelled_at" timestamptz(3),
    "created_at" timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamptz(3) NOT NULL,

    CONSTRAINT "emergency_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_request_candidates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "emergency_request_id" UUID NOT NULL,
    "contractor_profile_id" UUID NOT NULL,
    "dispatch_round" INTEGER NOT NULL,
    "status" "EmergencyRequestCandidateStatus" NOT NULL DEFAULT 'NOTIFIED',
    "notified_at" timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" timestamptz(3),
    "response_note" TEXT,
    "created_at" timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamptz(3) NOT NULL,

    CONSTRAINT "emergency_request_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "emergency_requests_client_user_id_idx" ON "emergency_requests"("client_user_id");

-- CreateIndex
CREATE INDEX "emergency_requests_assigned_contractor_profile_id_idx" ON "emergency_requests"("assigned_contractor_profile_id");

-- CreateIndex
CREATE INDEX "emergency_requests_status_idx" ON "emergency_requests"("status");

-- CreateIndex
CREATE INDEX "emergency_requests_expires_at_idx" ON "emergency_requests"("expires_at");

-- CreateIndex
CREATE INDEX "emergency_request_candidates_emergency_request_id_idx" ON "emergency_request_candidates"("emergency_request_id");

-- CreateIndex
CREATE INDEX "emergency_request_candidates_contractor_profile_id_idx" ON "emergency_request_candidates"("contractor_profile_id");

-- CreateIndex
CREATE INDEX "emergency_request_candidates_status_idx" ON "emergency_request_candidates"("status");

-- AddForeignKey
ALTER TABLE "emergency_requests"
ADD CONSTRAINT "emergency_requests_client_user_id_fkey"
FOREIGN KEY ("client_user_id")
REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_requests"
ADD CONSTRAINT "emergency_requests_category_id_fkey"
FOREIGN KEY ("category_id")
REFERENCES "categories"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_requests"
ADD CONSTRAINT "emergency_requests_address_id_fkey"
FOREIGN KEY ("address_id")
REFERENCES "addresses"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_requests"
ADD CONSTRAINT "emergency_requests_assigned_contractor_profile_id_fkey"
FOREIGN KEY ("assigned_contractor_profile_id")
REFERENCES "contractor_profiles"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_request_candidates"
ADD CONSTRAINT "emergency_request_candidates_emergency_request_id_fkey"
FOREIGN KEY ("emergency_request_id")
REFERENCES "emergency_requests"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_request_candidates"
ADD CONSTRAINT "emergency_request_candidates_contractor_profile_id_fkey"
FOREIGN KEY ("contractor_profile_id")
REFERENCES "contractor_profiles"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
