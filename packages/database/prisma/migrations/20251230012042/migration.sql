-- AlterTable
ALTER TABLE "activity_logs" ADD COLUMN     "session_id" TEXT;

-- AlterTable
ALTER TABLE "auth_audit_logs" ADD COLUMN     "session_id" TEXT;

-- AlterTable
ALTER TABLE "integration_logs" ADD COLUMN     "session_id" TEXT;

-- AlterTable
ALTER TABLE "system_error_logs" ADD COLUMN     "session_id" TEXT;

-- CreateIndex
CREATE INDEX "activity_logs_session_id_created_at_idx" ON "activity_logs"("session_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "auth_audit_logs_session_id_created_at_idx" ON "auth_audit_logs"("session_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "integration_logs_session_id_created_at_idx" ON "integration_logs"("session_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "system_error_logs_session_id_created_at_idx" ON "system_error_logs"("session_id", "created_at" DESC);
