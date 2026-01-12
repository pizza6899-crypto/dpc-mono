/*
  Warnings:

  - You are about to drop the column `affiliateId` on the `affiliate_commissions` table. All the data in the column will be lost.
  - You are about to drop the column `claimedAt` on the `affiliate_commissions` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `affiliate_commissions` table. All the data in the column will be lost.
  - You are about to drop the column `gameCategory` on the `affiliate_commissions` table. All the data in the column will be lost.
  - You are about to drop the column `gameRoundId` on the `affiliate_commissions` table. All the data in the column will be lost.
  - You are about to drop the column `rateApplied` on the `affiliate_commissions` table. All the data in the column will be lost.
  - You are about to drop the column `settlementDate` on the `affiliate_commissions` table. All the data in the column will be lost.
  - You are about to drop the column `subUserId` on the `affiliate_commissions` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `affiliate_commissions` table. All the data in the column will be lost.
  - You are about to drop the column `wagerAmount` on the `affiliate_commissions` table. All the data in the column will be lost.
  - You are about to drop the column `winAmount` on the `affiliate_commissions` table. All the data in the column will be lost.
  - You are about to drop the column `withdrawnAt` on the `affiliate_commissions` table. All the data in the column will be lost.
  - You are about to drop the `AffiliateTier` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AffiliateWallet` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `affiliate_id` to the `affiliate_commissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rate_applied` to the `affiliate_commissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sub_user_id` to the `affiliate_commissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `affiliate_commissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wager_amount` to the `affiliate_commissions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AffiliateTier" DROP CONSTRAINT "AffiliateTier_affiliateId_fkey";

-- DropForeignKey
ALTER TABLE "AffiliateWallet" DROP CONSTRAINT "AffiliateWallet_affiliateId_fkey";

-- DropForeignKey
ALTER TABLE "affiliate_commissions" DROP CONSTRAINT "affiliate_commissions_affiliateId_fkey";

-- DropForeignKey
ALTER TABLE "affiliate_commissions" DROP CONSTRAINT "affiliate_commissions_gameRoundId_fkey";

-- DropForeignKey
ALTER TABLE "affiliate_commissions" DROP CONSTRAINT "affiliate_commissions_subUserId_fkey";

-- DropIndex
DROP INDEX "affiliate_commissions_affiliateId_createdAt_idx";

-- DropIndex
DROP INDEX "affiliate_commissions_affiliateId_status_idx";

-- DropIndex
DROP INDEX "affiliate_commissions_gameRoundId_idx";

-- DropIndex
DROP INDEX "affiliate_commissions_settlementDate_idx";

-- DropIndex
DROP INDEX "affiliate_commissions_status_createdAt_idx";

-- DropIndex
DROP INDEX "affiliate_commissions_subUserId_idx";

-- AlterTable
ALTER TABLE "affiliate_commissions" DROP COLUMN "affiliateId",
DROP COLUMN "claimedAt",
DROP COLUMN "createdAt",
DROP COLUMN "gameCategory",
DROP COLUMN "gameRoundId",
DROP COLUMN "rateApplied",
DROP COLUMN "settlementDate",
DROP COLUMN "subUserId",
DROP COLUMN "updatedAt",
DROP COLUMN "wagerAmount",
DROP COLUMN "winAmount",
DROP COLUMN "withdrawnAt",
ADD COLUMN     "affiliate_id" BIGINT NOT NULL,
ADD COLUMN     "claimed_at" TIMESTAMP(3),
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "game_category" "GameCategory",
ADD COLUMN     "game_round_id" BIGINT,
ADD COLUMN     "rate_applied" DECIMAL(8,4) NOT NULL,
ADD COLUMN     "settlement_date" TIMESTAMP(3),
ADD COLUMN     "sub_user_id" BIGINT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "wager_amount" DECIMAL(32,18) NOT NULL,
ADD COLUMN     "win_amount" DECIMAL(32,18),
ADD COLUMN     "withdrawn_at" TIMESTAMP(3);

-- DropTable
DROP TABLE "AffiliateTier";

-- DropTable
DROP TABLE "AffiliateWallet";

-- CreateTable
CREATE TABLE "affiliate_wallets" (
    "affiliate_id" BIGINT NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "available_balance" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "pending_balance" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "total_earned" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_wallets_pkey" PRIMARY KEY ("affiliate_id","currency")
);

-- CreateTable
CREATE TABLE "affiliate_tiers" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "affiliate_id" BIGINT NOT NULL,
    "tier" "AffiliateTierLevel" NOT NULL DEFAULT 'BRONZE',
    "base_rate" DECIMAL(8,4) NOT NULL,
    "custom_rate" DECIMAL(8,4),
    "is_custom_rate" BOOLEAN NOT NULL DEFAULT false,
    "monthly_wager_amount" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "custom_rate_set_by" BIGINT,
    "custom_rate_set_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "affiliate_wallets_affiliate_id_idx" ON "affiliate_wallets"("affiliate_id");

-- CreateIndex
CREATE INDEX "affiliate_wallets_currency_idx" ON "affiliate_wallets"("currency");

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_tiers_uid_key" ON "affiliate_tiers"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_tiers_affiliate_id_key" ON "affiliate_tiers"("affiliate_id");

-- CreateIndex
CREATE INDEX "affiliate_tiers_affiliate_id_idx" ON "affiliate_tiers"("affiliate_id");

-- CreateIndex
CREATE INDEX "affiliate_tiers_tier_idx" ON "affiliate_tiers"("tier");

-- CreateIndex
CREATE INDEX "affiliate_commissions_affiliate_id_status_idx" ON "affiliate_commissions"("affiliate_id", "status");

-- CreateIndex
CREATE INDEX "affiliate_commissions_affiliate_id_created_at_idx" ON "affiliate_commissions"("affiliate_id", "created_at");

-- CreateIndex
CREATE INDEX "affiliate_commissions_sub_user_id_idx" ON "affiliate_commissions"("sub_user_id");

-- CreateIndex
CREATE INDEX "affiliate_commissions_status_created_at_idx" ON "affiliate_commissions"("status", "created_at");

-- CreateIndex
CREATE INDEX "affiliate_commissions_settlement_date_idx" ON "affiliate_commissions"("settlement_date");

-- CreateIndex
CREATE INDEX "affiliate_commissions_game_round_id_idx" ON "affiliate_commissions"("game_round_id");

-- AddForeignKey
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_game_round_id_fkey" FOREIGN KEY ("game_round_id") REFERENCES "GameRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_sub_user_id_fkey" FOREIGN KEY ("sub_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_wallets" ADD CONSTRAINT "affiliate_wallets_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_tiers" ADD CONSTRAINT "affiliate_tiers_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
