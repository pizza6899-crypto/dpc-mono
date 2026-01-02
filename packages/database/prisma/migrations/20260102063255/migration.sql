/*
  Warnings:

  - You are about to drop the `DepositDetail` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DepositDetail" DROP CONSTRAINT "DepositDetail_bankAccountId_fkey";

-- DropForeignKey
ALTER TABLE "DepositDetail" DROP CONSTRAINT "DepositDetail_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "Rolling" DROP CONSTRAINT "Rolling_depositDetailId_fkey";

-- DropTable
DROP TABLE "DepositDetail";

-- CreateTable
CREATE TABLE "deposit_details" (
    "id" BIGSERIAL NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "status" "DepositDetailStatus" NOT NULL,
    "transaction_id" BIGINT NOT NULL,
    "method_type" "DepositMethodType" NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "provider_payment_id" TEXT,
    "deposit_currency" "ExchangeCurrencyCode" NOT NULL,
    "deposit_network" TEXT,
    "wallet_address" TEXT,
    "wallet_address_extra_id" TEXT,
    "bank_name" TEXT,
    "account_number" TEXT,
    "account_holder" TEXT,
    "depositor_name" TEXT,
    "transaction_hash" TEXT,
    "actually_paid" DECIMAL(32,18),
    "fee_amount" DECIMAL(32,18),
    "fee_currency" TEXT,
    "fee_paid_by" "FeePaidByType",
    "failure_reason" TEXT,
    "provider_metadata" JSONB DEFAULT '{}',
    "bank_account_id" INTEGER,

    CONSTRAINT "deposit_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deposit_details_transaction_id_key" ON "deposit_details"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "deposit_details_provider_payment_id_key" ON "deposit_details"("provider_payment_id");

-- CreateIndex
CREATE INDEX "deposit_details_provider_provider_payment_id_idx" ON "deposit_details"("provider", "provider_payment_id");

-- CreateIndex
CREATE INDEX "deposit_details_status_created_at_idx" ON "deposit_details"("status", "created_at");

-- CreateIndex
CREATE INDEX "deposit_details_transaction_id_idx" ON "deposit_details"("transaction_id");

-- CreateIndex
CREATE INDEX "deposit_details_method_type_status_idx" ON "deposit_details"("method_type", "status");

-- CreateIndex
CREATE INDEX "deposit_details_deposit_currency_status_idx" ON "deposit_details"("deposit_currency", "status");

-- CreateIndex
CREATE INDEX "deposit_details_created_at_idx" ON "deposit_details"("created_at");

-- AddForeignKey
ALTER TABLE "Rolling" ADD CONSTRAINT "Rolling_depositDetailId_fkey" FOREIGN KEY ("depositDetailId") REFERENCES "deposit_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_details" ADD CONSTRAINT "deposit_details_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_details" ADD CONSTRAINT "deposit_details_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
