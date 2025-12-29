-- AlterTable
ALTER TABLE "auth_audit_logs" ADD COLUMN     "bot" BOOLEAN,
ADD COLUMN     "cfRay" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "isMobile" BOOLEAN,
ADD COLUMN     "threat" TEXT;

-- CreateIndex
CREATE INDEX "auth_audit_logs_country_createdAt_idx" ON "auth_audit_logs"("country", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "auth_audit_logs_bot_createdAt_idx" ON "auth_audit_logs"("bot", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "auth_audit_logs_threat_createdAt_idx" ON "auth_audit_logs"("threat", "createdAt" DESC);
