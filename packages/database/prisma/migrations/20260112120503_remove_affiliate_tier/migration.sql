/*
  Warnings:

  - You are about to drop the `affiliate_tiers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "affiliate_tiers" DROP CONSTRAINT "affiliate_tiers_affiliate_id_fkey";

-- DropTable
DROP TABLE "affiliate_tiers";

-- DropEnum
DROP TYPE "AffiliateTierLevel";
