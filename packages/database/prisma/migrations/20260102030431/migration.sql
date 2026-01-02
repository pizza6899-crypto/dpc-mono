/*
  Warnings:

  - You are about to drop the column `maxBonusAmount` on the `Promotion` table. All the data in the column will be lost.
  - You are about to drop the column `minDepositAmount` on the `Promotion` table. All the data in the column will be lost.
  - You are about to drop the column `bonusGranted` on the `UserPromotion` table. All the data in the column will be lost.
  - You are about to drop the column `bonusGrantedAt` on the `UserPromotion` table. All the data in the column will be lost.
  - Added the required column `currency` to the `UserPromotion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `depositAmount` to the `UserPromotion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetRollingAmount` to the `UserPromotion` table without a default value. This is not possible if the table is not empty.
  - Made the column `bonusAmount` on table `UserPromotion` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Promotion" DROP COLUMN "maxBonusAmount",
DROP COLUMN "minDepositAmount",
ADD COLUMN     "isOneTime" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UserPromotion" DROP COLUMN "bonusGranted",
DROP COLUMN "bonusGrantedAt",
ADD COLUMN     "currency" "ExchangeCurrencyCode" NOT NULL,
ADD COLUMN     "currentRollingAmount" DECIMAL(32,18) NOT NULL DEFAULT 0,
ADD COLUMN     "depositAmount" DECIMAL(32,18) NOT NULL,
ADD COLUMN     "targetRollingAmount" DECIMAL(32,18) NOT NULL,
ALTER COLUMN "bonusAmount" SET NOT NULL;

-- CreateTable
CREATE TABLE "PromotionCurrency" (
    "id" BIGSERIAL NOT NULL,
    "promotionId" BIGINT NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "minDepositAmount" DECIMAL(32,18) NOT NULL,
    "maxBonusAmount" DECIMAL(32,18),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionCurrency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromotionCurrency_promotionId_idx" ON "PromotionCurrency"("promotionId");

-- CreateIndex
CREATE INDEX "PromotionCurrency_currency_idx" ON "PromotionCurrency"("currency");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionCurrency_promotionId_currency_key" ON "PromotionCurrency"("promotionId", "currency");

-- CreateIndex
CREATE INDEX "UserPromotion_userId_status_idx" ON "UserPromotion"("userId", "status");

-- AddForeignKey
ALTER TABLE "PromotionCurrency" ADD CONSTRAINT "PromotionCurrency_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
