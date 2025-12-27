/*
  Warnings:

  - The primary key for the `AffiliateCommission` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `AffiliateCommission` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `AffiliateTier` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `AffiliateTier` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[uid]` on the table `AffiliateCommission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uid]` on the table `AffiliateTier` will be added. If there are existing duplicate values, this will fail.
  - The required column `uid` was added to the `AffiliateCommission` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `uid` was added to the `AffiliateTier` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "public"."AffiliateCommission" DROP CONSTRAINT "AffiliateCommission_pkey",
ADD COLUMN     "uid" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" BIGSERIAL NOT NULL,
ADD CONSTRAINT "AffiliateCommission_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."AffiliateTier" DROP CONSTRAINT "AffiliateTier_pkey",
ADD COLUMN     "uid" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" BIGSERIAL NOT NULL,
ADD CONSTRAINT "AffiliateTier_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateCommission_uid_key" ON "public"."AffiliateCommission"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateTier_uid_key" ON "public"."AffiliateTier"("uid");
