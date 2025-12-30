/*
  Warnings:

  - You are about to drop the `UserSession` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('HTTP', 'WEBSOCKET');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- DropForeignKey
ALTER TABLE "UserSession" DROP CONSTRAINT "UserSession_userId_fkey";

-- DropTable
DROP TABLE "UserSession";

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "session_id" TEXT NOT NULL,
    "type" "SessionType" NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "ip_address" TEXT,
    "user_agent" TEXT,
    "device_fingerprint" TEXT,
    "is_mobile" BOOLEAN,
    "device_name" TEXT,
    "os" TEXT,
    "browser" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_active_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "revoked_by" BIGINT,
    "metadata" JSONB DEFAULT '{}',

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_uid_key" ON "user_sessions"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_session_id_key" ON "user_sessions"("session_id");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_status_idx" ON "user_sessions"("user_id", "status");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_created_at_idx" ON "user_sessions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "user_sessions_session_id_idx" ON "user_sessions"("session_id");

-- CreateIndex
CREATE INDEX "user_sessions_type_idx" ON "user_sessions"("type");

-- CreateIndex
CREATE INDEX "user_sessions_status_idx" ON "user_sessions"("status");

-- CreateIndex
CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "user_sessions_status_expires_at_idx" ON "user_sessions"("status", "expires_at");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_type_status_idx" ON "user_sessions"("user_id", "type", "status");

-- CreateIndex
CREATE INDEX "user_sessions_device_fingerprint_idx" ON "user_sessions"("device_fingerprint");

-- CreateIndex
CREATE INDEX "user_sessions_ip_address_idx" ON "user_sessions"("ip_address");

-- CreateIndex
CREATE INDEX "user_sessions_last_active_at_idx" ON "user_sessions"("last_active_at");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_status_last_active_at_idx" ON "user_sessions"("user_id", "status", "last_active_at");

-- CreateIndex
CREATE INDEX "user_sessions_status_expires_at_created_at_idx" ON "user_sessions"("status", "expires_at", "created_at");

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
