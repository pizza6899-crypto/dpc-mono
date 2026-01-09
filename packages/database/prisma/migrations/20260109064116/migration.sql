-- CreateEnum
CREATE TYPE "CompTransactionType" AS ENUM ('EARN', 'CLAIM', 'ADMIN', 'EXPIRE');

-- CreateTable
CREATE TABLE "user_comp_wallets" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "balance" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "total_earned" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "total_used" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_comp_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comp_wallet_transactions" (
    "id" BIGSERIAL NOT NULL,
    "comp_wallet_id" BIGINT NOT NULL,
    "amount" DECIMAL(32,18) NOT NULL,
    "balance_after" DECIMAL(32,18) NOT NULL,
    "type" "CompTransactionType" NOT NULL,
    "reference_id" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comp_wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_comp_wallets_user_id_currency_key" ON "user_comp_wallets"("user_id", "currency");

-- CreateIndex
CREATE INDEX "comp_wallet_transactions_comp_wallet_id_idx" ON "comp_wallet_transactions"("comp_wallet_id");

-- CreateIndex
CREATE INDEX "comp_wallet_transactions_created_at_idx" ON "comp_wallet_transactions"("created_at");

-- AddForeignKey
ALTER TABLE "user_comp_wallets" ADD CONSTRAINT "user_comp_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comp_wallet_transactions" ADD CONSTRAINT "comp_wallet_transactions_comp_wallet_id_fkey" FOREIGN KEY ("comp_wallet_id") REFERENCES "user_comp_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
