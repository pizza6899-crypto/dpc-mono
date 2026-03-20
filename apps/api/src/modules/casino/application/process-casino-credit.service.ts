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
import { GameRoundHistoryService } from 'src/modules/game-round/application/game-round-history.service';
import { ResolveGameRoundService } from 'src/modules/game-round/application/resolve-game-round.service';
import { GetUserWalletService } from 'src/modules/wallet/application/get-user-wallet.service';
import { CheckCasinoBalanceService } from './check-casino-balance.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CasinoQueueNames } from '../infrastructure/queue/casino-queue.types';
import { BULLMQ_QUEUES } from 'src/infrastructure/bullmq/bullmq.constants';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { ProcessWageringWinService } from 'src/modules/wagering/engine/application/process-wagering-win.service';
import { ProcessWageringCancelService } from 'src/modules/wagering/engine/application/process-wagering-cancel.service';
import { WalletActionName } from 'src/modules/wallet/domain';


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
    private readonly gameRoundHistoryService: GameRoundHistoryService,
    private readonly checkCasinoBalanceService: CheckCasinoBalanceService,
    @InjectQueue(CasinoQueueNames.GAME_POST_PROCESS)
    private readonly gamePostProcessQueue: Queue,
    @InjectQueue(CasinoQueueNames.GAME_RESULT_FETCH)
    private readonly gameResultFetchQueue: Queue,
    private readonly advisoryLockService: AdvisoryLockService,
    private readonly getUserWalletService: GetUserWalletService,
    private readonly processWageringWinService: ProcessWageringWinService,
    private readonly processWageringCancelService: ProcessWageringCancelService,
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

    const existingTxExists = await this.gameRoundHistoryService.checkTransactionExists(
      transactionId,
      txType,
      round.startedAt,
    );

    if (existingTxExists) {
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
      const originalBet = await this.gameRoundHistoryService.getOriginalBet(
        transactionId,
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

    // 4. 지급 처리 (Wagering Engine 위임)
    const walletAmount = finalRefundAmount.div(session.exchangeRate);
    let cashTxId: bigint | undefined;
    let bonusTxId: bigint | undefined;
    
    let cashDistribution = new Prisma.Decimal(0);
    let bonusDistribution = new Prisma.Decimal(0);

    let actionName: WalletActionName = WalletActionName.CASINO_WIN;

    if (isCancel) {
      actionName = WalletActionName.CASINO_REFUND;
    } else if (isJackpot) {
      actionName = WalletActionName.CASINO_JACKPOT;
    } else if (isBonus) {
      actionName = WalletActionName.CASINO_BONUS;
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
      const wageringMetadata = {
        roundId: String(round.id),
        gameId: String(gameId),
        aggregatorTxId: transactionId,
        description,
        provider,
        isOrphaned: round.isOrphaned,
      };

      if (isCancel) {
        const result = await this.processWageringCancelService.execute({
          userId: session.userId,
          currency: session.walletCurrency,
          amount: walletAmount,
          usdExchangeRate: session.usdExchangeRate,
          referenceId: round.id,
          actionName,
          metadata: wageringMetadata,
        });
        updatedWallet = result.updatedWallet;
        cashTxId = result.cashTxId;
        bonusTxId = result.bonusTxId;
        cashDistribution = result.cashRefunded;
        bonusDistribution = result.bonusRefunded;
      } else {
        const result = await this.processWageringWinService.execute({
          userId: session.userId,
          currency: session.walletCurrency,
          amount: walletAmount,
          usdExchangeRate: session.usdExchangeRate,
          referenceId: round.id,
          actionName,
          metadata: wageringMetadata,
        });
        updatedWallet = result.updatedWallet;
        cashTxId = result.cashTxId;
        bonusTxId = result.bonusTxId;
        cashDistribution = result.cashDistributed;
        bonusDistribution = result.bonusDistributed;
      }
    }

    // 5. 카지노 트랜잭션 영속화 (현금, 보너스 분리 기록)
    if (cashDistribution.gt(0) && cashTxId) {
      await this.gameRoundHistoryService.recordTransaction({
        id: cashTxId,
        gameRoundId: round.id,
        roundStartedAt: round.startedAt,
        userId: session.userId,
        type: txType,
        aggregatorTxId: transactionId,
        amount: cashDistribution,
        balanceBefore: updatedWallet.cash.sub(cashDistribution), // 차감 후 잔액에서 더해진 값 빼서 Before 도출
        gameAmount: cashDistribution.mul(session.exchangeRate),
        balanceType: UserWalletBalanceType.CASH,
        currency: session.walletCurrency,
        createdAt: winTime,
      });
    }

    if (bonusDistribution.gt(0) && bonusTxId) {
      await this.gameRoundHistoryService.recordTransaction({
        id: bonusTxId,
        gameRoundId: round.id,
        roundStartedAt: round.startedAt,
        userId: session.userId,
        type: txType,
        aggregatorTxId: `${transactionId}_BONUS`,
        amount: bonusDistribution,
        balanceBefore: updatedWallet.bonus.sub(bonusDistribution),
        gameAmount: bonusDistribution.mul(session.exchangeRate),
        balanceType: UserWalletBalanceType.BONUS,
        currency: session.walletCurrency,
        createdAt: winTime,
      });
    }


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

    await this.gameRoundHistoryService.increaseRoundStats(
      round.id,
      round.startedAt,
      statsDelta,
    );

    // 7. Round Completion 처리
    if (command.isEndRound) {
      await this.gameRoundHistoryService.completeRound(round);
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

    // 8. Return Result (Bonus 잔액 합산 반영)
    const balanceInGameCurrency = new Prisma.Decimal(updatedWallet.cash)
      .add(new Prisma.Decimal(updatedWallet.bonus))
      .mul(session.exchangeRate);


    return {
      balance: balanceInGameCurrency,
    };
  }
}
