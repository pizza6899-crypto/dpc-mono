-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "NotifyStatus" AS ENUM ('PENDING', 'SENDING', 'SUCCESS', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('EMAIL', 'SMS', 'IN_APP');

-- CreateTable
CREATE TABLE "alerts" (
    "id" BIGSERIAL NOT NULL,
    "event" TEXT NOT NULL,
    "user_id" BIGINT,
    "target_group" TEXT,
    "payload" JSONB NOT NULL,
    "idempotency_key" TEXT,
    "status" "AlertStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("created_at","id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" BIGSERIAL NOT NULL,
    "alert_id" BIGINT NOT NULL,
    "alert_created_at" TIMESTAMP(3) NOT NULL,
    "channel" "ChannelType" NOT NULL,
    "receiver_id" BIGINT NOT NULL,
    "target" TEXT,
    "title" VARCHAR(100) NOT NULL,
    "body" TEXT NOT NULL,
    "action_uri" VARCHAR(500),
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 5,
    "scheduled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "NotifyStatus" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3),
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("created_at","id")
);

-- CreateIndex
CREATE INDEX "alerts_user_id_idx" ON "alerts"("user_id");

-- CreateIndex
CREATE INDEX "alerts_created_at_idx" ON "alerts"("created_at");

-- CreateIndex
CREATE INDEX "alerts_status_created_at_idx" ON "alerts"("status", "created_at");

-- CreateIndex
CREATE INDEX "alerts_event_created_at_idx" ON "alerts"("event", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "alerts_idempotency_key_created_at_key" ON "alerts"("idempotency_key", "created_at");

-- CreateIndex
CREATE INDEX "notification_logs_created_at_alert_id_idx" ON "notification_logs"("created_at", "alert_id");

-- CreateIndex
CREATE INDEX "notification_logs_receiver_id_channel_is_deleted_id_idx" ON "notification_logs"("receiver_id", "channel", "is_deleted", "id" DESC);

-- CreateIndex
CREATE INDEX "notification_logs_receiver_id_channel_is_read_created_at_idx" ON "notification_logs"("receiver_id", "channel", "is_read", "created_at");

-- CreateIndex
CREATE INDEX "notification_logs_status_scheduled_at_priority_idx" ON "notification_logs"("status", "scheduled_at", "priority");

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_alert_created_at_alert_id_fkey" FOREIGN KEY ("alert_created_at", "alert_id") REFERENCES "alerts"("created_at", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
