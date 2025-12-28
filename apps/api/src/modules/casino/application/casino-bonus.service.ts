import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/platform/prisma/prisma.service';
import { GameProvider, Prisma } from '@repo/database';
import {
  GameAggregatorType,
  TransactionType,
  TransactionStatus,
  BonusType,
} from '@repo/database';
import { CasinoBalanceService } from './casino-balance.service';
import { CasinoErrorCode } from '../constants/casino-error-codes';
import {
  GamingCurrencyCode,
  WalletCurrencyCode,
} from 'src/utils/currency.util';
import { ExchangeRateService } from 'src/modules/exchange/application/exchange-rate.service';

export interface ProcessBonusParams {
  tx: Prisma.TransactionClient;
  userId: string;
  gameCurrency: GamingCurrencyCode;
  transactionTime: Date;
  aggregatorType: GameAggregatorType;
  provider: GameProvider;
  bonusType: BonusType;
  bonusAmountInGameCurrency: Prisma.Decimal;
  aggregatorPromotionId?: string;
  aggregatorRoundId?: string;
  aggregatorWagerId?: string;
  aggregatorTransactionId?: string;
  aggregatorFreespinId?: string;
  isEndRound?: boolean;
  aggregatorSessionId?: string;
  description?: string;
  gameId?: number;
  gameSessionId?: bigint; // 추가
}

export interface ProcessBonusResult {
  transactionId: bigint;
  bonusDetailId: bigint;
  beforeMainBalance: Prisma.Decimal;
  beforeBonusBalance: Prisma.Decimal;
  afterMainBalance: Prisma.Decimal;
  afterBonusBalance: Prisma.Decimal;
}

@Injectable()
export class CasinoBonusService {
  private readonly logger = new Logger(CasinoBonusService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly casinoBalanceService: CasinoBalanceService,
    private readonly exchangeRateService: ExchangeRateService,
  ) {}

  /**
   * 보너스 지급 처리
   * - 잔액 증가 (mainBalance, totalBonus)
   * - 트랜잭션 생성
   * - 보너스 트랜잭션 기록
   */
  async processBonus(params: ProcessBonusParams): Promise<ProcessBonusResult> {
    const {
      tx = this.prismaService,
      userId,
      gameCurrency,
      transactionTime,
      aggregatorType,
      provider,
      bonusType,
      bonusAmountInGameCurrency,
      aggregatorPromotionId,
      aggregatorRoundId,
      aggregatorWagerId,
      aggregatorTransactionId,
      aggregatorFreespinId,
      aggregatorSessionId,
      isEndRound,
      description,
      gameId,
    } = params;

    // 중복 트랜잭션 체크
    let existingBonusTransaction;

    if (aggregatorRoundId && aggregatorWagerId) {
      // appendWager 케이스: round_id + wager_id 조합으로 체크
      existingBonusTransaction = await tx.bonusDetail.findFirst({
        where: {
          aggregatorType,
          provider,
          aggregatorRoundId,
          aggregatorWagerId,
        },
        select: {
          id: true,
        },
      });
    } else if (aggregatorRoundId) {
      // round_id만 있는 경우
      existingBonusTransaction = await tx.bonusDetail.findFirst({
        where: {
          aggregatorType,
          provider,
          aggregatorRoundId,
        },
        select: {
          id: true,
        },
      });
    } else if (aggregatorWagerId) {
      // wager_id만 있는 경우
      existingBonusTransaction = await tx.bonusDetail.findFirst({
        where: {
          aggregatorType,
          provider,
          aggregatorWagerId,
        },
        select: {
          id: true,
        },
      });
    } else if (aggregatorTransactionId) {
      // transaction_id가 있는 경우
      existingBonusTransaction = await tx.bonusDetail.findFirst({
        where: {
          aggregatorType,
          provider,
          aggregatorTransactionId,
        },
        select: {
          id: true,
        },
      });
    } else if (aggregatorPromotionId) {
      // promotion_id가 있는 경우
      existingBonusTransaction = await tx.bonusDetail.findFirst({
        where: {
          aggregatorType,
          provider,
          aggregatorPromotionId,
        },
        select: {
          id: true,
        },
      });
    }

    if (existingBonusTransaction) {
      throw new Error(CasinoErrorCode.BONUS_ALREADY_PROCESSED);
    }

    let gameSession;
    let walletCurrency = gameCurrency as WalletCurrencyCode;
    let bonusAmountInWalletCurrency = bonusAmountInGameCurrency;

    // gameSessionId가 있으면 직접 조회, 없으면 round_id로 찾기
    if (params.gameSessionId) {
      gameSession = await tx.gameSession.findUnique({
        where: { id: params.gameSessionId },
        select: {
          walletCurrency: true,
          exchangeRate: true,
        },
      });
    } else if (aggregatorRoundId) {
      // round_id로 gameRound를 찾아서 gameSession 가져오기
      const gameRound = await tx.gameRound.findUnique({
        where: {
          aggregatorTxId_aggregatorType: {
            aggregatorTxId: aggregatorRoundId,
            aggregatorType,
          },
        },
        select: {
          GameSession: {
            select: {
              walletCurrency: true,
              exchangeRate: true,
            },
          },
        },
      });
      gameSession = gameRound?.GameSession;
    } else {
      // 기존 로직 (fallback)
      gameSession = await tx.gameSession.findFirst({
        where: {
          userId: userId,
          aggregatorType: aggregatorType,
          gameCurrency: gameCurrency,
        },
        select: {
          walletCurrency: true,
          exchangeRate: true,
        },
      });
    }

    if (gameSession) {
      walletCurrency = gameSession.walletCurrency as WalletCurrencyCode;
      bonusAmountInWalletCurrency = bonusAmountInGameCurrency.div(
        gameSession.exchangeRate,
      );
    }

    const updatedUserBalance =
      await this.casinoBalanceService.updateUserCasinoBalance({
        tx,
        userId,
        currency: walletCurrency,
        amount: bonusAmountInWalletCurrency,
      });

    // 트랜잭션 생성
    const transaction = await tx.transaction.create({
      data: {
        userId,
        type: TransactionType.BONUS,
        status: TransactionStatus.COMPLETED,
        currency: walletCurrency,
        amount: bonusAmountInWalletCurrency,
        beforeAmount: updatedUserBalance.mainBeforeBalance.add(
          updatedUserBalance.bonusBeforeBalance,
        ),
        afterAmount: updatedUserBalance.mainAfterBalance.add(
          updatedUserBalance.bonusAfterBalance,
        ),
        bonusDetail: {
          create: {
            transactionTime,
            aggregatorType,
            provider,
            bonusType,
            amount: bonusAmountInGameCurrency,
            aggregatorPromotionId,
            aggregatorRoundId,
            aggregatorWagerId,
            aggregatorTransactionId,
            isEndRound,
            aggregatorFreespinId,
            description,
            aggregatorSessionId,
            gameId,
          },
        },
        balanceDetails: {
          create: {
            mainBalanceChange: updatedUserBalance.mainBalanceChange,
            mainBeforeAmount: updatedUserBalance.mainBeforeBalance,
            mainAfterAmount: updatedUserBalance.mainAfterBalance,
            bonusBalanceChange: null,
            bonusBeforeAmount: null,
            bonusAfterAmount: null,
          },
        },
      },
      select: {
        id: true,
        bonusDetail: {
          select: {
            id: true,
          },
        },
      },
    });

    return {
      transactionId: transaction.id,
      bonusDetailId: transaction.bonusDetail!.id,
      beforeMainBalance: updatedUserBalance.mainBeforeBalance,
      beforeBonusBalance: updatedUserBalance.bonusBeforeBalance,
      afterMainBalance: updatedUserBalance.mainAfterBalance,
      afterBonusBalance: updatedUserBalance.bonusAfterBalance,
    };
  }
}
