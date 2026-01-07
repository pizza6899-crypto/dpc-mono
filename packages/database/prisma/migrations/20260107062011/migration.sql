/*
  Warnings:

  - The `customRateSetBy` column on the `AffiliateTier` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "AffiliateTier" DROP COLUMN "customRateSetBy",
ADD COLUMN     "customRateSetBy" BIGINT;
