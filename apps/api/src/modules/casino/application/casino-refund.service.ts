// src/modules/casino/application/casino-refund.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { GameAggregatorType, Prisma, TransactionStatus } from '@repo/database';
import { CasinoErrorCode } from '../constants/casino-error-codes';
import {
  GamingCurrencyCode,
} from 'src/utils/currency.util';
import { UpdateUserBalanceService } from 'src/modules/wallet/application/update-user-balance.service';
import { BalanceType, UpdateOperation } from 'src/modules/wallet/domain';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';

export interface ProcessCancelParams {
  aggregatorTxId: string;
  aggregatorBetId: string;
  aggregatorType: GameAggregatorType;
  userId: bigint;
  gameCurrency: GamingCurrencyCode;
  cancelTime: Date;
  isEndRound: boolean;
}

export interface ProcessCancelResult {
  transactionId: bigint;
  gameRoundId: bigint;
  beforeMainBalance: Prisma.Decimal;
  beforeBonusBalance: Prisma.Decimal;
  afterMainBalance: Prisma.Decimal;
  afterBonusBalance: Prisma.Decimal;
}

@Injectable()
export class CasinoRefundService {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly updateUserBalanceService: UpdateUserBalanceService,
  ) { }

  /**
   * 베팅 취소 처리
   * - 잔액 복구
   * - 트랜잭션 취소
   */
  async processCancel(
    params: ProcessCancelParams,
  ): Promise<ProcessCancelResult> {
    const {
      aggregatorBetId,
      aggregatorType,
      userId,
      gameCurrency,
      cancelTime,
      isEndRound,
      aggregatorTxId,
    } = params;

    const existingGameBet = await this.tx.gameBet.findFirst({
      where: {
        aggregatorBetId,
        aggregatorType,
      },
      select: {
        id: true,
        isCancelled: true,
        betAmount: true, // 베팅 금액 추가
        bettedAt: true,
        gameRound: {
          select: {
            id: true,
            aggregatorTxId: true,
            jackpotContributionAmount: true,
            gameSession: {
              select: {
                walletCurrency: true,
                exchangeRate: true,
              },
            },
            transaction: {
              select: {
                id: true,
                balanceDetails: {
                  select: {
                    id: true,
                    mainBalanceChange: true,
                    bonusBalanceChange: true,
                    createdAt: true, // 생성 시점 추가
                  },
                  orderBy: {
                    createdAt: 'asc', // 생성 순서대로 정렬
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!existingGameBet) {
      throw new Error(CasinoErrorCode.INVALID_TXN);
    }

    if (existingGameBet.gameRound.aggregatorTxId !== aggregatorTxId) {
      throw new Error(CasinoErrorCode.INVALID_TXN);
    }

    if (existingGameBet.isCancelled) {
      throw new Error(CasinoErrorCode.BET_ALREADY_CANCELLED);
    }

    // 취소해야 하는 GameBet의 betAmount와 일치하는 TransactionBalanceDetail 찾기
    const walletCurrency = existingGameBet.gameRound.gameSession.walletCurrency;
    const betAmountInWalletCurrency = existingGameBet.betAmount;
    const betAmountInGameCurrency = existingGameBet.betAmount.mul(
      existingGameBet.gameRound.gameSession.exchangeRate,
    );
    const balanceDetails = existingGameBet.gameRound.transaction.balanceDetails;

    // 해당 베팅과 관련된 balanceDetail 찾기
    // 방법 1: betAmount와 일치하는 금액을 가진 balanceDetail 찾기
    const matchingBalanceDetail = balanceDetails.find((detail) => {
      const totalChange = Prisma.Decimal.abs(detail.mainBalanceChange || 0).add(
        Prisma.Decimal.abs(detail.bonusBalanceChange || 0),
      );
      // betAmount와 정확히 일치하거나 매우 근접한 경우 (소수점 오차 고려)
      return totalChange
        .sub(betAmountInWalletCurrency)
        .abs()
        .lt(new Prisma.Decimal(0.00000001));
    });

    if (!matchingBalanceDetail) {
      throw new Error(CasinoErrorCode.BET_ALREADY_CANCELLED);
    }

    // 돈 환불 - 해당 GameBet와 일치하는 balanceDetail만 사용
    const returnAmount = {
      mainBalance: new Prisma.Decimal(0),
      bonusBalance: new Prisma.Decimal(0),
    };

    // 매칭된 balanceDetail의 금액만 환불
    returnAmount.mainBalance = Prisma.Decimal.abs(
      matchingBalanceDetail.mainBalanceChange || 0,
    );
    returnAmount.bonusBalance = Prisma.Decimal.abs(
      matchingBalanceDetail.bonusBalanceChange || 0,
    );

    await this.updateUserBalanceService.execute({
      userId,
      currency: walletCurrency,
      amount: returnAmount.mainBalance,
      balanceType: BalanceType.MAIN,
      operation: UpdateOperation.ADD,
    });

    const updatedUserBalance = await this.updateUserBalanceService.execute({
      userId,
      currency: walletCurrency,
      amount: returnAmount.bonusBalance,
      balanceType: BalanceType.BONUS,
      operation: UpdateOperation.ADD,
    });

    // 트랜잭션 업데이트
    await this.tx.gameBet.update({
      where: {
        id_bettedAt: {
          id: existingGameBet.id,
          bettedAt: existingGameBet.bettedAt,
        }
      },
      data: {
        isCancelled: true,
        cancelledAt: cancelTime,
        gameRound: {
          update: {
            ...(isEndRound ? { completedAt: cancelTime } : {}),
            totalBetAmountInGameCurrency: {
              increment: betAmountInGameCurrency.neg(),
            },
            netAmountInGameCurrency: {
              increment: betAmountInGameCurrency,
            },
            totalBetAmountInWalletCurrency: {
              increment: betAmountInWalletCurrency.neg(),
            },
            netAmountInWalletCurrency: {
              increment: betAmountInWalletCurrency,
            },
            // 추가: jackpotContributionAmount 감소
            jackpotContributionAmount: {
              decrement:
                existingGameBet.gameRound.jackpotContributionAmount || 0,
            },
            transaction: {
              update: {
                ...(isEndRound ? { status: TransactionStatus.CANCELLED } : {}),
                amount: {
                  increment: returnAmount.mainBalance.add(
                    returnAmount.bonusBalance,
                  ),
                },
                afterAmount: {
                  increment: returnAmount.mainBalance.add(
                    returnAmount.bonusBalance,
                  ),
                },
                balanceDetails: {
                  create: {
                    mainBalanceChange: updatedUserBalance.mainBalanceChange,
                    mainBeforeAmount: updatedUserBalance.beforeMainBalance,
                    mainAfterAmount: updatedUserBalance.afterMainBalance,
                    bonusBalanceChange: updatedUserBalance.bonusBalanceChange,
                    bonusBeforeAmount: updatedUserBalance.beforeBonusBalance,
                    bonusAfterAmount: updatedUserBalance.afterBonusBalance,
                  },
                },
              },
            },
          },
        },
      },
      select: { id: true },
    });

    return {
      transactionId: existingGameBet.gameRound.transaction.id,
      gameRoundId: existingGameBet.gameRound.id,
      beforeMainBalance: updatedUserBalance.beforeMainBalance,
      beforeBonusBalance: updatedUserBalance.beforeBonusBalance,
      afterMainBalance: updatedUserBalance.afterMainBalance,
      afterBonusBalance: updatedUserBalance.afterBonusBalance,
    };
  }
}
