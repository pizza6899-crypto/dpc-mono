/*
  Warnings:

  - You are about to drop the `Game` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GameSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GameTranslation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BonusDetail" DROP CONSTRAINT "BonusDetail_gameId_fkey";

-- DropForeignKey
ALTER TABLE "GameRound" DROP CONSTRAINT "GameRound_gameId_fkey";

-- DropForeignKey
ALTER TABLE "GameRound" DROP CONSTRAINT "GameRound_gameSessionId_fkey";

-- DropForeignKey
ALTER TABLE "GameSession" DROP CONSTRAINT "GameSession_gameId_fkey";

-- DropForeignKey
ALTER TABLE "GameSession" DROP CONSTRAINT "GameSession_userId_fkey";

-- DropForeignKey
ALTER TABLE "GameTranslation" DROP CONSTRAINT "GameTranslation_gameId_fkey";

-- DropTable
DROP TABLE "Game";

-- DropTable
DROP TABLE "GameSession";

-- DropTable
DROP TABLE "GameTranslation";

-- CreateTable
CREATE TABLE "casino_games" (
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

    CONSTRAINT "casino_games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "casino_game_translations" (
    "id" SERIAL NOT NULL,
    "game_id" INTEGER NOT NULL,
    "language" "Language" NOT NULL,
    "provider_name" TEXT NOT NULL,
    "category_name" TEXT NOT NULL,
    "game_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "casino_game_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "casino_game_sessions" (
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

    CONSTRAINT "casino_game_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "casino_games_is_enabled_idx" ON "casino_games"("is_enabled");

-- CreateIndex
CREATE UNIQUE INDEX "casino_games_aggregator_type_provider_game_id_key" ON "casino_games"("aggregator_type", "provider", "game_id");

-- CreateIndex
CREATE INDEX "casino_game_translations_language_idx" ON "casino_game_translations"("language");

-- CreateIndex
CREATE UNIQUE INDEX "casino_game_translations_game_id_language_key" ON "casino_game_translations"("game_id", "language");

-- CreateIndex
CREATE UNIQUE INDEX "casino_game_sessions_token_key" ON "casino_game_sessions"("token");

-- CreateIndex
CREATE INDEX "casino_game_sessions_user_id_idx" ON "casino_game_sessions"("user_id");

-- CreateIndex
CREATE INDEX "casino_game_sessions_token_idx" ON "casino_game_sessions"("token");

-- AddForeignKey
ALTER TABLE "casino_game_translations" ADD CONSTRAINT "casino_game_translations_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "casino_games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casino_game_sessions" ADD CONSTRAINT "casino_game_sessions_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "casino_games"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casino_game_sessions" ADD CONSTRAINT "casino_game_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRound" ADD CONSTRAINT "GameRound_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "casino_games"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRound" ADD CONSTRAINT "GameRound_gameSessionId_fkey" FOREIGN KEY ("gameSessionId") REFERENCES "casino_game_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonusDetail" ADD CONSTRAINT "BonusDetail_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "casino_games"("id") ON DELETE SET NULL ON UPDATE CASCADE;
