/*
  Warnings:

  - You are about to drop the `ActivityLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "ActivityLog";

-- CreateTable
CREATE TABLE "auth_audit_logs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" BIGINT,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "deviceFingerprint" TEXT,
    "metadata" JSONB,

    CONSTRAINT "auth_audit_logs_pkey" PRIMARY KEY ("id","createdAt")
);

-- CreateTable
CREATE TABLE "user_activity_logs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" BIGINT,
    "category" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "user_activity_logs_pkey" PRIMARY KEY ("id","createdAt")
);

-- CreateTable
CREATE TABLE "system_error_logs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" BIGINT,
    "errorCode" TEXT,
    "errorMessage" TEXT NOT NULL,
    "stackTrace" TEXT,
    "metadata" JSONB,
    "path" TEXT,
    "method" TEXT,
    "statusCode" INTEGER,
    "severity" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "system_error_logs_pkey" PRIMARY KEY ("id","createdAt")
);

-- CreateTable
CREATE TABLE "integration_logs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" BIGINT,
    "provider" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "statusCode" INTEGER,
    "requestBody" JSONB,
    "responseBody" JSONB,
    "duration" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,

    CONSTRAINT "integration_logs_pkey" PRIMARY KEY ("id","createdAt")
);

-- CreateIndex
CREATE INDEX "auth_audit_logs_userId_createdAt_idx" ON "auth_audit_logs"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "user_activity_logs_userId_category_createdAt_idx" ON "user_activity_logs"("userId", "category", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "user_activity_logs_category_action_createdAt_idx" ON "user_activity_logs"("category", "action", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "user_activity_logs_createdAt_idx" ON "user_activity_logs"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "system_error_logs_severity_resolved_createdAt_idx" ON "system_error_logs"("severity", "resolved", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "system_error_logs_errorCode_createdAt_idx" ON "system_error_logs"("errorCode", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "integration_logs_provider_success_createdAt_idx" ON "integration_logs"("provider", "success", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "integration_logs_userId_createdAt_idx" ON "integration_logs"("userId", "createdAt" DESC);
