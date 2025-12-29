/*
  Warnings:

  - You are about to drop the column `deviceInfo` on the `UserSession` table. All the data in the column will be lost.
  - Changed the type of `userId` on the `GameBet` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "GameBet" DROP COLUMN "userId",
ADD COLUMN     "userId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "UserSession" DROP COLUMN "deviceInfo",
ADD COLUMN     "debetsiceInfo" TEXT;
