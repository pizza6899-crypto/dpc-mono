import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ClsService } from 'nestjs-cls';
import {
  InjectTransaction,
  Transactional,
} from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { Logger, OnApplicationShutdown } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CasinoQueueNames, GamePostProcessData } from '../casino-queue.types';
import { ProcessWageringContributionService } from 'src/modules/wagering/application';
import { AnalyticsQueueService } from 'src/modules/analytics/application';
import { AddUserRollingService } from 'src/modules/tier/application/add-user-rolling.service';
import { EarnCompService } from 'src/modules/comp/application/earn-comp.service';

/**
 * 게임 후처리 큐 정책
 */
export const GamePostProcessPolicy = {
  attempts: 999999, // 무거운 작업이므로 성공할 때까지 무제한 시도
  delay: 5000,
  backoff: {
    type: 'fixed' as const,
    delay: 5000,
  },
};

@Processor(CasinoQueueNames.GAME_POST_PROCESS)
export class GamePostProcessProcessor
  extends WorkerHost
  implements OnApplicationShutdown {
  private readonly logger = new Logger(GamePostProcessProcessor.name);

  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly cls: ClsService,
    private readonly wageringService: ProcessWageringContributionService,
    private readonly analyticsQueue: AnalyticsQueueService,
    private readonly tierService: AddUserRollingService,
    private readonly earnCompService: EarnCompService,
  ) {
    super();
  }

  async process(job: Job<GamePostProcessData>) {
    return this.cls.run(() => this.processJob(job));
  }

  @Transactional()
  private async processJob(job: Job<GamePostProcessData>) {
    const { gameRoundId } = job.data;

    try {
      // 1. 게임 라운드 V2 조회 (Snowflake ID이므로 id로 조회 가능하지만 파티셔닝 키 때문에 findFirst 사용)
      const gameRound = await this.tx.casinoGameRound.findFirst({
        where: {
          id: BigInt(gameRoundId),
        },
        include: {
          gameSession: {
            select: {
              usdExchangeRate: true,
              compRate: true,
            },
          },
          casinoGame: { // casinoGameV2 -> casinoGame
            select: {
              contributionRate: true,
              categoryItems: {
                where: { isPrimary: true },
                select: {
                  category: {
                    select: {
                      code: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!gameRound) {
        throw new Error(`게임 라운드를 찾을 수 없습니다: ${gameRoundId}`);
      }

      // 2. 완료 여부 체크
      if (!gameRound.isCompleted) {
        this.logger.warn(
          `게임 라운드가 아직 완료되지 않았습니다: ${gameRoundId}, isCompleted=false`,
        );
        return {
          success: true,
          message: `게임 라운드가 완료되지 않아 처리 건너뜀: ${gameRoundId}`,
        };
      }

      // -------------------------------------------------------------
      // 라이브 카지노 푸시 베팅 검증 (Evolution 등)
      // -------------------------------------------------------------
      const isLiveCasino = gameRound.casinoGame?.categoryItems?.[0]?.category?.code === 'LIVE_CASINO';

      // 라이브 카지노이면서, 아직 푸시 체크가 안 되었고, 라운드 완료 후 5분이 지나지 않았다면 재시도
      if (isLiveCasino && !gameRound.pushedBetCheckedAt) {
        const completedTime = gameRound.completedAt ? gameRound.completedAt.getTime() : 0;
        const now = Date.now();
        const diffMinutes = (now - completedTime) / 1000 / 60;

        // 5분 타임아웃 (무한 대기 방지)
        if (diffMinutes < 5) {
          throw new Error(`라이브 카지노 푸시 검증 대기 중: ${gameRoundId}`);
        } else {
          this.logger.warn(
            `라이브 카지노 푸시 검증 시간 초과(5분), 강제 진행: ${gameRoundId}`,
          );
        }
      }

      const userId = gameRound.userId;
      const currency = gameRound.currency;

      // 3. 실질 베팅 금액 계산 (Wallet Currency 기준)
      // V2에서는 totalBetAmount에 총 베팅액이, totalRefundAmount에 환불액이 집계되어 있음.
      // 넷 베팅액 = 총 베팅 - 환불
      let betAmountForProcessing = new Prisma.Decimal(gameRound.totalBetAmount);

      // if (gameRound.totalRefundAmount && gameRound.totalRefundAmount.gt(0)) {
      //   betAmountForProcessing = betAmountForProcessing.sub(gameRound.totalRefundAmount);
      // }

      // 베팅 금액이 0 이하이면 처리하지 않음
      if (betAmountForProcessing.lte(0)) {
        return {
          success: true,
          message: '유효 베팅 금액이 0 이하여서 처리 건너뜀',
        };
      }

      // 4. 롤링 처리
      await this.wageringService.execute({
        userId,
        currency,
        gameRoundId: BigInt(gameRoundId),
        betAmount: betAmountForProcessing,
        gameContributionRate: gameRound.casinoGame?.contributionRate?.toNumber() ?? 1,
      });

      // 5. 통계 기록 추가
      const categoryMap: Record<string, 'slot' | 'live' | 'other'> = {
        ['SLOTS']: 'slot',
        ['LIVE_CASINO']: 'live',
      };

      const categoryCode = gameRound.casinoGame?.categoryItems?.[0]?.category?.code;

      await this.analyticsQueue.enqueueGame({
        userId,
        currency,
        betAmount: betAmountForProcessing, // 환불 제외된 금액
        winAmount: gameRound.totalWinAmount,
        category: categoryCode ? (categoryMap[categoryCode] || 'other') : 'other',
        date: gameRound.completedAt || new Date(),
      });

      this.logger.log(
        `롤링 및 통계 처리 완료: userId=${userId}, betAmount=${betAmountForProcessing}, gameRoundId=${gameRoundId}`,
      );

      // 6. VIP 티어 업데이트 (롤링 누적)
      try {
        // 라운드 스냅샷에 저장된 USD 환율 사용
        const usdExchangeRate = gameRound.usdExchangeRate.eq(0)
          ? (gameRound.gameSession?.usdExchangeRate || new Prisma.Decimal(1))
          : gameRound.usdExchangeRate;

        const rollingAmountUsd = betAmountForProcessing.mul(usdExchangeRate);

        await this.tierService.execute(gameRound.userId, rollingAmountUsd);
        this.logger.log(
          `티어 롤링 누적 완료: userId=${userId}, rollingAmountUsd=${rollingAmountUsd}, rate=${usdExchangeRate}`,
        );
      } catch (error) {
        this.logger.error(`Failed to process tier rolling: ${error.message}`, error.stack);
      }

      // 7. Comp Accumulation
      try {
        // 라운드 스냅샷에 콤프율이 있으면 사용, 없으면 세션 값 사용, 그래도 없으면 0
        const compRate = gameRound.compRate.gt(0)
          ? gameRound.compRate
          : (gameRound.gameSession?.compRate || new Prisma.Decimal(0));

        if (compRate.greaterThan(0)) {
          const compAmount = betAmountForProcessing.mul(compRate);
          if (compAmount.greaterThan(0)) {
            await this.earnCompService.execute({
              userId: gameRound.userId,
              currency: gameRound.currency,
              amount: compAmount,
              referenceId: gameRound.id.toString(),
              description: `Game Comp: ${gameRound.id}`,
            });
            this.logger.log(
              `콤프 적립 완료: userId=${userId}, compAmount=${compAmount}, gameRoundId=${gameRoundId}`,
            );
          }
        }
      } catch (error) {
        this.logger.error(`Failed to process comp earning: ${error.message}`, error.stack);
      }

      // V2에서는 CasinoGameTransaction 업데이트 불필요 (이미 CasinoGameRound에 집계됨)
      // 추후 필요하다면 CasinoGameRound.compEarned 등을 업데이트할 수 있음

      return {
        success: true,
        message: '게임 후처리 완료',
      };
    } catch (error) {
      this.logger.error(`게임 후처리 실패: gameRoundId=${gameRoundId}`, error.stack);
      throw error;
    }
  }

  async onApplicationShutdown(signal?: string) {
    try {
      if (!this.worker) {
        return;
      }

      // 새로운 작업을 가져오지 않도록 중지
      // worker.close()는 자동으로 이를 처리하지만, 명시적으로 로깅
      await this.worker.close();

      this.logger.log(
        'GamePostProcessProcessor가 정상적으로 종료되었습니다.',
      );
    } catch (error) {
      this.logger.error(
        'GamePostProcessProcessor 종료 중 오류 발생',
        error,
      );
      // 에러가 발생해도 프로세스를 종료할 수 있도록 에러를 다시 throw하지 않음
    }
  }
}
