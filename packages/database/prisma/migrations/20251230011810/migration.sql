/*
  Warnings:

  - The primary key for the `activity_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `cfRay` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `isMobile` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `activity_logs` table. All the data in the column will be lost.
  - The primary key for the `auth_audit_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `cfRay` on the `auth_audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `auth_audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `deviceFingerprint` on the `auth_audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `isMobile` on the `auth_audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `auth_audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `auth_audit_logs` table. All the data in the column will be lost.
  - The primary key for the `integration_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `cfRay` on the `integration_logs` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `integration_logs` table. All the data in the column will be lost.
  - You are about to drop the column `errorMessage` on the `integration_logs` table. All the data in the column will be lost.
  - You are about to drop the column `requestBody` on the `integration_logs` table. All the data in the column will be lost.
  - You are about to drop the column `responseBody` on the `integration_logs` table. All the data in the column will be lost.
  - You are about to drop the column `statusCode` on the `integration_logs` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `integration_logs` table. All the data in the column will be lost.
  - The primary key for the `system_error_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `cfRay` on the `system_error_logs` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `system_error_logs` table. All the data in the column will be lost.
  - You are about to drop the column `errorCode` on the `system_error_logs` table. All the data in the column will be lost.
  - You are about to drop the column `errorMessage` on the `system_error_logs` table. All the data in the column will be lost.
  - You are about to drop the column `isMobile` on the `system_error_logs` table. All the data in the column will be lost.
  - You are about to drop the column `resolvedAt` on the `system_error_logs` table. All the data in the column will be lost.
  - You are about to drop the column `stackTrace` on the `system_error_logs` table. All the data in the column will be lost.
  - You are about to drop the column `statusCode` on the `system_error_logs` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `system_error_logs` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `system_error_logs` table. All the data in the column will be lost.
  - Added the required column `error_message` to the `system_error_logs` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "activity_logs_category_action_createdAt_idx";

-- DropIndex
DROP INDEX "activity_logs_country_createdAt_idx";

-- DropIndex
DROP INDEX "activity_logs_createdAt_idx";

-- DropIndex
DROP INDEX "activity_logs_userId_category_createdAt_idx";

-- DropIndex
DROP INDEX "auth_audit_logs_bot_createdAt_idx";

-- DropIndex
DROP INDEX "auth_audit_logs_country_createdAt_idx";

-- DropIndex
DROP INDEX "auth_audit_logs_threat_createdAt_idx";

-- DropIndex
DROP INDEX "auth_audit_logs_userId_createdAt_idx";

-- DropIndex
DROP INDEX "integration_logs_country_createdAt_idx";

-- DropIndex
DROP INDEX "integration_logs_provider_success_createdAt_idx";

-- DropIndex
DROP INDEX "integration_logs_userId_createdAt_idx";

-- DropIndex
DROP INDEX "system_error_logs_bot_createdAt_idx";

-- DropIndex
DROP INDEX "system_error_logs_country_createdAt_idx";

-- DropIndex
DROP INDEX "system_error_logs_errorCode_createdAt_idx";

-- DropIndex
DROP INDEX "system_error_logs_severity_resolved_createdAt_idx";

-- AlterTable
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_pkey",
DROP COLUMN "cfRay",
DROP COLUMN "createdAt",
DROP COLUMN "isMobile",
DROP COLUMN "userId",
ADD COLUMN     "cf_ray" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_mobile" BOOLEAN,
ADD COLUMN     "user_id" BIGINT,
ADD CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id", "created_at");

-- AlterTable
ALTER TABLE "auth_audit_logs" DROP CONSTRAINT "auth_audit_logs_pkey",
DROP COLUMN "cfRay",
DROP COLUMN "createdAt",
DROP COLUMN "deviceFingerprint",
DROP COLUMN "isMobile",
DROP COLUMN "userAgent",
DROP COLUMN "userId",
ADD COLUMN     "cf_ray" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "device_fingerprint" TEXT,
ADD COLUMN     "is_mobile" BOOLEAN,
ADD COLUMN     "user_agent" TEXT,
ADD COLUMN     "user_id" BIGINT,
ADD CONSTRAINT "auth_audit_logs_pkey" PRIMARY KEY ("id", "created_at");

-- AlterTable
ALTER TABLE "integration_logs" DROP CONSTRAINT "integration_logs_pkey",
DROP COLUMN "cfRay",
DROP COLUMN "createdAt",
DROP COLUMN "errorMessage",
DROP COLUMN "requestBody",
DROP COLUMN "responseBody",
DROP COLUMN "statusCode",
DROP COLUMN "userId",
ADD COLUMN     "cf_ray" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "error_message" TEXT,
ADD COLUMN     "request_body" JSONB,
ADD COLUMN     "response_body" JSONB,
ADD COLUMN     "status_code" INTEGER,
ADD COLUMN     "user_id" BIGINT,
ADD CONSTRAINT "integration_logs_pkey" PRIMARY KEY ("id", "created_at");

-- AlterTable
ALTER TABLE "system_error_logs" DROP CONSTRAINT "system_error_logs_pkey",
DROP COLUMN "cfRay",
DROP COLUMN "createdAt",
DROP COLUMN "errorCode",
DROP COLUMN "errorMessage",
DROP COLUMN "isMobile",
DROP COLUMN "resolvedAt",
DROP COLUMN "stackTrace",
DROP COLUMN "statusCode",
DROP COLUMN "userAgent",
DROP COLUMN "userId",
ADD COLUMN     "cf_ray" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "error_code" TEXT,
ADD COLUMN     "error_message" TEXT NOT NULL,
ADD COLUMN     "is_mobile" BOOLEAN,
ADD COLUMN     "resolved_at" TIMESTAMP(3),
ADD COLUMN     "stack_trace" TEXT,
ADD COLUMN     "status_code" INTEGER,
ADD COLUMN     "user_agent" TEXT,
ADD COLUMN     "user_id" BIGINT,
ADD CONSTRAINT "system_error_logs_pkey" PRIMARY KEY ("id", "created_at");

-- CreateIndex
CREATE INDEX "activity_logs_user_id_category_created_at_idx" ON "activity_logs"("user_id", "category", "created_at" DESC);

-- CreateIndex
CREATE INDEX "activity_logs_category_action_created_at_idx" ON "activity_logs"("category", "action", "created_at" DESC);

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "activity_logs_country_created_at_idx" ON "activity_logs"("country", "created_at" DESC);

-- CreateIndex
CREATE INDEX "auth_audit_logs_user_id_created_at_idx" ON "auth_audit_logs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "auth_audit_logs_country_created_at_idx" ON "auth_audit_logs"("country", "created_at" DESC);

-- CreateIndex
CREATE INDEX "auth_audit_logs_bot_created_at_idx" ON "auth_audit_logs"("bot", "created_at" DESC);

-- CreateIndex
CREATE INDEX "auth_audit_logs_threat_created_at_idx" ON "auth_audit_logs"("threat", "created_at" DESC);

-- CreateIndex
CREATE INDEX "integration_logs_provider_success_created_at_idx" ON "integration_logs"("provider", "success", "created_at" DESC);

-- CreateIndex
CREATE INDEX "integration_logs_user_id_created_at_idx" ON "integration_logs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "integration_logs_country_created_at_idx" ON "integration_logs"("country", "created_at" DESC);

-- CreateIndex
CREATE INDEX "system_error_logs_severity_resolved_created_at_idx" ON "system_error_logs"("severity", "resolved", "created_at" DESC);

-- CreateIndex
CREATE INDEX "system_error_logs_error_code_created_at_idx" ON "system_error_logs"("error_code", "created_at" DESC);

-- CreateIndex
CREATE INDEX "system_error_logs_country_created_at_idx" ON "system_error_logs"("country", "created_at" DESC);

-- CreateIndex
CREATE INDEX "system_error_logs_bot_created_at_idx" ON "system_error_logs"("bot", "created_at" DESC);
