-- CreateEnum
CREATE TYPE "public"."CommissionStatus" AS ENUM ('PENDING', 'AVAILABLE', 'CLAIMED', 'WITHDRAWN', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."AffiliateTierLevel" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND');

-- CreateTable
CREATE TABLE "public"."AffiliateWallet" (
    "affiliateId" TEXT NOT NULL,
    "currency" "public"."ExchangeCurrencyCode" NOT NULL,
    "availableBalance" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "pendingBalance" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "totalEarned" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateWallet_pkey" PRIMARY KEY ("affiliateId","currency")
);

-- CreateTable
CREATE TABLE "public"."AffiliateCommission" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "subUserId" TEXT NOT NULL,
    "gameRoundId" BIGINT,
    "wagerAmount" DECIMAL(32,18) NOT NULL,
    "winAmount" DECIMAL(32,18),
    "commission" DECIMAL(32,18) NOT NULL,
    "rateApplied" DECIMAL(8,4) NOT NULL,
    "currency" "public"."ExchangeCurrencyCode" NOT NULL,
    "status" "public"."CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "gameCategory" "public"."GameCategory",
    "settlementDate" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AffiliateTier" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "tier" "public"."AffiliateTierLevel" NOT NULL DEFAULT 'BRONZE',
    "baseRate" DECIMAL(8,4) NOT NULL,
    "customRate" DECIMAL(8,4),
    "isCustomRate" BOOLEAN NOT NULL DEFAULT false,
    "monthlyWagerAmount" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "customRateSetBy" TEXT,
    "customRateSetAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateTier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AffiliateWallet_affiliateId_idx" ON "public"."AffiliateWallet"("affiliateId");

-- CreateIndex
CREATE INDEX "AffiliateWallet_currency_idx" ON "public"."AffiliateWallet"("currency");

-- CreateIndex
CREATE INDEX "AffiliateCommission_affiliateId_status_idx" ON "public"."AffiliateCommission"("affiliateId", "status");

-- CreateIndex
CREATE INDEX "AffiliateCommission_affiliateId_createdAt_idx" ON "public"."AffiliateCommission"("affiliateId", "createdAt");

-- CreateIndex
CREATE INDEX "AffiliateCommission_subUserId_idx" ON "public"."AffiliateCommission"("subUserId");

-- CreateIndex
CREATE INDEX "AffiliateCommission_status_createdAt_idx" ON "public"."AffiliateCommission"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AffiliateCommission_settlementDate_idx" ON "public"."AffiliateCommission"("settlementDate");

-- CreateIndex
CREATE INDEX "AffiliateCommission_gameRoundId_idx" ON "public"."AffiliateCommission"("gameRoundId");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateTier_affiliateId_key" ON "public"."AffiliateTier"("affiliateId");

-- CreateIndex
CREATE INDEX "AffiliateTier_affiliateId_idx" ON "public"."AffiliateTier"("affiliateId");

-- CreateIndex
CREATE INDEX "AffiliateTier_tier_idx" ON "public"."AffiliateTier"("tier");

-- AddForeignKey
ALTER TABLE "public"."AffiliateWallet" ADD CONSTRAINT "AffiliateWallet_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AffiliateCommission" ADD CONSTRAINT "AffiliateCommission_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AffiliateCommission" ADD CONSTRAINT "AffiliateCommission_subUserId_fkey" FOREIGN KEY ("subUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AffiliateCommission" ADD CONSTRAINT "AffiliateCommission_gameRoundId_fkey" FOREIGN KEY ("gameRoundId") REFERENCES "public"."GameRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AffiliateTier" ADD CONSTRAINT "AffiliateTier_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
