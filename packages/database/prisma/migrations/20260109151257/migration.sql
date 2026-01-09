/*
  Warnings:

  - You are about to drop the `GameBet` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "GameBet" DROP CONSTRAINT "GameBet_gameRoundId_fkey";

-- DropTable
DROP TABLE "GameBet";

-- CreateTable
CREATE TABLE "game_bets" (
    "id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "game_round_id" BIGINT NOT NULL,
    "aggregator_type" "GameAggregatorType" NOT NULL,
    "aggregator_bet_id" TEXT NOT NULL,
    "bet_type" "BetType" NOT NULL,
    "bet_amount" DECIMAL(32,18) NOT NULL,
    "betted_at" TIMESTAMP(3) NOT NULL,
    "bet_amount_in_game_currency" DECIMAL(32,18) NOT NULL,
    "is_cancelled" BOOLEAN NOT NULL DEFAULT false,
    "cancelled_at" TIMESTAMP(3),

    CONSTRAINT "game_bets_pkey" PRIMARY KEY ("id","betted_at")
);

-- CreateIndex
CREATE INDEX "game_bets_game_round_id_betted_at_idx" ON "game_bets"("game_round_id", "betted_at");

-- CreateIndex
CREATE UNIQUE INDEX "game_bets_aggregator_bet_id_aggregator_type_betted_at_key" ON "game_bets"("aggregator_bet_id", "aggregator_type", "betted_at");

-- AddForeignKey
ALTER TABLE "game_bets" ADD CONSTRAINT "game_bets_game_round_id_fkey" FOREIGN KEY ("game_round_id") REFERENCES "GameRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;
