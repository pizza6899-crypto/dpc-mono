-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'SYSTEM';
ALTER TYPE "TransactionType" ADD VALUE 'ADMIN_ADJUST';

-- CreateTable
CREATE TABLE "admin_adjustment_details" (
    "id" BIGSERIAL NOT NULL,
    "transaction_id" BIGINT NOT NULL,
    "admin_user_id" BIGINT NOT NULL,
    "reason_code" TEXT,
    "internal_note" TEXT,

    CONSTRAINT "admin_adjustment_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_adjustment_details" (
    "id" BIGSERIAL NOT NULL,
    "transaction_id" BIGINT NOT NULL,
    "service_name" TEXT NOT NULL,
    "trigger_id" TEXT,
    "action_name" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "system_adjustment_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_adjustment_details_transaction_id_key" ON "admin_adjustment_details"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "system_adjustment_details_transaction_id_key" ON "system_adjustment_details"("transaction_id");

-- CreateIndex
CREATE INDEX "system_adjustment_details_service_name_action_name_idx" ON "system_adjustment_details"("service_name", "action_name");

-- AddForeignKey
ALTER TABLE "admin_adjustment_details" ADD CONSTRAINT "admin_adjustment_details_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_adjustment_details" ADD CONSTRAINT "system_adjustment_details_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
