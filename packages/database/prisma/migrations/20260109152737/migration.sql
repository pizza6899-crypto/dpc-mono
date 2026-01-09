-- AlterTable
ALTER TABLE "activity_logs" ALTER COLUMN "created_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "auth_audit_logs" ALTER COLUMN "created_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "integration_logs" ALTER COLUMN "created_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "system_error_logs" ALTER COLUMN "created_at" DROP DEFAULT;
