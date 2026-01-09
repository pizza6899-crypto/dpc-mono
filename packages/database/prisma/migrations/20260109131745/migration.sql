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
CREATE TYPE "GameAggregatorType" AS ENUM ('WHITECLIFF', 'DCS');

-- CreateEnum
CREATE TYPE "GameCategory" AS ENUM ('LIVE_CASINO', 'SLOTS');

-- CreateEnum
CREATE TYPE "GameProvider" AS ENUM ('EVOLUTION', 'PRAGMATIC_PLAY_LIVE', 'PG_SOFT', 'PRAGMATIC_PLAY_SLOTS', 'RELAX_GAMING', 'PLAYNGO');

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
CREATE TYPE "EmailType" AS ENUM ('PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'AVAILABLE', 'CLAIMED', 'WITHDRAWN', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AffiliateTierLevel" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND');

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
CREATE TYPE "PromotionTargetType" AS ENUM ('NEW_USER_FIRST_DEPOSIT');

-- CreateEnum
CREATE TYPE "PromotionBonusType" AS ENUM ('PERCENTAGE');

-- CreateEnum
CREATE TYPE "PromotionQualification" AS ENUM ('UNTIL_FIRST_WITHDRAWAL');

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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
CREATE TABLE "casino_games" (
    "id" BIGSERIAL NOT NULL,
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
    "game_id" BIGINT NOT NULL,
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
    "uid" TEXT NOT NULL,
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
    "casino_game_id" BIGINT,

    CONSTRAINT "casino_game_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "whitecliffId" BIGINT,
    "whitecliffSystemId" BIGINT,
    "whitecliffUsername" TEXT,
    "dcsId" TEXT,
    "email" TEXT,
    "passwordHash" TEXT,
    "socialType" "SocialType",
    "socialId" TEXT,
    "role" "UserRoleType" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "kycLevel" "KycLevel" NOT NULL DEFAULT 'NONE',
    "country" TEXT,
    "language" "Language",
    "timezone" TEXT,
    "timezoneOffset" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_wallets" (
    "userId" BIGINT NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "mainBalance" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "bonusBalance" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_wallets_pkey" PRIMARY KEY ("userId","currency")
);

-- CreateTable
CREATE TABLE "UserBalanceStats" (
    "userId" BIGINT NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "totalDeposit" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "totalWithdraw" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "totalBet" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "totalWin" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "totalBonus" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "totalCompEarned" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "totalCompUsed" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "totalSettlementFromBet" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "totalSettlementFromVip" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBalanceStats_pkey" PRIMARY KEY ("userId","currency")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "amount" DECIMAL(32,18) NOT NULL,
    "beforeAmount" DECIMAL(32,18) NOT NULL,
    "afterAmount" DECIMAL(32,18) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "comp_wallet_transaction_id" BIGINT,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameRound" (
    "id" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "aggregatorType" "GameAggregatorType" NOT NULL,
    "provider" "GameProvider" NOT NULL,
    "aggregatorTxId" TEXT NOT NULL,
    "transactionId" BIGINT NOT NULL,
    "aggregatorGameId" INTEGER NOT NULL,
    "totalBetAmountInGameCurrency" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "totalWinAmountInGameCurrency" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "netAmountInGameCurrency" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "totalBetAmountInWalletCurrency" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "totalWinAmountInWalletCurrency" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "netAmountInWalletCurrency" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "sessionId" TEXT,
    "tableId" TEXT,
    "roundId" TEXT,
    "replayType" "GameReplayType",
    "replayData" TEXT,
    "totalPushAmount" DECIMAL(32,18),
    "tieBetAmount" DECIMAL(32,18),
    "contributionAmount" DECIMAL(32,18),
    "compEarned" DECIMAL(32,18),
    "jackpotContributionAmount" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "gameId" BIGINT,
    "gameSessionId" BIGINT NOT NULL,

    CONSTRAINT "GameRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameBet" (
    "id" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "gameRoundId" BIGINT NOT NULL,
    "aggregatorType" "GameAggregatorType" NOT NULL,
    "aggregatorBetId" TEXT NOT NULL,
    "betType" "BetType" NOT NULL,
    "betAmount" DECIMAL(32,18) NOT NULL,
    "bettedAt" TIMESTAMP(3) NOT NULL,
    "betAmountInGameCurrency" DECIMAL(32,18) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "GameBet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameWin" (
    "id" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "gameRoundId" BIGINT NOT NULL,
    "aggregatorType" "GameAggregatorType" NOT NULL,
    "aggregatorWinId" TEXT NOT NULL,
    "winType" "WinType" NOT NULL,
    "winAmount" DECIMAL(32,18) NOT NULL,
    "wonAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "winAmountInGameCurrency" DECIMAL(32,18) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameWin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionBalanceDetail" (
    "id" BIGINT NOT NULL,
    "transactionId" BIGINT NOT NULL,
    "mainBalanceChange" DECIMAL(32,18),
    "mainBeforeAmount" DECIMAL(32,18),
    "mainAfterAmount" DECIMAL(32,18),
    "bonusBalanceChange" DECIMAL(32,18),
    "bonusBeforeAmount" DECIMAL(32,18),
    "bonusAfterAmount" DECIMAL(32,18),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionBalanceDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BonusDetail" (
    "id" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactionTime" TIMESTAMP(3) NOT NULL,
    "aggregatorType" "GameAggregatorType" NOT NULL,
    "provider" "GameProvider" NOT NULL,
    "bonusType" "BonusType" NOT NULL,
    "amount" DECIMAL(32,18) NOT NULL,
    "aggregatorPromotionId" TEXT,
    "aggregatorRoundId" TEXT,
    "aggregatorWagerId" TEXT,
    "aggregatorTransactionId" TEXT,
    "aggregatorFreespinId" TEXT,
    "aggregatorSessionId" TEXT,
    "isEndRound" BOOLEAN,
    "description" TEXT,
    "gameId" BIGINT,
    "transactionId" BIGINT NOT NULL,

    CONSTRAINT "BonusDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WithdrawDetail" (
    "id" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "WithdrawDetailStatus" NOT NULL,
    "transactionId" BIGINT NOT NULL,
    "withdrawCurrency" "ExchangeCurrencyCode" NOT NULL,
    "withdrawNetwork" TEXT NOT NULL,
    "withdrawAmount" DECIMAL(32,18) NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "walletAddressExtraId" TEXT,
    "provider" "PaymentProvider" NOT NULL,
    "providerWithdrawalId" TEXT,
    "transactionHash" TEXT,
    "errorMessage" TEXT,
    "feeAmount" DECIMAL(32,18),
    "feeCurrency" TEXT,
    "feePaidBy" "FeePaidByType",
    "providerMetadata" JSONB DEFAULT '{}',

    CONSTRAINT "WithdrawDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NowPaymentCallbackLog" (
    "id" BIGSERIAL NOT NULL,
    "requestHeaders" JSONB,
    "requestBody" JSONB NOT NULL,
    "responseStatus" INTEGER,
    "responseBody" JSONB,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processingError" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NowPaymentCallbackLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" SERIAL NOT NULL,
    "baseCurrency" "ExchangeCurrencyCode" NOT NULL,
    "quoteCurrency" "ExchangeCurrencyCode" NOT NULL,
    "rate" DECIMAL(32,18) NOT NULL,
    "provider" "ExchangeRateProvider" NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "previousRate" DECIMAL(32,18),
    "changeRate" DECIMAL(8,4),
    "isValid" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserToken" (
    "id" SERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "type" "TokenType" NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" SERIAL NOT NULL,
    "userId" BIGINT,
    "type" "EmailType" NOT NULL,
    "status" "EmailStatus" NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "from" TEXT,
    "messageId" TEXT,
    "error" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateWallet" (
    "affiliateId" BIGINT NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "availableBalance" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "pendingBalance" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "totalEarned" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateWallet_pkey" PRIMARY KEY ("affiliateId","currency")
);

-- CreateTable
CREATE TABLE "AffiliateCommission" (
    "affiliateId" BIGINT NOT NULL,
    "subUserId" BIGINT NOT NULL,
    "gameRoundId" BIGINT,
    "wagerAmount" DECIMAL(32,18) NOT NULL,
    "winAmount" DECIMAL(32,18),
    "commission" DECIMAL(32,18) NOT NULL,
    "rateApplied" DECIMAL(8,4) NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "gameCategory" "GameCategory",
    "settlementDate" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "uid" TEXT NOT NULL,
    "id" BIGSERIAL NOT NULL,

    CONSTRAINT "AffiliateCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateTier" (
    "affiliateId" BIGINT NOT NULL,
    "tier" "AffiliateTierLevel" NOT NULL DEFAULT 'BRONZE',
    "baseRate" DECIMAL(8,4) NOT NULL,
    "customRate" DECIMAL(8,4),
    "isCustomRate" BOOLEAN NOT NULL DEFAULT false,
    "monthlyWagerAmount" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "customRateSetBy" BIGINT,
    "customRateSetAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "uid" TEXT NOT NULL,
    "id" BIGSERIAL NOT NULL,

    CONSTRAINT "AffiliateTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "userId" BIGINT,
    "result" "LoginAttemptResult" NOT NULL,
    "failureReason" "LoginFailureReason",
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceFingerprint" TEXT,
    "isMobile" BOOLEAN,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
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
    "bank_config_id" BIGINT,
    "crypto_config_id" BIGINT,
    "promotion_id" BIGINT,

    CONSTRAINT "deposit_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crypto_configs" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "min_deposit_amount" DECIMAL(32,18) NOT NULL,
    "deposit_fee_rate" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "confirmations" INTEGER NOT NULL DEFAULT 3,
    "contract_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "crypto_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_configs" (
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

    CONSTRAINT "bank_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "management_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "target_type" "PromotionTargetType" NOT NULL,
    "bonus_type" "PromotionBonusType" NOT NULL,
    "bonus_rate" DECIMAL(8,4),
    "rolling_multiplier" DECIMAL(8,4),
    "qualification_maintain_condition" "PromotionQualification" NOT NULL,
    "is_one_time" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
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
    "min_deposit_amount" DECIMAL(32,18) NOT NULL,
    "max_bonus_amount" DECIMAL(32,18),
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
    "deposit_amount" DECIMAL(32,18) NOT NULL,
    "bonus_amount" DECIMAL(32,18) NOT NULL,
    "target_rolling_amount" DECIMAL(32,18) NOT NULL,
    "current_rolling_amount" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "currency" "ExchangeCurrencyCode" NOT NULL,
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
CREATE INDEX "casino_games_is_enabled_idx" ON "casino_games"("is_enabled");

-- CreateIndex
CREATE UNIQUE INDEX "casino_games_aggregator_type_provider_game_id_key" ON "casino_games"("aggregator_type", "provider", "game_id");

-- CreateIndex
CREATE INDEX "casino_game_translations_language_idx" ON "casino_game_translations"("language");

-- CreateIndex
CREATE UNIQUE INDEX "casino_game_translations_game_id_language_key" ON "casino_game_translations"("game_id", "language");

-- CreateIndex
CREATE UNIQUE INDEX "casino_game_sessions_uid_key" ON "casino_game_sessions"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "casino_game_sessions_token_key" ON "casino_game_sessions"("token");

-- CreateIndex
CREATE INDEX "casino_game_sessions_user_id_idx" ON "casino_game_sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_uid_key" ON "User"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "User_whitecliffId_key" ON "User"("whitecliffId");

-- CreateIndex
CREATE UNIQUE INDEX "User_whitecliffSystemId_key" ON "User"("whitecliffSystemId");

-- CreateIndex
CREATE UNIQUE INDEX "User_whitecliffUsername_key" ON "User"("whitecliffUsername");

-- CreateIndex
CREATE UNIQUE INDEX "User_dcsId_key" ON "User"("dcsId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "user_wallets_userId_idx" ON "user_wallets"("userId");

-- CreateIndex
CREATE INDEX "user_wallets_currency_idx" ON "user_wallets"("currency");

-- CreateIndex
CREATE INDEX "UserBalanceStats_userId_idx" ON "UserBalanceStats"("userId");

-- CreateIndex
CREATE INDEX "UserBalanceStats_currency_idx" ON "UserBalanceStats"("currency");

-- CreateIndex
CREATE UNIQUE INDEX "GameRound_transactionId_key" ON "GameRound"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "GameRound_aggregatorTxId_aggregatorType_key" ON "GameRound"("aggregatorTxId", "aggregatorType");

-- CreateIndex
CREATE INDEX "GameBet_gameRoundId_idx" ON "GameBet"("gameRoundId");

-- CreateIndex
CREATE UNIQUE INDEX "GameBet_aggregatorBetId_aggregatorType_key" ON "GameBet"("aggregatorBetId", "aggregatorType");

-- CreateIndex
CREATE INDEX "GameWin_gameRoundId_idx" ON "GameWin"("gameRoundId");

-- CreateIndex
CREATE UNIQUE INDEX "GameWin_aggregatorWinId_aggregatorType_key" ON "GameWin"("aggregatorWinId", "aggregatorType");

-- CreateIndex
CREATE INDEX "TransactionBalanceDetail_transactionId_idx" ON "TransactionBalanceDetail"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "BonusDetail_transactionId_key" ON "BonusDetail"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "WithdrawDetail_transactionId_key" ON "WithdrawDetail"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "WithdrawDetail_providerWithdrawalId_key" ON "WithdrawDetail"("providerWithdrawalId");

-- CreateIndex
CREATE INDEX "WithdrawDetail_provider_providerWithdrawalId_idx" ON "WithdrawDetail"("provider", "providerWithdrawalId");

-- CreateIndex
CREATE INDEX "WithdrawDetail_provider_status_idx" ON "WithdrawDetail"("provider", "status");

-- CreateIndex
CREATE INDEX "WithdrawDetail_transactionHash_idx" ON "WithdrawDetail"("transactionHash");

-- CreateIndex
CREATE INDEX "WithdrawDetail_status_createdAt_idx" ON "WithdrawDetail"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ExchangeRate_baseCurrency_quoteCurrency_idx" ON "ExchangeRate"("baseCurrency", "quoteCurrency");

-- CreateIndex
CREATE INDEX "ExchangeRate_baseCurrency_quoteCurrency_provider_idx" ON "ExchangeRate"("baseCurrency", "quoteCurrency", "provider");

-- CreateIndex
CREATE INDEX "ExchangeRate_collectedAt_idx" ON "ExchangeRate"("collectedAt");

-- CreateIndex
CREATE INDEX "ExchangeRate_isActive_collectedAt_idx" ON "ExchangeRate"("isActive", "collectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_baseCurrency_quoteCurrency_provider_key" ON "ExchangeRate"("baseCurrency", "quoteCurrency", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "UserToken_token_key" ON "UserToken"("token");

-- CreateIndex
CREATE INDEX "UserToken_userId_type_idx" ON "UserToken"("userId", "type");

-- CreateIndex
CREATE INDEX "UserToken_type_expiresAt_idx" ON "UserToken"("type", "expiresAt");

-- CreateIndex
CREATE INDEX "UserToken_userId_type_usedAt_idx" ON "UserToken"("userId", "type", "usedAt");

-- CreateIndex
CREATE INDEX "UserToken_expiresAt_idx" ON "UserToken"("expiresAt");

-- CreateIndex
CREATE INDEX "EmailLog_userId_type_createdAt_idx" ON "EmailLog"("userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_to_type_createdAt_idx" ON "EmailLog"("to", "type", "createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_status_createdAt_idx" ON "EmailLog"("status", "createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_type_status_idx" ON "EmailLog"("type", "status");

-- CreateIndex
CREATE INDEX "AffiliateWallet_affiliateId_idx" ON "AffiliateWallet"("affiliateId");

-- CreateIndex
CREATE INDEX "AffiliateWallet_currency_idx" ON "AffiliateWallet"("currency");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateCommission_uid_key" ON "AffiliateCommission"("uid");

-- CreateIndex
CREATE INDEX "AffiliateCommission_affiliateId_status_idx" ON "AffiliateCommission"("affiliateId", "status");

-- CreateIndex
CREATE INDEX "AffiliateCommission_affiliateId_createdAt_idx" ON "AffiliateCommission"("affiliateId", "createdAt");

-- CreateIndex
CREATE INDEX "AffiliateCommission_subUserId_idx" ON "AffiliateCommission"("subUserId");

-- CreateIndex
CREATE INDEX "AffiliateCommission_status_createdAt_idx" ON "AffiliateCommission"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AffiliateCommission_settlementDate_idx" ON "AffiliateCommission"("settlementDate");

-- CreateIndex
CREATE INDEX "AffiliateCommission_gameRoundId_idx" ON "AffiliateCommission"("gameRoundId");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateTier_affiliateId_key" ON "AffiliateTier"("affiliateId");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateTier_uid_key" ON "AffiliateTier"("uid");

-- CreateIndex
CREATE INDEX "AffiliateTier_affiliateId_idx" ON "AffiliateTier"("affiliateId");

-- CreateIndex
CREATE INDEX "AffiliateTier_tier_idx" ON "AffiliateTier"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "LoginAttempt_uid_key" ON "LoginAttempt"("uid");

-- CreateIndex
CREATE INDEX "LoginAttempt_userId_idx" ON "LoginAttempt"("userId");

-- CreateIndex
CREATE INDEX "LoginAttempt_email_idx" ON "LoginAttempt"("email");

-- CreateIndex
CREATE INDEX "LoginAttempt_ipAddress_idx" ON "LoginAttempt"("ipAddress");

-- CreateIndex
CREATE INDEX "LoginAttempt_attemptedAt_idx" ON "LoginAttempt"("attemptedAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_result_idx" ON "LoginAttempt"("result");

-- CreateIndex
CREATE INDEX "LoginAttempt_email_attemptedAt_idx" ON "LoginAttempt"("email", "attemptedAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_ipAddress_attemptedAt_idx" ON "LoginAttempt"("ipAddress", "attemptedAt");

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
CREATE INDEX "deposit_details_bank_config_id_idx" ON "deposit_details"("bank_config_id");

-- CreateIndex
CREATE INDEX "deposit_details_crypto_config_id_idx" ON "deposit_details"("crypto_config_id");

-- CreateIndex
CREATE UNIQUE INDEX "crypto_configs_uid_key" ON "crypto_configs"("uid");

-- CreateIndex
CREATE INDEX "crypto_configs_symbol_network_isActive_idx" ON "crypto_configs"("symbol", "network", "isActive");

-- CreateIndex
CREATE INDEX "crypto_configs_isActive_idx" ON "crypto_configs"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "crypto_configs_symbol_network_key" ON "crypto_configs"("symbol", "network");

-- CreateIndex
CREATE UNIQUE INDEX "bank_configs_uid_key" ON "bank_configs"("uid");

-- CreateIndex
CREATE INDEX "bank_configs_currency_is_active_priority_idx" ON "bank_configs"("currency", "is_active", "priority");

-- CreateIndex
CREATE INDEX "bank_configs_is_active_idx" ON "bank_configs"("is_active");

-- CreateIndex
CREATE INDEX "bank_configs_currency_idx" ON "bank_configs"("currency");

-- CreateIndex
CREATE INDEX "bank_configs_priority_idx" ON "bank_configs"("priority");

-- CreateIndex
CREATE INDEX "bank_configs_deleted_at_idx" ON "bank_configs"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "promotions_uid_key" ON "promotions"("uid");

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

-- AddForeignKey
ALTER TABLE "affiliate_codes" ADD CONSTRAINT "affiliate_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_code_id_fkey" FOREIGN KEY ("code_id") REFERENCES "affiliate_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_sub_user_id_fkey" FOREIGN KEY ("sub_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_hourly_stats" ADD CONSTRAINT "user_hourly_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casino_game_translations" ADD CONSTRAINT "casino_game_translations_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "casino_games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casino_game_sessions" ADD CONSTRAINT "casino_game_sessions_casino_game_id_fkey" FOREIGN KEY ("casino_game_id") REFERENCES "casino_games"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casino_game_sessions" ADD CONSTRAINT "casino_game_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_wallets" ADD CONSTRAINT "user_wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBalanceStats" ADD CONSTRAINT "UserBalanceStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_comp_wallet_transaction_id_fkey" FOREIGN KEY ("comp_wallet_transaction_id") REFERENCES "comp_wallet_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRound" ADD CONSTRAINT "GameRound_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "casino_games"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRound" ADD CONSTRAINT "GameRound_gameSessionId_fkey" FOREIGN KEY ("gameSessionId") REFERENCES "casino_game_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRound" ADD CONSTRAINT "GameRound_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameBet" ADD CONSTRAINT "GameBet_gameRoundId_fkey" FOREIGN KEY ("gameRoundId") REFERENCES "GameRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameWin" ADD CONSTRAINT "GameWin_gameRoundId_fkey" FOREIGN KEY ("gameRoundId") REFERENCES "GameRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionBalanceDetail" ADD CONSTRAINT "TransactionBalanceDetail_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonusDetail" ADD CONSTRAINT "BonusDetail_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "casino_games"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonusDetail" ADD CONSTRAINT "BonusDetail_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawDetail" ADD CONSTRAINT "WithdrawDetail_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserToken" ADD CONSTRAINT "UserToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateWallet" ADD CONSTRAINT "AffiliateWallet_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateCommission" ADD CONSTRAINT "AffiliateCommission_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateCommission" ADD CONSTRAINT "AffiliateCommission_gameRoundId_fkey" FOREIGN KEY ("gameRoundId") REFERENCES "GameRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateCommission" ADD CONSTRAINT "AffiliateCommission_subUserId_fkey" FOREIGN KEY ("subUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateTier" ADD CONSTRAINT "AffiliateTier_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginAttempt" ADD CONSTRAINT "LoginAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_comp_wallets" ADD CONSTRAINT "user_comp_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comp_wallet_transactions" ADD CONSTRAINT "comp_wallet_transactions_comp_wallet_id_fkey" FOREIGN KEY ("comp_wallet_id") REFERENCES "user_comp_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_details" ADD CONSTRAINT "deposit_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_details" ADD CONSTRAINT "deposit_details_bank_config_id_fkey" FOREIGN KEY ("bank_config_id") REFERENCES "bank_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_details" ADD CONSTRAINT "deposit_details_crypto_config_id_fkey" FOREIGN KEY ("crypto_config_id") REFERENCES "crypto_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_details" ADD CONSTRAINT "deposit_details_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_details" ADD CONSTRAINT "deposit_details_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_translations" ADD CONSTRAINT "promotion_translations_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_currencies" ADD CONSTRAINT "promotion_currencies_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_promotions" ADD CONSTRAINT "user_promotions_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_promotions" ADD CONSTRAINT "user_promotions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tier_translation" ADD CONSTRAINT "tier_translation_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "tier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tier" ADD CONSTRAINT "user_tier_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tier" ADD CONSTRAINT "user_tier_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "tier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tier_history" ADD CONSTRAINT "tier_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tier_history" ADD CONSTRAINT "tier_history_from_tier_id_fkey" FOREIGN KEY ("from_tier_id") REFERENCES "tier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tier_history" ADD CONSTRAINT "tier_history_to_tier_id_fkey" FOREIGN KEY ("to_tier_id") REFERENCES "tier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_adjustment_details" ADD CONSTRAINT "admin_adjustment_details_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_adjustment_details" ADD CONSTRAINT "admin_adjustment_details_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_adjustment_details" ADD CONSTRAINT "system_adjustment_details_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wagering_requirements" ADD CONSTRAINT "wagering_requirements_deposit_detail_id_fkey" FOREIGN KEY ("deposit_detail_id") REFERENCES "deposit_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wagering_requirements" ADD CONSTRAINT "wagering_requirements_user_id_currency_fkey" FOREIGN KEY ("user_id", "currency") REFERENCES "user_wallets"("userId", "currency") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wagering_requirements" ADD CONSTRAINT "wagering_requirements_user_promotion_id_fkey" FOREIGN KEY ("user_promotion_id") REFERENCES "user_promotions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wagering_requirements" ADD CONSTRAINT "wagering_requirements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wagering_contribution_logs" ADD CONSTRAINT "wagering_contribution_logs_wagering_requirement_id_fkey" FOREIGN KEY ("wagering_requirement_id") REFERENCES "wagering_requirements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
