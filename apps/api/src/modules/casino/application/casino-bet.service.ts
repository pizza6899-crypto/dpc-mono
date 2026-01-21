import { Injectable, Logger } from '@nestjs/common';
import { BetType, GameProvider, Prisma, WinType } from '@prisma/client';
import {
  GameAggregatorType,
  TransactionType,
  TransactionStatus,
  WalletBalanceType,
  WalletTransactionType,
  ExchangeCurrencyCode,
} from '@prisma/client';
import { CasinoErrorCode } from '../constants/casino-error-codes';
import { parseDateStringOrThrow } from 'src/utils/date.util';
import {
  GamingCurrencyCode,
  WalletCurrencyCode,
} from 'src/utils/currency.util';
import { UpdateUserBalanceService } from 'src/modules/wallet/application/update-user-balance.service';
import { FindUserWalletService } from 'src/modules/wallet/application/find-user-wallet.service';
import { UpdateOperation, WalletActionName } from 'src/modules/wallet/domain/wallet.constant';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';

export interface ProcessBetParams {
  userId: bigint;
  aggregatorType: GameAggregatorType;
  provider: GameProvider;
  walletCurrency: WalletCurrencyCode;
  betAmountInGameCurrency: Prisma.Decimal;
  betAmountInWalletCurrency: Prisma.Decimal;
  aggregatorTxId: string;
  aggregatorBetId: string;
  betTime: string;
  aggregatorGameId: number;
  gameId: bigint;
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
  aggregatorType: GameAggregatorType;
  userId: bigint;
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
  userId: bigint;
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
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly updateUserBalanceService: UpdateUserBalanceService,
    private readonly findUserWalletService: FindUserWalletService,
    private readonly snowflakeService: SnowflakeService,
  ) { }

  /**
   * 베팅 처리
   * - 잔액 차감 (Cash 우선, 부족 시 Bonus)
   * - 트랜잭션 생성
   */
  async processBet(params: ProcessBetParams): Promise<ProcessBetResult> {
    const {
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
    const existingBet = await this.tx.gameBet.findFirst({
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

    const gameBetId = this.snowflakeService.generate(betTimeDate);

    // 1. 지갑 조회 (Balance Split 계산을 위해)
    const wallet = await this.findUserWalletService.findWallet(
      userId,
      walletCurrency as unknown as ExchangeCurrencyCode,
      true, // useLock (이미 상위 트랜잭션이나 서비스에서 처리될 수 있으나 안전하게)
    );

    if (!wallet) {
      throw new Error(CasinoErrorCode.USER_BALANCE_NOT_FOUND);
    }

    const beforeMainBalance = wallet.cash;
    const beforeBonusBalance = wallet.bonus;

    // 2. 차감 금액 계산 (Cash First Policy)
    let cashDeduction = new Prisma.Decimal(0);
    let bonusDeduction = new Prisma.Decimal(0);

    if (wallet.cash.gte(betAmountInWalletCurrency)) {
      cashDeduction = betAmountInWalletCurrency;
    } else {
      cashDeduction = wallet.cash;
      bonusDeduction = betAmountInWalletCurrency.sub(wallet.cash);
    }

    // Bonus 잔액 확인
    if (bonusDeduction.gt(0) && wallet.bonus.lt(bonusDeduction)) {
      throw new Error(CasinoErrorCode.INSUFFICIENT_FUNDS);
    }

    // 3. 잔액 차감 실행
    let updatedWallet = wallet;

    // Cash 차감
    if (cashDeduction.gt(0)) {
      updatedWallet = await this.updateUserBalanceService.updateBalance({
        userId,
        currency: walletCurrency as unknown as ExchangeCurrencyCode,
        amount: cashDeduction,
        operation: UpdateOperation.SUBTRACT,
        balanceType: WalletBalanceType.CASH,
        transactionType: WalletTransactionType.BET,
        referenceId: gameBetId,
      }, {
        actionName: WalletActionName.CASINO_BET_CASH,
        metadata: { aggregatorType, aggregatorGameId, gameId },
      });
    }

    // Bonus 차감
    if (bonusDeduction.gt(0)) {
      updatedWallet = await this.updateUserBalanceService.updateBalance({
        userId,
        currency: walletCurrency as unknown as ExchangeCurrencyCode,
        amount: bonusDeduction,
        operation: UpdateOperation.SUBTRACT,
        balanceType: WalletBalanceType.BONUS,
        transactionType: WalletTransactionType.BET,
        referenceId: gameBetId,
      }, {
        actionName: WalletActionName.CASINO_BET_BONUS,
        metadata: { aggregatorType, aggregatorGameId, gameId },
      });
    }

    const afterMainBalance = updatedWallet.cash;
    const afterBonusBalance = updatedWallet.bonus;

    const beforeAmount = beforeMainBalance.add(beforeBonusBalance);
    const afterAmount = afterMainBalance.add(afterBonusBalance);

    const mainBalanceChange = afterMainBalance.sub(beforeMainBalance); // Negative
    const bonusBalanceChange = afterBonusBalance.sub(beforeBonusBalance); // Negative

    const existingGameRound = await this.tx.gameRound.findUnique({
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
      const updatedGameRound = await this.tx.gameRound.update({
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
              id: gameBetId,
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
                  mainBalanceChange: mainBalanceChange,
                  mainBeforeAmount: beforeMainBalance,
                  mainAfterAmount: afterMainBalance,
                  bonusBalanceChange: bonusBalanceChange,
                  bonusBeforeAmount: beforeBonusBalance,
                  bonusAfterAmount: afterBonusBalance,
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

      return {
        transactionId: updatedGameRound.transactionId,
        gameRoundId: updatedGameRound.id,
        beforeMainBalance,
        beforeBonusBalance,
        afterMainBalance,
        afterBonusBalance,
      };
    } else {
      this.logger.debug(`[processBet] 새로운 GameRound 생성 시작`);
      // 새로운 라운드 생성
      const transaction = await this.tx.transaction.create({
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
              netAmountInGameCurrency: betAmountInGameCurrency.neg(),
              totalBetAmountInWalletCurrency: betAmountInWalletCurrency,
              netAmountInWalletCurrency: betAmountInWalletCurrency.neg(),
              startedAt: betTimeDate,
              gameId,
              jackpotContributionAmount,
              gameSessionId,
              bets: {
                create: {
                  id: gameBetId,
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
              mainBalanceChange: mainBalanceChange,
              mainBeforeAmount: beforeMainBalance,
              mainAfterAmount: afterMainBalance,
              bonusBalanceChange: bonusBalanceChange,
              bonusBeforeAmount: beforeBonusBalance,
              bonusAfterAmount: afterBonusBalance,
            },
          },
        },
        select: {
          id: true,
          gameRound: {
            select: {
              id: true,
            }
          },
        },
      });
      this.logger.debug(
        `[processBet] 새로운 Transaction 및 GameRound 생성 완료 - transactionId: ${transaction.id}, gameRoundId: ${transaction.gameRound!.id}`,
      );

      return {
        transactionId: transaction.id,
        gameRoundId: transaction.gameRound!.id,
        beforeMainBalance,
        beforeBonusBalance,
        afterMainBalance,
        afterBonusBalance,
      };
    }
  }

  /**
   * 당첨 처리
   * - 잔액 증가 (Main - Cash)
   * - 트랜잭션 업데이트
   */
  async processWin(params: ProcessWinParams): Promise<ProcessWinResult> {
    const {
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

    const winTimeDate = parseDateStringOrThrow(winTime) || new Date();

    const existingWin = await this.tx.gameWin.findUnique({
      where: {
        aggregatorWinId_aggregatorType_wonAt: {
          wonAt: winTimeDate,
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
      throw new Error(CasinoErrorCode.DUPLICATE_CREDIT);
    }

    const existingGameRound = await this.tx.gameRound.findUnique({
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

    const gameWinId = this.snowflakeService.generate(winTimeDate);

    // 유저 밸런스 조회 (Before)
    const wallet = await this.findUserWalletService.findWallet(
      userId,
      walletCurrency as unknown as ExchangeCurrencyCode,
      false, // Lock 불필요 (updateUserBalanceService 내부에서 처리됨, 다만 여기서는 이전상태 조회를 위해)
      // *주의*: updateBalance 내에서 다시 Lock을 잡으므로 여기서는 Lock 없이 조회만 하거나,
      // updateBalance에서 리턴된 Wallet을 사용해야 함.
      // 여기서는 updateBalance의 리턴값을 신뢰.
    );

    if (!wallet) {
      throw new Error(CasinoErrorCode.USER_BALANCE_NOT_FOUND);
    }

    const beforeMainBalance = wallet.cash;
    const beforeBonusBalance = wallet.bonus;

    // 유저 밸런스 업데이트 (항상 Cash/Main으로 지급 가정 - 필요시 Bonus 당첨 분기 추가 가능)
    const updatedWallet = await this.updateUserBalanceService.updateBalance({
      userId,
      currency: walletCurrency as unknown as ExchangeCurrencyCode,
      amount: winAmountInWalletCurrency,
      operation: UpdateOperation.ADD,
      balanceType: WalletBalanceType.CASH, // 당첨금은 Cash로 지급
      transactionType: WalletTransactionType.WIN,
      referenceId: gameWinId,
    }, {
      actionName: WalletActionName.CASINO_WIN,
      metadata: { aggregatorType, aggregatorWinId },
    });

    const afterMainBalance = updatedWallet.cash;
    const afterBonusBalance = updatedWallet.bonus;

    const mainBalanceChange = afterMainBalance.sub(beforeMainBalance);
    const bonusBalanceChange = afterBonusBalance.sub(beforeBonusBalance);

    // 트랜잭션 상태 업데이트
    const updatedGameRound = await this.tx.gameRound.update({
      where: {
        id: existingGameRound.id,
      },
      data: {
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
            ...(mainBalanceChange.toNumber() !== 0 || bonusBalanceChange.toNumber() !== 0
              ? {
                balanceDetails: {
                  create: {
                    mainBalanceChange: mainBalanceChange,
                    mainBeforeAmount: beforeMainBalance,
                    mainAfterAmount: afterMainBalance,
                    bonusBalanceChange: bonusBalanceChange,
                    bonusBeforeAmount: beforeBonusBalance,
                    bonusAfterAmount: afterBonusBalance,
                  },
                },
              }
              : {}),
          },
        },
        wins: {
          create: {
            id: gameWinId,
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
      gameRoundId: updatedGameRound.id,
      beforeMainBalance,
      beforeBonusBalance,
      afterMainBalance,
      afterBonusBalance,
    };
  }

  /**
   * AppendWager 처리 (잭팟 당첨 등)
   */
  async processAppendWager(
    params: ProcessAppendWagerParams,
  ): Promise<ProcessAppendWagerResult> {
    const {
      tx, // Note: This might need to be removed if we use this.tx strictly, 
      // but if the caller passes a specific tx, we should use it OR refactor to use the CLS context.
      // Assuming 'tx' is passed for a reason, but standard pattern is to use injected tx.
      // For now, I'll use the injected services which manage their own tx or join existing one via CLS.
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

    const existingAppendWager = await this.tx.gameWin.findFirst({
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

    const gameRound = await this.tx.gameRound.findUnique({
      where: {
        aggregatorTxId_aggregatorType: {
          aggregatorTxId,
          aggregatorType,
        },
      },
      select: {
        id: true,
        gameSession: {
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

    const gameWinId = this.snowflakeService.generate(winTime);

    const walletCurrency = gameRound.gameSession.walletCurrency;
    const winAmountInWalletCurrency = winAmountInGameCurrency.div(
      gameRound.gameSession.exchangeRate,
    );

    // 유저 밸런스 조회
    const wallet = await this.findUserWalletService.findWallet(
      userId,
      walletCurrency as unknown as ExchangeCurrencyCode,
      false
    );

    if (!wallet) {
      throw new Error(CasinoErrorCode.USER_BALANCE_NOT_FOUND);
    }

    const beforeMainBalance = wallet.cash;
    const beforeBonusBalance = wallet.bonus;

    // 유저 밸런스 업데이트 (잭팟 -> Cash)
    const updatedWallet = await this.updateUserBalanceService.updateBalance({
      userId,
      currency: walletCurrency as unknown as ExchangeCurrencyCode,
      amount: winAmountInWalletCurrency,
      operation: UpdateOperation.ADD,
      balanceType: WalletBalanceType.CASH,
      transactionType: WalletTransactionType.WIN, // 잭팟으로 가정
      referenceId: gameWinId,
    }, {
      actionName: WalletActionName.CASINO_JACKPOT,
      internalNote: description,
      metadata: { aggregatorType, aggregatorWagerId }
    });

    const afterMainBalance = updatedWallet.cash;
    const afterBonusBalance = updatedWallet.bonus;

    const mainBalanceChange = afterMainBalance.sub(beforeMainBalance);
    const bonusBalanceChange = afterBonusBalance.sub(beforeBonusBalance);

    const updatedGameRound = await this.tx.gameRound.update({
      where: {
        id: gameRound.id,
      },
      data: {
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
            ...(mainBalanceChange.toNumber() !== 0 || bonusBalanceChange.toNumber() !== 0
              ? {
                balanceDetails: {
                  create: {
                    mainBalanceChange: mainBalanceChange,
                    mainBeforeAmount: beforeMainBalance,
                    mainAfterAmount: afterMainBalance,
                    bonusBalanceChange: bonusBalanceChange,
                    bonusBeforeAmount: beforeBonusBalance,
                    bonusAfterAmount: afterBonusBalance,
                  },
                },
              }
              : {}),
          },
        },
        wins: {
          create: {
            id: gameWinId,
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
      beforeMainBalance,
      beforeBonusBalance,
      afterMainBalance,
      afterBonusBalance,
      gameRoundId: updatedGameRound.id,
    };
  }
}
