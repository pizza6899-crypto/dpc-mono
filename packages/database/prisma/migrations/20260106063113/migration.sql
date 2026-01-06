/*
  Warnings:

  - A unique constraint covering the columns `[uid]` on the table `casino_game_sessions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `uid` to the `casino_game_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "casino_game_sessions" ADD COLUMN     "uid" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "casino_game_sessions_uid_key" ON "casino_game_sessions"("uid");

-- CreateIndex
CREATE INDEX "casino_game_sessions_uid_idx" ON "casino_game_sessions"("uid");
