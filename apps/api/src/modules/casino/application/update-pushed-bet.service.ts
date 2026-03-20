import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import {
  GameAggregatorType,
  Prisma,
  CasinoGameTransactionType,
  UserWalletTransactionType,
  UserWalletBalanceType,
} from '@prisma/client';
import { CasinoErrorCode } from '../constants/casino-error-codes';
import { CasinoGameRoundException } from '../domain/casino.exception';
import { type GameResultMeta } from 'src/modules/game-round/domain/game-round.entity';
import { GAME_ROUND_REPOSITORY_TOKEN } from 'src/modules/game-round/ports/game-round.repository.token';
import type { GameRoundRepositoryPort } from 'src/modules/game-round/ports/game-round.repository.port';
import { GAME_TRANSACTION_REPOSITORY_TOKEN } from 'src/modules/game-round/ports/game-transaction.repository.token';
import type { GameTransactionRepositoryPort } from 'src/modules/game-round/ports/game-transaction.repository.port';
import { ProcessWageringCancelService } from 'src/modules/wagering/engine/application/process-wagering-cancel.service';
import { WalletActionName } from 'src/modules/wallet/domain';


export type GamePushedBetUpdateDto = {
  aggregatorRoundId: string;
  pushedAmountGame: Prisma.Decimal;
  tieAmountGame?: Prisma.Decimal;
};

@Injectable()
export class UpdatePushedBetService {
  private readonly logger = new Logger(UpdatePushedBetService.name);

  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    @Inject(GAME_ROUND_REPOSITORY_TOKEN)
    private readonly gameRoundRepository: GameRoundRepositoryPort,
    @Inject(GAME_TRANSACTION_REPOSITORY_TOKEN)
    private readonly gameTransactionRepository: GameTransactionRepositoryPort,
    private readonly processWageringCancelService: ProcessWageringCancelService,
  ) {}


  /**
   * 게임 라운드의 푸시(환불) 및 타이(무승부) 베팅 금액을 업데이트합니다.
   * 1. 믹스벳(캐시+보너스)일 경우 보너스 우선 환불 원칙을 따릅니다.
   * 2. 유저 지갑 잔액을 반환 및 관련 트랜잭션을 기록합니다.
   * 3. 롤링 집계에서 제외하기 위해 UserBalanceStats.totalBet을 차감합니다.
   */
  async execute(
    dto: GamePushedBetUpdateDto,
  ): Promise<{ success: boolean; roundId?: string }> {
    const { aggregatorRoundId, pushedAmountGame, tieAmountGame } = dto;
    const pushVal = pushedAmountGame;
    const tieVal = tieAmountGame ?? new Prisma.Decimal(0);
    const totalPushGame = pushVal.add(tieVal);

    if (totalPushGame.lte(0)) {
      return { success: true };
    }

    // 1. 라운드 조회 (Domain Entity)
    const gameRound = await this.gameRoundRepository.findLatestByExternalId(
      aggregatorRoundId,
      GameAggregatorType.WHITECLIFF,
    );

    if (!gameRound) {
      this.logger.warn(
        `Pushed bet update skipped: Round not found for ${aggregatorRoundId}`,
      );
      return { success: false };
    }

    // 2. 이미 처리된 라운드인지 확인 (멱등성 보장)
    // Domain Entity 필드 사용
    const isProcessed =
      gameRound.totalGameRefundAmount &&
      gameRound.totalGameRefundAmount.gte(totalPushGame);
    if (isProcessed) {
      this.logger.debug(
        `Pushed bet update skipped: Already processed for ${aggregatorRoundId}`,
      );
      return { success: true, roundId: gameRound.id.toString() };
    }

    // 3. 베팅 트랜잭션 조회
    const transactions = await this.gameTransactionRepository.findAllByRoundId(
      gameRound.id,
      gameRound.startedAt,
    );
    const betTransactions = transactions.filter(
      (t) => t.type === CasinoGameTransactionType.BET,
    );

    // 4. 베팅 원금 분석 (Cash vs Bonus)
    let totalCashBetGame = new Prisma.Decimal(0);
    let totalBonusBetGame = new Prisma.Decimal(0);

    if (betTransactions.length > 0) {
      for (const tx of betTransactions) {
        const amount = tx.gameAmount ?? new Prisma.Decimal(0);
        if (tx.balanceType === UserWalletBalanceType.CASH) {
          totalCashBetGame = totalCashBetGame.add(amount);
        } else if (tx.balanceType === UserWalletBalanceType.BONUS) {
          totalBonusBetGame = totalBonusBetGame.add(amount);
        }
      }
    }

    // 5. 환불 금액 배분 (Wallet Currency 변환)
    const exchangeRate = gameRound.exchangeRate;
    const totalRefundWallet = totalPushGame.mul(exchangeRate);
    
    try {
      // 6. Wagering Engine에게 환불 위임 (지갑 복구 + 웨이저링 조건 역산)
      await this.processWageringCancelService.execute({
        userId: gameRound.userId,
        currency: gameRound.currency,
        amount: totalRefundWallet,
        referenceId: BigInt(gameRound.id.toString()), // bigint type mismatch 주의
        actionName: WalletActionName.CASINO_REFUND,
        metadata: {
          roundId: gameRound.id.toString(),
          reason: 'PUSH_OR_TIE_REFUND',
          aggregatorRoundId,
        },
      });

      // 7. CasinoGameRound Update (Via Repo)

      // 통계 증가 (환불액)
      await this.gameRoundRepository.increaseStats(
        gameRound.id,
        gameRound.startedAt,
        {
          refundAmount: totalRefundWallet,
          gameRefundAmount: totalPushGame,
        },
      );

      // 메타데이터 업데이트
      const currentMeta = (gameRound.resultMeta as Record<string, any>) || {};
      const newMeta: GameResultMeta = {
        ...currentMeta,
        whitecliffPushInfo: {
          pushedAmount: pushVal.toNumber(),
          tieAmount: tieVal.toNumber(),
          processedAt: new Date().toISOString(),
        },
      };

      await this.gameRoundRepository.updateResultMeta(
        gameRound.id,
        gameRound.startedAt,
        newMeta,
      );

      // Mark as checked using Repository
      await this.gameRoundRepository.markPushedBetChecked([
        {
          id: gameRound.id,
          startedAt: gameRound.startedAt,
        },
      ]);

      this.logger.log(
        `Pushed bet updated: Round ${gameRound.id}, GameAmount ${totalPushGame}, WalletAmount ${totalRefundWallet}`,
      );
      return { success: true, roundId: gameRound.id.toString() };
    } catch (error) {
      this.logger.error(
        `Failed to update pushed bet for round ${gameRound.id}`,
        error.stack,
      );
      throw new CasinoGameRoundException(
        CasinoErrorCode.INTERNAL_ERROR,
        `Failed to update pushed bet: ${error.message}`,
      );
    }
  }

  /**
   * 해당 라운드들이 "푸시 없음(No Push)"임을 검증 완료 처리합니다.
   */
  async markAsChecked(
    roundIds: { id: bigint; startedAt: Date }[],
  ): Promise<void> {
    if (roundIds.length === 0) return;

    try {
      await this.gameRoundRepository.markPushedBetChecked(roundIds);
    } catch (error) {
      this.logger.error(`Failed to mark rounds as checked`, error.stack);
      throw error;
    }
  }
}
