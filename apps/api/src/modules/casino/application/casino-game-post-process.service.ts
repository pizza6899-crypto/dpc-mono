import { Injectable, Logger, Inject } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Prisma, ExchangeCurrencyCode } from '@prisma/client'; // ExchangeCurrencyCode 추가
import { ProcessWageringContributionService } from 'src/modules/wagering/application';
import { AnalyticsQueueService } from 'src/modules/analytics/application';
import { AddUserRollingService } from 'src/modules/tier/application/add-user-rolling.service';
import { EarnCompService } from 'src/modules/comp/application/earn-comp.service';
import { GAME_ROUND_REPOSITORY_TOKEN } from '../ports/out/game-round.repository.token';
import type { GameRoundRepositoryPort } from '../ports/out/game-round.repository.port';
import { GameRoundPostProcessContext } from '../ports/out/game-round.repository.port';

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
        private readonly analyticsQueue: AnalyticsQueueService,
        private readonly tierService: AddUserRollingService,
        private readonly earnCompService: EarnCompService,
    ) { }

    @Transactional()
    async execute(gameRoundId: bigint) {
        // 1. Data Fetch
        const gameRound = await this.gameRoundRepository.findByIdForPostProcess(gameRoundId);
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
        await this.processAnalytics(gameRound, context);
        await this.processTierRolling(gameRound, context);
        await this.processCompEarning(gameRound, context);

        this.logger.log(`게임 후처리 완료: gameRoundId=${gameRoundId}`);
        return { success: true };
    }

    private isValidForProcessing(gameRound: GameRoundPostProcessContext): boolean {
        if (!gameRound.isCompleted) {
            this.logger.warn(`게임 라운드 미완료: ${gameRound.id}`);
            return false;
        }

        // Live Casino Push Check
        const isLiveCasino = gameRound.gameCategoryCode === 'LIVE_CASINO';
        if (isLiveCasino && !gameRound.pushedBetCheckedAt) {
            const completedTime = gameRound.completedAt ? gameRound.completedAt.getTime() : 0;
            const diffMinutes = (Date.now() - completedTime) / 1000 / 60;

            if (diffMinutes < 5) {
                throw new Error(`라이브 카지노 푸시 검증 대기 중: ${gameRound.id}`);
            } else {
                this.logger.warn(`라이브 카지노 푸시 검증 시간 초과(5분), 강제 진행: ${gameRound.id}`);
            }
        }

        return true;
    }

    private createProcessingContext(gameRound: GameRoundPostProcessContext): ProcessingContext {
        return {
            betAmount: new Prisma.Decimal(gameRound.totalBetAmount),
            usdExchangeRate: gameRound.usdExchangeRate.eq(0)
                ? (gameRound.sessionUsdExchangeRate || new Prisma.Decimal(1))
                : gameRound.usdExchangeRate,
            compRate: gameRound.compRate.gt(0)
                ? gameRound.compRate
                : (gameRound.sessionCompRate || new Prisma.Decimal(0)),
            categoryCode: gameRound.gameCategoryCode,
        };
    }

    private async processWagering(gameRound: GameRoundPostProcessContext, context: ProcessingContext) {
        await this.wageringService.execute({
            userId: gameRound.userId,
            currency: gameRound.currency as ExchangeCurrencyCode, // Type casting safe assertion
            gameRoundId: gameRound.id,
            betAmount: context.betAmount,
            gameContributionRate: gameRound.gameContributionRate?.toNumber() ?? 1,
        });
    }

    private async processAnalytics(gameRound: GameRoundPostProcessContext, context: ProcessingContext) {
        const categoryMap: Record<string, 'slot' | 'live' | 'other'> = {
            ['SLOTS']: 'slot',
            ['LIVE_CASINO']: 'live',
        };

        await this.analyticsQueue.enqueueGame({
            userId: gameRound.userId,
            currency: gameRound.currency as ExchangeCurrencyCode,
            betAmount: context.betAmount,
            winAmount: gameRound.totalWinAmount,
            category: context.categoryCode ? (categoryMap[context.categoryCode] || 'other') : 'other',
            date: gameRound.completedAt || new Date(),
        });
    }

    private async processTierRolling(gameRound: GameRoundPostProcessContext, context: ProcessingContext) {
        try {
            const rollingAmountUsd = context.betAmount.mul(context.usdExchangeRate);
            await this.tierService.execute(gameRound.userId, rollingAmountUsd);
            this.logger.log(`티어 롤링 누적: userId=${gameRound.userId}, amount=${rollingAmountUsd}`);
        } catch (error) {
            this.logger.error(`티어 롤링 실패: ${error.message}`, error.stack);
        }
    }

    private async processCompEarning(gameRound: GameRoundPostProcessContext, context: ProcessingContext) {
        try {
            if (context.compRate.gt(0)) {
                const compAmount = context.betAmount.mul(context.compRate);
                if (compAmount.gt(0)) {
                    await this.earnCompService.execute({
                        userId: gameRound.userId,
                        currency: gameRound.currency as ExchangeCurrencyCode,
                        amount: compAmount,
                        referenceId: gameRound.id.toString(),
                        description: `Game Comp: ${gameRound.id}`,
                    });
                    this.logger.log(`콤프 적립: userId=${gameRound.userId}, amount=${compAmount}`);
                }
            }
        } catch (error) {
            this.logger.error(`콤프 적립 실패: ${error.message}`, error.stack);
        }
    }
}
