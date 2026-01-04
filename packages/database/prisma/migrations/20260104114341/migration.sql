/*
  Warnings:

  - You are about to drop the `VipHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VipLevel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VipMembership` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "VipHistory" DROP CONSTRAINT "VipHistory_userId_fkey";

-- DropForeignKey
ALTER TABLE "VipHistory" DROP CONSTRAINT "VipHistory_vipMembershipId_fkey";

-- DropForeignKey
ALTER TABLE "VipMembership" DROP CONSTRAINT "VipMembership_userId_fkey";

-- DropForeignKey
ALTER TABLE "VipMembership" DROP CONSTRAINT "VipMembership_vipLevelId_fkey";

-- DropTable
DROP TABLE "VipHistory";

-- DropTable
DROP TABLE "VipLevel";

-- DropTable
DROP TABLE "VipMembership";
