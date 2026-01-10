/*
  Warnings:

  - You are about to drop the column `bank_config_id` on the `deposit_details` table. All the data in the column will be lost.
  - You are about to drop the column `crypto_config_id` on the `deposit_details` table. All the data in the column will be lost.
  - You are about to drop the `bank_configs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `crypto_configs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "deposit_details" DROP CONSTRAINT "deposit_details_bank_config_id_fkey";

-- DropForeignKey
ALTER TABLE "deposit_details" DROP CONSTRAINT "deposit_details_crypto_config_id_fkey";

-- DropIndex
DROP INDEX "deposit_details_bank_config_id_idx";

-- DropIndex
DROP INDEX "deposit_details_crypto_config_id_idx";

-- AlterTable
ALTER TABLE "deposit_details" DROP COLUMN "bank_config_id",
DROP COLUMN "crypto_config_id",
ADD COLUMN     "bank_deposit_config_id" BIGINT,
ADD COLUMN     "crypto_deposit_config_id" BIGINT;

-- DropTable
DROP TABLE "bank_configs";

-- DropTable
DROP TABLE "crypto_configs";

-- CreateTable
CREATE TABLE "crypto_deposit_configs" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "min_deposit_amount" DECIMAL(32,18) NOT NULL,
    "deposit_fee_rate" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "confirmations" INTEGER NOT NULL DEFAULT 3,
    "contract_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "crypto_deposit_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_deposit_configs" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "bank_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "account_holder" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "notes" TEXT,
    "min_amount" DECIMAL(32,18) NOT NULL,
    "max_amount" DECIMAL(32,18),
    "total_deposits" INTEGER NOT NULL DEFAULT 0,
    "total_deposit_amount" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "bank_deposit_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "crypto_deposit_configs_uid_key" ON "crypto_deposit_configs"("uid");

-- CreateIndex
CREATE INDEX "crypto_deposit_configs_symbol_network_isActive_idx" ON "crypto_deposit_configs"("symbol", "network", "isActive");

-- CreateIndex
CREATE INDEX "crypto_deposit_configs_isActive_idx" ON "crypto_deposit_configs"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "crypto_deposit_configs_symbol_network_key" ON "crypto_deposit_configs"("symbol", "network");

-- CreateIndex
CREATE UNIQUE INDEX "bank_deposit_configs_uid_key" ON "bank_deposit_configs"("uid");

-- CreateIndex
CREATE INDEX "bank_deposit_configs_currency_is_active_priority_idx" ON "bank_deposit_configs"("currency", "is_active", "priority");

-- CreateIndex
CREATE INDEX "bank_deposit_configs_is_active_idx" ON "bank_deposit_configs"("is_active");

-- CreateIndex
CREATE INDEX "bank_deposit_configs_currency_idx" ON "bank_deposit_configs"("currency");

-- CreateIndex
CREATE INDEX "bank_deposit_configs_priority_idx" ON "bank_deposit_configs"("priority");

-- CreateIndex
CREATE INDEX "bank_deposit_configs_deleted_at_idx" ON "bank_deposit_configs"("deleted_at");

-- CreateIndex
CREATE INDEX "deposit_details_bank_deposit_config_id_idx" ON "deposit_details"("bank_deposit_config_id");

-- CreateIndex
CREATE INDEX "deposit_details_crypto_deposit_config_id_idx" ON "deposit_details"("crypto_deposit_config_id");

-- AddForeignKey
ALTER TABLE "deposit_details" ADD CONSTRAINT "deposit_details_bank_deposit_config_id_fkey" FOREIGN KEY ("bank_deposit_config_id") REFERENCES "bank_deposit_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_details" ADD CONSTRAINT "deposit_details_crypto_deposit_config_id_fkey" FOREIGN KEY ("crypto_deposit_config_id") REFERENCES "crypto_deposit_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
