/*
  Warnings:

  - The primary key for the `affiliate_commissions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `uid` on the `affiliate_commissions` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "affiliate_commissions_uid_key";

-- AlterTable
ALTER TABLE "affiliate_commissions" DROP CONSTRAINT "affiliate_commissions_pkey",
DROP COLUMN "uid",
ADD CONSTRAINT "affiliate_commissions_pkey" PRIMARY KEY ("created_at", "id");
