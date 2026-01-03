/*
  Warnings:

  - The primary key for the `Referral` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Referral` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[uid]` on the table `Referral` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `uid` to the `Referral` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Referral" DROP CONSTRAINT "Referral_pkey",
ADD COLUMN     "uid" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" BIGSERIAL NOT NULL,
ADD CONSTRAINT "Referral_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_uid_key" ON "Referral"("uid");
