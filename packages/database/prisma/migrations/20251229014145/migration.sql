/*
  Warnings:

  - The primary key for the `AffiliateWallet` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `userId` column on the `EmailLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `userId` column on the `LoginAttempt` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `numericId` on the `User` table. All the data in the column will be lost.
  - The `id` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `UserBalance` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `UserBalanceStats` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[uid]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `userId` on the `AffiliateCode` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `affiliateId` on the `AffiliateCommission` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `subUserId` on the `AffiliateCommission` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `affiliateId` on the `AffiliateTier` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `affiliateId` on the `AffiliateWallet` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `CompTransaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `DailyCompEarning` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `GameSession` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `affiliateId` on the `Referral` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `subUserId` on the `Referral` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `Rolling` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `Transaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - The required column `uid` was added to the `User` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Changed the type of `userId` on the `UserBalance` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `UserBalanceStats` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `UserPromotion` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `UserSession` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `UserToken` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `VipHistory` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `VipMembership` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "AffiliateCode" DROP CONSTRAINT "AffiliateCode_userId_fkey";

-- DropForeignKey
ALTER TABLE "AffiliateCommission" DROP CONSTRAINT "AffiliateCommission_affiliateId_fkey";

-- DropForeignKey
ALTER TABLE "AffiliateCommission" DROP CONSTRAINT "AffiliateCommission_subUserId_fkey";

-- DropForeignKey
ALTER TABLE "AffiliateTier" DROP CONSTRAINT "AffiliateTier_affiliateId_fkey";

-- DropForeignKey
ALTER TABLE "AffiliateWallet" DROP CONSTRAINT "AffiliateWallet_affiliateId_fkey";

-- DropForeignKey
ALTER TABLE "CompTransaction" DROP CONSTRAINT "CompTransaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "DailyCompEarning" DROP CONSTRAINT "DailyCompEarning_userId_fkey";

-- DropForeignKey
ALTER TABLE "EmailLog" DROP CONSTRAINT "EmailLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "GameSession" DROP CONSTRAINT "GameSession_userId_fkey";

-- DropForeignKey
ALTER TABLE "LoginAttempt" DROP CONSTRAINT "LoginAttempt_userId_fkey";

-- DropForeignKey
ALTER TABLE "Referral" DROP CONSTRAINT "Referral_affiliateId_fkey";

-- DropForeignKey
ALTER TABLE "Referral" DROP CONSTRAINT "Referral_subUserId_fkey";

-- DropForeignKey
ALTER TABLE "Rolling" DROP CONSTRAINT "Rolling_userId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserBalance" DROP CONSTRAINT "UserBalance_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserBalanceStats" DROP CONSTRAINT "UserBalanceStats_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserPromotion" DROP CONSTRAINT "UserPromotion_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserSession" DROP CONSTRAINT "UserSession_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserToken" DROP CONSTRAINT "UserToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "VipHistory" DROP CONSTRAINT "VipHistory_userId_fkey";

-- DropForeignKey
ALTER TABLE "VipMembership" DROP CONSTRAINT "VipMembership_userId_fkey";

-- DropIndex
DROP INDEX "User_numericId_key";

-- AlterTable
ALTER TABLE "AffiliateCode" DROP COLUMN "userId",
ADD COLUMN     "userId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "AffiliateCommission" DROP COLUMN "affiliateId",
ADD COLUMN     "affiliateId" BIGINT NOT NULL,
DROP COLUMN "subUserId",
ADD COLUMN     "subUserId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "AffiliateTier" DROP COLUMN "affiliateId",
ADD COLUMN     "affiliateId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "AffiliateWallet" DROP CONSTRAINT "AffiliateWallet_pkey",
DROP COLUMN "affiliateId",
ADD COLUMN     "affiliateId" BIGINT NOT NULL,
ADD CONSTRAINT "AffiliateWallet_pkey" PRIMARY KEY ("affiliateId", "currency");

-- AlterTable
ALTER TABLE "CompTransaction" DROP COLUMN "userId",
ADD COLUMN     "userId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "DailyCompEarning" DROP COLUMN "userId",
ADD COLUMN     "userId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "EmailLog" DROP COLUMN "userId",
ADD COLUMN     "userId" BIGINT;

-- AlterTable
ALTER TABLE "GameSession" DROP COLUMN "userId",
ADD COLUMN     "userId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "LoginAttempt" DROP COLUMN "userId",
ADD COLUMN     "userId" BIGINT;

-- AlterTable
ALTER TABLE "Referral" DROP COLUMN "affiliateId",
ADD COLUMN     "affiliateId" BIGINT NOT NULL,
DROP COLUMN "subUserId",
ADD COLUMN     "subUserId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "Rolling" DROP COLUMN "userId",
ADD COLUMN     "userId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "userId",
ADD COLUMN     "userId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "numericId",
ADD COLUMN     "uid" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" BIGSERIAL NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "UserBalance" DROP CONSTRAINT "UserBalance_pkey",
DROP COLUMN "userId",
ADD COLUMN     "userId" BIGINT NOT NULL,
ADD CONSTRAINT "UserBalance_pkey" PRIMARY KEY ("userId", "currency");

-- AlterTable
ALTER TABLE "UserBalanceStats" DROP CONSTRAINT "UserBalanceStats_pkey",
DROP COLUMN "userId",
ADD COLUMN     "userId" BIGINT NOT NULL,
ADD CONSTRAINT "UserBalanceStats_pkey" PRIMARY KEY ("userId", "currency");

-- AlterTable
ALTER TABLE "UserPromotion" DROP COLUMN "userId",
ADD COLUMN     "userId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "UserSession" DROP COLUMN "userId",
ADD COLUMN     "userId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "UserToken" DROP COLUMN "userId",
ADD COLUMN     "userId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "VipHistory" DROP COLUMN "userId",
ADD COLUMN     "userId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "VipMembership" DROP COLUMN "userId",
ADD COLUMN     "userId" BIGINT NOT NULL;

-- CreateIndex
CREATE INDEX "AffiliateCode_userId_idx" ON "AffiliateCode"("userId");

-- CreateIndex
CREATE INDEX "AffiliateCode_userId_isActive_idx" ON "AffiliateCode"("userId", "isActive");

-- CreateIndex
CREATE INDEX "AffiliateCommission_affiliateId_status_idx" ON "AffiliateCommission"("affiliateId", "status");

-- CreateIndex
CREATE INDEX "AffiliateCommission_affiliateId_createdAt_idx" ON "AffiliateCommission"("affiliateId", "createdAt");

-- CreateIndex
CREATE INDEX "AffiliateCommission_subUserId_idx" ON "AffiliateCommission"("subUserId");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateTier_affiliateId_key" ON "AffiliateTier"("affiliateId");

-- CreateIndex
CREATE INDEX "AffiliateTier_affiliateId_idx" ON "AffiliateTier"("affiliateId");

-- CreateIndex
CREATE INDEX "AffiliateWallet_affiliateId_idx" ON "AffiliateWallet"("affiliateId");

-- CreateIndex
CREATE INDEX "CompTransaction_userId_idx" ON "CompTransaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCompEarning_userId_earningDate_key" ON "DailyCompEarning"("userId", "earningDate");

-- CreateIndex
CREATE INDEX "EmailLog_userId_type_createdAt_idx" ON "EmailLog"("userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_userId_idx" ON "LoginAttempt"("userId");

-- CreateIndex
CREATE INDEX "Referral_affiliateId_idx" ON "Referral"("affiliateId");

-- CreateIndex
CREATE INDEX "Referral_subUserId_idx" ON "Referral"("subUserId");

-- CreateIndex
CREATE INDEX "Referral_affiliateId_codeId_idx" ON "Referral"("affiliateId", "codeId");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_affiliateId_subUserId_key" ON "Referral"("affiliateId", "subUserId");

-- CreateIndex
CREATE INDEX "Rolling_userId_status_createdAt_idx" ON "Rolling"("userId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_uid_key" ON "User"("uid");

-- CreateIndex
CREATE INDEX "UserBalance_userId_idx" ON "UserBalance"("userId");

-- CreateIndex
CREATE INDEX "UserBalanceStats_userId_idx" ON "UserBalanceStats"("userId");

-- CreateIndex
CREATE INDEX "UserSession_userId_isActive_idx" ON "UserSession"("userId", "isActive");

-- CreateIndex
CREATE INDEX "UserSession_userId_createdAt_idx" ON "UserSession"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserToken_userId_type_idx" ON "UserToken"("userId", "type");

-- CreateIndex
CREATE INDEX "UserToken_userId_type_usedAt_idx" ON "UserToken"("userId", "type", "usedAt");

-- CreateIndex
CREATE INDEX "VipHistory_userId_createdAt_idx" ON "VipHistory"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VipMembership_userId_key" ON "VipMembership"("userId");

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBalance" ADD CONSTRAINT "UserBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBalanceStats" ADD CONSTRAINT "UserBalanceStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompTransaction" ADD CONSTRAINT "CompTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCompEarning" ADD CONSTRAINT "DailyCompEarning_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPromotion" ADD CONSTRAINT "UserPromotion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VipMembership" ADD CONSTRAINT "VipMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VipHistory" ADD CONSTRAINT "VipHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rolling" ADD CONSTRAINT "Rolling_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserToken" ADD CONSTRAINT "UserToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateCode" ADD CONSTRAINT "AffiliateCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_subUserId_fkey" FOREIGN KEY ("subUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateWallet" ADD CONSTRAINT "AffiliateWallet_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateCommission" ADD CONSTRAINT "AffiliateCommission_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateCommission" ADD CONSTRAINT "AffiliateCommission_subUserId_fkey" FOREIGN KEY ("subUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateTier" ADD CONSTRAINT "AffiliateTier_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginAttempt" ADD CONSTRAINT "LoginAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
