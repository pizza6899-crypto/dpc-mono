import { Injectable, Logger } from '@nestjs/common';
import { GameProvider, Prisma } from '@repo/database';
import {
  GameAggregatorType,
  TransactionType,
  TransactionStatus,
  BonusType,
} from '@repo/database';
import { CasinoErrorCode } from '../constants/casino-error-codes';
import {
  GamingCurrencyCode,
  WalletCurrencyCode,
} from 'src/utils/currency.util';
import { UpdateUserBalanceService } from 'src/modules/wallet/application/update-user-balance.service';
import { BalanceType, UpdateOperation } from 'src/modules/wallet/domain';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';

export interface ProcessBonusParams {
  userId: bigint;
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
  gameId?: bigint;
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

  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly updateUserBalanceService: UpdateUserBalanceService,
  ) { }

  /**
   * 보너스 지급 처리
   * - 잔액 증가 (mainBalance, totalBonus)
   * - 트랜잭션 생성
   * - 보너스 트랜잭션 기록
   */
  async processBonus(params: ProcessBonusParams): Promise<ProcessBonusResult> {
    const {
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
      existingBonusTransaction = await this.tx.bonusDetail.findFirst({
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
      existingBonusTransaction = await this.tx.bonusDetail.findFirst({
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
      existingBonusTransaction = await this.tx.bonusDetail.findFirst({
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
      existingBonusTransaction = await this.tx.bonusDetail.findFirst({
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
      existingBonusTransaction = await this.tx.bonusDetail.findFirst({
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
      gameSession = await this.tx.casinoGameSession.findUnique({
        where: { id: params.gameSessionId },
        select: {
          walletCurrency: true,
          exchangeRate: true,
        },
      });
    } else if (aggregatorRoundId) {
      // round_id로 gameRound를 찾아서 gameSession 가져오기
      const gameRound = await this.tx.gameRound.findUnique({
        where: {
          aggregatorTxId_aggregatorType: {
            aggregatorTxId: aggregatorRoundId,
            aggregatorType,
          },
        },
        select: {
          gameSession: {
            select: {
              walletCurrency: true,
              exchangeRate: true,
            },
          },
        },
      });
      gameSession = gameRound?.gameSession;
    } else {
      // 기존 로직 (fallback)
      gameSession = await this.tx.casinoGameSession.findFirst({
        where: {
          userId,
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
      await this.updateUserBalanceService.execute({
        userId,
        currency: walletCurrency,
        amount: bonusAmountInWalletCurrency,
        balanceType: BalanceType.MAIN,
        operation: UpdateOperation.ADD,
      });

    // 트랜잭션 생성
    const transaction = await this.tx.transaction.create({
      data: {
        userId,
        type: TransactionType.BONUS,
        status: TransactionStatus.COMPLETED,
        currency: walletCurrency,
        amount: bonusAmountInWalletCurrency,
        beforeAmount: updatedUserBalance.beforeMainBalance.add(
          updatedUserBalance.beforeBonusBalance,
        ),
        afterAmount: updatedUserBalance.afterMainBalance.add(
          updatedUserBalance.afterBonusBalance,
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
            mainBeforeAmount: updatedUserBalance.beforeMainBalance,
            mainAfterAmount: updatedUserBalance.afterMainBalance,
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
      beforeMainBalance: updatedUserBalance.beforeMainBalance,
      beforeBonusBalance: updatedUserBalance.beforeBonusBalance,
      afterMainBalance: updatedUserBalance.afterMainBalance,
      afterBonusBalance: updatedUserBalance.afterBonusBalance,
    };
  }
}
