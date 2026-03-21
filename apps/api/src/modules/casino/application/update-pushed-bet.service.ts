import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  GameAggregatorType,
  Prisma,
  CasinoGameTransactionType,
  UserWalletBalanceType,
} from '@prisma/client';
import { CasinoErrorCode } from '../constants/casino-error-codes';
import { CasinoGameRoundException } from '../domain/casino.exception';
import { type GameResultMeta } from 'src/modules/game-round/domain/game-round.entity';
import { GAME_ROUND_REPOSITORY_TOKEN } from 'src/modules/game-round/ports/game-round.repository.token';
import type { GameRoundRepositoryPort } from 'src/modules/game-round/ports/game-round.repository.port';
import { GameRoundHistoryService } from 'src/modules/game-round/application/game-round-history.service';
import { WalletActionName } from '../../wallet/domain';
import { Transactional } from '@nestjs-cls/transactional';
import { ProcessWageringCancelService } from 'src/modules/wagering/engine/application/process-wagering-cancel.service';

export type GamePushedBetUpdateDto = {
  aggregatorRoundId: string;
  pushedAmountGame: Prisma.Decimal;
  tieAmountGame?: Prisma.Decimal;
};

@Injectable()
export class UpdatePushedBetService {
  private readonly logger = new Logger(UpdatePushedBetService.name);

  constructor(
    @Inject(GAME_ROUND_REPOSITORY_TOKEN)
    private readonly gameRoundRepository: GameRoundRepositoryPort,
    private readonly gameRoundHistoryService: GameRoundHistoryService,
    private readonly processWageringCancelService: ProcessWageringCancelService,
  ) { }

  /**
   * 게임 라운드의 푸시(환불) 및 타이(무승부) 베팅 금액을 업데이트합니다.
   * Wagering Engine을 통해 롤링 실적을 정확히 역산하고 지갑 잔액을 복구합니다.
   */
  @Transactional()
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

    // 1. 라운드 조회
    const gameRound = await this.gameRoundRepository.findLatestByExternalId(
      aggregatorRoundId,
      GameAggregatorType.WHITECLIFF,
    );

    if (!gameRound) {
      this.logger.warn(`Pushed bet update skipped: Round not found for ${aggregatorRoundId}`);
      return { success: false };
    }

    // 2. 멱등성 확인
    const isProcessed = gameRound.totalGameRefundAmount && gameRound.totalGameRefundAmount.gte(totalPushGame);
    if (isProcessed) {
      this.logger.debug(`Pushed bet update skipped: Already processed for ${aggregatorRoundId}`);
      return { success: true, roundId: gameRound.id.toString() };
    }

    try {
      // 3. Wagering Engine을 통한 환불 처리 (롤링 실적 및 잔액 복구 통합)
      // [FIX] 환율 계산 방식 수정: Game -> Wallet 변환은 div(exchangeRate)
      const walletAmount = totalPushGame.div(gameRound.exchangeRate).toDecimalPlaces(8);

      const cancelResult = await this.processWageringCancelService.execute({
        userId: gameRound.userId,
        currency: gameRound.currency,
        amount: walletAmount,
        usdExchangeRate: gameRound.usdExchangeRate,
        referenceId: gameRound.id,
        actionName: WalletActionName.CASINO_REFUND,
        metadata: {
          roundId: gameRound.id.toString(),
          reason: 'WHITECLIFF_PUSH_TIE_UPDATE',
          aggregatorRoundId,
        },
      });

      const { cashRefunded, bonusRefunded, cashTxId, bonusTxId, updatedWallet } = cancelResult;

      // 4. 카지노 엔티티 영속화 (트랜잭션 기록)
      // 4-1. 현금 환불 기록
      if (cashRefunded.gt(0) && cashTxId) {
        await this.gameRoundHistoryService.recordTransaction({
          id: cashTxId,
          gameRoundId: gameRound.id,
          roundStartedAt: gameRound.startedAt,
          userId: gameRound.userId,
          type: CasinoGameTransactionType.CANCEL,
          aggregatorTxId: `${aggregatorRoundId}_PUSH_CASH`,
          amount: cashRefunded, // [FIX] 부호 일관성 확보 (양수로 기록)
          balanceBefore: updatedWallet.cash.sub(cashRefunded),
          gameAmount: cashRefunded.mul(gameRound.exchangeRate),
          balanceType: UserWalletBalanceType.CASH,
          currency: gameRound.currency,
          createdAt: new Date(),
        });
      }

      // 4-2. 보너스 환불 기록
      if (bonusRefunded.gt(0) && bonusTxId) {
        await this.gameRoundHistoryService.recordTransaction({
          id: bonusTxId,
          gameRoundId: gameRound.id,
          roundStartedAt: gameRound.startedAt,
          userId: gameRound.userId,
          type: CasinoGameTransactionType.CANCEL,
          aggregatorTxId: `${aggregatorRoundId}_PUSH_BONUS`,
          amount: bonusRefunded,
          balanceBefore: updatedWallet.bonus.sub(bonusRefunded),
          gameAmount: bonusRefunded.mul(gameRound.exchangeRate),
          balanceType: UserWalletBalanceType.BONUS,
          currency: gameRound.currency,
          createdAt: new Date(),
        });
      }

      // 5. 라운드 통계 및 메타데이터 업데이트
      await this.gameRoundRepository.increaseStats(
        gameRound.id,
        gameRound.startedAt,
        {
          refundAmount: walletAmount,
          gameRefundAmount: totalPushGame,
        },
      );

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

      // 6. 검증 완료 처리
      await this.gameRoundRepository.markPushedBetChecked([
        { id: gameRound.id, startedAt: gameRound.startedAt },
      ]);

      // 7. 실시간 유효 잔액 확인
      // session 객체 대신 userId와 currency 정보를 활용할 수 있는 서비스 호출이 필요할 수 있으나,
      // 현재 구조에서는 편의상 리팩토링된 CheckCasinoBalanceService와의 규격을 맞추기 위해 
      // 필요한 정보들을 조합하여 반환하거나 세션을 조회할 수 있습니다.

      this.logger.log(`Pushed bet updated: Round ${gameRound.id}, WalletAmount ${walletAmount}`);

      return {
        success: true,
        roundId: gameRound.id.toString(),
      };
    } catch (error) {
      this.logger.error(`Failed to update pushed bet for round ${gameRound.id}`, error.stack);
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
