/*
  Warnings:

  - You are about to drop the `AffiliateCommission` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AffiliateCommission" DROP CONSTRAINT "AffiliateCommission_affiliateId_fkey";

-- DropForeignKey
ALTER TABLE "AffiliateCommission" DROP CONSTRAINT "AffiliateCommission_gameRoundId_fkey";

-- DropForeignKey
ALTER TABLE "AffiliateCommission" DROP CONSTRAINT "AffiliateCommission_subUserId_fkey";

-- DropTable
DROP TABLE "AffiliateCommission";

-- CreateTable
CREATE TABLE "affiliate_commissions" (
    "affiliateId" BIGINT NOT NULL,
    "subUserId" BIGINT NOT NULL,
    "gameRoundId" BIGINT,
    "wagerAmount" DECIMAL(32,18) NOT NULL,
    "winAmount" DECIMAL(32,18),
    "commission" DECIMAL(32,18) NOT NULL,
    "rateApplied" DECIMAL(8,4) NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "gameCategory" "GameCategory",
    "settlementDate" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "uid" TEXT NOT NULL,
    "id" BIGSERIAL NOT NULL,

    CONSTRAINT "affiliate_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_commissions_uid_key" ON "affiliate_commissions"("uid");

-- CreateIndex
CREATE INDEX "affiliate_commissions_affiliateId_status_idx" ON "affiliate_commissions"("affiliateId", "status");

-- CreateIndex
CREATE INDEX "affiliate_commissions_affiliateId_createdAt_idx" ON "affiliate_commissions"("affiliateId", "createdAt");

-- CreateIndex
CREATE INDEX "affiliate_commissions_subUserId_idx" ON "affiliate_commissions"("subUserId");

-- CreateIndex
CREATE INDEX "affiliate_commissions_status_createdAt_idx" ON "affiliate_commissions"("status", "createdAt");

-- CreateIndex
CREATE INDEX "affiliate_commissions_settlementDate_idx" ON "affiliate_commissions"("settlementDate");

-- CreateIndex
CREATE INDEX "affiliate_commissions_gameRoundId_idx" ON "affiliate_commissions"("gameRoundId");

-- AddForeignKey
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_gameRoundId_fkey" FOREIGN KEY ("gameRoundId") REFERENCES "GameRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_subUserId_fkey" FOREIGN KEY ("subUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
