import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/platform/prisma/prisma.service';
import { BetType, GameProvider, Prisma, WinType } from '@repo/database';
import {
  GameAggregatorType,
  TransactionType,
  TransactionStatus,
} from '@repo/database';
import { CasinoBalanceService } from './casino-balance.service';
import { CasinoErrorCode } from '../constants/casino-error-codes';
import { parseDateStringOrThrow } from 'src/utils/date.util';
import {
  GamingCurrencyCode,
  WalletCurrencyCode,
} from 'src/utils/currency.util';

export interface ProcessBetParams {
  tx: Prisma.TransactionClient;
  userId: string;
  aggregatorType: GameAggregatorType;
  provider: GameProvider;
  walletCurrency: WalletCurrencyCode;
  betAmountInGameCurrency: Prisma.Decimal;
  betAmountInWalletCurrency: Prisma.Decimal;
  aggregatorTxId: string;
  aggregatorBetId: string;
  betTime: string;
  aggregatorGameId: number;
  gameId: number;
  jackpotContributionAmount: Prisma.Decimal;
  gameSessionId: bigint;
  betType: BetType;
}

export interface ProcessBetResult {
  transactionId: bigint;
  gameRoundId: bigint;
  beforeMainBalance: Prisma.Decimal;
  beforeBonusBalance: Prisma.Decimal;
  afterMainBalance: Prisma.Decimal;
  afterBonusBalance: Prisma.Decimal;
}

export interface ProcessWinParams {
  tx: Prisma.TransactionClient;
  aggregatorType: GameAggregatorType;
  userId: string;
  gameCurrency: GamingCurrencyCode;
  walletCurrency: WalletCurrencyCode;
  aggregatorTxId: string;
  aggregatorWinId: string;
  winAmountInGameCurrency: Prisma.Decimal;
  winAmountInWalletCurrency: Prisma.Decimal;
  winTime: string;
  isEndRound: boolean;
}

export interface ProcessWinResult {
  transactionId: bigint;
  gameRoundId: bigint;
  beforeMainBalance: Prisma.Decimal;
  beforeBonusBalance: Prisma.Decimal;
  afterMainBalance: Prisma.Decimal;
  afterBonusBalance: Prisma.Decimal;
}

export interface ProcessAppendWagerParams {
  tx: Prisma.TransactionClient;
  aggregatorType: GameAggregatorType;
  userId: string;
  currency: GamingCurrencyCode;
  aggregatorTxId: string; // round_id
  aggregatorWagerId: string; // wager_id
  winAmountInGameCurrency: Prisma.Decimal; // 잭팟 당첨 금액
  winTime: Date;
  isEndRound: boolean;
  description?: string; // 추가
}

export interface ProcessAppendWagerResult {
  transactionId: bigint;
  gameRoundId: bigint;
  beforeMainBalance: Prisma.Decimal;
  beforeBonusBalance: Prisma.Decimal;
  afterMainBalance: Prisma.Decimal;
  afterBonusBalance: Prisma.Decimal;
}

@Injectable()
export class CasinoBetService {
  private readonly logger = new Logger(CasinoBetService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly casinoBalanceService: CasinoBalanceService,
  ) {}

  /**
   * 베팅 처리
   * - 잔액 차감
   * - 트랜잭션 생성
   */
  async processBet(params: ProcessBetParams): Promise<ProcessBetResult> {
    const {
      tx = this.prismaService,
      userId,
      betAmountInGameCurrency,
      betAmountInWalletCurrency,
      walletCurrency,
      aggregatorTxId, // dcs: round_id, whitecliff: txn_id
      aggregatorBetId, // dcs: wager_id, whitecliff: txn_id
      aggregatorType,
      aggregatorGameId,
      gameId,
      betTime,
      provider,
      jackpotContributionAmount,
      gameSessionId,
      betType,
    } = params;

    const betTimeDate = parseDateStringOrThrow(betTime);
    const existingBet = await tx.gameBet.findFirst({
      where: {
        aggregatorBetId,
        aggregatorType,
        gameRound: {
          aggregatorTxId,
          aggregatorType,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingBet) {
      throw new Error(CasinoErrorCode.DUPLICATE_DEBIT);
    }

    const updatedUserBalance =
      await this.casinoBalanceService.updateUserCasinoBalance({
        tx,
        userId: userId,
        currency: walletCurrency,
        amount: betAmountInWalletCurrency.neg(),
      });

    const beforeAmount = updatedUserBalance.mainBeforeBalance.add(
      updatedUserBalance.bonusBeforeBalance,
    );
    const afterAmount = updatedUserBalance.mainAfterBalance.add(
      updatedUserBalance.bonusAfterBalance,
    );

    const existingGameRound = await tx.gameRound.findUnique({
      where: {
        aggregatorTxId_aggregatorType: {
          aggregatorTxId,
          aggregatorType,
        },
      },
      select: {
        id: true,
        transactionId: true,
      },
    });

    if (existingGameRound) {
      // 기존 라운드에 추가 베팅
      const updatedGameRound = await tx.gameRound.update({
        where: {
          id: existingGameRound.id,
        },
        data: {
          totalBetAmountInGameCurrency: {
            increment: betAmountInGameCurrency,
          },
          netAmountInGameCurrency: {
            decrement: betAmountInGameCurrency,
          },
          totalBetAmountInWalletCurrency: {
            increment: betAmountInWalletCurrency,
          },
          netAmountInWalletCurrency: {
            decrement: betAmountInWalletCurrency,
          },
          jackpotContributionAmount: {
            increment: jackpotContributionAmount,
          },
          bets: {
            create: {
              userId,
              betAmount: betAmountInWalletCurrency,
              betAmountInGameCurrency: betAmountInGameCurrency,
              bettedAt: betTimeDate,
              aggregatorType,
              aggregatorBetId,
              betType,
            },
          },
          transaction: {
            update: {
              amount: {
                decrement: betAmountInWalletCurrency,
              },
              afterAmount: afterAmount,
              balanceDetails: {
                create: {
                  mainBalanceChange: updatedUserBalance.mainBalanceChange,
                  mainBeforeAmount: updatedUserBalance.mainBeforeBalance,
                  mainAfterAmount: updatedUserBalance.mainAfterBalance,
                  bonusBalanceChange: updatedUserBalance.bonusBalanceChange,
                  bonusBeforeAmount: updatedUserBalance.bonusBeforeBalance,
                  bonusAfterAmount: updatedUserBalance.bonusAfterBalance,
                },
              },
            },
          },
        },
        select: {
          id: true,
          transactionId: true,
        },
      });
      this.logger.debug(
        `[processBet] 기존 GameRound 업데이트 완료 - gameRoundId: ${updatedGameRound.id}, transactionId: ${updatedGameRound.transactionId}`,
      );

      const result = {
        transactionId: updatedGameRound.transactionId,
        gameRoundId: updatedGameRound.id,
        beforeMainBalance: updatedUserBalance.mainBeforeBalance,
        beforeBonusBalance: updatedUserBalance.bonusBeforeBalance,
        afterMainBalance: updatedUserBalance.mainAfterBalance,
        afterBonusBalance: updatedUserBalance.bonusAfterBalance,
      };
      this.logger.log(
        `[processBet] 성공 완료 (기존 라운드) - transactionId: ${result.transactionId}, gameRoundId: ${result.gameRoundId}`,
      );
      return result;
    } else {
      this.logger.debug(`[processBet] 새로운 GameRound 생성 시작`);
      // 새로운 라운드 생성
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: TransactionType.GAME,
          status: TransactionStatus.PENDING,
          currency: walletCurrency,
          amount: betAmountInWalletCurrency.neg(),
          beforeAmount,
          afterAmount,
          gameRound: {
            create: {
              userId,
              aggregatorType,
              provider,
              aggregatorTxId: aggregatorTxId,
              aggregatorGameId,
              totalBetAmountInGameCurrency: betAmountInGameCurrency,
              totalWinAmountInGameCurrency: null,
              netAmountInGameCurrency: betAmountInGameCurrency.neg(),
              totalBetAmountInWalletCurrency: betAmountInWalletCurrency,
              totalWinAmountInWalletCurrency: null,
              netAmountInWalletCurrency: betAmountInWalletCurrency.neg(),
              startedAt: betTimeDate,
              completedAt: null,
              gameId,
              jackpotContributionAmount,
              gameSessionId,
              bets: {
                create: {
                  userId,
                  betAmount: betAmountInWalletCurrency,
                  betAmountInGameCurrency: betAmountInGameCurrency,
                  bettedAt: betTimeDate,
                  aggregatorType,
                  aggregatorBetId,
                  betType,
                },
              },
            },
          },
          balanceDetails: {
            create: {
              mainBalanceChange: updatedUserBalance.mainBalanceChange,
              mainBeforeAmount: updatedUserBalance.mainBeforeBalance,
              mainAfterAmount: updatedUserBalance.mainAfterBalance,
              bonusBalanceChange: updatedUserBalance.bonusBalanceChange,
              bonusBeforeAmount: updatedUserBalance.bonusBeforeBalance,
              bonusAfterAmount: updatedUserBalance.bonusAfterBalance,
            },
          },
        },
        select: {
          id: true,
          gameRound: {
            select: {
              id: true,
            },
          },
        },
      });
      this.logger.debug(
        `[processBet] 새로운 Transaction 및 GameRound 생성 완료 - transactionId: ${transaction.id}, gameRoundId: ${transaction.gameRound!.id}`,
      );

      const result = {
        transactionId: transaction.id,
        gameRoundId: transaction.gameRound!.id,
        beforeMainBalance: updatedUserBalance.mainBeforeBalance,
        beforeBonusBalance: updatedUserBalance.bonusBeforeBalance,
        afterMainBalance: updatedUserBalance.mainAfterBalance,
        afterBonusBalance: updatedUserBalance.bonusAfterBalance,
      };
      this.logger.log(
        `[processBet] 성공 완료 (새 라운드) - transactionId: ${result.transactionId}, gameRoundId: ${result.gameRoundId}`,
      );
      return result;
    }
  }

  /**
   * 당첨 처리
   * - 잔액 증가
   * - 트랜잭션 업데이트
   * - 롤링/콤프 적립 (이미 베팅 시 적립되었으므로 추가 적립 없음)
   */
  async processWin(params: ProcessWinParams): Promise<ProcessWinResult> {
    const {
      tx,
      winAmountInGameCurrency,
      winTime,
      gameCurrency,
      walletCurrency,
      winAmountInWalletCurrency,
      userId,
      aggregatorType,
      aggregatorWinId,
      aggregatorTxId,
      isEndRound,
    } = params;

    const winTimeDate = parseDateStringOrThrow(winTime);

    // DCS의 경우: 같은 round_id에 대해 다른 wager_id로 여러 win이 올 수 있음
    // 따라서 같은 aggregatorWinId가 이미 존재하는지만 확인 (어느 round_id에 속해 있든 중복)
    // aggregatorWinId_aggregatorType은 unique constraint이므로 이 체크만으로 충분
    const existingWin = await tx.gameWin.findUnique({
      where: {
        aggregatorWinId_aggregatorType: {
          aggregatorWinId,
          aggregatorType,
        },
      },
      select: {
        id: true,
        gameRound: {
          select: {
            aggregatorTxId: true,
          },
        },
      },
    });

    if (existingWin) {
      // 같은 wager_id로 이미 win이 처리되었으면 중복
      throw new Error(CasinoErrorCode.DUPLICATE_CREDIT);
    }

    // GameRound가 존재하는지 확인 (같은 round_id에 대해 여러 win이 올 수 있으므로)
    const existingGameRound = await tx.gameRound.findUnique({
      where: {
        aggregatorTxId_aggregatorType: {
          aggregatorTxId,
          aggregatorType,
        },
      },
      select: {
        id: true,
        transactionId: true,
      },
    });

    if (!existingGameRound) {
      throw new Error(CasinoErrorCode.INVALID_TXN);
    }

    // 유저 밸런스 업데이트
    const updatedUserBalance =
      await this.casinoBalanceService.updateUserCasinoBalance({
        tx,
        userId,
        currency: walletCurrency,
        amount: winAmountInWalletCurrency,
      });

    if (!updatedUserBalance) {
      throw new Error(CasinoErrorCode.USER_BALANCE_NOT_FOUND);
    }

    // 트랜잭션 상태 업데이트
    // 같은 round_id에 대해 여러 win이 올 수 있으므로 totalWinAmount는 increment로 처리
    const updatedGameRound = await tx.gameRound.update({
      where: {
        id: existingGameRound.id,
      },
      data: {
        // 여러 win이 올 수 있으므로 increment 사용
        totalWinAmountInGameCurrency: {
          increment: winAmountInGameCurrency,
        },
        netAmountInGameCurrency: {
          increment: winAmountInGameCurrency,
        },
        totalWinAmountInWalletCurrency: {
          increment: winAmountInWalletCurrency,
        },
        netAmountInWalletCurrency: {
          increment: winAmountInWalletCurrency,
        },
        completedAt: winTimeDate,
        transaction: {
          update: {
            status: isEndRound
              ? TransactionStatus.COMPLETED
              : TransactionStatus.PENDING,
            amount: {
              increment: winAmountInWalletCurrency,
            },
            afterAmount: {
              increment: winAmountInWalletCurrency,
            },
            // 승리 금액이 0이 아니면 잔액 변경 내역 생성
            ...(updatedUserBalance.mainBalanceChange.toNumber() !== 0 ||
            updatedUserBalance.bonusBalanceChange.toNumber() !== 0
              ? {
                  balanceDetails: {
                    create: {
                      mainBalanceChange: updatedUserBalance.mainBalanceChange,
                      mainBeforeAmount: updatedUserBalance.mainBeforeBalance,
                      mainAfterAmount: updatedUserBalance.mainAfterBalance,
                      bonusBalanceChange: updatedUserBalance.bonusBalanceChange,
                      bonusBeforeAmount: updatedUserBalance.bonusBeforeBalance,
                      bonusAfterAmount: updatedUserBalance.bonusAfterBalance,
                    },
                  },
                }
              : {}),
          },
        },
        wins: {
          create: {
            userId,
            winType: WinType.NORMAL,
            aggregatorType,
            aggregatorWinId,
            winAmountInGameCurrency: winAmountInGameCurrency,
            winAmount: winAmountInWalletCurrency,
            wonAt: winTimeDate,
          },
        },
      },
      select: {
        transactionId: true,
        id: true,
      },
    });

    return {
      transactionId: updatedGameRound.transactionId,
      beforeMainBalance: updatedUserBalance.mainBeforeBalance,
      beforeBonusBalance: updatedUserBalance.bonusBeforeBalance,
      afterMainBalance: updatedUserBalance.mainAfterBalance,
      afterBonusBalance: updatedUserBalance.bonusAfterBalance,
      gameRoundId: updatedGameRound.id,
    };
  }

  /**
   * AppendWager 처리 (잭팟 당첨)
   * - 잔액 증가
   * - GameRound의 totalWinAmount에 추가
   * - GameWin 생성 (JACKPOT 타입)
   * - round_id + wager_id로 중복 체크
   */
  async processAppendWager(
    params: ProcessAppendWagerParams,
  ): Promise<ProcessAppendWagerResult> {
    const {
      tx,
      winAmountInGameCurrency,
      winTime,
      currency,
      userId,
      aggregatorType,
      aggregatorWagerId,
      aggregatorTxId,
      isEndRound,
      description,
    } = params;

    // 1. round_id + wager_id로 중복 체크
    // 같은 round_id와 wager_id 조합이 이미 실행되었는지 확인
    const existingAppendWager = await tx.gameWin.findFirst({
      where: {
        aggregatorType,
        aggregatorWinId: aggregatorWagerId,
        gameRound: {
          aggregatorTxId,
          aggregatorType,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingAppendWager) {
      throw new Error(CasinoErrorCode.DUPLICATE_CREDIT);
    }

    // 2. GameRound 조회 (round_id로)
    const gameRound = await tx.gameRound.findUnique({
      where: {
        aggregatorTxId_aggregatorType: {
          aggregatorTxId,
          aggregatorType,
        },
      },
      select: {
        id: true,
        GameSession: {
          select: {
            walletCurrency: true,
            exchangeRate: true,
          },
        },
        transaction: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!gameRound) {
      throw new Error(CasinoErrorCode.INVALID_TXN);
    }

    const walletCurrency = gameRound.GameSession.walletCurrency;
    const winAmountInWalletCurrency = winAmountInGameCurrency.div(
      gameRound.GameSession.exchangeRate,
    );

    // 3. 유저 밸런스 업데이트
    const updatedUserBalance =
      await this.casinoBalanceService.updateUserCasinoBalance({
        tx,
        userId,
        currency: walletCurrency,
        amount: winAmountInWalletCurrency,
      });

    if (!updatedUserBalance) {
      throw new Error(CasinoErrorCode.USER_BALANCE_NOT_FOUND);
    }

    // 4. GameRound 업데이트 및 GameWin 생성
    const updatedGameRound = await tx.gameRound.update({
      where: {
        id: gameRound.id,
      },
      data: {
        // totalWinAmount에 추가 (기존 win이 있을 수 있으므로 increment)
        totalWinAmountInGameCurrency: {
          increment: winAmountInGameCurrency,
        },
        netAmountInGameCurrency: {
          increment: winAmountInGameCurrency,
        },
        totalWinAmountInWalletCurrency: {
          increment: winAmountInWalletCurrency,
        },
        netAmountInWalletCurrency: {
          increment: winAmountInWalletCurrency,
        },
        completedAt: isEndRound ? winTime : undefined,
        transaction: {
          update: {
            status: isEndRound
              ? TransactionStatus.COMPLETED
              : TransactionStatus.PENDING,
            amount: {
              increment: winAmountInWalletCurrency,
            },
            afterAmount: {
              increment: winAmountInWalletCurrency,
            },
            // 잔액 변경 내역 생성
            ...(updatedUserBalance.mainBalanceChange.toNumber() !== 0 ||
            updatedUserBalance.bonusBalanceChange.toNumber() !== 0
              ? {
                  balanceDetails: {
                    create: {
                      mainBalanceChange: updatedUserBalance.mainBalanceChange,
                      mainBeforeAmount: updatedUserBalance.mainBeforeBalance,
                      mainAfterAmount: updatedUserBalance.mainAfterBalance,
                      bonusBalanceChange: updatedUserBalance.bonusBalanceChange,
                      bonusBeforeAmount: updatedUserBalance.bonusBeforeBalance,
                      bonusAfterAmount: updatedUserBalance.bonusAfterBalance,
                    },
                  },
                }
              : {}),
          },
        },
        wins: {
          create: {
            userId,
            winType: WinType.JACKPOT,
            aggregatorType,
            aggregatorWinId: aggregatorWagerId,
            winAmount: winAmountInWalletCurrency,
            winAmountInGameCurrency: winAmountInGameCurrency,
            wonAt: winTime,
            description: description,
          },
        },
      },
      select: {
        transactionId: true,
        id: true,
      },
    });

    return {
      transactionId: updatedGameRound.transactionId,
      beforeMainBalance: updatedUserBalance.mainBeforeBalance,
      beforeBonusBalance: updatedUserBalance.bonusBeforeBalance,
      afterMainBalance: updatedUserBalance.mainAfterBalance,
      afterBonusBalance: updatedUserBalance.bonusAfterBalance,
      gameRoundId: updatedGameRound.id,
    };
  }
}
