/*
  Warnings:

  - You are about to drop the column `signupCodeId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `ReferralBonus` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReferralCode` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ReferralBonus" DROP CONSTRAINT "ReferralBonus_gameRoundId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ReferralBonus" DROP CONSTRAINT "ReferralBonus_recipientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ReferralBonus" DROP CONSTRAINT "ReferralBonus_sourceUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ReferralBonus" DROP CONSTRAINT "ReferralBonus_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ReferralBonus" DROP CONSTRAINT "ReferralBonus_vipHistoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ReferralCode" DROP CONSTRAINT "ReferralCode_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."User" DROP CONSTRAINT "User_signupCodeId_fkey";

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "signupCodeId";

-- DropTable
DROP TABLE "public"."ReferralBonus";

-- DropTable
DROP TABLE "public"."ReferralCode";

-- DropEnum
DROP TYPE "public"."ReferralBonusSourceType";

-- DropEnum
DROP TYPE "public"."ReferralBonusStatus";
