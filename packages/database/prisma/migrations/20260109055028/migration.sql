/*
  Warnings:

  - Added the required column `comp_rate` to the `casino_game_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "casino_game_sessions" ADD COLUMN     "comp_rate" DECIMAL(8,4) NOT NULL;
