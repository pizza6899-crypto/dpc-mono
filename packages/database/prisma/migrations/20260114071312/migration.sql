/*
  Warnings:

  - Made the column `code` on table `promotions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "promotions" ALTER COLUMN "code" SET NOT NULL;
