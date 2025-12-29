-- AlterTable
ALTER TABLE "activity_logs" ADD COLUMN     "cfRay" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "isMobile" BOOLEAN;

-- AlterTable
ALTER TABLE "integration_logs" ADD COLUMN     "bot" BOOLEAN,
ADD COLUMN     "cfRay" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "ip" TEXT,
ADD COLUMN     "threat" TEXT;

-- AlterTable
ALTER TABLE "system_error_logs" ADD COLUMN     "bot" BOOLEAN,
ADD COLUMN     "cfRay" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "ip" TEXT,
ADD COLUMN     "isMobile" BOOLEAN,
ADD COLUMN     "threat" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- CreateIndex
CREATE INDEX "activity_logs_country_createdAt_idx" ON "activity_logs"("country", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "integration_logs_country_createdAt_idx" ON "integration_logs"("country", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "system_error_logs_country_createdAt_idx" ON "system_error_logs"("country", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "system_error_logs_bot_createdAt_idx" ON "system_error_logs"("bot", "createdAt" DESC);
