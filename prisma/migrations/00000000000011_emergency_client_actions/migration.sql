ALTER TYPE "EmergencyRequestStatus" ADD VALUE 'RESOLVED_BY_CLIENT';

ALTER TABLE "emergency_requests"
ADD COLUMN "resolved_at" timestamptz(3);
