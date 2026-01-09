/*
  Warnings:

  - You are about to drop the `CompTransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DailyCompEarning` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CompTransaction" DROP CONSTRAINT "CompTransaction_dailyCompEarningId_fkey";

-- DropForeignKey
ALTER TABLE "CompTransaction" DROP CONSTRAINT "CompTransaction_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "CompTransaction" DROP CONSTRAINT "CompTransaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "DailyCompEarning" DROP CONSTRAINT "DailyCompEarning_userId_fkey";

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "comp_wallet_transaction_id" BIGINT;

-- DropTable
DROP TABLE "CompTransaction";

-- DropTable
DROP TABLE "DailyCompEarning";

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_comp_wallet_transaction_id_fkey" FOREIGN KEY ("comp_wallet_transaction_id") REFERENCES "comp_wallet_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
