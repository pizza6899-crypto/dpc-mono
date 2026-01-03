/*
  Warnings:

  - The primary key for the `AffiliateCode` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `AffiliateCode` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[uid]` on the table `AffiliateCode` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `uid` to the `AffiliateCode` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `codeId` on the `Referral` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Referral" DROP CONSTRAINT "Referral_codeId_fkey";

-- AlterTable
ALTER TABLE "AffiliateCode" DROP CONSTRAINT "AffiliateCode_pkey",
ADD COLUMN     "uid" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" BIGSERIAL NOT NULL,
ADD CONSTRAINT "AffiliateCode_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Referral" DROP COLUMN "codeId",
ADD COLUMN     "codeId" BIGINT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateCode_uid_key" ON "AffiliateCode"("uid");

-- CreateIndex
CREATE INDEX "Referral_codeId_idx" ON "Referral"("codeId");

-- CreateIndex
CREATE INDEX "Referral_affiliateId_codeId_idx" ON "Referral"("affiliateId", "codeId");

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "AffiliateCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
