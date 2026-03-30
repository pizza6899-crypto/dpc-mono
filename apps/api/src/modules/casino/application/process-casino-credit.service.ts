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
import { WalletActionName } from 'src/modules/wallet/domain';
import { CheckCasinoBalanceService } from './check-casino-balance.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CasinoQueueNames } from '../infrastructure/queue/casino-queue.types';
import { BULLMQ_QUEUES } from 'src/infrastructure/bullmq/bullmq.constants';
import { AdvisoryLockService, LockNamespace } from 'src/infrastructure/concurrency';
import { ProcessWageringWinService } from 'src/modules/wagering/engine/application/process-wagering-win.service';
import { ProcessWageringCancelService } from 'src/modules/wagering/engine/application/process-wagering-cancel.service';

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
    private readonly resolveGameRoundService: ResolveGameRoundService,
    private readonly processWageringWinService: ProcessWageringWinService,
    private readonly processWageringCancelService: ProcessWageringCancelService,
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
    let finalCreditAmount = amount;
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
        finalCreditAmount = originalBet.gameAmount;
      }
    }

    // 4. Wagering Engine을 통한 지급/취소 처리
    // 지갑 통화로 환산 (소수점 정밀도 8자리 유지)
    const walletAmount = finalCreditAmount.div(session.exchangeRate).toDecimalPlaces(8);

    let actionName: WalletActionName = WalletActionName.CASINO_WIN;
    if (isCancel) actionName = WalletActionName.CASINO_REFUND;
    else if (isJackpot) actionName = WalletActionName.CASINO_JACKPOT;
    else if (isBonus) actionName = WalletActionName.CASINO_BONUS;

    let wageringResult;
    const commonWageringParams = {
      userId: session.userId,
      currency: session.walletCurrency,
      amount: walletAmount,
      usdExchangeRate: session.usdExchangeRate,
      referenceId: round.id,
      actionName,
      metadata: {
        roundId: String(round.id),
        gameId: String(gameId),
        aggregatorTxId: transactionId,
        description,
        provider,
        isOrphaned: round.isOrphaned,
      } as Record<string, any>,
    };

    if (isCancel) {
      wageringResult = await this.processWageringCancelService.execute(commonWageringParams);
    } else {
      wageringResult = await this.processWageringWinService.execute(commonWageringParams);
    }

    const { updatedWallet } = wageringResult;
    const cashIncluded = 'cashDistributed' in wageringResult ? wageringResult.cashDistributed : wageringResult.cashRefunded;
    const bonusIncluded = 'bonusDistributed' in wageringResult ? wageringResult.bonusDistributed : wageringResult.bonusRefunded;
    const cashTxId = wageringResult.cashTxId;
    const bonusTxId = wageringResult.bonusTxId;

    // 5. 카지노 엔티티 영속화 (전체 지급 내역 기록)
    // 5-1. 현금 트랜잭션 저장
    if (cashIncluded.gt(0) && cashTxId) {
      await this.gameRoundHistoryService.recordTransaction({
        id: cashTxId,
        gameRoundId: round.id,
        roundStartedAt: round.startedAt,
        userId: session.userId,
        type: txType,
        aggregatorTxId: transactionId,
        amount: cashIncluded,
        balanceBefore: updatedWallet.cash.sub(cashIncluded),
        gameAmount: cashIncluded.mul(session.exchangeRate),
        balanceType: UserWalletBalanceType.CASH,
        currency: session.walletCurrency,
        createdAt: winTime,
      });
    }

    // 5-2. 보너스 트랜잭션 저장
    if (bonusIncluded.gt(0) && bonusTxId) {
      await this.gameRoundHistoryService.recordTransaction({
        id: bonusTxId,
        gameRoundId: round.id,
        roundStartedAt: round.startedAt,
        userId: session.userId,
        type: txType,
        aggregatorTxId: `${transactionId}_BONUS`, // [SAFETY] 중복 방지를 위해 접미사 추가
        amount: bonusIncluded,
        balanceBefore: updatedWallet.bonus.sub(bonusIncluded),
        gameAmount: bonusIncluded.mul(session.exchangeRate),
        balanceType: UserWalletBalanceType.BONUS,
        currency: session.walletCurrency,
        createdAt: winTime,
      });
    }

    // 6. 라운드 통계 업데이트
    const statsDelta: any = {};
    const totalWalletAmount = cashIncluded.add(bonusIncluded);

    if (isCancel) {
      statsDelta.refundAmount = totalWalletAmount;
      statsDelta.gameRefundAmount = finalCreditAmount;
    } else if (isJackpot) {
      statsDelta.jackpotAmount = totalWalletAmount;
      statsDelta.gameJackpotAmount = amount;
    } else {
      statsDelta.winAmount = totalWalletAmount;
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

    // 9. 결과 반환 (유효 잔액 산출 로직 통일)
    const balanceResult = await this.checkCasinoBalanceService.execute(session);

    return {
      balance: balanceResult.balance,
    };
  }
}
