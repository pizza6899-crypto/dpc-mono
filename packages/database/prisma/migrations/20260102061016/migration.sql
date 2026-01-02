/*
  Warnings:

  - You are about to drop the `Promotion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PromotionCurrency` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PromotionTranslation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserPromotion` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PromotionQualification" AS ENUM ('UNTIL_FIRST_WITHDRAWAL');

-- DropForeignKey
ALTER TABLE "PromotionCurrency" DROP CONSTRAINT "PromotionCurrency_promotionId_fkey";

-- DropForeignKey
ALTER TABLE "PromotionTranslation" DROP CONSTRAINT "PromotionTranslation_promotionId_fkey";

-- DropForeignKey
ALTER TABLE "Rolling" DROP CONSTRAINT "Rolling_userPromotionId_fkey";

-- DropForeignKey
ALTER TABLE "UserPromotion" DROP CONSTRAINT "UserPromotion_promotionId_fkey";

-- DropForeignKey
ALTER TABLE "UserPromotion" DROP CONSTRAINT "UserPromotion_userId_fkey";

-- DropTable
DROP TABLE "Promotion";

-- DropTable
DROP TABLE "PromotionCurrency";

-- DropTable
DROP TABLE "PromotionTranslation";

-- DropTable
DROP TABLE "UserPromotion";

-- DropEnum
DROP TYPE "PromotionQualificationCondition";

-- CreateTable
CREATE TABLE "promotions" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "management_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "target_type" "PromotionTargetType" NOT NULL,
    "bonus_type" "PromotionBonusType" NOT NULL,
    "bonus_rate" DECIMAL(8,4),
    "rolling_multiplier" DECIMAL(8,4),
    "qualification_maintain_condition" "PromotionQualification" NOT NULL,
    "is_one_time" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_translations" (
    "id" BIGSERIAL NOT NULL,
    "promotion_id" BIGINT NOT NULL,
    "language" "Language" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotion_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_currencies" (
    "id" BIGSERIAL NOT NULL,
    "promotion_id" BIGINT NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "min_deposit_amount" DECIMAL(32,18) NOT NULL,
    "max_bonus_amount" DECIMAL(32,18),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotion_currencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_promotions" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "promotion_id" BIGINT NOT NULL,
    "status" "UserPromotionStatus" NOT NULL DEFAULT 'ACTIVE',
    "deposit_amount" DECIMAL(32,18) NOT NULL,
    "bonus_amount" DECIMAL(32,18) NOT NULL,
    "target_rolling_amount" DECIMAL(32,18) NOT NULL,
    "current_rolling_amount" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_promotions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "promotions_uid_key" ON "promotions"("uid");

-- CreateIndex
CREATE INDEX "promotion_translations_language_idx" ON "promotion_translations"("language");

-- CreateIndex
CREATE INDEX "promotion_translations_promotion_id_idx" ON "promotion_translations"("promotion_id");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_translations_promotion_id_language_key" ON "promotion_translations"("promotion_id", "language");

-- CreateIndex
CREATE INDEX "promotion_currencies_promotion_id_idx" ON "promotion_currencies"("promotion_id");

-- CreateIndex
CREATE INDEX "promotion_currencies_currency_idx" ON "promotion_currencies"("currency");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_currencies_promotion_id_currency_key" ON "promotion_currencies"("promotion_id", "currency");

-- CreateIndex
CREATE INDEX "user_promotions_user_id_status_idx" ON "user_promotions"("user_id", "status");

-- AddForeignKey
ALTER TABLE "Rolling" ADD CONSTRAINT "Rolling_userPromotionId_fkey" FOREIGN KEY ("userPromotionId") REFERENCES "user_promotions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_translations" ADD CONSTRAINT "promotion_translations_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_currencies" ADD CONSTRAINT "promotion_currencies_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_promotions" ADD CONSTRAINT "user_promotions_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_promotions" ADD CONSTRAINT "user_promotions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
