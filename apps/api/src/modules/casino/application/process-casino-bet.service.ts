import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  Prisma,
  GameProvider,
  CasinoGameTransactionType,
  UserWalletBalanceType,
} from '@prisma/client';
import { CasinoGameSession } from 'src/modules/casino-session/domain';
import { Transactional } from '@nestjs-cls/transactional';
import { GAME_ROUND_REPOSITORY_TOKEN } from 'src/modules/game-round/ports/game-round.repository.token';
import type { GameRoundRepositoryPort } from 'src/modules/game-round/ports/game-round.repository.port';
import { GAME_TRANSACTION_REPOSITORY_TOKEN } from 'src/modules/game-round/ports/game-transaction.repository.token';
import type { GameTransactionRepositoryPort } from 'src/modules/game-round/ports/game-transaction.repository.port';
import { GameTransaction } from 'src/modules/game-round/domain/game-transaction.entity';
import { WalletActionName } from 'src/modules/wallet/domain';
import { ResolveGameRoundService } from 'src/modules/game-round/application/resolve-game-round.service';
import { CheckCasinoBalanceService } from './check-casino-balance.service';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
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
    @Inject(GAME_ROUND_REPOSITORY_TOKEN)
    private readonly gameRoundRepository: GameRoundRepositoryPort,
    @Inject(GAME_TRANSACTION_REPOSITORY_TOKEN)
    private readonly gameTransactionRepository: GameTransactionRepositoryPort,
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
    const existingTx = await this.gameTransactionRepository.findByExternalId(
      transactionId,
      CasinoGameTransactionType.BET,
      round.startedAt,
    );

    if (existingTx) {
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
    const walletAmount = amount.div(session.exchangeRate);

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
      const cashTx = GameTransaction.create(
        cashTxId,
        round.id,
        round.startedAt,
        session.userId,
        CasinoGameTransactionType.BET,
        transactionId,
        cashDeducted,
        updatedWallet.cash.add(cashDeducted), // 차감 전 잔액 (updatedWallet은 차감 후임)
        cashDeducted.mul(session.exchangeRate),
        UserWalletBalanceType.CASH,
        session.walletCurrency,
        betTime,
      );
      await this.gameTransactionRepository.save(cashTx);
    }

    // 5-2. 보너스 트랜잭션 저장
    if (bonusDeducted.gt(0) && bonusTxId) {
      const bonusTx = GameTransaction.create(
        bonusTxId,
        round.id,
        round.startedAt,
        session.userId,
        CasinoGameTransactionType.BET,
        `${transactionId}_BONUS`,
        bonusDeducted,
        updatedWallet.bonus.add(bonusDeducted), // 차감 전 잔액
        bonusDeducted.mul(session.exchangeRate),
        UserWalletBalanceType.BONUS,
        session.walletCurrency,
        betTime,
      );
      await this.gameTransactionRepository.save(bonusTx);
    }

    // 5-3. 라운드 통계 업데이트
    const totalWalletAmount = cashDeducted.add(bonusDeducted);
    await this.gameRoundRepository.increaseStats(round.id, round.startedAt, {
      betAmount: totalWalletAmount,
      gameBetAmount: amount,
    });

    // 6. Round Completion 처리
    if (command.isEndRound) {
      round.complete();
      await this.gameRoundRepository.save(round);
    }

    // 7. 결과 반환 (게임 통화 기준 잔액)
    const balanceInGameCurrency = new Prisma.Decimal(updatedWallet.cash)
      .add(new Prisma.Decimal(updatedWallet.bonus))
      .mul(session.exchangeRate);

    return {
      balance: balanceInGameCurrency,
    };
  }
}
