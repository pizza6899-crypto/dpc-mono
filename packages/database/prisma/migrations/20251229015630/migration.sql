/*
  Warnings:

  - Changed the type of `userId` on the `GameWin` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "GameWin" DROP COLUMN "userId",
ADD COLUMN     "userId" BIGINT NOT NULL;
