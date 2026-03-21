import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  GameAggregatorType,
  Prisma,
} from '@prisma/client';
import { CasinoErrorCode } from '../constants/casino-error-codes';
import { CasinoGameRoundException } from '../domain/casino.exception';
import { type GameResultMeta } from 'src/modules/game-round/domain/game-round.entity';
import { GAME_ROUND_REPOSITORY_TOKEN } from 'src/modules/game-round/ports/game-round.repository.token';
import type { GameRoundRepositoryPort } from 'src/modules/game-round/ports/game-round.repository.port';
import { Transactional } from '@nestjs-cls/transactional';
import { RevertWageringContributionService } from 'src/modules/wagering/engine/application/revert-wagering-contribution.service';

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
    private readonly revertWageringContributionService: RevertWageringContributionService,
  ) { }

  /**
   * 게임 라운드의 푸시(환불) 및 타이(무승부) 베팅 금액을 업데이트합니다.
   * Wagering Engine을 통해 롤링 실적을 정확히 역산(Revert)합니다. (지갑 잔액은 건드리지 않음)
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
      // 3. Wagering Engine을 통한 사후 롤링(Contribution) 삭감
      // [FIX] 환율 계산 방식 수정: Game -> Wallet 변환은 div(exchangeRate)
      const walletAmount = totalPushGame.div(gameRound.exchangeRate).toDecimalPlaces(8);

      const revertResult = await this.revertWageringContributionService.execute({
        userId: gameRound.userId,
        currency: gameRound.currency,
        amount: walletAmount,
        referenceId: gameRound.id,
      });

      if (revertResult.success) {
        this.logger.debug(`Successfully reverted bonus rolling: ${revertResult.bonusReverted} for round ${gameRound.id}`);
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
