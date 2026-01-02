/*
  Warnings:

  - You are about to drop the column `bank_account_id` on the `deposit_details` table. All the data in the column will be lost.
  - You are about to drop the `BankAccount` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "deposit_details" DROP CONSTRAINT "deposit_details_bank_account_id_fkey";

-- AlterTable
ALTER TABLE "deposit_details" DROP COLUMN "bank_account_id",
ADD COLUMN     "bank_config_id" BIGINT;

-- DropTable
DROP TABLE "BankAccount";

-- CreateTable
CREATE TABLE "crypto_configs" (
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

    CONSTRAINT "crypto_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_configs" (
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

    CONSTRAINT "bank_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "crypto_configs_uid_key" ON "crypto_configs"("uid");

-- CreateIndex
CREATE INDEX "crypto_configs_symbol_network_isActive_idx" ON "crypto_configs"("symbol", "network", "isActive");

-- CreateIndex
CREATE INDEX "crypto_configs_isActive_idx" ON "crypto_configs"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "crypto_configs_symbol_network_key" ON "crypto_configs"("symbol", "network");

-- CreateIndex
CREATE UNIQUE INDEX "bank_configs_uid_key" ON "bank_configs"("uid");

-- CreateIndex
CREATE INDEX "bank_configs_currency_is_active_priority_idx" ON "bank_configs"("currency", "is_active", "priority");

-- CreateIndex
CREATE INDEX "bank_configs_is_active_idx" ON "bank_configs"("is_active");

-- CreateIndex
CREATE INDEX "bank_configs_currency_idx" ON "bank_configs"("currency");

-- CreateIndex
CREATE INDEX "bank_configs_priority_idx" ON "bank_configs"("priority");

-- CreateIndex
CREATE INDEX "bank_configs_deleted_at_idx" ON "bank_configs"("deleted_at");

-- AddForeignKey
ALTER TABLE "deposit_details" ADD CONSTRAINT "deposit_details_bank_config_id_fkey" FOREIGN KEY ("bank_config_id") REFERENCES "bank_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
