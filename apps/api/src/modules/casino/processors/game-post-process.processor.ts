import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ClsService } from 'nestjs-cls';
import {
  QueueNames,
  GamePostProcessData,
} from 'src/infrastructure/queue/queue.types';
import {
  InjectTransaction,
  Transactional,
} from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { Logger, OnApplicationShutdown } from '@nestjs/common';
import { Prisma, TransactionStatus } from '@repo/database';
import { ProcessWageringContributionService } from '../../wagering/application/process-wagering-contribution.service';

@Processor(QueueNames.GAME_POST_PROCESS)
export class GamePostProcessProcessor
  extends WorkerHost
  implements OnApplicationShutdown {
  private readonly logger = new Logger(GamePostProcessProcessor.name);

  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly cls: ClsService,
    private readonly wageringService: ProcessWageringContributionService,
  ) {
    super();
  }

  async process(job: Job<GamePostProcessData>) {
    return this.cls.run(() => this.processJob(job));
  }

  @Transactional()
  private async processJob(job: Job<GamePostProcessData>) {
    const { gameRoundId, waitForPushBet } = job.data;

    try {
      // 1. 트랜잭션 및 게임 트랜잭션 정보 조회
      const gameRound = await this.tx.gameRound.findUnique({
        where: {
          id: BigInt(gameRoundId),
        },
        select: {
          id: true,
          userId: true,
          totalBetAmountInGameCurrency: true,
          totalPushAmount: true,
          tieBetAmount: true,
          transaction: {
            select: {
              currency: true,
              status: true,
            },
          },
          casinoGame: {
            select: {
              contributionRate: true,
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

      // waitForPushBet가 true이고 totalPushAmount 또는 tieBetAmount가 null이면 대기
      if (
        waitForPushBet &&
        (!gameRound.totalPushAmount || !gameRound.tieBetAmount)
      ) {
        throw new Error(
          `푸시 베팅 정보가 아직 준비되지 않음: ${gameRoundId}`,
        );
      }

      const userId = gameRound.userId;
      const currency = gameRound.transaction.currency;

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
        gameRound.casinoGame?.contributionRate || new Prisma.Decimal(0);
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
        gameContributionRate: gameRound.casinoGame?.contributionRate?.toNumber(),
      });
      this.logger.log(
        `롤링 처리 완료: userId=${userId}, betAmount=${betAmountForProcessing}, gameRoundId=${gameRoundId}`,
      );

      // 6. VIP 레벨 업데이트 (롤링 누적)
      //   await this.vipMembershipService.updateAccumulatedRolling(
      //     userId,
      //     betAmountForProcessing,
      //   );
      //   this.logger.log(
      //     `VIP 롤링 누적 완료: userId=${userId}, rollingAmount=${betAmountForProcessing}, transactionId=${transactionId}`,
      //   );

      // 7. 게임 트랜잭션에 기여도 및 콤프 정보 업데이트
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
        'WhitecliffFetchGameResultUrlProcessor가 정상적으로 종료되었습니다.',
      );
    } catch (error) {
      this.logger.error(
        'WhitecliffFetchGameResultUrlProcessor 종료 중 오류 발생',
        error,
      );
      // 에러가 발생해도 프로세스를 종료할 수 있도록 에러를 다시 throw하지 않음
    }
  }
}
