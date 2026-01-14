/*
  Warnings:

  - You are about to drop the column `uid` on the `promotions` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "promotions_uid_key";

-- AlterTable
ALTER TABLE "promotions" DROP COLUMN "uid";
