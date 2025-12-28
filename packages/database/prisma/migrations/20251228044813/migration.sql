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
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAW', 'GAME', 'BONUS', 'COMP_CLAIM');

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
CREATE TYPE "PaymentProvider" AS ENUM ('NOWPAYMENT', 'MANUAL');

-- CreateEnum
CREATE TYPE "DepositMethodType" AS ENUM ('CRYPTO_WALLET', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "DepositDetailStatus" AS ENUM ('PENDING', 'CONFIRMING', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FeePaidByType" AS ENUM ('USER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "WithdrawDetailStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PromotionTargetType" AS ENUM ('NEW_USER_FIRST_DEPOSIT');

-- CreateEnum
CREATE TYPE "PromotionBonusType" AS ENUM ('PERCENTAGE');

-- CreateEnum
CREATE TYPE "PromotionQualificationCondition" AS ENUM ('UNTIL_FIRST_WITHDRAWAL');

-- CreateEnum
CREATE TYPE "UserPromotionStatus" AS ENUM ('ACTIVE', 'QUALIFICATION_LOST', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "ExchangeRateProvider" AS ENUM ('NOWPAYMENT', 'COINGECKO', 'OPEN_EXCHANGE_RATES');

-- CreateEnum
CREATE TYPE "RollingSourceType" AS ENUM ('DEPOSIT', 'PROMOTION_BONUS');

-- CreateEnum
CREATE TYPE "RollingStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

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

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "numericId" SERIAL NOT NULL,
    "whitecliffId" BIGINT,
    "whitecliffSystemId" BIGINT,
    "whitecliffUsername" TEXT,
    "dcsId" TEXT,
    "email" TEXT,
    "passwordHash" TEXT,
    "socialType" "SocialType",
    "socialId" TEXT,
    "agentId" TEXT,
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
CREATE TABLE "UserSession" (
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "deviceInfo" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "isMobile" BOOLEAN,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "id" BIGSERIAL NOT NULL,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBalance" (
    "userId" TEXT NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "mainBalance" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "bonusBalance" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBalance_pkey" PRIMARY KEY ("userId","currency")
);

-- CreateTable
CREATE TABLE "UserBalanceStats" (
    "userId" TEXT NOT NULL,
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
CREATE TABLE "ActivityLog" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "activityType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "isMobile" BOOLEAN,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "aggregatorType" "GameAggregatorType" NOT NULL,
    "provider" "GameProvider" NOT NULL,
    "category" "GameCategory" NOT NULL,
    "gameId" INTEGER NOT NULL,
    "gameType" TEXT,
    "tableId" TEXT,
    "iconLink" TEXT,
    "isEnabled" BOOLEAN NOT NULL,
    "isVisibleToUser" BOOLEAN NOT NULL DEFAULT true,
    "houseEdge" DECIMAL(8,4) NOT NULL DEFAULT 0.04,
    "contributionRate" DECIMAL(8,4) NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameTranslation" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "language" "Language" NOT NULL,
    "providerName" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "gameName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhitecliffApiLog" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "httpMethod" TEXT,
    "request" JSONB NOT NULL,
    "response" JSONB NOT NULL,
    "statusCode" INTEGER,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhitecliffApiLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DcsApiLog" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "httpMethod" TEXT,
    "request" JSONB NOT NULL,
    "response" JSONB NOT NULL,
    "statusCode" INTEGER,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DcsApiLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "amount" DECIMAL(32,18) NOT NULL,
    "beforeAmount" DECIMAL(32,18) NOT NULL,
    "afterAmount" DECIMAL(32,18) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameRound" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "aggregatorType" "GameAggregatorType" NOT NULL,
    "provider" "GameProvider" NOT NULL,
    "aggregatorTxId" TEXT NOT NULL,
    "aggregatorGameId" INTEGER NOT NULL,
    "totalBetAmountInGameCurrency" DECIMAL(32,18),
    "totalWinAmountInGameCurrency" DECIMAL(32,18),
    "netAmountInGameCurrency" DECIMAL(32,18),
    "totalBetAmountInWalletCurrency" DECIMAL(32,18),
    "totalWinAmountInWalletCurrency" DECIMAL(32,18),
    "netAmountInWalletCurrency" DECIMAL(32,18),
    "transactionId" BIGINT NOT NULL,
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
    "gameId" INTEGER,
    "gameSessionId" BIGINT NOT NULL,

    CONSTRAINT "GameRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameBet" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
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
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
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
    "id" BIGSERIAL NOT NULL,
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
    "id" BIGSERIAL NOT NULL,
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
    "gameId" INTEGER,
    "transactionId" BIGINT NOT NULL,

    CONSTRAINT "BonusDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositDetail" (
    "id" BIGSERIAL NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "DepositDetailStatus" NOT NULL,
    "transactionId" BIGINT NOT NULL,
    "methodType" "DepositMethodType" NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "providerPaymentId" TEXT,
    "depositCurrency" "ExchangeCurrencyCode" NOT NULL,
    "depositNetwork" TEXT,
    "walletAddress" TEXT,
    "walletAddressExtraId" TEXT,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "accountHolder" TEXT,
    "depositorName" TEXT,
    "transactionHash" TEXT,
    "actuallyPaid" DECIMAL(32,18),
    "feeAmount" DECIMAL(32,18),
    "feeCurrency" TEXT,
    "feePaidBy" "FeePaidByType",
    "failureReason" TEXT,
    "providerMetadata" JSONB DEFAULT '{}',
    "bankAccountId" INTEGER,

    CONSTRAINT "DepositDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WithdrawDetail" (
    "id" BIGSERIAL NOT NULL,
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
CREATE TABLE "CompTransaction" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(32,18) NOT NULL,
    "dailyCompEarningId" INTEGER NOT NULL,
    "transactionId" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyCompEarning" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "earningDate" TIMESTAMP(3) NOT NULL,
    "totalContribution" DECIMAL(32,18) NOT NULL,
    "compEarned" DECIMAL(32,18) NOT NULL,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyCompEarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" SERIAL NOT NULL,
    "managementName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "targetType" "PromotionTargetType" NOT NULL,
    "bonusType" "PromotionBonusType" NOT NULL,
    "bonusRate" DECIMAL(8,4),
    "minDepositAmount" DECIMAL(32,18) NOT NULL,
    "maxBonusAmount" DECIMAL(32,18),
    "rollingMultiplier" DECIMAL(8,4),
    "qualificationMaintainCondition" "PromotionQualificationCondition" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionTranslation" (
    "id" SERIAL NOT NULL,
    "promotionId" INTEGER NOT NULL,
    "language" "Language" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPromotion" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "promotionId" INTEGER NOT NULL,
    "status" "UserPromotionStatus" NOT NULL DEFAULT 'ACTIVE',
    "bonusGranted" BOOLEAN NOT NULL DEFAULT false,
    "bonusGrantedAt" TIMESTAMP(3),
    "bonusAmount" DECIMAL(32,18),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPromotion_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "VipLevel" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "requiredRolling" DECIMAL(32,18) NOT NULL,
    "levelUpBonus" DECIMAL(32,18) NOT NULL,
    "compRate" DECIMAL(8,4) NOT NULL,
    "paybackBasisRate" DECIMAL(8,4) NOT NULL,
    "weeklyBonusRate" DECIMAL(8,4) NOT NULL,
    "monthlyBonusRate" DECIMAL(8,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VipLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VipMembership" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "vipLevelId" INTEGER NOT NULL,
    "accumulatedRolling" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "totalRewardsPaid" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "achievedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VipMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VipHistory" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "previousLevelNameKey" TEXT,
    "newLevelNameKey" TEXT NOT NULL,
    "rewardAmount" DECIMAL(32,18) NOT NULL,
    "rewardPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vipMembershipId" INTEGER,

    CONSTRAINT "VipHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rolling" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceType" "RollingSourceType" NOT NULL DEFAULT 'DEPOSIT',
    "userPromotionId" INTEGER,
    "requiredAmount" DECIMAL(32,18) NOT NULL,
    "currentAmount" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "cancellationBalanceThreshold" DECIMAL(32,18),
    "status" "RollingStatus" NOT NULL DEFAULT 'ACTIVE',
    "depositAmount" DECIMAL(32,18),
    "bonusAmount" DECIMAL(32,18),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "depositDetailId" BIGINT,

    CONSTRAINT "Rolling_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserToken" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
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
    "userId" TEXT,
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
CREATE TABLE "GameSession" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aggregatorType" "GameAggregatorType" NOT NULL,
    "token" TEXT NOT NULL,
    "walletCurrency" "ExchangeCurrencyCode" NOT NULL,
    "gameCurrency" "ExchangeCurrencyCode" NOT NULL,
    "exchangeRate" DECIMAL(32,18) NOT NULL,
    "exchangeRateSnapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gameId" INTEGER,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" SERIAL NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "notes" TEXT,
    "totalDeposits" INTEGER NOT NULL DEFAULT 0,
    "totalDepositAmount" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaQueryLog" (
    "id" BIGSERIAL NOT NULL,
    "query" TEXT NOT NULL,
    "params" JSONB,
    "duration" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrismaQueryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "campaignName" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "AffiliateCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "subUserId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "deviceFingerprint" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "codeId" TEXT NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateWallet" (
    "affiliateId" TEXT NOT NULL,
    "currency" "ExchangeCurrencyCode" NOT NULL,
    "availableBalance" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "pendingBalance" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "totalEarned" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateWallet_pkey" PRIMARY KEY ("affiliateId","currency")
);

-- CreateTable
CREATE TABLE "AffiliateCommission" (
    "affiliateId" TEXT NOT NULL,
    "subUserId" TEXT NOT NULL,
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
    "affiliateId" TEXT NOT NULL,
    "tier" "AffiliateTierLevel" NOT NULL DEFAULT 'BRONZE',
    "baseRate" DECIMAL(8,4) NOT NULL,
    "customRate" DECIMAL(8,4),
    "isCustomRate" BOOLEAN NOT NULL DEFAULT false,
    "monthlyWagerAmount" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "customRateSetBy" TEXT,
    "customRateSetAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "uid" TEXT NOT NULL,
    "id" BIGSERIAL NOT NULL,

    CONSTRAINT "AffiliateTier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_numericId_key" ON "User"("numericId");

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
CREATE UNIQUE INDEX "UserSession_sessionId_key" ON "UserSession"("sessionId");

-- CreateIndex
CREATE INDEX "UserSession_userId_isActive_idx" ON "UserSession"("userId", "isActive");

-- CreateIndex
CREATE INDEX "UserSession_sessionId_idx" ON "UserSession"("sessionId");

-- CreateIndex
CREATE INDEX "UserSession_userId_createdAt_idx" ON "UserSession"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");

-- CreateIndex
CREATE INDEX "UserSession_isActive_expiresAt_idx" ON "UserSession"("isActive", "expiresAt");

-- CreateIndex
CREATE INDEX "UserBalance_userId_idx" ON "UserBalance"("userId");

-- CreateIndex
CREATE INDEX "UserBalance_currency_idx" ON "UserBalance"("currency");

-- CreateIndex
CREATE INDEX "UserBalanceStats_userId_idx" ON "UserBalanceStats"("userId");

-- CreateIndex
CREATE INDEX "UserBalanceStats_currency_idx" ON "UserBalanceStats"("currency");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_timestamp_idx" ON "ActivityLog"("timestamp");

-- CreateIndex
CREATE INDEX "ActivityLog_isAdmin_timestamp_idx" ON "ActivityLog"("isAdmin", "timestamp");

-- CreateIndex
CREATE INDEX "Game_isEnabled_idx" ON "Game"("isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "Game_aggregatorType_provider_gameId_key" ON "Game"("aggregatorType", "provider", "gameId");

-- CreateIndex
CREATE INDEX "GameTranslation_language_idx" ON "GameTranslation"("language");

-- CreateIndex
CREATE UNIQUE INDEX "GameTranslation_gameId_language_key" ON "GameTranslation"("gameId", "language");

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
CREATE UNIQUE INDEX "DepositDetail_transactionId_key" ON "DepositDetail"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "DepositDetail_providerPaymentId_key" ON "DepositDetail"("providerPaymentId");

-- CreateIndex
CREATE INDEX "DepositDetail_provider_providerPaymentId_idx" ON "DepositDetail"("provider", "providerPaymentId");

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
CREATE UNIQUE INDEX "CompTransaction_transactionId_key" ON "CompTransaction"("transactionId");

-- CreateIndex
CREATE INDEX "CompTransaction_userId_idx" ON "CompTransaction"("userId");

-- CreateIndex
CREATE INDEX "CompTransaction_createdAt_idx" ON "CompTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "DailyCompEarning_earningDate_idx" ON "DailyCompEarning"("earningDate");

-- CreateIndex
CREATE INDEX "DailyCompEarning_isProcessed_idx" ON "DailyCompEarning"("isProcessed");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCompEarning_userId_earningDate_key" ON "DailyCompEarning"("userId", "earningDate");

-- CreateIndex
CREATE INDEX "PromotionTranslation_language_idx" ON "PromotionTranslation"("language");

-- CreateIndex
CREATE INDEX "PromotionTranslation_promotionId_idx" ON "PromotionTranslation"("promotionId");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionTranslation_promotionId_language_key" ON "PromotionTranslation"("promotionId", "language");

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
CREATE UNIQUE INDEX "VipLevel_name_key" ON "VipLevel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VipLevel_nameKey_key" ON "VipLevel"("nameKey");

-- CreateIndex
CREATE UNIQUE INDEX "VipLevel_rank_key" ON "VipLevel"("rank");

-- CreateIndex
CREATE UNIQUE INDEX "VipMembership_userId_key" ON "VipMembership"("userId");

-- CreateIndex
CREATE INDEX "VipHistory_userId_createdAt_idx" ON "VipHistory"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Rolling_userId_status_createdAt_idx" ON "Rolling"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Rolling_sourceType_idx" ON "Rolling"("sourceType");

-- CreateIndex
CREATE INDEX "Rolling_userPromotionId_idx" ON "Rolling"("userPromotionId");

-- CreateIndex
CREATE INDEX "Rolling_status_idx" ON "Rolling"("status");

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
CREATE UNIQUE INDEX "GameSession_token_key" ON "GameSession"("token");

-- CreateIndex
CREATE INDEX "BankAccount_currency_isActive_priority_idx" ON "BankAccount"("currency", "isActive", "priority");

-- CreateIndex
CREATE INDEX "BankAccount_isActive_idx" ON "BankAccount"("isActive");

-- CreateIndex
CREATE INDEX "BankAccount_currency_idx" ON "BankAccount"("currency");

-- CreateIndex
CREATE INDEX "BankAccount_priority_idx" ON "BankAccount"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateCode_code_key" ON "AffiliateCode"("code");

-- CreateIndex
CREATE INDEX "AffiliateCode_userId_idx" ON "AffiliateCode"("userId");

-- CreateIndex
CREATE INDEX "AffiliateCode_userId_isActive_idx" ON "AffiliateCode"("userId", "isActive");

-- CreateIndex
CREATE INDEX "AffiliateCode_code_idx" ON "AffiliateCode"("code");

-- CreateIndex
CREATE INDEX "Referral_affiliateId_idx" ON "Referral"("affiliateId");

-- CreateIndex
CREATE INDEX "Referral_codeId_idx" ON "Referral"("codeId");

-- CreateIndex
CREATE INDEX "Referral_subUserId_idx" ON "Referral"("subUserId");

-- CreateIndex
CREATE INDEX "Referral_affiliateId_codeId_idx" ON "Referral"("affiliateId", "codeId");

-- CreateIndex
CREATE INDEX "Referral_ipAddress_deviceFingerprint_idx" ON "Referral"("ipAddress", "deviceFingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_affiliateId_subUserId_key" ON "Referral"("affiliateId", "subUserId");

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

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBalance" ADD CONSTRAINT "UserBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBalanceStats" ADD CONSTRAINT "UserBalanceStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameTranslation" ADD CONSTRAINT "GameTranslation_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRound" ADD CONSTRAINT "GameRound_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRound" ADD CONSTRAINT "GameRound_gameSessionId_fkey" FOREIGN KEY ("gameSessionId") REFERENCES "GameSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRound" ADD CONSTRAINT "GameRound_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameBet" ADD CONSTRAINT "GameBet_gameRoundId_fkey" FOREIGN KEY ("gameRoundId") REFERENCES "GameRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameWin" ADD CONSTRAINT "GameWin_gameRoundId_fkey" FOREIGN KEY ("gameRoundId") REFERENCES "GameRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionBalanceDetail" ADD CONSTRAINT "TransactionBalanceDetail_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonusDetail" ADD CONSTRAINT "BonusDetail_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BonusDetail" ADD CONSTRAINT "BonusDetail_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositDetail" ADD CONSTRAINT "DepositDetail_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositDetail" ADD CONSTRAINT "DepositDetail_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawDetail" ADD CONSTRAINT "WithdrawDetail_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompTransaction" ADD CONSTRAINT "CompTransaction_dailyCompEarningId_fkey" FOREIGN KEY ("dailyCompEarningId") REFERENCES "DailyCompEarning"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompTransaction" ADD CONSTRAINT "CompTransaction_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompTransaction" ADD CONSTRAINT "CompTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCompEarning" ADD CONSTRAINT "DailyCompEarning_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionTranslation" ADD CONSTRAINT "PromotionTranslation_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPromotion" ADD CONSTRAINT "UserPromotion_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPromotion" ADD CONSTRAINT "UserPromotion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VipMembership" ADD CONSTRAINT "VipMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VipMembership" ADD CONSTRAINT "VipMembership_vipLevelId_fkey" FOREIGN KEY ("vipLevelId") REFERENCES "VipLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VipHistory" ADD CONSTRAINT "VipHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VipHistory" ADD CONSTRAINT "VipHistory_vipMembershipId_fkey" FOREIGN KEY ("vipMembershipId") REFERENCES "VipMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rolling" ADD CONSTRAINT "Rolling_depositDetailId_fkey" FOREIGN KEY ("depositDetailId") REFERENCES "DepositDetail"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rolling" ADD CONSTRAINT "Rolling_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rolling" ADD CONSTRAINT "Rolling_userPromotionId_fkey" FOREIGN KEY ("userPromotionId") REFERENCES "UserPromotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserToken" ADD CONSTRAINT "UserToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateCode" ADD CONSTRAINT "AffiliateCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "AffiliateCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_subUserId_fkey" FOREIGN KEY ("subUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
