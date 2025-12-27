/*
  Warnings:

  - You are about to drop the column `balanceLocked` on the `UserBalance` table. All the data in the column will be lost.
  - You are about to drop the column `totalBet` on the `UserBalance` table. All the data in the column will be lost.
  - You are about to drop the column `totalBonus` on the `UserBalance` table. All the data in the column will be lost.
  - You are about to drop the column `totalCompEarned` on the `UserBalance` table. All the data in the column will be lost.
  - You are about to drop the column `totalCompUsed` on the `UserBalance` table. All the data in the column will be lost.
  - You are about to drop the column `totalDeposit` on the `UserBalance` table. All the data in the column will be lost.
  - You are about to drop the column `totalSettlementFromBet` on the `UserBalance` table. All the data in the column will be lost.
  - You are about to drop the column `totalSettlementFromVip` on the `UserBalance` table. All the data in the column will be lost.
  - You are about to drop the column `totalWin` on the `UserBalance` table. All the data in the column will be lost.
  - You are about to drop the column `totalWithdraw` on the `UserBalance` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."UserBalance" DROP COLUMN "balanceLocked",
DROP COLUMN "totalBet",
DROP COLUMN "totalBonus",
DROP COLUMN "totalCompEarned",
DROP COLUMN "totalCompUsed",
DROP COLUMN "totalDeposit",
DROP COLUMN "totalSettlementFromBet",
DROP COLUMN "totalSettlementFromVip",
DROP COLUMN "totalWin",
DROP COLUMN "totalWithdraw";

-- CreateTable
CREATE TABLE "public"."UserBalanceStats" (
    "userId" TEXT NOT NULL,
    "currency" "public"."ExchangeCurrencyCode" NOT NULL,
    "totalDeposit" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "totalWithdraw" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "totalBet" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "totalWin" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "totalBonus" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "totalCompEarned" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "totalCompUsed" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "totalSettlementFromBet" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "totalSettlementFromVip" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBalanceStats_pkey" PRIMARY KEY ("userId","currency")
);

-- CreateIndex
CREATE INDEX "UserBalanceStats_userId_idx" ON "public"."UserBalanceStats"("userId");

-- CreateIndex
CREATE INDEX "UserBalanceStats_currency_idx" ON "public"."UserBalanceStats"("currency");

-- AddForeignKey
ALTER TABLE "public"."UserBalanceStats" ADD CONSTRAINT "UserBalanceStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
