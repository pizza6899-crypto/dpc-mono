/*
  Warnings:

  - Added the required column `player_name` to the `casino_game_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "casino_game_sessions" ADD COLUMN     "player_name" TEXT NOT NULL;
