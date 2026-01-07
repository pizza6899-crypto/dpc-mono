/*
  Warnings:

  - Made the column `totalBetAmountInGameCurrency` on table `GameRound` required. This step will fail if there are existing NULL values in that column.
  - Made the column `totalWinAmountInGameCurrency` on table `GameRound` required. This step will fail if there are existing NULL values in that column.
  - Made the column `netAmountInGameCurrency` on table `GameRound` required. This step will fail if there are existing NULL values in that column.
  - Made the column `totalBetAmountInWalletCurrency` on table `GameRound` required. This step will fail if there are existing NULL values in that column.
  - Made the column `totalWinAmountInWalletCurrency` on table `GameRound` required. This step will fail if there are existing NULL values in that column.
  - Made the column `netAmountInWalletCurrency` on table `GameRound` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "GameRound" ALTER COLUMN "totalBetAmountInGameCurrency" SET NOT NULL,
ALTER COLUMN "totalBetAmountInGameCurrency" SET DEFAULT 0,
ALTER COLUMN "totalWinAmountInGameCurrency" SET NOT NULL,
ALTER COLUMN "totalWinAmountInGameCurrency" SET DEFAULT 0,
ALTER COLUMN "netAmountInGameCurrency" SET NOT NULL,
ALTER COLUMN "netAmountInGameCurrency" SET DEFAULT 0,
ALTER COLUMN "totalBetAmountInWalletCurrency" SET NOT NULL,
ALTER COLUMN "totalBetAmountInWalletCurrency" SET DEFAULT 0,
ALTER COLUMN "totalWinAmountInWalletCurrency" SET NOT NULL,
ALTER COLUMN "totalWinAmountInWalletCurrency" SET DEFAULT 0,
ALTER COLUMN "netAmountInWalletCurrency" SET NOT NULL,
ALTER COLUMN "netAmountInWalletCurrency" SET DEFAULT 0;
