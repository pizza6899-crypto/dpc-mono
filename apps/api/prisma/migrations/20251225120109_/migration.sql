/*
  Warnings:

  - You are about to drop the column `linkId` on the `Referral` table. All the data in the column will be lost.
  - You are about to drop the `AffiliateLink` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `codeId` to the `Referral` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."AffiliateLink" DROP CONSTRAINT "AffiliateLink_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Referral" DROP CONSTRAINT "Referral_linkId_fkey";

-- DropIndex
DROP INDEX "public"."Referral_affiliateId_linkId_idx";

-- DropIndex
DROP INDEX "public"."Referral_linkId_idx";

-- AlterTable
ALTER TABLE "public"."Referral" DROP COLUMN "linkId",
ADD COLUMN     "codeId" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."AffiliateLink";

-- CreateTable
CREATE TABLE "public"."AffiliateCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "campaignName" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "AffiliateCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateCode_code_key" ON "public"."AffiliateCode"("code");

-- CreateIndex
CREATE INDEX "AffiliateCode_userId_idx" ON "public"."AffiliateCode"("userId");

-- CreateIndex
CREATE INDEX "AffiliateCode_userId_isActive_idx" ON "public"."AffiliateCode"("userId", "isActive");

-- CreateIndex
CREATE INDEX "AffiliateCode_code_idx" ON "public"."AffiliateCode"("code");

-- CreateIndex
CREATE INDEX "Referral_codeId_idx" ON "public"."Referral"("codeId");

-- CreateIndex
CREATE INDEX "Referral_affiliateId_codeId_idx" ON "public"."Referral"("affiliateId", "codeId");

-- AddForeignKey
ALTER TABLE "public"."AffiliateCode" ADD CONSTRAINT "AffiliateCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Referral" ADD CONSTRAINT "Referral_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "public"."AffiliateCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
