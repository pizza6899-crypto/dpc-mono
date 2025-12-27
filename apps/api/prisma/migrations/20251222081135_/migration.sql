-- CreateEnum
CREATE TYPE "public"."SocialType" AS ENUM ('GOOGLE', 'APPLE', 'TELEGRAM');

-- CreateEnum
CREATE TYPE "public"."UserRoleType" AS ENUM ('USER', 'AGENT', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."ExchangeCurrencyCode" AS ENUM ('USDT', 'USD', 'KRW', 'JPY', 'PHP', 'IDR', 'VND', 'BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'LTC', 'BCH', 'EOS', 'TRX');

-- CreateEnum
CREATE TYPE "public"."Language" AS ENUM ('EN', 'KO', 'JA');

-- CreateEnum
CREATE TYPE "public"."KycLevel" AS ENUM ('NONE', 'BASIC', 'FULL');

-- CreateEnum
CREATE TYPE "public"."ReferralBonusSourceType" AS ENUM ('GAME_BET', 'VIP_LEVEL_UP');

-- CreateEnum
CREATE TYPE "public"."ReferralBonusStatus" AS ENUM ('PENDING', 'CLAIMED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."GameAggregatorType" AS ENUM ('WHITECLIFF', 'DCS');

-- CreateEnum
CREATE TYPE "public"."GameCategory" AS ENUM ('LIVE_CASINO', 'SLOTS');

-- CreateEnum
CREATE TYPE "public"."GameProvider" AS ENUM ('EVOLUTION', 'PRAGMATIC_PLAY_LIVE', 'PG_SOFT', 'PRAGMATIC_PLAY_SLOTS', 'RELAX_GAMING', 'PLAYNGO');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAW', 'GAME', 'BONUS', 'SETTLEMENT', 'COMP_CLAIM');

-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."GameReplayType" AS ENUM ('TEXT', 'URL', 'HTML');

-- CreateEnum
CREATE TYPE "public"."BetType" AS ENUM ('NORMAL', 'TIP');

-- CreateEnum
CREATE TYPE "public"."WinType" AS ENUM ('NORMAL', 'JACKPOT');

-- CreateEnum
CREATE TYPE "public"."BonusType" AS ENUM ('PROMOTION', 'JACKPOT', 'IN_GAME_BONUS');

-- CreateEnum
CREATE TYPE "public"."PaymentProvider" AS ENUM ('NOWPAYMENT', 'MANUAL');

-- CreateEnum
CREATE TYPE "public"."DepositMethodType" AS ENUM ('CRYPTO_WALLET', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "public"."DepositDetailStatus" AS ENUM ('PENDING', 'CONFIRMING', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."FeePaidByType" AS ENUM ('USER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."WithdrawDetailStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."PromotionTargetType" AS ENUM ('NEW_USER_FIRST_DEPOSIT');

-- CreateEnum
CREATE TYPE "public"."PromotionBonusType" AS ENUM ('PERCENTAGE');

-- CreateEnum
CREATE TYPE "public"."PromotionQualificationCondition" AS ENUM ('UNTIL_FIRST_WITHDRAWAL');

-- CreateEnum
CREATE TYPE "public"."UserPromotionStatus" AS ENUM ('ACTIVE', 'QUALIFICATION_LOST', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."ExchangeRateProvider" AS ENUM ('NOWPAYMENT', 'COINGECKO', 'OPEN_EXCHANGE_RATES');

-- CreateEnum
CREATE TYPE "public"."CommissionSourceType" AS ENUM ('GAME', 'VIP_LEVEL_BONUS');

-- CreateEnum
CREATE TYPE "public"."RollingSourceType" AS ENUM ('DEPOSIT', 'PROMOTION_BONUS');

-- CreateEnum
CREATE TYPE "public"."RollingStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."TokenType" AS ENUM ('PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "public"."EmailType" AS ENUM ('PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "public"."EmailStatus" AS ENUM ('SENT', 'FAILED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "numericId" SERIAL NOT NULL,
    "whitecliffId" BIGINT,
    "whitecliffSystemId" BIGINT,
    "whitecliffUsername" TEXT,
    "dcsId" TEXT,
    "email" TEXT,
    "passwordHash" TEXT,
    "socialType" "public"."SocialType",
    "socialId" TEXT,
    "agentId" TEXT,
    "signupCodeId" INTEGER,
    "role" "public"."UserRoleType" NOT NULL DEFAULT 'USER',
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "kycLevel" "public"."KycLevel" NOT NULL DEFAULT 'NONE',
    "country" TEXT,
    "language" "public"."Language",
    "timezone" TEXT,
    "timezoneOffset" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserSession" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserBalance" (
    "userId" TEXT NOT NULL,
    "currency" "public"."ExchangeCurrencyCode" NOT NULL,
    "mainBalance" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "bonusBalance" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "balanceLocked" DECIMAL(32,18) NOT NULL DEFAULT 0,
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

    CONSTRAINT "UserBalance_pkey" PRIMARY KEY ("userId","currency")
);

-- CreateTable
CREATE TABLE "public"."ReferralCode" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ReferralCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReferralBonus" (
    "id" BIGSERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "recipientId" TEXT NOT NULL,
    "sourceUserId" TEXT NOT NULL,
    "sourceType" "public"."ReferralBonusSourceType" NOT NULL,
    "gameRoundId" BIGINT,
    "vipHistoryId" INTEGER,
    "currency" "public"."ExchangeCurrencyCode" NOT NULL,
    "bonusAmount" DECIMAL(32,18) NOT NULL,
    "baseAmount" DECIMAL(32,18) NOT NULL,
    "bonusRate" DECIMAL(8,4) NOT NULL,
    "status" "public"."ReferralBonusStatus" NOT NULL DEFAULT 'PENDING',
    "claimedAt" TIMESTAMP(3),
    "transactionId" BIGINT,
    "minClaimAmount" DECIMAL(32,18),
    "claimableAt" TIMESTAMP(3),

    CONSTRAINT "ReferralBonus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ActivityLog" (
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
CREATE TABLE "public"."Game" (
    "id" SERIAL NOT NULL,
    "aggregatorType" "public"."GameAggregatorType" NOT NULL,
    "provider" "public"."GameProvider" NOT NULL,
    "category" "public"."GameCategory" NOT NULL,
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
CREATE TABLE "public"."GameTranslation" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "language" "public"."Language" NOT NULL,
    "providerName" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "gameName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WhitecliffApiLog" (
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
CREATE TABLE "public"."DcsApiLog" (
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
CREATE TABLE "public"."Transaction" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."TransactionType" NOT NULL,
    "status" "public"."TransactionStatus" NOT NULL,
    "currency" "public"."ExchangeCurrencyCode" NOT NULL,
    "amount" DECIMAL(32,18) NOT NULL,
    "beforeAmount" DECIMAL(32,18) NOT NULL,
    "afterAmount" DECIMAL(32,18) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GameRound" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "aggregatorType" "public"."GameAggregatorType" NOT NULL,
    "provider" "public"."GameProvider" NOT NULL,
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
    "replayType" "public"."GameReplayType",
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
CREATE TABLE "public"."GameBet" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "gameRoundId" BIGINT NOT NULL,
    "aggregatorType" "public"."GameAggregatorType" NOT NULL,
    "aggregatorBetId" TEXT NOT NULL,
    "betType" "public"."BetType" NOT NULL,
    "betAmount" DECIMAL(32,18) NOT NULL,
    "bettedAt" TIMESTAMP(3) NOT NULL,
    "betAmountInGameCurrency" DECIMAL(32,18) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "GameBet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GameWin" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "gameRoundId" BIGINT NOT NULL,
    "aggregatorType" "public"."GameAggregatorType" NOT NULL,
    "aggregatorWinId" TEXT NOT NULL,
    "winType" "public"."WinType" NOT NULL,
    "winAmount" DECIMAL(32,18) NOT NULL,
    "wonAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "winAmountInGameCurrency" DECIMAL(32,18) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameWin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TransactionBalanceDetail" (
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
CREATE TABLE "public"."BonusDetail" (
    "id" BIGSERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactionTime" TIMESTAMP(3) NOT NULL,
    "aggregatorType" "public"."GameAggregatorType" NOT NULL,
    "provider" "public"."GameProvider" NOT NULL,
    "bonusType" "public"."BonusType" NOT NULL,
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
CREATE TABLE "public"."DepositDetail" (
    "id" BIGSERIAL NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "public"."DepositDetailStatus" NOT NULL,
    "transactionId" BIGINT NOT NULL,
    "methodType" "public"."DepositMethodType" NOT NULL,
    "provider" "public"."PaymentProvider" NOT NULL,
    "providerPaymentId" TEXT,
    "depositCurrency" "public"."ExchangeCurrencyCode" NOT NULL,
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
    "feePaidBy" "public"."FeePaidByType",
    "failureReason" TEXT,
    "providerMetadata" JSONB DEFAULT '{}',
    "bankAccountId" INTEGER,

    CONSTRAINT "DepositDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WithdrawDetail" (
    "id" BIGSERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "public"."WithdrawDetailStatus" NOT NULL,
    "transactionId" BIGINT NOT NULL,
    "withdrawCurrency" "public"."ExchangeCurrencyCode" NOT NULL,
    "withdrawNetwork" TEXT NOT NULL,
    "withdrawAmount" DECIMAL(32,18) NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "walletAddressExtraId" TEXT,
    "provider" "public"."PaymentProvider" NOT NULL,
    "providerWithdrawalId" TEXT,
    "transactionHash" TEXT,
    "errorMessage" TEXT,
    "feeAmount" DECIMAL(32,18),
    "feeCurrency" TEXT,
    "feePaidBy" "public"."FeePaidByType",
    "providerMetadata" JSONB DEFAULT '{}',

    CONSTRAINT "WithdrawDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SettlementDetail" (
    "id" BIGSERIAL NOT NULL,
    "transactionId" BIGINT NOT NULL,

    CONSTRAINT "SettlementDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CompTransaction" (
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
CREATE TABLE "public"."DailyCompEarning" (
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
CREATE TABLE "public"."Promotion" (
    "id" SERIAL NOT NULL,
    "managementName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "targetType" "public"."PromotionTargetType" NOT NULL,
    "bonusType" "public"."PromotionBonusType" NOT NULL,
    "bonusRate" DECIMAL(8,4),
    "minDepositAmount" DECIMAL(32,18) NOT NULL,
    "maxBonusAmount" DECIMAL(32,18),
    "rollingMultiplier" DECIMAL(8,4),
    "qualificationMaintainCondition" "public"."PromotionQualificationCondition" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PromotionTranslation" (
    "id" SERIAL NOT NULL,
    "promotionId" INTEGER NOT NULL,
    "language" "public"."Language" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserPromotion" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "promotionId" INTEGER NOT NULL,
    "status" "public"."UserPromotionStatus" NOT NULL DEFAULT 'ACTIVE',
    "bonusGranted" BOOLEAN NOT NULL DEFAULT false,
    "bonusGrantedAt" TIMESTAMP(3),
    "bonusAmount" DECIMAL(32,18),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPromotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NowPaymentCallbackLog" (
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
CREATE TABLE "public"."ExchangeRate" (
    "id" SERIAL NOT NULL,
    "baseCurrency" "public"."ExchangeCurrencyCode" NOT NULL,
    "quoteCurrency" "public"."ExchangeCurrencyCode" NOT NULL,
    "rate" DECIMAL(32,18) NOT NULL,
    "provider" "public"."ExchangeRateProvider" NOT NULL,
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
CREATE TABLE "public"."VipLevel" (
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
CREATE TABLE "public"."VipMembership" (
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
CREATE TABLE "public"."VipHistory" (
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
CREATE TABLE "public"."AgentCommissionLog" (
    "id" BIGSERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agentId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "sourceType" "public"."CommissionSourceType" NOT NULL,
    "gameRoundId" BIGINT,
    "vipHistoryId" INTEGER,
    "currency" "public"."ExchangeCurrencyCode" NOT NULL,
    "betAmount" DECIMAL(32,18),
    "calculationBasis" DECIMAL(32,18) NOT NULL,
    "agentMarginRate" DECIMAL(8,4) NOT NULL,
    "memberMarginRate" DECIMAL(8,4) NOT NULL,
    "commissionRate" DECIMAL(8,4) NOT NULL,
    "commissionAmount" DECIMAL(32,18) NOT NULL,
    "isSettled" BOOLEAN NOT NULL DEFAULT false,
    "settledAt" TIMESTAMP(3),
    "settlementDetailId" BIGINT,

    CONSTRAINT "AgentCommissionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Rolling" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceType" "public"."RollingSourceType" NOT NULL DEFAULT 'DEPOSIT',
    "userPromotionId" INTEGER,
    "requiredAmount" DECIMAL(32,18) NOT NULL,
    "currentAmount" DECIMAL(32,18) NOT NULL DEFAULT 0,
    "cancellationBalanceThreshold" DECIMAL(32,18),
    "status" "public"."RollingStatus" NOT NULL DEFAULT 'ACTIVE',
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
CREATE TABLE "public"."UserToken" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."TokenType" NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailLog" (
    "id" SERIAL NOT NULL,
    "userId" TEXT,
    "type" "public"."EmailType" NOT NULL,
    "status" "public"."EmailStatus" NOT NULL,
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
CREATE TABLE "public"."GameSession" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aggregatorType" "public"."GameAggregatorType" NOT NULL,
    "token" TEXT NOT NULL,
    "walletCurrency" "public"."ExchangeCurrencyCode" NOT NULL,
    "gameCurrency" "public"."ExchangeCurrencyCode" NOT NULL,
    "exchangeRate" DECIMAL(32,18) NOT NULL,
    "exchangeRateSnapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gameId" INTEGER,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BankAccount" (
    "id" SERIAL NOT NULL,
    "currency" "public"."ExchangeCurrencyCode" NOT NULL,
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
CREATE TABLE "public"."PrismaQueryLog" (
    "id" BIGSERIAL NOT NULL,
    "query" TEXT NOT NULL,
    "params" JSONB,
    "duration" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrismaQueryLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_numericId_key" ON "public"."User"("numericId");

-- CreateIndex
CREATE UNIQUE INDEX "User_whitecliffId_key" ON "public"."User"("whitecliffId");

-- CreateIndex
CREATE UNIQUE INDEX "User_whitecliffSystemId_key" ON "public"."User"("whitecliffSystemId");

-- CreateIndex
CREATE UNIQUE INDEX "User_whitecliffUsername_key" ON "public"."User"("whitecliffUsername");

-- CreateIndex
CREATE UNIQUE INDEX "User_dcsId_key" ON "public"."User"("dcsId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_sessionId_key" ON "public"."UserSession"("sessionId");

-- CreateIndex
CREATE INDEX "UserSession_userId_isActive_idx" ON "public"."UserSession"("userId", "isActive");

-- CreateIndex
CREATE INDEX "UserSession_sessionId_idx" ON "public"."UserSession"("sessionId");

-- CreateIndex
CREATE INDEX "UserSession_userId_createdAt_idx" ON "public"."UserSession"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserSession_expiresAt_idx" ON "public"."UserSession"("expiresAt");

-- CreateIndex
CREATE INDEX "UserSession_isActive_expiresAt_idx" ON "public"."UserSession"("isActive", "expiresAt");

-- CreateIndex
CREATE INDEX "UserBalance_userId_idx" ON "public"."UserBalance"("userId");

-- CreateIndex
CREATE INDEX "UserBalance_currency_idx" ON "public"."UserBalance"("currency");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_code_key" ON "public"."ReferralCode"("code");

-- CreateIndex
CREATE INDEX "ReferralCode_code_idx" ON "public"."ReferralCode"("code");

-- CreateIndex
CREATE INDEX "ReferralCode_ownerId_idx" ON "public"."ReferralCode"("ownerId");

-- CreateIndex
CREATE INDEX "ReferralCode_isActive_idx" ON "public"."ReferralCode"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralBonus_gameRoundId_key" ON "public"."ReferralBonus"("gameRoundId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralBonus_vipHistoryId_key" ON "public"."ReferralBonus"("vipHistoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralBonus_transactionId_key" ON "public"."ReferralBonus"("transactionId");

-- CreateIndex
CREATE INDEX "ReferralBonus_recipientId_status_createdAt_idx" ON "public"."ReferralBonus"("recipientId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ReferralBonus_sourceUserId_createdAt_idx" ON "public"."ReferralBonus"("sourceUserId", "createdAt");

-- CreateIndex
CREATE INDEX "ReferralBonus_sourceType_createdAt_idx" ON "public"."ReferralBonus"("sourceType", "createdAt");

-- CreateIndex
CREATE INDEX "ReferralBonus_status_idx" ON "public"."ReferralBonus"("status");

-- CreateIndex
CREATE INDEX "ReferralBonus_gameRoundId_idx" ON "public"."ReferralBonus"("gameRoundId");

-- CreateIndex
CREATE INDEX "ReferralBonus_vipHistoryId_idx" ON "public"."ReferralBonus"("vipHistoryId");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "public"."ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_timestamp_idx" ON "public"."ActivityLog"("timestamp");

-- CreateIndex
CREATE INDEX "ActivityLog_isAdmin_timestamp_idx" ON "public"."ActivityLog"("isAdmin", "timestamp");

-- CreateIndex
CREATE INDEX "Game_isEnabled_idx" ON "public"."Game"("isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "Game_aggregatorType_provider_gameId_key" ON "public"."Game"("aggregatorType", "provider", "gameId");

-- CreateIndex
CREATE INDEX "GameTranslation_language_idx" ON "public"."GameTranslation"("language");

-- CreateIndex
CREATE UNIQUE INDEX "GameTranslation_gameId_language_key" ON "public"."GameTranslation"("gameId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "GameRound_transactionId_key" ON "public"."GameRound"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "GameRound_aggregatorTxId_aggregatorType_key" ON "public"."GameRound"("aggregatorTxId", "aggregatorType");

-- CreateIndex
CREATE INDEX "GameBet_gameRoundId_idx" ON "public"."GameBet"("gameRoundId");

-- CreateIndex
CREATE UNIQUE INDEX "GameBet_aggregatorBetId_aggregatorType_key" ON "public"."GameBet"("aggregatorBetId", "aggregatorType");

-- CreateIndex
CREATE INDEX "GameWin_gameRoundId_idx" ON "public"."GameWin"("gameRoundId");

-- CreateIndex
CREATE UNIQUE INDEX "GameWin_aggregatorWinId_aggregatorType_key" ON "public"."GameWin"("aggregatorWinId", "aggregatorType");

-- CreateIndex
CREATE INDEX "TransactionBalanceDetail_transactionId_idx" ON "public"."TransactionBalanceDetail"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "BonusDetail_transactionId_key" ON "public"."BonusDetail"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "DepositDetail_transactionId_key" ON "public"."DepositDetail"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "DepositDetail_providerPaymentId_key" ON "public"."DepositDetail"("providerPaymentId");

-- CreateIndex
CREATE INDEX "DepositDetail_provider_providerPaymentId_idx" ON "public"."DepositDetail"("provider", "providerPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "WithdrawDetail_transactionId_key" ON "public"."WithdrawDetail"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "WithdrawDetail_providerWithdrawalId_key" ON "public"."WithdrawDetail"("providerWithdrawalId");

-- CreateIndex
CREATE INDEX "WithdrawDetail_provider_providerWithdrawalId_idx" ON "public"."WithdrawDetail"("provider", "providerWithdrawalId");

-- CreateIndex
CREATE INDEX "WithdrawDetail_provider_status_idx" ON "public"."WithdrawDetail"("provider", "status");

-- CreateIndex
CREATE INDEX "WithdrawDetail_transactionHash_idx" ON "public"."WithdrawDetail"("transactionHash");

-- CreateIndex
CREATE INDEX "WithdrawDetail_status_createdAt_idx" ON "public"."WithdrawDetail"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SettlementDetail_transactionId_key" ON "public"."SettlementDetail"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "CompTransaction_transactionId_key" ON "public"."CompTransaction"("transactionId");

-- CreateIndex
CREATE INDEX "CompTransaction_userId_idx" ON "public"."CompTransaction"("userId");

-- CreateIndex
CREATE INDEX "CompTransaction_createdAt_idx" ON "public"."CompTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "DailyCompEarning_earningDate_idx" ON "public"."DailyCompEarning"("earningDate");

-- CreateIndex
CREATE INDEX "DailyCompEarning_isProcessed_idx" ON "public"."DailyCompEarning"("isProcessed");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCompEarning_userId_earningDate_key" ON "public"."DailyCompEarning"("userId", "earningDate");

-- CreateIndex
CREATE INDEX "PromotionTranslation_language_idx" ON "public"."PromotionTranslation"("language");

-- CreateIndex
CREATE INDEX "PromotionTranslation_promotionId_idx" ON "public"."PromotionTranslation"("promotionId");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionTranslation_promotionId_language_key" ON "public"."PromotionTranslation"("promotionId", "language");

-- CreateIndex
CREATE INDEX "ExchangeRate_baseCurrency_quoteCurrency_idx" ON "public"."ExchangeRate"("baseCurrency", "quoteCurrency");

-- CreateIndex
CREATE INDEX "ExchangeRate_baseCurrency_quoteCurrency_provider_idx" ON "public"."ExchangeRate"("baseCurrency", "quoteCurrency", "provider");

-- CreateIndex
CREATE INDEX "ExchangeRate_collectedAt_idx" ON "public"."ExchangeRate"("collectedAt");

-- CreateIndex
CREATE INDEX "ExchangeRate_isActive_collectedAt_idx" ON "public"."ExchangeRate"("isActive", "collectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_baseCurrency_quoteCurrency_provider_key" ON "public"."ExchangeRate"("baseCurrency", "quoteCurrency", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "VipLevel_name_key" ON "public"."VipLevel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VipLevel_nameKey_key" ON "public"."VipLevel"("nameKey");

-- CreateIndex
CREATE UNIQUE INDEX "VipLevel_rank_key" ON "public"."VipLevel"("rank");

-- CreateIndex
CREATE UNIQUE INDEX "VipMembership_userId_key" ON "public"."VipMembership"("userId");

-- CreateIndex
CREATE INDEX "VipHistory_userId_createdAt_idx" ON "public"."VipHistory"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AgentCommissionLog_gameRoundId_key" ON "public"."AgentCommissionLog"("gameRoundId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentCommissionLog_vipHistoryId_key" ON "public"."AgentCommissionLog"("vipHistoryId");

-- CreateIndex
CREATE INDEX "AgentCommissionLog_sourceType_createdAt_idx" ON "public"."AgentCommissionLog"("sourceType", "createdAt");

-- CreateIndex
CREATE INDEX "Rolling_userId_status_createdAt_idx" ON "public"."Rolling"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Rolling_sourceType_idx" ON "public"."Rolling"("sourceType");

-- CreateIndex
CREATE INDEX "Rolling_userPromotionId_idx" ON "public"."Rolling"("userPromotionId");

-- CreateIndex
CREATE INDEX "Rolling_status_idx" ON "public"."Rolling"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UserToken_token_key" ON "public"."UserToken"("token");

-- CreateIndex
CREATE INDEX "UserToken_userId_type_idx" ON "public"."UserToken"("userId", "type");

-- CreateIndex
CREATE INDEX "UserToken_type_expiresAt_idx" ON "public"."UserToken"("type", "expiresAt");

-- CreateIndex
CREATE INDEX "UserToken_userId_type_usedAt_idx" ON "public"."UserToken"("userId", "type", "usedAt");

-- CreateIndex
CREATE INDEX "UserToken_expiresAt_idx" ON "public"."UserToken"("expiresAt");

-- CreateIndex
CREATE INDEX "EmailLog_userId_type_createdAt_idx" ON "public"."EmailLog"("userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_to_type_createdAt_idx" ON "public"."EmailLog"("to", "type", "createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_status_createdAt_idx" ON "public"."EmailLog"("status", "createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_type_status_idx" ON "public"."EmailLog"("type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "GameSession_token_key" ON "public"."GameSession"("token");

-- CreateIndex
CREATE INDEX "BankAccount_currency_isActive_priority_idx" ON "public"."BankAccount"("currency", "isActive", "priority");

-- CreateIndex
CREATE INDEX "BankAccount_isActive_idx" ON "public"."BankAccount"("isActive");

-- CreateIndex
CREATE INDEX "BankAccount_currency_idx" ON "public"."BankAccount"("currency");

-- CreateIndex
CREATE INDEX "BankAccount_priority_idx" ON "public"."BankAccount"("priority");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_signupCodeId_fkey" FOREIGN KEY ("signupCodeId") REFERENCES "public"."ReferralCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserBalance" ADD CONSTRAINT "UserBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReferralCode" ADD CONSTRAINT "ReferralCode_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReferralBonus" ADD CONSTRAINT "ReferralBonus_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReferralBonus" ADD CONSTRAINT "ReferralBonus_sourceUserId_fkey" FOREIGN KEY ("sourceUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReferralBonus" ADD CONSTRAINT "ReferralBonus_gameRoundId_fkey" FOREIGN KEY ("gameRoundId") REFERENCES "public"."GameRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReferralBonus" ADD CONSTRAINT "ReferralBonus_vipHistoryId_fkey" FOREIGN KEY ("vipHistoryId") REFERENCES "public"."VipHistory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReferralBonus" ADD CONSTRAINT "ReferralBonus_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameTranslation" ADD CONSTRAINT "GameTranslation_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameRound" ADD CONSTRAINT "GameRound_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameRound" ADD CONSTRAINT "GameRound_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameRound" ADD CONSTRAINT "GameRound_gameSessionId_fkey" FOREIGN KEY ("gameSessionId") REFERENCES "public"."GameSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameBet" ADD CONSTRAINT "GameBet_gameRoundId_fkey" FOREIGN KEY ("gameRoundId") REFERENCES "public"."GameRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameWin" ADD CONSTRAINT "GameWin_gameRoundId_fkey" FOREIGN KEY ("gameRoundId") REFERENCES "public"."GameRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TransactionBalanceDetail" ADD CONSTRAINT "TransactionBalanceDetail_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BonusDetail" ADD CONSTRAINT "BonusDetail_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BonusDetail" ADD CONSTRAINT "BonusDetail_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DepositDetail" ADD CONSTRAINT "DepositDetail_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DepositDetail" ADD CONSTRAINT "DepositDetail_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "public"."BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WithdrawDetail" ADD CONSTRAINT "WithdrawDetail_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SettlementDetail" ADD CONSTRAINT "SettlementDetail_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CompTransaction" ADD CONSTRAINT "CompTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CompTransaction" ADD CONSTRAINT "CompTransaction_dailyCompEarningId_fkey" FOREIGN KEY ("dailyCompEarningId") REFERENCES "public"."DailyCompEarning"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CompTransaction" ADD CONSTRAINT "CompTransaction_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyCompEarning" ADD CONSTRAINT "DailyCompEarning_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PromotionTranslation" ADD CONSTRAINT "PromotionTranslation_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "public"."Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserPromotion" ADD CONSTRAINT "UserPromotion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserPromotion" ADD CONSTRAINT "UserPromotion_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "public"."Promotion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VipMembership" ADD CONSTRAINT "VipMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VipMembership" ADD CONSTRAINT "VipMembership_vipLevelId_fkey" FOREIGN KEY ("vipLevelId") REFERENCES "public"."VipLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VipHistory" ADD CONSTRAINT "VipHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VipHistory" ADD CONSTRAINT "VipHistory_vipMembershipId_fkey" FOREIGN KEY ("vipMembershipId") REFERENCES "public"."VipMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgentCommissionLog" ADD CONSTRAINT "AgentCommissionLog_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgentCommissionLog" ADD CONSTRAINT "AgentCommissionLog_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgentCommissionLog" ADD CONSTRAINT "AgentCommissionLog_gameRoundId_fkey" FOREIGN KEY ("gameRoundId") REFERENCES "public"."GameRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgentCommissionLog" ADD CONSTRAINT "AgentCommissionLog_vipHistoryId_fkey" FOREIGN KEY ("vipHistoryId") REFERENCES "public"."VipHistory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgentCommissionLog" ADD CONSTRAINT "AgentCommissionLog_settlementDetailId_fkey" FOREIGN KEY ("settlementDetailId") REFERENCES "public"."SettlementDetail"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Rolling" ADD CONSTRAINT "Rolling_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Rolling" ADD CONSTRAINT "Rolling_userPromotionId_fkey" FOREIGN KEY ("userPromotionId") REFERENCES "public"."UserPromotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Rolling" ADD CONSTRAINT "Rolling_depositDetailId_fkey" FOREIGN KEY ("depositDetailId") REFERENCES "public"."DepositDetail"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserToken" ADD CONSTRAINT "UserToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailLog" ADD CONSTRAINT "EmailLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameSession" ADD CONSTRAINT "GameSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameSession" ADD CONSTRAINT "GameSession_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;
