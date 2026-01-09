-- CreateTable
CREATE TABLE "user_daily_stats" (
    "user_id" BIGINT NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "date" DATE NOT NULL,
    "total_deposit" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "total_withdraw" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "deposit_count" INTEGER NOT NULL DEFAULT 0,
    "withdraw_count" INTEGER NOT NULL DEFAULT 0,
    "total_bonus_given" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "total_bonus_used" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "total_bonus_converted" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "total_bet" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "total_win" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "net_win" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "ggr" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "total_game_count" INTEGER NOT NULL DEFAULT 0,
    "slot_bet_amount" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "slot_win_amount" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "slot_ggr" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "slot_game_count" INTEGER NOT NULL DEFAULT 0,
    "live_bet_amount" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "live_win_amount" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "live_ggr" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "live_game_count" INTEGER NOT NULL DEFAULT 0,
    "total_comp_earned" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "start_balance" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "end_balance" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "start_bonus_balance" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "end_bonus_balance" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_daily_stats_pkey" PRIMARY KEY ("user_id","currency","date")
);

-- CreateIndex
CREATE INDEX "user_daily_stats_date_idx" ON "user_daily_stats"("date");

-- CreateIndex
CREATE INDEX "user_daily_stats_user_id_date_idx" ON "user_daily_stats"("user_id", "date");

-- AddForeignKey
ALTER TABLE "user_daily_stats" ADD CONSTRAINT "user_daily_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
