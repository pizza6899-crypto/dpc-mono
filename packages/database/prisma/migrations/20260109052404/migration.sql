/*
  Warnings:

  - Added the required column `usd_exchange_rate` to the `casino_game_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "casino_game_sessions" ADD COLUMN     "usd_exchange_rate" DECIMAL(32,18) NOT NULL;
