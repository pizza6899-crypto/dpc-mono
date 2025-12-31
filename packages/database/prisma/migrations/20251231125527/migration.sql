/*
  Warnings:

  - You are about to drop the `Game` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GameBet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GameRound` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GameSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GameTranslation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GameWin` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AffiliateCommission" DROP CONSTRAINT "AffiliateCommission_gameRoundId_fkey";

-- DropForeignKey
ALTER TABLE "BonusDetail" DROP CONSTRAINT "BonusDetail_gameId_fkey";

-- DropForeignKey
ALTER TABLE "GameBet" DROP CONSTRAINT "GameBet_gameRoundId_fkey";

-- DropForeignKey
ALTER TABLE "GameRound" DROP CONSTRAINT "GameRound_gameId_fkey";

-- DropForeignKey
ALTER TABLE "GameRound" DROP CONSTRAINT "GameRound_gameSessionId_fkey";

-- DropForeignKey
ALTER TABLE "GameRound" DROP CONSTRAINT "GameRound_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "GameSession" DROP CONSTRAINT "GameSession_gameId_fkey";

-- DropForeignKey
ALTER TABLE "GameSession" DROP CONSTRAINT "GameSession_userId_fkey";

-- DropForeignKey
ALTER TABLE "GameTranslation" DROP CONSTRAINT "GameTranslation_gameId_fkey";

-- DropForeignKey
ALTER TABLE "GameWin" DROP CONSTRAINT "GameWin_gameRoundId_fkey";

-- DropTable
DROP TABLE "Game";

-- DropTable
DROP TABLE "GameBet";

-- DropTable
DROP TABLE "GameRound";

-- DropTable
DROP TABLE "GameSession";

-- DropTable
DROP TABLE "GameTranslation";

-- DropTable
DROP TABLE "GameWin";

-- CreateTable
CREATE TABLE "games" (
    "id" SERIAL NOT NULL,
    "aggregator_type" "GameAggregatorType" NOT NULL,
    "provider" "GameProvider" NOT NULL,
    "category" "GameCategory" NOT NULL,
    "game_id" INTEGER NOT NULL,
    "game_type" TEXT,
    "table_id" TEXT,
    "icon_link" TEXT,
    "is_enabled" BOOLEAN NOT NULL,
    "is_visible_to_user" BOOLEAN NOT NULL DEFAULT true,
    "house_edge" DECIMAL(8,4) NOT NULL DEFAULT 0.04,
    "contribution_rate" DECIMAL(8,4) NOT NULL DEFAULT 1.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_translations" (
    "id" SERIAL NOT NULL,
    "game_id" INTEGER NOT NULL,
    "language" "Language" NOT NULL,
    "provider_name" TEXT NOT NULL,
    "category_name" TEXT NOT NULL,
    "game_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_sessions" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_accessed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aggregator_type" "GameAggregatorType" NOT NULL,
    "token" TEXT NOT NULL,
    "wallet_currency" "ExchangeCurrencyCode" NOT NULL,
    "game_currency" "ExchangeCurrencyCode" NOT NULL,
    "exchange_rate" DECIMAL(32,18) NOT NULL,
    "exchange_rate_snapshot_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "game_id" INTEGER,

    CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_rounds" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "aggregator_type" "GameAggregatorType" NOT NULL,
    "provider" "GameProvider" NOT NULL,
    "aggregator_tx_id" TEXT NOT NULL,
    "aggregator_game_id" INTEGER NOT NULL,
    "total_bet_amount_in_game_currency" DECIMAL(32,18),
    "total_win_amount_in_game_currency" DECIMAL(32,18),
    "net_amount_in_game_currency" DECIMAL(32,18),
    "total_bet_amount_in_wallet_currency" DECIMAL(32,18),
    "total_win_amount_in_wallet_currency" DECIMAL(32,18),
    "net_amount_in_wallet_currency" DECIMAL(32,18),
    "transaction_id" BIGINT NOT NULL,
    "session_id" TEXT,
    "table_id" TEXT,
    "round_id" TEXT,
    "replay_type" "GameReplayType",
    "replay_data" TEXT,
    "total_push_amount" DECIMAL(32,18),
    "tie_bet_amount" DECIMAL(32,18),
    "contribution_amount" DECIMAL(32,18),
    "comp_earned" DECIMAL(32,18),
    "jackpot_contribution_amount" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "game_id" INTEGER,
    "game_session_id" BIGINT NOT NULL,

    CONSTRAINT "game_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_bets" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "game_round_id" BIGINT NOT NULL,
    "aggregator_type" "GameAggregatorType" NOT NULL,
    "aggregator_bet_id" TEXT NOT NULL,
    "bet_type" "BetType" NOT NULL,
    "bet_amount" DECIMAL(32,18) NOT NULL,
    "betted_at" TIMESTAMP(3) NOT NULL,
    "bet_amount_in_game_currency" DECIMAL(32,18) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_cancelled" BOOLEAN NOT NULL DEFAULT false,
    "cancelled_at" TIMESTAMP(3),

    CONSTRAINT "game_bets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_wins" (
    "id" BIGSERIAL NOT NULL,
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

    CONSTRAINT "game_wins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "games_is_enabled_idx" ON "games"("is_enabled");

-- CreateIndex
CREATE UNIQUE INDEX "games_aggregator_type_provider_game_id_key" ON "games"("aggregator_type", "provider", "game_id");

-- CreateIndex
CREATE INDEX "game_translations_language_idx" ON "game_translations"("language");

-- CreateIndex
CREATE UNIQUE INDEX "game_translations_game_id_language_key" ON "game_translations"("game_id", "language");

-- CreateIndex
CREATE UNIQUE INDEX "game_sessions_token_key" ON "game_sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "game_rounds_transaction_id_key" ON "game_rounds"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "game_rounds_aggregator_tx_id_aggregator_type_key" ON "game_rounds"("aggregator_tx_id", "aggregator_type");

-- CreateIndex
CREATE INDEX "game_bets_game_round_id_idx" ON "game_bets"("game_round_id");

-- CreateIndex
CREATE UNIQUE INDEX "game_bets_aggregator_bet_id_aggregator_type_key" ON "game_bets"("aggregator_bet_id", "aggregator_type");

-- CreateIndex
CREATE INDEX "game_wins_game_round_id_idx" ON "game_wins"("game_round_id");

-- CreateIndex
CREATE UNIQUE INDEX "game_wins_aggregator_win_id_aggregator_type_key" ON "game_wins"("aggregator_win_id", "aggregator_type");

-- AddForeignKey
ALTER TABLE "game_translations" ADD CONSTRAINT "game_translations_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_rounds" ADD CONSTRAINT "game_rounds_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_rounds" ADD CONSTRAINT "game_rounds_game_session_id_fkey" FOREIGN KEY ("game_session_id") REFERENCES "game_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_rounds" ADD CONSTRAINT "game_rounds_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_bets" ADD CONSTRAINT "game_bets_game_round_id_fkey" FOREIGN KEY ("game_round_id") REFERENCES "game_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_wins" ADD CONSTRAINT "game_wins_game_round_id_fkey" FOREIGN KEY ("game_round_id") REFERENCES "game_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonusDetail" ADD CONSTRAINT "BonusDetail_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateCommission" ADD CONSTRAINT "AffiliateCommission_gameRoundId_fkey" FOREIGN KEY ("gameRoundId") REFERENCES "game_rounds"("id") ON DELETE SET NULL ON UPDATE CASCADE;
