import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  Prisma,
  GameProvider,
  CasinoGameTransactionType,
  UserWalletBalanceType,
} from '@prisma/client';
import { CasinoGameSession } from 'src/modules/casino-session/domain';
import { Transactional } from '@nestjs-cls/transactional';
import { GameRoundHistoryService } from 'src/modules/game-round/application/game-round-history.service';
import { WalletActionName } from 'src/modules/wallet/domain';
import { ResolveGameRoundService } from 'src/modules/game-round/application/resolve-game-round.service';
import { CheckCasinoBalanceService } from './check-casino-balance.service';
import { AdvisoryLockService, LockNamespace } from 'src/infrastructure/concurrency';
import { ProcessWageringBetService } from 'src/modules/wagering/engine/application/process-wagering-bet.service';

export interface ProcessCasinoBetCommand {
  session: CasinoGameSession;
  amount: Prisma.Decimal;
  transactionId: string;
  roundId: string;
  gameId: bigint;
  betTime: Date;
  provider: GameProvider;
  isEndRound?: boolean;
  description?: string;
}

export interface ProcessCasinoBetResult {
  balance: Prisma.Decimal;
}

@Injectable()
export class ProcessCasinoBetService {
  private readonly logger = new Logger(ProcessCasinoBetService.name);

  constructor(
    private readonly gameRoundHistoryService: GameRoundHistoryService,
    private readonly checkCasinoBalanceService: CheckCasinoBalanceService,
    private readonly advisoryLockService: AdvisoryLockService,
    private readonly processWageringBetService: ProcessWageringBetService,
    private readonly resolveGameRoundService: ResolveGameRoundService,
  ) { }

  @Transactional()
  async execute(
    command: ProcessCasinoBetCommand,
  ): Promise<ProcessCasinoBetResult> {
    const {
      session,
      amount,
      transactionId,
      roundId,
      gameId,
      betTime,
      description,
      provider,
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
      triggerTime: betTime,
      provider,
    });

    // 3. Idempotency Check
    const existingTxExists = await this.gameRoundHistoryService.checkTransactionExists(
      transactionId,
      CasinoGameTransactionType.BET,
      round.startedAt,
    );

    if (existingTxExists) {
      this.logger.warn(
        `[ProcessCasinoBet] 중복된 베팅 요청 (Idempotency): ExternalTxId=${transactionId}`,
      );
      const balanceResult =
        await this.checkCasinoBalanceService.execute(session);
      return {
        balance: balanceResult.balance,
      };
    }

    // 4. Wagering Engine을 통한 잔액 차감 및 롤링 처리
    // 지갑 통화로 환산 (게임 통화 / 환율), 소수점 8자리 정밀도 유지
    const walletAmount = amount.div(session.exchangeRate).toDecimalPlaces(8);

    const wageringResult = await this.processWageringBetService.execute({
      userId: session.userId,
      currency: session.walletCurrency,
      betAmount: walletAmount,
      exchangeRate: session.exchangeRate,
      usdExchangeRate: session.usdExchangeRate,
      referenceId: round.id,
      actionName: WalletActionName.CASINO_BET,
      metadata: {
        roundId: String(round.id),
        gameId: String(gameId),
        aggregatorTxId: transactionId,
        description,
        provider,
      },
      // gameContributionRate: TODO: 게임 카탈로그 정보에서 게임 기여율 연동 필요
    });

    const { cashDeducted, bonusDeducted, cashTxId, bonusTxId, updatedWallet } = wageringResult;

    // 5. 카지노 엔티티 영속화 (GameTransaction & 라운드 통계)
    // 5-1. 현금 트랜잭션 저장
    if (cashDeducted.gt(0) && cashTxId) {
      await this.gameRoundHistoryService.recordTransaction({
        id: cashTxId,
        gameRoundId: round.id,
        roundStartedAt: round.startedAt,
        userId: session.userId,
        type: CasinoGameTransactionType.BET,
        aggregatorTxId: transactionId,
        amount: cashDeducted,
        balanceBefore: updatedWallet.cash.add(cashDeducted), // 차감 전 잔액 (updatedWallet은 차감 후임)
        gameAmount: cashDeducted.mul(session.exchangeRate),
        balanceType: UserWalletBalanceType.CASH,
        currency: session.walletCurrency,
        createdAt: betTime,
      });
    }

    // 5-2. 보너스 트랜잭션 저장
    if (bonusDeducted.gt(0) && bonusTxId) {
      await this.gameRoundHistoryService.recordTransaction({
        id: bonusTxId,
        gameRoundId: round.id,
        roundStartedAt: round.startedAt,
        userId: session.userId,
        type: CasinoGameTransactionType.BET,
        aggregatorTxId: `${transactionId}_BONUS`,
        amount: bonusDeducted,
        balanceBefore: updatedWallet.bonus.add(bonusDeducted), // 차감 전 잔액
        gameAmount: bonusDeducted.mul(session.exchangeRate),
        balanceType: UserWalletBalanceType.BONUS,
        currency: session.walletCurrency,
        createdAt: betTime,
      });
    }

    // 5-3. 라운드 통계 업데이트
    const totalWalletAmount = cashDeducted.add(bonusDeducted);
    await this.gameRoundHistoryService.increaseRoundStats(round.id, round.startedAt, {
      betAmount: totalWalletAmount,
      gameBetAmount: amount,
    });

    // 6. Round Completion 처리
    if (command.isEndRound) {
      await this.gameRoundHistoryService.completeRound(round);
    }

    // 7. 결과 반환 (게임 통화 기준 잔액)
    // [CRITICAL] 단순 합산이 아닌 Wagering 정책이 반영된 최신 유효 잔액을 다시 조회하여 반환
    const balanceResult = await this.checkCasinoBalanceService.execute(session);

    return {
      balance: balanceResult.balance,
    };
  }
}
