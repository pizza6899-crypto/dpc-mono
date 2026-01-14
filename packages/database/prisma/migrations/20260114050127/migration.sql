/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `promotions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "PromotionBonusType" ADD VALUE 'FIXED_AMOUNT';

-- AlterTable
ALTER TABLE "promotions" ADD COLUMN     "code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "promotions_code_key" ON "promotions"("code");
