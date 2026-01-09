/*
  Warnings:

  - You are about to drop the `GameWin` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "GameWin" DROP CONSTRAINT "GameWin_gameRoundId_fkey";

-- DropTable
DROP TABLE "GameWin";

-- CreateTable
CREATE TABLE "game_wins" (
    "id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "game_round_id" BIGINT NOT NULL,
    "aggregator_type" "GameAggregatorType" NOT NULL,
    "aggregator_win_id" TEXT NOT NULL,
    "win_type" "WinType" NOT NULL,
    "win_amount" DECIMAL(32,18) NOT NULL,
    "won_at" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "win_amount_in_game_currency" DECIMAL(32,18) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_wins_pkey" PRIMARY KEY ("id","won_at")
);

-- CreateIndex
CREATE INDEX "game_wins_game_round_id_idx" ON "game_wins"("game_round_id");

-- CreateIndex
CREATE UNIQUE INDEX "game_wins_aggregator_win_id_aggregator_type_won_at_key" ON "game_wins"("aggregator_win_id", "aggregator_type", "won_at");

-- AddForeignKey
ALTER TABLE "game_wins" ADD CONSTRAINT "game_wins_game_round_id_fkey" FOREIGN KEY ("game_round_id") REFERENCES "GameRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;
