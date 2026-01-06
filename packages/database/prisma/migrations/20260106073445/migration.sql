/*
  Warnings:

  - You are about to drop the column `game_id` on the `casino_game_sessions` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "casino_game_sessions" DROP CONSTRAINT "casino_game_sessions_game_id_fkey";

-- AlterTable
ALTER TABLE "casino_game_sessions" DROP COLUMN "game_id",
ADD COLUMN     "casino_game_id" BIGINT;

-- AddForeignKey
ALTER TABLE "casino_game_sessions" ADD CONSTRAINT "casino_game_sessions_casino_game_id_fkey" FOREIGN KEY ("casino_game_id") REFERENCES "casino_games"("id") ON DELETE SET NULL ON UPDATE CASCADE;
