/*
  Warnings:

  - You are about to drop the `Rolling` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserBalance` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "WageringSourceType" AS ENUM ('DEPOSIT', 'PROMOTION_BONUS');

-- CreateEnum
CREATE TYPE "WageringStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'VOIDED');

-- DropForeignKey
ALTER TABLE "Rolling" DROP CONSTRAINT "Rolling_depositDetailId_fkey";

-- DropForeignKey
ALTER TABLE "Rolling" DROP CONSTRAINT "Rolling_userId_fkey";

-- DropForeignKey
ALTER TABLE "Rolling" DROP CONSTRAINT "Rolling_userPromotionId_fkey";

-- DropForeignKey
ALTER TABLE "UserBalance" DROP CONSTRAINT "UserBalance_userId_fkey";

-- DropTable
DROP TABLE "Rolling";

-- DropTable
DROP TABLE "UserBalance";

-- DropEnum
DROP TYPE "RollingSourceType";

-- DropEnum
DROP TYPE "RollingStatus";

-- CreateTable
CREATE TABLE "user_wallets" (
    "userId" BIGINT NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "mainBalance" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "bonusBalance" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_wallets_pkey" PRIMARY KEY ("userId","currency")
);

-- CreateTable
CREATE TABLE "wagering_requirements" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "source_type" "WageringSourceType" NOT NULL DEFAULT 'DEPOSIT',
    "required_amount" DECIMAL(32,18) NOT NULL,
    "current_amount" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "cancellation_balance_threshold" DECIMAL(32,18),
    "status" "WageringStatus" NOT NULL DEFAULT 'ACTIVE',
    "deposit_detail_id" BIGINT,
    "user_promotion_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancellation_note" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "wagering_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wagering_contribution_logs" (
    "id" BIGSERIAL NOT NULL,
    "wagering_requirement_id" BIGINT NOT NULL,
    "game_round_id" BIGINT NOT NULL,
    "request_amount" DECIMAL(32,18) NOT NULL,
    "contribution_rate" DECIMAL(8,4) NOT NULL,
    "contributed_amount" DECIMAL(32,18) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wagering_contribution_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_wallets_userId_idx" ON "user_wallets"("userId");

-- CreateIndex
CREATE INDEX "user_wallets_currency_idx" ON "user_wallets"("currency");

-- CreateIndex
CREATE UNIQUE INDEX "wagering_requirements_uid_key" ON "wagering_requirements"("uid");

-- CreateIndex
CREATE INDEX "wagering_requirements_user_id_currency_status_priority_idx" ON "wagering_requirements"("user_id", "currency", "status", "priority");

-- CreateIndex
CREATE INDEX "wagering_requirements_user_id_status_idx" ON "wagering_requirements"("user_id", "status");

-- CreateIndex
CREATE INDEX "wagering_requirements_source_type_idx" ON "wagering_requirements"("source_type");

-- CreateIndex
CREATE INDEX "wagering_requirements_user_promotion_id_idx" ON "wagering_requirements"("user_promotion_id");

-- CreateIndex
CREATE INDEX "wagering_requirements_status_idx" ON "wagering_requirements"("status");

-- CreateIndex
CREATE INDEX "wagering_contribution_logs_wagering_requirement_id_idx" ON "wagering_contribution_logs"("wagering_requirement_id");

-- CreateIndex
CREATE INDEX "wagering_contribution_logs_game_round_id_idx" ON "wagering_contribution_logs"("game_round_id");

-- AddForeignKey
ALTER TABLE "user_wallets" ADD CONSTRAINT "user_wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wagering_requirements" ADD CONSTRAINT "wagering_requirements_deposit_detail_id_fkey" FOREIGN KEY ("deposit_detail_id") REFERENCES "deposit_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wagering_requirements" ADD CONSTRAINT "wagering_requirements_user_id_currency_fkey" FOREIGN KEY ("user_id", "currency") REFERENCES "user_wallets"("userId", "currency") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wagering_requirements" ADD CONSTRAINT "wagering_requirements_user_promotion_id_fkey" FOREIGN KEY ("user_promotion_id") REFERENCES "user_promotions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wagering_requirements" ADD CONSTRAINT "wagering_requirements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wagering_contribution_logs" ADD CONSTRAINT "wagering_contribution_logs_wagering_requirement_id_fkey" FOREIGN KEY ("wagering_requirement_id") REFERENCES "wagering_requirements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
