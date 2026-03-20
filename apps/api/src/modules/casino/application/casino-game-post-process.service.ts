import { Injectable, Logger, Inject } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Prisma, ExchangeCurrencyCode, ExpSourceType } from '@prisma/client'; // ExpSourceType 추가
import { EarnCompService } from 'src/modules/comp/application/earn-comp.service';
import { GAME_ROUND_REPOSITORY_TOKEN } from 'src/modules/game-round/ports/game-round.repository.token';
import type {
  GameRoundRepositoryPort,
  GameRoundPostProcessContext,
} from 'src/modules/game-round/ports/game-round.repository.port';
import { AccumulateUserRollingService } from 'src/modules/tier/evaluator/application/accumulate-user-rolling.service';
import { ProcessWageringContributionService } from 'src/modules/wagering/requirement/application';

interface ProcessingContext {
  betAmount: Prisma.Decimal;
  usdExchangeRate: Prisma.Decimal;
  compRate: Prisma.Decimal;
  categoryCode?: string;
}

@Injectable()
export class CasinoGamePostProcessService {
  private readonly logger = new Logger(CasinoGamePostProcessService.name);

  constructor(
    @Inject(GAME_ROUND_REPOSITORY_TOKEN)
    private readonly gameRoundRepository: GameRoundRepositoryPort,
    private readonly wageringService: ProcessWageringContributionService,
    private readonly earnCompService: EarnCompService,
    private readonly accumulateUserRollingService: AccumulateUserRollingService,
  ) {}

  @Transactional()
  async execute(gameRoundId: bigint) {
    // 1. Data Fetch
    const gameRound =
      await this.gameRoundRepository.findByIdForPostProcess(gameRoundId);
    if (!gameRound) {
      throw new Error(`게임 라운드를 찾을 수 없습니다: ${gameRoundId}`);
    }

    // 2. Validation
    if (!this.isValidForProcessing(gameRound)) {
      return { skipped: true, reason: 'Not eligible for processing' };
    }

    // 3. Context Calculation
    const context = this.createProcessingContext(gameRound);
    if (context.betAmount.lte(0)) {
      return { skipped: true, reason: 'Bet amount <= 0' };
    }

    // 4. Processing Steps
    await this.processWagering(gameRound, context);
    await this.processCompEarning(gameRound, context);
    await this.processTierRolling(gameRound, context);

    this.logger.log(`게임 후처리 완료: gameRoundId=${gameRoundId}`);
    return { success: true };
  }

  private isValidForProcessing(
    gameRound: GameRoundPostProcessContext,
  ): boolean {
    if (!gameRound.isCompleted) {
      this.logger.warn(`게임 라운드 미완료: ${gameRound.id}`);
      return false;
    }

    // Live Casino Push Check
    const isLiveCasino = gameRound.gameCategoryCode === 'LIVE_CASINO';
    if (isLiveCasino && !gameRound.pushedBetCheckedAt) {
      const completedTime = gameRound.completedAt
        ? gameRound.completedAt.getTime()
        : 0;
      const diffMinutes = (Date.now() - completedTime) / 1000 / 60;

      if (diffMinutes < 5) {
        throw new Error(`라이브 카지노 푸시 검증 대기 중: ${gameRound.id}`);
      } else {
        this.logger.warn(
          `라이브 카지노 푸시 검증 시간 초과(5분), 강제 진행: ${gameRound.id}`,
        );
      }
    }

    return true;
  }

  private createProcessingContext(
    gameRound: GameRoundPostProcessContext,
  ): ProcessingContext {
    return {
      betAmount: new Prisma.Decimal(gameRound.totalBetAmount),
      usdExchangeRate: gameRound.usdExchangeRate.eq(0)
        ? gameRound.sessionUsdExchangeRate || new Prisma.Decimal(1)
        : gameRound.usdExchangeRate,
      compRate: gameRound.compRate.gt(0)
        ? gameRound.compRate
        : gameRound.sessionCompRate || new Prisma.Decimal(0),
      categoryCode: gameRound.gameCategoryCode,
    };
  }

  private async processWagering(
    gameRound: GameRoundPostProcessContext,
    context: ProcessingContext,
  ) {
    await this.wageringService.execute({
      userId: gameRound.userId,
      currency: gameRound.currency as ExchangeCurrencyCode, // Type casting safe assertion
      gameRoundId: gameRound.id,
      betAmount: context.betAmount,
      gameContributionRate: gameRound.gameContributionRate?.toNumber() ?? 1,
    });
  }

  private async processCompEarning(
    gameRound: GameRoundPostProcessContext,
    context: ProcessingContext,
  ) {
    try {
      if (context.compRate.gt(0)) {
        const compAmount = context.betAmount.mul(context.compRate);
        if (compAmount.gt(0)) {
          await this.earnCompService.execute({
            userId: gameRound.userId,
            currency: gameRound.currency as ExchangeCurrencyCode,
            amount: compAmount,
            appliedRate: context.compRate,
            referenceId: gameRound.id,
          });
          this.logger.log(
            `콤프 적립: userId=${gameRound.userId}, amount=${compAmount}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`콤프 적립 실패: ${error.message}`, error.stack);
    }
  }

  private async processTierRolling(
    gameRound: GameRoundPostProcessContext,
    context: ProcessingContext,
  ) {
    try {
      // Calculate USD amount: betAmount * exchangeRate (Tier always accumulates 100% of rolling unlike Wagering)
      const usdAmount = context.betAmount.mul(context.usdExchangeRate);

      if (usdAmount.gt(0)) {
        // Execute rolling accumulation with reference info
        await this.accumulateUserRollingService.execute(
          gameRound.userId,
          usdAmount.toNumber(),
          {
            sourceType: ExpSourceType.ROLLING_REWARD,
            referenceId: gameRound.id,
          },
        );
        this.logger.log(
          `티어 롤링 누적: userId=${gameRound.userId}, usdAmount=${usdAmount}`,
        );
      }
    } catch (error) {
      this.logger.error(`티어 롤링 누적 실패: ${error.message}`, error.stack);
      // Don't throw, just log. Post-processing should continue or partially succeed.
    }
  }
}
