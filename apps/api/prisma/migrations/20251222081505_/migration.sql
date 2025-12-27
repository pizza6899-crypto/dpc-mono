/*
  Warnings:

  - The primary key for the `UserSession` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `UserSession` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."UserSession" DROP CONSTRAINT "UserSession_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" BIGSERIAL NOT NULL,
ADD CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id");
