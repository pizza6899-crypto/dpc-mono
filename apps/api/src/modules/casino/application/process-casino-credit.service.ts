import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  Prisma,
  GameProvider,
  CasinoGameTransactionType,
  UserWalletBalanceType,
  UserWalletTransactionType,
} from '@prisma/client';
import { CasinoGameSession } from 'src/modules/casino-session/domain';
import { Transactional } from '@nestjs-cls/transactional';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import { GAME_ROUND_REPOSITORY_TOKEN } from 'src/modules/game-round/ports/game-round.repository.token';
import type { GameRoundRepositoryPort } from 'src/modules/game-round/ports/game-round.repository.port';
import { GAME_TRANSACTION_REPOSITORY_TOKEN } from 'src/modules/game-round/ports/game-transaction.repository.token';
import type { GameTransactionRepositoryPort } from 'src/modules/game-round/ports/game-transaction.repository.port';
import { GameTransaction } from 'src/modules/game-round/domain/game-transaction.entity';
import { GameRound } from 'src/modules/game-round/domain/game-round.entity';
import { ResolveGameRoundService } from 'src/modules/game-round/application/resolve-game-round.service';
import { UpdateUserBalanceService } from 'src/modules/wallet/application/update-user-balance.service';
import { GetUserWalletService } from 'src/modules/wallet/application/get-user-wallet.service';
import { UpdateOperation, WalletActionName } from 'src/modules/wallet/domain';
import { CheckCasinoBalanceService } from './check-casino-balance.service';
import { CasinoWinMetadata } from 'src/modules/wallet/domain/model/user-wallet-transaction-metadata';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CasinoQueueNames } from '../infrastructure/queue/casino-queue.types';
import { BULLMQ_QUEUES } from 'src/infrastructure/bullmq/bullmq.constants';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { UserBalanceNotFoundException } from '../domain/casino.exception';

export interface ProcessCasinoCreditCommand {
  session: CasinoGameSession;
  amount: Prisma.Decimal;
  transactionId: string;
  roundId: string;
  gameId: bigint;
  winTime: Date;
  provider: GameProvider;
  isCancel?: boolean;
  isJackpot?: boolean;
  isBonus?: boolean;
  isEndRound?: boolean;
  isSimulation?: boolean;
  description?: string;
}

export interface ProcessCasinoCreditResult {
  balance: Prisma.Decimal;
}

@Injectable()
export class ProcessCasinoCreditService {
  private readonly logger = new Logger(ProcessCasinoCreditService.name);

  constructor(
    @Inject(GAME_ROUND_REPOSITORY_TOKEN)
    private readonly gameRoundRepository: GameRoundRepositoryPort,
    @Inject(GAME_TRANSACTION_REPOSITORY_TOKEN)
    private readonly gameTransactionRepository: GameTransactionRepositoryPort,
    private readonly updateUserBalanceService: UpdateUserBalanceService,
    private readonly checkCasinoBalanceService: CheckCasinoBalanceService,
    @InjectQueue(CasinoQueueNames.GAME_POST_PROCESS)
    private readonly gamePostProcessQueue: Queue,
    @InjectQueue(CasinoQueueNames.GAME_RESULT_FETCH)
    private readonly gameResultFetchQueue: Queue,
    private readonly advisoryLockService: AdvisoryLockService,
    private readonly getUserWalletService: GetUserWalletService,
    private readonly resolveGameRoundService: ResolveGameRoundService,
  ) { }

  @Transactional()
  async execute(
    command: ProcessCasinoCreditCommand,
  ): Promise<ProcessCasinoCreditResult> {
    const {
      session,
      amount,
      transactionId,
      roundId,
      gameId,
      winTime,
      provider,
      isCancel,
      isJackpot,
      isBonus,
      description,
    } = command;

    // 1. Acquire Advisory Lock (Round Level)
    const lockKey = `${session.aggregatorType}:${roundId}`;
    await this.advisoryLockService.acquireLock(
      LockNamespace.GAME_ROUND,
      lockKey,
      {
        throwThrottleError: true,
      },
    );

    // 2. Resolve Game Round
    const round = await this.resolveGameRoundService.execute({
      session,
      externalRoundId: roundId,
      triggerTime: winTime,
      provider,
      isOrphaned: true, // WIN 시 라운드가 없으면 Orphaned로 간주
    });

    // 3. Idempotency Check
    let txType: CasinoGameTransactionType = CasinoGameTransactionType.WIN;
    if (isCancel) txType = CasinoGameTransactionType.CANCEL;
    else if (isJackpot) txType = CasinoGameTransactionType.JACKPOT;

    const existingTx = await this.gameTransactionRepository.findByExternalId(
      transactionId,
      txType,
      round.startedAt,
    );

    if (existingTx) {
      this.logger.warn(`중복된 ${txType} 요청 무시됨: ${transactionId}`);
      const balanceResult =
        await this.checkCasinoBalanceService.execute(session);
      return {
        balance: balanceResult.balance,
      };
    }

    // [LOGICAL FIX] 취소(CANCEL/REFUND) 요청인 경우 처리
    let finalRefundAmount = amount;
    if (isCancel) {
      const originalBet = await this.gameTransactionRepository.findByExternalId(
        transactionId,
        CasinoGameTransactionType.BET,
        round.startedAt,
      );

      if (!originalBet) {
        this.logger.warn(
          `원본 BET을 찾을 수 없는 CANCEL 요청 무시됨 (차감된 적 없음): ${transactionId}`,
        );
        const balanceResult =
          await this.checkCasinoBalanceService.execute(session);
        return {
          balance: balanceResult.balance,
        };
      }

      if (amount.isZero() && originalBet.gameAmount) {
        finalRefundAmount = originalBet.gameAmount;
      }
    }

    // 4. 지급 처리 (현금 잔액으로 지급)
    const walletAmount = finalRefundAmount.div(session.exchangeRate);
    let newTxId: bigint = BigInt(0);

    let actionName: WalletActionName = WalletActionName.CASINO_WIN;
    let walletTxType: UserWalletTransactionType = UserWalletTransactionType.WIN;

    if (isCancel) {
      actionName = WalletActionName.CASINO_REFUND;
      walletTxType = UserWalletTransactionType.REFUND;
    } else if (isJackpot) {
      actionName = WalletActionName.CASINO_JACKPOT;
      walletTxType = UserWalletTransactionType.WIN;
    } else if (isBonus) {
      actionName = WalletActionName.CASINO_BONUS;
      walletTxType = UserWalletTransactionType.BONUS_IN;
    }

    let updatedWallet: any = null;

    // [OPTIMIZATION] 0원일 경우 Lock/Update을 스킵하고 단순 잔액 조회만 수행
    if (walletAmount.isZero()) {
      updatedWallet = await this.getUserWalletService.getWallet(
        session.userId,
        session.walletCurrency,
        false,
      );
    } else {
      // USD 환산 금액 계산 (Session 스냅샷 환율 기준)
      const walletAmountUsd =
        session.walletCurrency === 'USD'
          ? walletAmount
          : session.usdExchangeRate && !session.usdExchangeRate.isZero()
            ? walletAmount.div(session.usdExchangeRate)
            : undefined;

      const result = await this.updateUserBalanceService.updateBalance(
        {
          userId: session.userId,
          currency: session.walletCurrency,
          amount: walletAmount,
          amountUsd: walletAmountUsd, // [Inject] USD Amount
          operation: UpdateOperation.ADD,
          balanceType: UserWalletBalanceType.CASH,
          transactionType: walletTxType,
          referenceId: round.id,
        },
        {
          actionName: actionName,
          metadata: {
            roundId: String(round.id),
            gameId: String(gameId),
            aggregatorTxId: transactionId,
            description,
            provider,
            isOrphaned: round.isOrphaned,
          } as CasinoWinMetadata,
        },
      );
      updatedWallet = result.wallet;
      newTxId = result.txId;
    }

    // 5. 카지노 엔티티 영속화
    const winTx = GameTransaction.create(
      newTxId,
      round.id,
      round.startedAt,
      session.userId,
      txType,
      transactionId,
      walletAmount,
      updatedWallet.cash.sub(walletAmount), // balanceBefore
      finalRefundAmount,
      UserWalletBalanceType.CASH,
      session.walletCurrency,
      winTime,
    );
    await this.gameTransactionRepository.save(winTx);

    // 6. 라운드 통계 업데이트
    const statsDelta: any = {};
    if (isCancel) {
      statsDelta.refundAmount = walletAmount;
      statsDelta.gameRefundAmount = finalRefundAmount;
    } else if (isJackpot) {
      statsDelta.jackpotAmount = walletAmount;
      statsDelta.gameJackpotAmount = amount;
    } else {
      statsDelta.winAmount = walletAmount;
      statsDelta.gameWinAmount = amount;
    }

    await this.gameRoundRepository.increaseStats(
      round.id,
      round.startedAt,
      statsDelta,
    );

    // 7. Round Completion 처리
    if (command.isEndRound) {
      round.complete();
      await this.gameRoundRepository.save(round);
    }

    // [비동기] 8. 큐 처리 (결과 조회 & 후처리)
    if (
      txType === CasinoGameTransactionType.WIN ||
      txType === CasinoGameTransactionType.CANCEL
    ) {
      // 시뮬레이션이 아닐 때만 실제 결과 조회를 큐에 넣음
      if (!command.isSimulation) {
        await this.gameResultFetchQueue.add(
          BULLMQ_QUEUES.CASINO.GAME_RESULT_FETCH.name,
          {
            gameRoundId: round.id.toString(),
          },
        );
      }

      await this.gamePostProcessQueue.add(
        BULLMQ_QUEUES.CASINO.GAME_POST_PROCESS.name,
        {
          gameRoundId: round.id.toString(),
        },
      );
    }

    // 8. Return Result
    const balanceInGameCurrency = updatedWallet.totalAvailableBalance.mul(
      session.exchangeRate,
    );

    return {
      balance: balanceInGameCurrency,
    };
  }
}
