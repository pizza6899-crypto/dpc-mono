import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ClsService } from 'nestjs-cls';
import {
  InjectTransaction,
  Transactional,
} from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { Logger, OnApplicationShutdown } from '@nestjs/common';
import { Prisma, TransactionStatus } from '@prisma/client';
import { CasinoQueueNames, GamePostProcessData } from '../casino-queue.types';
import { ProcessWageringContributionService } from 'src/modules/wagering/application';
import { AnalyticsQueueService } from 'src/modules/analytics/application';
import { AddUserRollingService } from 'src/modules/tier/application/add-user-rolling.service';
import { EarnCompService } from 'src/modules/comp/application/earn-comp.service';

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
      // 1. 트랜잭션 및 게임 트랜잭션 정보 조회
      const gameRound = await this.tx.gameRound.findUnique({
        where: {
          id: BigInt(gameRoundId),
        },
        select: {
          id: true,
          userId: true,
          provider: true,
          totalBetAmountInGameCurrency: true,
          totalBetAmountInWalletCurrency: true,
          totalWinAmountInWalletCurrency: true,
          totalPushAmount: true,
          tieBetAmount: true,
          completedAt: true,
          gameSession: {
            select: {
              usdExchangeRate: true,
              compRate: true, // Fetch compRate
            },
          },
          transaction: {
            select: {
              currency: true,
              status: true,
            },
          },
          casinoGameV2: {
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

      if (!gameRound.transaction) {
        throw new Error(`게임 트랜잭션을 찾을 수 없습니다: ${gameRoundId}`);
      }

      if (gameRound.transaction.status !== TransactionStatus.COMPLETED) {
        this.logger.warn(
          `게임 트랜잭션 상태가 완료가 아닙니다: ${gameRoundId}, status=${gameRound.transaction.status}`,
        );
        return {
          success: true,
          message: `게임 트랜잭션 상태가 완료가 아니므로 처리 건너뜀: ${gameRoundId}, status=${gameRound.transaction.status}`,
        };
      }

      const userId = gameRound.userId;
      const currency = gameRound.transaction.currency;
      const provider = gameRound.provider; // GameRound 엔티티에 provider가 있다고 가정 (혹은 gameSession 통해)
      // 만약 GameRound에 provider 필드가 없다면 조회 쿼리 수정 필요.
      // 쿼리 확인: select 절에 provider 추가 필요.

      // 라이브 카지노(에볼루션, PP라이브 등)는 푸시 베팅(무승부) 여부를 확인
      // job.data.waitForPushBet가 true로 오거나, provider가 라이브 카지노인 경우
      const isLiveCasino = [
        'EVOLUTION',
        'EVOLUTION_ASIA',
        'EVOLUTION_KOREA',
        'EVOLUTION_INDIA',
        'PRAGMATIC_PLAY_LIVE'
      ].includes(provider);

      const shouldWaitForPushBet = isLiveCasino;

      // waitForPushBet가 true이고 totalPushAmount 또는 tieBetAmount가 null이면 대기
      if (
        shouldWaitForPushBet &&
        (!gameRound.totalPushAmount || !gameRound.tieBetAmount)
      ) {
        throw new Error(
          `푸시 베팅 정보가 아직 준비되지 않음: ${gameRoundId} (LiveCasino=${isLiveCasino})`,
        );
      }

      // 2. 베팅 금액 계산 (푸시가 있으면 제외)
      let betAmountForProcessing = gameRound.totalBetAmountInGameCurrency
        ? new Prisma.Decimal(gameRound.totalBetAmountInGameCurrency)
        : new Prisma.Decimal(0);

      // 푸시 베팅이 있는 경우 제외
      if (gameRound.totalPushAmount) {
        betAmountForProcessing = betAmountForProcessing.sub(
          gameRound.totalPushAmount,
        );
      }

      // 베팅 금액이 0 이하이면 처리하지 않음
      if (betAmountForProcessing.lte(0)) {
        return {
          success: true,
          message: '베팅 금액이 0 이하여서 처리 건너뜀',
        };
      }

      // 3. 기여도 금액 계산
      const contributionRate =
        gameRound.casinoGameV2?.contributionRate || new Prisma.Decimal(0);
      const contributionAmount = betAmountForProcessing.mul(contributionRate);

      // 4. 콤프 처리
      //   if (contributionAmount.gt(0) && gameTransaction.betTime) {
      //     // betTime을 동경시 기준 날짜로 변환
      //     const betTimeUtc = DateTime.fromFormat(
      //       gameTransaction.betTime,
      //       'yyyy-MM-dd HH:mm:ss',
      //       { zone: 'utc' },
      //     );
      //     const betTimeJst = betTimeUtc.setZone('Asia/Tokyo');
      //     const earnDate = betTimeJst.startOf('day').toJSDate();

      //     await this.compService.earnComp(userId, contributionAmount, earnDate);
      //     this.logger.log(
      //       `콤프 적립 완료: userId=${userId}, contributionAmount=${contributionAmount}, gameTransactionId=${gameTransactionId}`,
      //     );
      //   }

      // 5. 롤링 처리
      await this.wageringService.execute({
        userId,
        currency,
        gameRoundId: BigInt(gameRoundId),
        betAmount: betAmountForProcessing,
        gameContributionRate: gameRound.casinoGameV2?.contributionRate?.toNumber(),
      });

      // --- 통계 기록 추가 ---
      const categoryMap: Record<string, 'slot' | 'live' | 'other'> = {
        ['SLOTS']: 'slot',
        ['LIVE_CASINO']: 'live',
      };

      await this.analyticsQueue.enqueueGame({
        userId,
        currency,
        betAmount: gameRound.totalBetAmountInWalletCurrency,
        winAmount: gameRound.totalWinAmountInWalletCurrency,
        category: gameRound.casinoGameV2?.categoryItems?.[0]?.category?.code
          ? categoryMap[gameRound.casinoGameV2.categoryItems[0].category.code] || 'other'
          : 'other',
        date: gameRound.completedAt || new Date(),
      });

      this.logger.log(
        `롤링 및 통계 처리 완료: userId=${userId}, betAmount=${betAmountForProcessing}, gameRoundId=${gameRoundId}`,
      );

      // 6. VIP 티어 업데이트 (롤링 누적)
      try {
        // 세션에 저장된 환율(Play Currency -> USD)을 사용하여 USD 기준 롤링 금액 계산
        const usdExchangeRate =
          gameRound.gameSession?.usdExchangeRate || new Prisma.Decimal(1);
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
        const compRate = gameRound.gameSession?.compRate; // Use optional chaining for gameSession
        if (compRate && compRate.greaterThan(0)) {
          const compAmount = betAmountForProcessing.mul(compRate);
          if (compAmount.greaterThan(0)) {
            await this.earnCompService.execute({
              userId: gameRound.userId,
              currency: gameRound.transaction.currency, // Use currency from transaction
              amount: compAmount,
              referenceId: gameRound.id.toString(),
              description: `Game Comp: ${gameRound.id}`,
              // TODO: If we want to store USD value of comp, we might need conversion, 
              // but for now we follow the plan: Comp Currency = Wallet Currency (1:1 value)
            });
            this.logger.log(
              `콤프 적립 완료: userId=${userId}, compAmount=${compAmount}, gameRoundId=${gameRoundId}`,
            );
          }
        }
      } catch (error) {
        this.logger.error(`Failed to process comp earning: ${error.message}`, error.stack);
      }

      // 8. 게임 트랜잭션에 기여도 및 콤프 정보 업데이트
      //   await this.tx.gameTransaction.update({
      //     where: { id: gameTransaction.id },
      //     data: {
      //       contributionAmount: contributionAmount,
      //       compEarned: contributionAmount.gt(0)
      //         ? contributionAmount.mul(
      //             (await this.getCompRate(userId)) || new Decimal(0),
      //           )
      //         : new Decimal(0),
      //     },
      //   });

      return {
        success: true,
        message: '게임 후처리 완료',
      };
    } catch (error) {
      this.logger.error(error, `게임 후처리 실패: gameRoundId=${gameRoundId}`);
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
