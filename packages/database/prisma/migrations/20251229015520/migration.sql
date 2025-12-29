/*
  Warnings:

  - The `userId` column on the `DcsApiLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `userId` column on the `WhitecliffApiLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `userId` on the `ActivityLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `GameRound` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "ActivityLog" DROP COLUMN "userId",
ADD COLUMN     "userId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "DcsApiLog" DROP COLUMN "userId",
ADD COLUMN     "userId" BIGINT;

-- AlterTable
ALTER TABLE "GameRound" DROP COLUMN "userId",
ADD COLUMN     "userId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "WhitecliffApiLog" DROP COLUMN "userId",
ADD COLUMN     "userId" BIGINT;

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");
