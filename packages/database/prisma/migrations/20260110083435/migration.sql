/*
  Warnings:

  - You are about to drop the `WithdrawDetail` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "WithdrawalMethodType" AS ENUM ('CRYPTO_WALLET', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'PENDING_REVIEW', 'PROCESSING', 'SENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "WithdrawalProcessingMode" AS ENUM ('AUTO', 'MANUAL');

-- DropForeignKey
ALTER TABLE "WithdrawDetail" DROP CONSTRAINT "WithdrawDetail_transactionId_fkey";

-- DropTable
DROP TABLE "WithdrawDetail";

-- CreateTable
CREATE TABLE "withdrawal_details" (
    "id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "transaction_id" BIGINT,
    "method_type" "WithdrawalMethodType" NOT NULL,
    "status" "WithdrawalStatus" NOT NULL,
    "processing_mode" "WithdrawalProcessingMode" NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "requested_amount" DECIMAL(32,18) NOT NULL,
    "net_amount" DECIMAL(32,18),
    "fee_amount" DECIMAL(32,18),
    "fee_currency" TEXT,
    "fee_paid_by" "FeePaidByType",
    "network" TEXT,
    "wallet_address" TEXT,
    "wallet_address_extra_id" TEXT,
    "transaction_hash" TEXT,
    "bank_name" TEXT,
    "account_number" TEXT,
    "account_holder" TEXT,
    "provider" "PaymentProvider" NOT NULL,
    "provider_withdrawal_id" TEXT,
    "provider_metadata" JSONB DEFAULT '{}',
    "processed_by" BIGINT,
    "admin_notes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "failure_reason" TEXT,
    "ip_address" TEXT,
    "device_fingerprint" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "applied_config" JSONB DEFAULT '{}',
    "crypto_withdraw_config_id" BIGINT,
    "bank_withdraw_config_id" BIGINT,

    CONSTRAINT "withdrawal_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crypto_withdraw_configs" (
    "id" BIGSERIAL NOT NULL,
    "symbol" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "min_withdraw_amount" DECIMAL(32,18) NOT NULL,
    "max_withdraw_amount" DECIMAL(32,18),
    "auto_process_limit" DECIMAL(32,18),
    "withdraw_fee_fixed" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "withdraw_fee_rate" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "crypto_withdraw_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_withdraw_configs" (
    "id" BIGSERIAL NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "bank_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "min_withdraw_amount" DECIMAL(32,18) NOT NULL,
    "max_withdraw_amount" DECIMAL(32,18),
    "withdraw_fee_fixed" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "withdraw_fee_rate" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "description" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "bank_withdraw_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "withdrawal_details_transaction_id_key" ON "withdrawal_details"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "withdrawal_details_provider_withdrawal_id_key" ON "withdrawal_details"("provider_withdrawal_id");

-- CreateIndex
CREATE INDEX "withdrawal_details_user_id_status_idx" ON "withdrawal_details"("user_id", "status");

-- CreateIndex
CREATE INDEX "withdrawal_details_status_created_at_idx" ON "withdrawal_details"("status", "created_at");

-- CreateIndex
CREATE INDEX "withdrawal_details_provider_status_idx" ON "withdrawal_details"("provider", "status");

-- CreateIndex
CREATE INDEX "withdrawal_details_transaction_hash_idx" ON "withdrawal_details"("transaction_hash");

-- CreateIndex
CREATE INDEX "withdrawal_details_method_type_status_idx" ON "withdrawal_details"("method_type", "status");

-- CreateIndex
CREATE INDEX "withdrawal_details_processing_mode_status_idx" ON "withdrawal_details"("processing_mode", "status");

-- CreateIndex
CREATE INDEX "withdrawal_details_processed_by_idx" ON "withdrawal_details"("processed_by");

-- CreateIndex
CREATE INDEX "crypto_withdraw_configs_symbol_network_is_active_idx" ON "crypto_withdraw_configs"("symbol", "network", "is_active");

-- CreateIndex
CREATE INDEX "crypto_withdraw_configs_is_active_idx" ON "crypto_withdraw_configs"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "crypto_withdraw_configs_symbol_network_key" ON "crypto_withdraw_configs"("symbol", "network");

-- CreateIndex
CREATE INDEX "bank_withdraw_configs_currency_is_active_idx" ON "bank_withdraw_configs"("currency", "is_active");

-- CreateIndex
CREATE INDEX "bank_withdraw_configs_is_active_idx" ON "bank_withdraw_configs"("is_active");

-- AddForeignKey
ALTER TABLE "withdrawal_details" ADD CONSTRAINT "withdrawal_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_details" ADD CONSTRAINT "withdrawal_details_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_details" ADD CONSTRAINT "withdrawal_details_crypto_withdraw_config_id_fkey" FOREIGN KEY ("crypto_withdraw_config_id") REFERENCES "crypto_withdraw_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_details" ADD CONSTRAINT "withdrawal_details_bank_withdraw_config_id_fkey" FOREIGN KEY ("bank_withdraw_config_id") REFERENCES "bank_withdraw_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
