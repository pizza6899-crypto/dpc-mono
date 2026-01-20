-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "tsm_system_rows";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'AVAILABLE', 'CLAIMED', 'WITHDRAWN', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AggregatorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('PRIMARY', 'COLLECTION');

-- CreateEnum
CREATE TYPE "SocialType" AS ENUM ('GOOGLE', 'APPLE', 'TELEGRAM');

-- CreateEnum
CREATE TYPE "UserRoleType" AS ENUM ('USER', 'AGENT', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ExchangeCurrencyCode" AS ENUM ('USDT', 'USD', 'KRW', 'JPY', 'PHP', 'IDR', 'VND', 'BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'LTC', 'BCH', 'EOS', 'TRX');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('EN', 'KO', 'JA');

-- CreateEnum
CREATE TYPE "KycLevel" AS ENUM ('NONE', 'BASIC', 'FULL');

-- CreateEnum
CREATE TYPE "GameAggregatorType" AS ENUM ('WHITECLIFF', 'DC');

-- CreateEnum
CREATE TYPE "GameProvider" AS ENUM ('EVOLUTION', 'EVOLUTION_ASIA', 'EVOLUTION_INDIA', 'EVOLUTION_KOREA', 'PRAGMATIC_PLAY_LIVE', 'PG_SOFT', 'PRAGMATIC_PLAY_SLOTS', 'RELAX_GAMING', 'PLAYNGO');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAW', 'GAME', 'BONUS', 'COMP_CLAIM', 'SYSTEM', 'ADMIN_ADJUST');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GameReplayType" AS ENUM ('TEXT', 'URL', 'HTML');

-- CreateEnum
CREATE TYPE "BetType" AS ENUM ('NORMAL', 'TIP');

-- CreateEnum
CREATE TYPE "WinType" AS ENUM ('NORMAL', 'JACKPOT');

-- CreateEnum
CREATE TYPE "BonusType" AS ENUM ('PROMOTION', 'JACKPOT', 'IN_GAME_BONUS');

-- CreateEnum
CREATE TYPE "WithdrawDetailStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ExchangeRateProvider" AS ENUM ('NOWPAYMENT', 'COINGECKO', 'OPEN_EXCHANGE_RATES');

-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "LoginAttemptResult" AS ENUM ('SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "LoginFailureReason" AS ENUM ('INVALID_CREDENTIALS', 'USER_NOT_FOUND', 'ACCOUNT_SUSPENDED', 'ACCOUNT_CLOSED', 'THROTTLE_LIMIT_EXCEEDED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "CompTransactionType" AS ENUM ('EARN', 'CLAIM', 'ADMIN', 'EXPIRE');

-- CreateEnum
CREATE TYPE "DepositMethodType" AS ENUM ('CRYPTO_WALLET', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "DepositDetailStatus" AS ENUM ('PENDING', 'CONFIRMING', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('NOWPAYMENT', 'MANUAL');

-- CreateEnum
CREATE TYPE "FeePaidByType" AS ENUM ('USER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('PENDING', 'ACTIVE', 'DELETED');

-- CreateEnum
CREATE TYPE "FileAccessType" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "NotifyStatus" AS ENUM ('PENDING', 'SENDING', 'SUCCESS', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('EMAIL', 'SMS', 'IN_APP');

-- CreateEnum
CREATE TYPE "PromotionTargetType" AS ENUM ('NEW_USER_FIRST_DEPOSIT', 'ALL_USERS', 'SPECIFIC_USERS');

-- CreateEnum
CREATE TYPE "PromotionBonusType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "PromotionQualification" AS ENUM ('FORFEIT_BONUS_ON_WITHDRAWAL', 'MUST_COMPLETE_ROLLING_CONDITION');

-- CreateEnum
CREATE TYPE "UserPromotionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'QUALIFICATION_LOST', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "TierChangeType" AS ENUM ('INITIAL', 'UPGRADE', 'DOWNGRADE', 'MANUAL_UPDATE');

-- CreateEnum
CREATE TYPE "AdjustmentReasonCode" AS ENUM ('CS_RECOVERY', 'PROMOTION_REWARD', 'SYSTEM_ERROR_FIX', 'MANUAL_DEPOSIT', 'TEST_ACCOUNT', 'OTHER');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('HTTP', 'WEBSOCKET');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "WageringSourceType" AS ENUM ('DEPOSIT', 'PROMOTION_BONUS');

-- CreateEnum
CREATE TYPE "WageringStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'VOIDED');

-- CreateEnum
CREATE TYPE "WithdrawalMethodType" AS ENUM ('CRYPTO_WALLET', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'PENDING_REVIEW', 'PROCESSING', 'SENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "WithdrawalProcessingMode" AS ENUM ('AUTO', 'MANUAL');

-- CreateTable
CREATE TABLE "affiliate_codes" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "code" TEXT NOT NULL,
    "campaign_name" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_used_at" TIMESTAMP(3),

    CONSTRAINT "affiliate_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "affiliate_id" BIGINT NOT NULL,
    "sub_user_id" BIGINT NOT NULL,
    "ip_address" TEXT,
    "device_fingerprint" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "code_id" BIGINT NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_commissions" (
    "id" BIGSERIAL NOT NULL,
    "affiliate_id" BIGINT NOT NULL,
    "sub_user_id" BIGINT NOT NULL,
    "game_round_id" BIGINT,
    "wager_amount" DECIMAL(32,18) NOT NULL,
    "win_amount" DECIMAL(32,18),
    "commission" DECIMAL(32,18) NOT NULL,
    "rate_applied" DECIMAL(8,4) NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "game_category" TEXT,
    "settlement_date" TIMESTAMP(3),
    "claimed_at" TIMESTAMP(3),
    "withdrawn_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_commissions_pkey" PRIMARY KEY ("created_at","id")
);

-- CreateTable
CREATE TABLE "affiliate_wallets" (
    "affiliate_id" BIGINT NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "available_balance" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "pending_balance" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "total_earned" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_wallets_pkey" PRIMARY KEY ("affiliate_id","currency")
);

-- CreateTable
CREATE TABLE "user_hourly_stats" (
    "user_id" BIGINT NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
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
    "total_comp_converted" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "total_comp_deducted" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "start_balance" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "end_balance" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "start_bonus_balance" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "end_bonus_balance" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_hourly_stats_pkey" PRIMARY KEY ("user_id","date","currency")
);

-- CreateTable
CREATE TABLE "auth_audit_logs" (
    "id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "user_id" BIGINT,
    "session_id" TEXT,
    "trace_id" TEXT,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "ip" TEXT,
    "user_agent" TEXT,
    "device_fingerprint" TEXT,
    "country" TEXT,
    "city" TEXT,
    "bot" BOOLEAN,
    "threat" TEXT,
    "is_mobile" BOOLEAN,
    "cf_ray" TEXT,
    "metadata" JSONB,

    CONSTRAINT "auth_audit_logs_pkey" PRIMARY KEY ("id","created_at")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "user_id" BIGINT,
    "session_id" TEXT,
    "trace_id" TEXT,
    "category" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "is_mobile" BOOLEAN,
    "cf_ray" TEXT,
    "ip" TEXT,
    "metadata" JSONB,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id","created_at")
);

-- CreateTable
CREATE TABLE "system_error_logs" (
    "id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "user_id" BIGINT,
    "session_id" TEXT,
    "trace_id" TEXT,
    "error_code" TEXT,
    "error_message" TEXT NOT NULL,
    "stack_trace" TEXT,
    "metadata" JSONB,
    "path" TEXT,
    "method" TEXT,
    "status_code" INTEGER,
    "severity" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_at" TIMESTAMP(3),
    "country" TEXT,
    "city" TEXT,
    "bot" BOOLEAN,
    "threat" TEXT,
    "is_mobile" BOOLEAN,
    "cf_ray" TEXT,
    "ip" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "system_error_logs_pkey" PRIMARY KEY ("id","created_at")
);

-- CreateTable
CREATE TABLE "integration_logs" (
    "id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "user_id" BIGINT,
    "session_id" TEXT,
    "trace_id" TEXT,
    "provider" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "status_code" INTEGER,
    "request_body" JSONB,
    "response_body" JSONB,
    "duration" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "error_message" TEXT,
    "country" TEXT,
    "city" TEXT,
    "bot" BOOLEAN,
    "threat" TEXT,
    "cf_ray" TEXT,
    "ip" TEXT,

    CONSTRAINT "integration_logs_pkey" PRIMARY KEY ("id","created_at")
);

-- CreateTable
CREATE TABLE "casino_game_sessions" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "token" TEXT NOT NULL,
    "player_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_accessed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aggregator_type" "GameAggregatorType" NOT NULL,
    "wallet_currency" "ExchangeCurrencyCode" NOT NULL,
    "game_currency" "ExchangeCurrencyCode" NOT NULL,
    "exchange_rate" DECIMAL(32,18) NOT NULL,
    "exchange_rate_snapshot_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usd_exchange_rate" DECIMAL(32,18) NOT NULL,
    "comp_rate" DECIMAL(8,4) NOT NULL,
    "game_id" BIGINT,

    CONSTRAINT "casino_game_sessions_pkey" PRIMARY KEY ("id")
);

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

    CONSTRAINT "game_wins_pkey" PRIMARY KEY ("id","won_at")
);

-- CreateTable
CREATE TABLE "casino_aggregators" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "AggregatorStatus" NOT NULL,
    "api_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "casino_aggregators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "casino_game_providers" (
    "id" BIGSERIAL NOT NULL,
    "aggregator_id" BIGINT NOT NULL,
    "external_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "group_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "casino_game_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "casino_game_categories" (
    "id" BIGSERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CategoryType" NOT NULL DEFAULT 'PRIMARY',
    "icon_url" TEXT,
    "banner_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "casino_game_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "casino_game_category_translations" (
    "id" BIGSERIAL NOT NULL,
    "category_id" BIGINT NOT NULL,
    "language" "Language" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "casino_game_category_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "casino_game_category_items" (
    "id" BIGSERIAL NOT NULL,
    "category_id" BIGINT NOT NULL,
    "game_id" BIGINT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "casino_game_category_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "casino_games_v2" (
    "id" BIGSERIAL NOT NULL,
    "provider_id" BIGINT NOT NULL,
    "external_game_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "banner_url" TEXT,
    "rtp" DECIMAL(5,2),
    "volatility" TEXT,
    "game_type" TEXT,
    "table_id" TEXT,
    "tags" TEXT[],
    "house_edge" DECIMAL(8,4) NOT NULL DEFAULT 0.04,
    "contribution_rate" DECIMAL(8,4) NOT NULL DEFAULT 1.0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "casino_games_v2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "casino_game_v2_translations" (
    "id" BIGSERIAL NOT NULL,
    "game_id" BIGINT NOT NULL,
    "language" "Language" NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "casino_game_v2_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "whitecliff_id" BIGINT,
    "whitecliff_system_id" BIGINT,
    "whitecliff_username" TEXT,
    "dcs_id" TEXT,
    "email" TEXT,
    "password_hash" TEXT,
    "social_type" "SocialType",
    "social_id" TEXT,
    "role" "UserRoleType" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "kyc_level" "KycLevel" NOT NULL DEFAULT 'NONE',
    "country" TEXT,
    "language" "Language",
    "timezone" TEXT,
    "timezone_offset" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_wallets" (
    "user_id" BIGINT NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "main_balance" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "bonus_balance" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_wallets_pkey" PRIMARY KEY ("user_id","currency")
);

-- CreateTable
CREATE TABLE "user_balance_stats" (
    "user_id" BIGINT NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "total_deposit" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "total_withdraw" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "total_bet" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "total_win" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "total_bonus" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "total_comp_earned" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "total_comp_used" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "total_settlement_from_bet" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "total_settlement_from_vip" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_balance_stats_pkey" PRIMARY KEY ("user_id","currency")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "amount" DECIMAL(32,18) NOT NULL,
    "before_amount" DECIMAL(32,18) NOT NULL,
    "after_amount" DECIMAL(32,18) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "comp_wallet_transaction_id" BIGINT,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_rounds" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "aggregator_type" "GameAggregatorType" NOT NULL,
    "provider" "GameProvider" NOT NULL,
    "aggregator_tx_id" TEXT NOT NULL,
    "transaction_id" BIGINT NOT NULL,
    "aggregator_game_id" INTEGER NOT NULL,
    "total_bet_amount_in_game_currency" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "total_win_amount_in_game_currency" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "net_amount_in_game_currency" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "total_bet_amount_in_wallet_currency" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "total_win_amount_in_wallet_currency" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "net_amount_in_wallet_currency" DECIMAL(32,18) NOT NULL DEFAULT 0,
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
    "game_id" BIGINT,
    "game_session_id" BIGINT NOT NULL,

    CONSTRAINT "game_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_balance_details" (
    "id" BIGSERIAL NOT NULL,
    "transaction_id" BIGINT NOT NULL,
    "main_balance_change" DECIMAL(32,18),
    "main_before_amount" DECIMAL(32,18),
    "main_after_amount" DECIMAL(32,18),
    "bonus_balance_change" DECIMAL(32,18),
    "bonus_before_amount" DECIMAL(32,18),
    "bonus_after_amount" DECIMAL(32,18),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_balance_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bonus_details" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transaction_time" TIMESTAMP(3) NOT NULL,
    "aggregator_type" "GameAggregatorType" NOT NULL,
    "provider" "GameProvider" NOT NULL,
    "bonus_type" "BonusType" NOT NULL,
    "amount" DECIMAL(32,18) NOT NULL,
    "aggregator_promotion_id" TEXT,
    "aggregator_round_id" TEXT,
    "aggregator_wager_id" TEXT,
    "aggregator_transaction_id" TEXT,
    "aggregator_freespin_id" TEXT,
    "aggregator_session_id" TEXT,
    "is_end_round" BOOLEAN,
    "description" TEXT,
    "game_id" BIGINT,
    "transaction_id" BIGINT NOT NULL,

    CONSTRAINT "bonus_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "now_payment_callback_logs" (
    "id" BIGSERIAL NOT NULL,
    "request_headers" JSONB,
    "request_body" JSONB NOT NULL,
    "response_status" INTEGER,
    "response_body" JSONB,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processing_error" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "now_payment_callback_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" SERIAL NOT NULL,
    "base_currency" "ExchangeCurrencyCode" NOT NULL,
    "quote_currency" "ExchangeCurrencyCode" NOT NULL,
    "rate" DECIMAL(32,18) NOT NULL,
    "provider" "ExchangeRateProvider" NOT NULL,
    "collected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "previous_rate" DECIMAL(32,18),
    "change_rate" DECIMAL(8,4),
    "is_valid" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "type" "TokenType" NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_attempts" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "user_id" BIGINT,
    "result" "LoginAttemptResult" NOT NULL,
    "failure_reason" "LoginFailureReason",
    "ip_address" TEXT,
    "user_agent" TEXT,
    "device_fingerprint" TEXT,
    "is_mobile" BOOLEAN,
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_comp_wallets" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "balance" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "total_earned" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "total_used" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_comp_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comp_wallet_transactions" (
    "id" BIGSERIAL NOT NULL,
    "comp_wallet_id" BIGINT NOT NULL,
    "amount" DECIMAL(32,18) NOT NULL,
    "balance_after" DECIMAL(32,18) NOT NULL,
    "type" "CompTransactionType" NOT NULL,
    "reference_id" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comp_wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposit_details" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "status" "DepositDetailStatus" NOT NULL,
    "user_id" BIGINT NOT NULL,
    "transaction_id" BIGINT,
    "method_type" "DepositMethodType" NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "provider_payment_id" TEXT,
    "deposit_currency" "ExchangeCurrencyCode" NOT NULL,
    "deposit_network" TEXT,
    "wallet_address" TEXT,
    "wallet_address_extra_id" TEXT,
    "depositor_name" TEXT,
    "transaction_hash" TEXT,
    "requested_amount" DECIMAL(32,18) NOT NULL,
    "actually_paid" DECIMAL(32,18),
    "processed_by" BIGINT,
    "admin_note" TEXT,
    "ip_address" TEXT,
    "device_fingerprint" TEXT,
    "fee_amount" DECIMAL(32,18),
    "fee_currency" TEXT,
    "fee_paid_by" "FeePaidByType",
    "failure_reason" TEXT,
    "provider_metadata" JSONB DEFAULT '{}',
    "bank_deposit_config_id" BIGINT,
    "crypto_deposit_config_id" BIGINT,
    "promotion_id" BIGINT,

    CONSTRAINT "deposit_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crypto_deposit_configs" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "min_deposit_amount" DECIMAL(32,18) NOT NULL,
    "deposit_fee_rate" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "confirmations" INTEGER NOT NULL DEFAULT 3,
    "contract_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "crypto_deposit_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_deposit_configs" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "bank_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "account_holder" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "notes" TEXT,
    "min_amount" DECIMAL(32,18) NOT NULL,
    "max_amount" DECIMAL(32,18),
    "total_deposits" INTEGER NOT NULL DEFAULT 0,
    "total_deposit_amount" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "bank_deposit_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" BIGSERIAL NOT NULL,
    "bucket" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "hash" TEXT,
    "filename" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "status" "FileStatus" NOT NULL,
    "access_type" "FileAccessType" NOT NULL,
    "uploader_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_usages" (
    "id" BIGSERIAL NOT NULL,
    "file_id" BIGINT NOT NULL,
    "usage_type" TEXT NOT NULL,
    "usage_id" BIGINT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" BIGSERIAL NOT NULL,
    "event" TEXT NOT NULL,
    "user_id" BIGINT,
    "target_group" TEXT,
    "payload" JSONB NOT NULL,
    "idempotency_key" TEXT,
    "status" "AlertStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("created_at","id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "event" TEXT NOT NULL,
    "channel" "ChannelType" NOT NULL,
    "variables" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_template_translations" (
    "id" BIGSERIAL NOT NULL,
    "template_id" BIGINT NOT NULL,
    "locale" "Language" NOT NULL,
    "title_template" TEXT NOT NULL,
    "body_template" TEXT NOT NULL,
    "action_uri_template" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_template_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" BIGSERIAL NOT NULL,
    "alert_id" BIGINT NOT NULL,
    "alert_created_at" TIMESTAMP(3) NOT NULL,
    "template_id" BIGINT,
    "template_event" TEXT,
    "locale" "Language",
    "channel" "ChannelType" NOT NULL,
    "receiver_id" BIGINT NOT NULL,
    "target" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "action_uri" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 3,
    "scheduled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "NotifyStatus" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3),
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("created_at","id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" BIGSERIAL NOT NULL,
    "management_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "target_type" "PromotionTargetType" NOT NULL,
    "bonus_type" "PromotionBonusType" NOT NULL,
    "bonus_rate" DECIMAL(8,4),
    "code" TEXT NOT NULL,
    "rolling_multiplier" DECIMAL(8,4),
    "qualification_maintain_condition" "PromotionQualification" NOT NULL,
    "is_one_time" BOOLEAN NOT NULL DEFAULT false,
    "is_deposit_required" BOOLEAN NOT NULL DEFAULT true,
    "max_usage_count" INTEGER,
    "current_usage_count" INTEGER NOT NULL DEFAULT 0,
    "bonus_expiry_minutes" INTEGER,
    "note" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_allowlists" (
    "id" BIGSERIAL NOT NULL,
    "promotion_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_allowlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_translations" (
    "id" BIGSERIAL NOT NULL,
    "promotion_id" BIGINT NOT NULL,
    "language" "Language" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotion_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_currencies" (
    "id" BIGSERIAL NOT NULL,
    "promotion_id" BIGINT NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "min_deposit_amount" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "max_bonus_amount" DECIMAL(32,18),
    "max_withdraw_amount" DECIMAL(32,18),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotion_currencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_promotions" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "promotion_id" BIGINT NOT NULL,
    "status" "UserPromotionStatus" NOT NULL DEFAULT 'ACTIVE',
    "deposit_amount" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "locked_amount" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "bonus_amount" DECIMAL(32,18) NOT NULL,
    "target_rolling_amount" DECIMAL(32,18) NOT NULL,
    "current_rolling_amount" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tier" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "requirement_usd" DECIMAL(32,18) NOT NULL,
    "level_up_bonus" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "comp_rate" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "affiliate_commission_rate" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tier_translation" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "tier_id" BIGINT NOT NULL,
    "language" "Language" NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "tier_translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_tier" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "tier_id" BIGINT NOT NULL,
    "cumulative_rolling_usd" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "highest_promoted_priority" INTEGER NOT NULL DEFAULT 0,
    "is_manual_lock" BOOLEAN NOT NULL DEFAULT false,
    "last_promoted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "affiliate_custom_rate" DECIMAL(8,4),
    "is_affiliate_custom_rate" BOOLEAN NOT NULL DEFAULT false,
    "affiliate_monthly_wager_amount" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_tier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tier_history" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "from_tier_id" BIGINT,
    "to_tier_id" BIGINT NOT NULL,
    "change_type" "TierChangeType" NOT NULL,
    "reason" TEXT,
    "rolling_amount_snap" DECIMAL(32,18) NOT NULL,
    "bonus_amount" DECIMAL(32,18),
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "change_by" TEXT,

    CONSTRAINT "tier_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_adjustment_details" (
    "id" BIGSERIAL NOT NULL,
    "transaction_id" BIGINT NOT NULL,
    "admin_user_id" BIGINT NOT NULL,
    "reason_code" "AdjustmentReasonCode" NOT NULL,
    "internal_note" TEXT,

    CONSTRAINT "admin_adjustment_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_adjustment_details" (
    "id" BIGSERIAL NOT NULL,
    "transaction_id" BIGINT NOT NULL,
    "service_name" TEXT NOT NULL,
    "trigger_id" TEXT,
    "action_name" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "system_adjustment_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "session_id" TEXT NOT NULL,
    "type" "SessionType" NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "device_fingerprint" TEXT,
    "is_mobile" BOOLEAN,
    "device_name" TEXT,
    "os" TEXT,
    "browser" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_active_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "revoked_by" BIGINT,
    "metadata" JSONB DEFAULT '{}',

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wagering_requirements" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "source_type" "WageringSourceType" NOT NULL DEFAULT 'DEPOSIT',
    "required_amount" DECIMAL(32,18) NOT NULL,
    "current_amount" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "cancellation_balance_threshold" DECIMAL(32,18),
    "status" "WageringStatus" NOT NULL DEFAULT 'ACTIVE',
    "deposit_detail_id" BIGINT,
    "user_promotion_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancellation_note" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "wagering_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wagering_contribution_logs" (
    "id" BIGSERIAL NOT NULL,
    "wagering_requirement_id" BIGINT NOT NULL,
    "game_round_id" BIGINT NOT NULL,
    "request_amount" DECIMAL(32,18) NOT NULL,
    "contribution_rate" DECIMAL(8,4) NOT NULL,
    "contributed_amount" DECIMAL(32,18) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wagering_contribution_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawal_details" (
    "id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "transaction_id" BIGINT,
    "method_type" "WithdrawalMethodType" NOT NULL,
    "status" "WithdrawalStatus" NOT NULL,
    "processing_mode" "WithdrawalProcessingMode" NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "requested_amount" DECIMAL(32,18) NOT NULL,
    "net_amount" DECIMAL(32,18),
    "fee_amount" DECIMAL(32,18),
    "fee_currency" TEXT,
    "fee_paid_by" "FeePaidByType",
    "network" TEXT,
    "wallet_address" TEXT,
    "wallet_address_extra_id" TEXT,
    "transaction_hash" TEXT,
    "bank_name" TEXT,
    "account_number" TEXT,
    "account_holder" TEXT,
    "provider" "PaymentProvider" NOT NULL,
    "provider_withdrawal_id" TEXT,
    "provider_metadata" JSONB DEFAULT '{}',
    "processed_by" BIGINT,
    "admin_notes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "failure_reason" TEXT,
    "ip_address" TEXT,
    "device_fingerprint" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "applied_config" JSONB DEFAULT '{}',
    "crypto_withdraw_config_id" BIGINT,
    "bank_withdraw_config_id" BIGINT,

    CONSTRAINT "withdrawal_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crypto_withdraw_configs" (
    "id" BIGSERIAL NOT NULL,
    "symbol" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "min_withdraw_amount" DECIMAL(32,18) NOT NULL,
    "max_withdraw_amount" DECIMAL(32,18),
    "auto_process_limit" DECIMAL(32,18),
    "withdraw_fee_fixed" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "withdraw_fee_rate" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "crypto_withdraw_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_withdraw_configs" (
    "id" BIGSERIAL NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "bank_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "min_withdraw_amount" DECIMAL(32,18) NOT NULL,
    "max_withdraw_amount" DECIMAL(32,18),
    "withdraw_fee_fixed" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "withdraw_fee_rate" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "description" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "bank_withdraw_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_codes_uid_key" ON "affiliate_codes"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_codes_code_key" ON "affiliate_codes"("code");

-- CreateIndex
CREATE INDEX "affiliate_codes_user_id_idx" ON "affiliate_codes"("user_id");

-- CreateIndex
CREATE INDEX "affiliate_codes_user_id_is_active_idx" ON "affiliate_codes"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "affiliate_codes_code_idx" ON "affiliate_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_uid_key" ON "referrals"("uid");

-- CreateIndex
CREATE INDEX "referrals_affiliate_id_idx" ON "referrals"("affiliate_id");

-- CreateIndex
CREATE INDEX "referrals_code_id_idx" ON "referrals"("code_id");

-- CreateIndex
CREATE INDEX "referrals_sub_user_id_idx" ON "referrals"("sub_user_id");

-- CreateIndex
CREATE INDEX "referrals_affiliate_id_code_id_idx" ON "referrals"("affiliate_id", "code_id");

-- CreateIndex
CREATE INDEX "referrals_ip_address_device_fingerprint_idx" ON "referrals"("ip_address", "device_fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_affiliate_id_sub_user_id_key" ON "referrals"("affiliate_id", "sub_user_id");

-- CreateIndex
CREATE INDEX "affiliate_commissions_affiliate_id_status_idx" ON "affiliate_commissions"("affiliate_id", "status");

-- CreateIndex
CREATE INDEX "affiliate_commissions_affiliate_id_created_at_idx" ON "affiliate_commissions"("affiliate_id", "created_at");

-- CreateIndex
CREATE INDEX "affiliate_commissions_sub_user_id_idx" ON "affiliate_commissions"("sub_user_id");

-- CreateIndex
CREATE INDEX "affiliate_commissions_status_created_at_idx" ON "affiliate_commissions"("status", "created_at");

-- CreateIndex
CREATE INDEX "affiliate_commissions_settlement_date_idx" ON "affiliate_commissions"("settlement_date");

-- CreateIndex
CREATE INDEX "affiliate_commissions_game_round_id_idx" ON "affiliate_commissions"("game_round_id");

-- CreateIndex
CREATE INDEX "affiliate_wallets_affiliate_id_idx" ON "affiliate_wallets"("affiliate_id");

-- CreateIndex
CREATE INDEX "affiliate_wallets_currency_idx" ON "affiliate_wallets"("currency");

-- CreateIndex
CREATE INDEX "user_hourly_stats_date_idx" ON "user_hourly_stats"("date");

-- CreateIndex
CREATE INDEX "user_hourly_stats_user_id_date_idx" ON "user_hourly_stats"("user_id", "date");

-- CreateIndex
CREATE INDEX "auth_audit_logs_user_id_created_at_idx" ON "auth_audit_logs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "auth_audit_logs_session_id_created_at_idx" ON "auth_audit_logs"("session_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "auth_audit_logs_trace_id_created_at_idx" ON "auth_audit_logs"("trace_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "auth_audit_logs_country_created_at_idx" ON "auth_audit_logs"("country", "created_at" DESC);

-- CreateIndex
CREATE INDEX "auth_audit_logs_bot_created_at_idx" ON "auth_audit_logs"("bot", "created_at" DESC);

-- CreateIndex
CREATE INDEX "auth_audit_logs_threat_created_at_idx" ON "auth_audit_logs"("threat", "created_at" DESC);

-- CreateIndex
CREATE INDEX "activity_logs_user_id_category_created_at_idx" ON "activity_logs"("user_id", "category", "created_at" DESC);

-- CreateIndex
CREATE INDEX "activity_logs_session_id_created_at_idx" ON "activity_logs"("session_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "activity_logs_trace_id_created_at_idx" ON "activity_logs"("trace_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "activity_logs_category_action_created_at_idx" ON "activity_logs"("category", "action", "created_at" DESC);

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "activity_logs_country_created_at_idx" ON "activity_logs"("country", "created_at" DESC);

-- CreateIndex
CREATE INDEX "system_error_logs_severity_resolved_created_at_idx" ON "system_error_logs"("severity", "resolved", "created_at" DESC);

-- CreateIndex
CREATE INDEX "system_error_logs_error_code_created_at_idx" ON "system_error_logs"("error_code", "created_at" DESC);

-- CreateIndex
CREATE INDEX "system_error_logs_session_id_created_at_idx" ON "system_error_logs"("session_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "system_error_logs_trace_id_created_at_idx" ON "system_error_logs"("trace_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "system_error_logs_country_created_at_idx" ON "system_error_logs"("country", "created_at" DESC);

-- CreateIndex
CREATE INDEX "system_error_logs_bot_created_at_idx" ON "system_error_logs"("bot", "created_at" DESC);

-- CreateIndex
CREATE INDEX "integration_logs_provider_success_created_at_idx" ON "integration_logs"("provider", "success", "created_at" DESC);

-- CreateIndex
CREATE INDEX "integration_logs_user_id_created_at_idx" ON "integration_logs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "integration_logs_session_id_created_at_idx" ON "integration_logs"("session_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "integration_logs_trace_id_created_at_idx" ON "integration_logs"("trace_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "integration_logs_country_created_at_idx" ON "integration_logs"("country", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "casino_game_sessions_token_key" ON "casino_game_sessions"("token");

-- CreateIndex
CREATE INDEX "casino_game_sessions_user_id_idx" ON "casino_game_sessions"("user_id");

-- CreateIndex
CREATE INDEX "game_bets_game_round_id_betted_at_idx" ON "game_bets"("game_round_id", "betted_at");

-- CreateIndex
CREATE UNIQUE INDEX "game_bets_aggregator_bet_id_aggregator_type_betted_at_key" ON "game_bets"("aggregator_bet_id", "aggregator_type", "betted_at");

-- CreateIndex
CREATE INDEX "game_wins_game_round_id_idx" ON "game_wins"("game_round_id");

-- CreateIndex
CREATE UNIQUE INDEX "game_wins_aggregator_win_id_aggregator_type_won_at_key" ON "game_wins"("aggregator_win_id", "aggregator_type", "won_at");

-- CreateIndex
CREATE UNIQUE INDEX "casino_aggregators_code_key" ON "casino_aggregators"("code");

-- CreateIndex
CREATE UNIQUE INDEX "casino_game_providers_aggregator_id_code_key" ON "casino_game_providers"("aggregator_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "casino_game_providers_aggregator_id_external_id_key" ON "casino_game_providers"("aggregator_id", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "casino_game_categories_code_key" ON "casino_game_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "casino_game_category_translations_category_id_language_key" ON "casino_game_category_translations"("category_id", "language");

-- CreateIndex
CREATE INDEX "casino_game_category_items_category_id_sort_order_idx" ON "casino_game_category_items"("category_id", "sort_order");

-- CreateIndex
CREATE INDEX "casino_game_category_items_game_id_is_primary_idx" ON "casino_game_category_items"("game_id", "is_primary");

-- CreateIndex
CREATE INDEX "casino_game_category_items_expires_at_idx" ON "casino_game_category_items"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "casino_game_category_items_category_id_game_id_key" ON "casino_game_category_items"("category_id", "game_id");

-- CreateIndex
CREATE INDEX "casino_games_v2_is_enabled_is_visible_idx" ON "casino_games_v2"("is_enabled", "is_visible");

-- CreateIndex
CREATE INDEX "casino_games_v2_sort_order_idx" ON "casino_games_v2"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "casino_games_v2_provider_id_external_game_id_key" ON "casino_games_v2"("provider_id", "external_game_id");

-- CreateIndex
CREATE INDEX "casino_game_v2_translations_language_idx" ON "casino_game_v2_translations"("language");

-- CreateIndex
CREATE INDEX "casino_game_v2_translations_name_idx" ON "casino_game_v2_translations" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE UNIQUE INDEX "casino_game_v2_translations_game_id_language_key" ON "casino_game_v2_translations"("game_id", "language");

-- CreateIndex
CREATE UNIQUE INDEX "users_whitecliff_id_key" ON "users"("whitecliff_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_whitecliff_system_id_key" ON "users"("whitecliff_system_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_whitecliff_username_key" ON "users"("whitecliff_username");

-- CreateIndex
CREATE UNIQUE INDEX "users_dcs_id_key" ON "users"("dcs_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "user_wallets_user_id_idx" ON "user_wallets"("user_id");

-- CreateIndex
CREATE INDEX "user_wallets_currency_idx" ON "user_wallets"("currency");

-- CreateIndex
CREATE INDEX "user_balance_stats_user_id_idx" ON "user_balance_stats"("user_id");

-- CreateIndex
CREATE INDEX "user_balance_stats_currency_idx" ON "user_balance_stats"("currency");

-- CreateIndex
CREATE UNIQUE INDEX "game_rounds_transaction_id_key" ON "game_rounds"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "game_rounds_aggregator_tx_id_aggregator_type_key" ON "game_rounds"("aggregator_tx_id", "aggregator_type");

-- CreateIndex
CREATE INDEX "transaction_balance_details_transaction_id_idx" ON "transaction_balance_details"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "bonus_details_transaction_id_key" ON "bonus_details"("transaction_id");

-- CreateIndex
CREATE INDEX "exchange_rates_base_currency_quote_currency_idx" ON "exchange_rates"("base_currency", "quote_currency");

-- CreateIndex
CREATE INDEX "exchange_rates_base_currency_quote_currency_provider_idx" ON "exchange_rates"("base_currency", "quote_currency", "provider");

-- CreateIndex
CREATE INDEX "exchange_rates_collected_at_idx" ON "exchange_rates"("collected_at");

-- CreateIndex
CREATE INDEX "exchange_rates_is_active_collected_at_idx" ON "exchange_rates"("is_active", "collected_at");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_base_currency_quote_currency_provider_key" ON "exchange_rates"("base_currency", "quote_currency", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "user_tokens_token_key" ON "user_tokens"("token");

-- CreateIndex
CREATE INDEX "user_tokens_user_id_type_idx" ON "user_tokens"("user_id", "type");

-- CreateIndex
CREATE INDEX "user_tokens_type_expires_at_idx" ON "user_tokens"("type", "expires_at");

-- CreateIndex
CREATE INDEX "user_tokens_user_id_type_used_at_idx" ON "user_tokens"("user_id", "type", "used_at");

-- CreateIndex
CREATE INDEX "user_tokens_expires_at_idx" ON "user_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "login_attempts_uid_key" ON "login_attempts"("uid");

-- CreateIndex
CREATE INDEX "login_attempts_user_id_idx" ON "login_attempts"("user_id");

-- CreateIndex
CREATE INDEX "login_attempts_email_idx" ON "login_attempts"("email");

-- CreateIndex
CREATE INDEX "login_attempts_ip_address_idx" ON "login_attempts"("ip_address");

-- CreateIndex
CREATE INDEX "login_attempts_attempted_at_idx" ON "login_attempts"("attempted_at");

-- CreateIndex
CREATE INDEX "login_attempts_result_idx" ON "login_attempts"("result");

-- CreateIndex
CREATE INDEX "login_attempts_email_attempted_at_idx" ON "login_attempts"("email", "attempted_at");

-- CreateIndex
CREATE INDEX "login_attempts_ip_address_attempted_at_idx" ON "login_attempts"("ip_address", "attempted_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_comp_wallets_user_id_currency_key" ON "user_comp_wallets"("user_id", "currency");

-- CreateIndex
CREATE INDEX "comp_wallet_transactions_comp_wallet_id_idx" ON "comp_wallet_transactions"("comp_wallet_id");

-- CreateIndex
CREATE INDEX "comp_wallet_transactions_created_at_idx" ON "comp_wallet_transactions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "deposit_details_uid_key" ON "deposit_details"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "deposit_details_transaction_id_key" ON "deposit_details"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "deposit_details_provider_payment_id_key" ON "deposit_details"("provider_payment_id");

-- CreateIndex
CREATE INDEX "deposit_details_provider_provider_payment_id_idx" ON "deposit_details"("provider", "provider_payment_id");

-- CreateIndex
CREATE INDEX "deposit_details_status_created_at_idx" ON "deposit_details"("status", "created_at");

-- CreateIndex
CREATE INDEX "deposit_details_transaction_id_idx" ON "deposit_details"("transaction_id");

-- CreateIndex
CREATE INDEX "deposit_details_method_type_status_idx" ON "deposit_details"("method_type", "status");

-- CreateIndex
CREATE INDEX "deposit_details_deposit_currency_status_idx" ON "deposit_details"("deposit_currency", "status");

-- CreateIndex
CREATE INDEX "deposit_details_created_at_idx" ON "deposit_details"("created_at");

-- CreateIndex
CREATE INDEX "deposit_details_processed_by_idx" ON "deposit_details"("processed_by");

-- CreateIndex
CREATE INDEX "deposit_details_ip_address_device_fingerprint_idx" ON "deposit_details"("ip_address", "device_fingerprint");

-- CreateIndex
CREATE INDEX "deposit_details_ip_address_idx" ON "deposit_details"("ip_address");

-- CreateIndex
CREATE INDEX "deposit_details_device_fingerprint_idx" ON "deposit_details"("device_fingerprint");

-- CreateIndex
CREATE INDEX "deposit_details_bank_deposit_config_id_idx" ON "deposit_details"("bank_deposit_config_id");

-- CreateIndex
CREATE INDEX "deposit_details_crypto_deposit_config_id_idx" ON "deposit_details"("crypto_deposit_config_id");

-- CreateIndex
CREATE UNIQUE INDEX "crypto_deposit_configs_uid_key" ON "crypto_deposit_configs"("uid");

-- CreateIndex
CREATE INDEX "crypto_deposit_configs_symbol_network_is_active_idx" ON "crypto_deposit_configs"("symbol", "network", "is_active");

-- CreateIndex
CREATE INDEX "crypto_deposit_configs_is_active_idx" ON "crypto_deposit_configs"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "crypto_deposit_configs_symbol_network_key" ON "crypto_deposit_configs"("symbol", "network");

-- CreateIndex
CREATE UNIQUE INDEX "bank_deposit_configs_uid_key" ON "bank_deposit_configs"("uid");

-- CreateIndex
CREATE INDEX "bank_deposit_configs_currency_is_active_priority_idx" ON "bank_deposit_configs"("currency", "is_active", "priority");

-- CreateIndex
CREATE INDEX "bank_deposit_configs_is_active_idx" ON "bank_deposit_configs"("is_active");

-- CreateIndex
CREATE INDEX "bank_deposit_configs_currency_idx" ON "bank_deposit_configs"("currency");

-- CreateIndex
CREATE INDEX "bank_deposit_configs_priority_idx" ON "bank_deposit_configs"("priority");

-- CreateIndex
CREATE INDEX "bank_deposit_configs_deleted_at_idx" ON "bank_deposit_configs"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "files_key_key" ON "files"("key");

-- CreateIndex
CREATE INDEX "files_key_idx" ON "files"("key");

-- CreateIndex
CREATE INDEX "files_path_idx" ON "files"("path");

-- CreateIndex
CREATE INDEX "files_uploader_id_idx" ON "files"("uploader_id");

-- CreateIndex
CREATE INDEX "files_status_idx" ON "files"("status");

-- CreateIndex
CREATE INDEX "file_usages_usage_type_usage_id_idx" ON "file_usages"("usage_type", "usage_id");

-- CreateIndex
CREATE UNIQUE INDEX "file_usages_usage_type_usage_id_file_id_key" ON "file_usages"("usage_type", "usage_id", "file_id");

-- CreateIndex
CREATE INDEX "alerts_user_id_idx" ON "alerts"("user_id");

-- CreateIndex
CREATE INDEX "alerts_created_at_idx" ON "alerts"("created_at");

-- CreateIndex
CREATE INDEX "alerts_status_created_at_idx" ON "alerts"("status", "created_at");

-- CreateIndex
CREATE INDEX "alerts_event_created_at_idx" ON "alerts"("event", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "alerts_idempotency_key_created_at_key" ON "alerts"("idempotency_key", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_event_channel_key" ON "notification_templates"("event", "channel");

-- CreateIndex
CREATE INDEX "notification_template_translations_locale_idx" ON "notification_template_translations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "notification_template_translations_template_id_locale_key" ON "notification_template_translations"("template_id", "locale");

-- CreateIndex
CREATE INDEX "notification_logs_created_at_alert_id_idx" ON "notification_logs"("created_at", "alert_id");

-- CreateIndex
CREATE INDEX "notification_logs_receiver_id_channel_is_deleted_id_idx" ON "notification_logs"("receiver_id", "channel", "is_deleted", "id" DESC);

-- CreateIndex
CREATE INDEX "notification_logs_receiver_id_channel_is_read_created_at_idx" ON "notification_logs"("receiver_id", "channel", "is_read", "created_at");

-- CreateIndex
CREATE INDEX "notification_logs_status_scheduled_at_priority_idx" ON "notification_logs"("status", "scheduled_at", "priority");

-- CreateIndex
CREATE INDEX "notification_logs_template_id_idx" ON "notification_logs"("template_id");

-- CreateIndex
CREATE UNIQUE INDEX "promotions_code_key" ON "promotions"("code");

-- CreateIndex
CREATE INDEX "promotion_allowlists_promotion_id_idx" ON "promotion_allowlists"("promotion_id");

-- CreateIndex
CREATE INDEX "promotion_allowlists_user_id_idx" ON "promotion_allowlists"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_allowlists_promotion_id_user_id_key" ON "promotion_allowlists"("promotion_id", "user_id");

-- CreateIndex
CREATE INDEX "promotion_translations_language_idx" ON "promotion_translations"("language");

-- CreateIndex
CREATE INDEX "promotion_translations_promotion_id_idx" ON "promotion_translations"("promotion_id");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_translations_promotion_id_language_key" ON "promotion_translations"("promotion_id", "language");

-- CreateIndex
CREATE INDEX "promotion_currencies_promotion_id_idx" ON "promotion_currencies"("promotion_id");

-- CreateIndex
CREATE INDEX "promotion_currencies_currency_idx" ON "promotion_currencies"("currency");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_currencies_promotion_id_currency_key" ON "promotion_currencies"("promotion_id", "currency");

-- CreateIndex
CREATE INDEX "user_promotions_user_id_status_idx" ON "user_promotions"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tier_uid_key" ON "tier"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "tier_priority_key" ON "tier"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "tier_code_key" ON "tier"("code");

-- CreateIndex
CREATE INDEX "tier_priority_idx" ON "tier"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "tier_translation_uid_key" ON "tier_translation"("uid");

-- CreateIndex
CREATE INDEX "tier_translation_language_idx" ON "tier_translation"("language");

-- CreateIndex
CREATE UNIQUE INDEX "tier_translation_tier_id_language_key" ON "tier_translation"("tier_id", "language");

-- CreateIndex
CREATE UNIQUE INDEX "user_tier_uid_key" ON "user_tier"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "user_tier_user_id_key" ON "user_tier"("user_id");

-- CreateIndex
CREATE INDEX "user_tier_tier_id_idx" ON "user_tier"("tier_id");

-- CreateIndex
CREATE INDEX "user_tier_affiliate_monthly_wager_amount_idx" ON "user_tier"("affiliate_monthly_wager_amount");

-- CreateIndex
CREATE UNIQUE INDEX "tier_history_uid_key" ON "tier_history"("uid");

-- CreateIndex
CREATE INDEX "tier_history_user_id_idx" ON "tier_history"("user_id");

-- CreateIndex
CREATE INDEX "tier_history_changed_at_idx" ON "tier_history"("changed_at");

-- CreateIndex
CREATE UNIQUE INDEX "admin_adjustment_details_transaction_id_key" ON "admin_adjustment_details"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "system_adjustment_details_transaction_id_key" ON "system_adjustment_details"("transaction_id");

-- CreateIndex
CREATE INDEX "system_adjustment_details_service_name_action_name_idx" ON "system_adjustment_details"("service_name", "action_name");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_uid_key" ON "user_sessions"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_session_id_key" ON "user_sessions"("session_id");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_status_idx" ON "user_sessions"("user_id", "status");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_created_at_idx" ON "user_sessions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "user_sessions_session_id_idx" ON "user_sessions"("session_id");

-- CreateIndex
CREATE INDEX "user_sessions_type_idx" ON "user_sessions"("type");

-- CreateIndex
CREATE INDEX "user_sessions_status_idx" ON "user_sessions"("status");

-- CreateIndex
CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "user_sessions_status_expires_at_idx" ON "user_sessions"("status", "expires_at");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_type_status_idx" ON "user_sessions"("user_id", "type", "status");

-- CreateIndex
CREATE INDEX "user_sessions_device_fingerprint_idx" ON "user_sessions"("device_fingerprint");

-- CreateIndex
CREATE INDEX "user_sessions_ip_address_idx" ON "user_sessions"("ip_address");

-- CreateIndex
CREATE INDEX "user_sessions_last_active_at_idx" ON "user_sessions"("last_active_at");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_status_last_active_at_idx" ON "user_sessions"("user_id", "status", "last_active_at");

-- CreateIndex
CREATE INDEX "user_sessions_status_expires_at_created_at_idx" ON "user_sessions"("status", "expires_at", "created_at");

-- CreateIndex
CREATE INDEX "user_sessions_is_admin_status_idx" ON "user_sessions"("is_admin", "status");

-- CreateIndex
CREATE UNIQUE INDEX "wagering_requirements_uid_key" ON "wagering_requirements"("uid");

-- CreateIndex
CREATE INDEX "wagering_requirements_user_id_currency_status_priority_idx" ON "wagering_requirements"("user_id", "currency", "status", "priority");

-- CreateIndex
CREATE INDEX "wagering_requirements_user_id_status_idx" ON "wagering_requirements"("user_id", "status");

-- CreateIndex
CREATE INDEX "wagering_requirements_source_type_idx" ON "wagering_requirements"("source_type");

-- CreateIndex
CREATE INDEX "wagering_requirements_user_promotion_id_idx" ON "wagering_requirements"("user_promotion_id");

-- CreateIndex
CREATE INDEX "wagering_requirements_status_idx" ON "wagering_requirements"("status");

-- CreateIndex
CREATE INDEX "wagering_contribution_logs_wagering_requirement_id_idx" ON "wagering_contribution_logs"("wagering_requirement_id");

-- CreateIndex
CREATE INDEX "wagering_contribution_logs_game_round_id_idx" ON "wagering_contribution_logs"("game_round_id");

-- CreateIndex
CREATE UNIQUE INDEX "withdrawal_details_transaction_id_key" ON "withdrawal_details"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "withdrawal_details_provider_withdrawal_id_key" ON "withdrawal_details"("provider_withdrawal_id");

-- CreateIndex
CREATE INDEX "withdrawal_details_user_id_status_idx" ON "withdrawal_details"("user_id", "status");

-- CreateIndex
CREATE INDEX "withdrawal_details_status_created_at_idx" ON "withdrawal_details"("status", "created_at");

-- CreateIndex
CREATE INDEX "withdrawal_details_provider_status_idx" ON "withdrawal_details"("provider", "status");

-- CreateIndex
CREATE INDEX "withdrawal_details_transaction_hash_idx" ON "withdrawal_details"("transaction_hash");

-- CreateIndex
CREATE INDEX "withdrawal_details_method_type_status_idx" ON "withdrawal_details"("method_type", "status");

-- CreateIndex
CREATE INDEX "withdrawal_details_processing_mode_status_idx" ON "withdrawal_details"("processing_mode", "status");

-- CreateIndex
CREATE INDEX "withdrawal_details_processed_by_idx" ON "withdrawal_details"("processed_by");

-- CreateIndex
CREATE INDEX "crypto_withdraw_configs_symbol_network_is_active_idx" ON "crypto_withdraw_configs"("symbol", "network", "is_active");

-- CreateIndex
CREATE INDEX "crypto_withdraw_configs_is_active_idx" ON "crypto_withdraw_configs"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "crypto_withdraw_configs_symbol_network_key" ON "crypto_withdraw_configs"("symbol", "network");

-- CreateIndex
CREATE INDEX "bank_withdraw_configs_currency_is_active_idx" ON "bank_withdraw_configs"("currency", "is_active");

-- CreateIndex
CREATE INDEX "bank_withdraw_configs_is_active_idx" ON "bank_withdraw_configs"("is_active");

-- AddForeignKey
ALTER TABLE "affiliate_codes" ADD CONSTRAINT "affiliate_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_code_id_fkey" FOREIGN KEY ("code_id") REFERENCES "affiliate_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_sub_user_id_fkey" FOREIGN KEY ("sub_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_game_round_id_fkey" FOREIGN KEY ("game_round_id") REFERENCES "game_rounds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_sub_user_id_fkey" FOREIGN KEY ("sub_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_wallets" ADD CONSTRAINT "affiliate_wallets_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_hourly_stats" ADD CONSTRAINT "user_hourly_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casino_game_sessions" ADD CONSTRAINT "casino_game_sessions_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "casino_games_v2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casino_game_sessions" ADD CONSTRAINT "casino_game_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_bets" ADD CONSTRAINT "game_bets_game_round_id_fkey" FOREIGN KEY ("game_round_id") REFERENCES "game_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_wins" ADD CONSTRAINT "game_wins_game_round_id_fkey" FOREIGN KEY ("game_round_id") REFERENCES "game_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casino_game_providers" ADD CONSTRAINT "casino_game_providers_aggregator_id_fkey" FOREIGN KEY ("aggregator_id") REFERENCES "casino_aggregators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casino_game_category_translations" ADD CONSTRAINT "casino_game_category_translations_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "casino_game_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casino_game_category_items" ADD CONSTRAINT "casino_game_category_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "casino_game_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casino_game_category_items" ADD CONSTRAINT "casino_game_category_items_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "casino_games_v2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casino_games_v2" ADD CONSTRAINT "casino_games_v2_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "casino_game_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casino_game_v2_translations" ADD CONSTRAINT "casino_game_v2_translations_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "casino_games_v2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_wallets" ADD CONSTRAINT "user_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_balance_stats" ADD CONSTRAINT "user_balance_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_comp_wallet_transaction_id_fkey" FOREIGN KEY ("comp_wallet_transaction_id") REFERENCES "comp_wallet_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_rounds" ADD CONSTRAINT "game_rounds_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "casino_games_v2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_rounds" ADD CONSTRAINT "game_rounds_game_session_id_fkey" FOREIGN KEY ("game_session_id") REFERENCES "casino_game_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_rounds" ADD CONSTRAINT "game_rounds_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_balance_details" ADD CONSTRAINT "transaction_balance_details_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bonus_details" ADD CONSTRAINT "bonus_details_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "casino_games_v2"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bonus_details" ADD CONSTRAINT "bonus_details_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tokens" ADD CONSTRAINT "user_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_attempts" ADD CONSTRAINT "login_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_comp_wallets" ADD CONSTRAINT "user_comp_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comp_wallet_transactions" ADD CONSTRAINT "comp_wallet_transactions_comp_wallet_id_fkey" FOREIGN KEY ("comp_wallet_id") REFERENCES "user_comp_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_details" ADD CONSTRAINT "deposit_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_details" ADD CONSTRAINT "deposit_details_bank_deposit_config_id_fkey" FOREIGN KEY ("bank_deposit_config_id") REFERENCES "bank_deposit_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_details" ADD CONSTRAINT "deposit_details_crypto_deposit_config_id_fkey" FOREIGN KEY ("crypto_deposit_config_id") REFERENCES "crypto_deposit_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_details" ADD CONSTRAINT "deposit_details_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_details" ADD CONSTRAINT "deposit_details_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_usages" ADD CONSTRAINT "file_usages_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_template_translations" ADD CONSTRAINT "notification_template_translations_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "notification_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_alert_created_at_alert_id_fkey" FOREIGN KEY ("alert_created_at", "alert_id") REFERENCES "alerts"("created_at", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "notification_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_allowlists" ADD CONSTRAINT "promotion_allowlists_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_translations" ADD CONSTRAINT "promotion_translations_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_currencies" ADD CONSTRAINT "promotion_currencies_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_promotions" ADD CONSTRAINT "user_promotions_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_promotions" ADD CONSTRAINT "user_promotions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tier_translation" ADD CONSTRAINT "tier_translation_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "tier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tier" ADD CONSTRAINT "user_tier_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tier" ADD CONSTRAINT "user_tier_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "tier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tier_history" ADD CONSTRAINT "tier_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tier_history" ADD CONSTRAINT "tier_history_from_tier_id_fkey" FOREIGN KEY ("from_tier_id") REFERENCES "tier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tier_history" ADD CONSTRAINT "tier_history_to_tier_id_fkey" FOREIGN KEY ("to_tier_id") REFERENCES "tier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_adjustment_details" ADD CONSTRAINT "admin_adjustment_details_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_adjustment_details" ADD CONSTRAINT "admin_adjustment_details_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_adjustment_details" ADD CONSTRAINT "system_adjustment_details_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wagering_requirements" ADD CONSTRAINT "wagering_requirements_deposit_detail_id_fkey" FOREIGN KEY ("deposit_detail_id") REFERENCES "deposit_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wagering_requirements" ADD CONSTRAINT "wagering_requirements_user_id_currency_fkey" FOREIGN KEY ("user_id", "currency") REFERENCES "user_wallets"("user_id", "currency") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wagering_requirements" ADD CONSTRAINT "wagering_requirements_user_promotion_id_fkey" FOREIGN KEY ("user_promotion_id") REFERENCES "user_promotions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wagering_requirements" ADD CONSTRAINT "wagering_requirements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wagering_contribution_logs" ADD CONSTRAINT "wagering_contribution_logs_wagering_requirement_id_fkey" FOREIGN KEY ("wagering_requirement_id") REFERENCES "wagering_requirements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_details" ADD CONSTRAINT "withdrawal_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_details" ADD CONSTRAINT "withdrawal_details_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_details" ADD CONSTRAINT "withdrawal_details_crypto_withdraw_config_id_fkey" FOREIGN KEY ("crypto_withdraw_config_id") REFERENCES "crypto_withdraw_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_details" ADD CONSTRAINT "withdrawal_details_bank_withdraw_config_id_fkey" FOREIGN KEY ("bank_withdraw_config_id") REFERENCES "bank_withdraw_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
