import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EnvService } from '../../../../common/env/env.service';
import {
  PushedBetHistoryResponse,
  WhitecliffApiService,
} from 'src/modules/casino/whitecliff/infrastructure/whitecliff-api.service';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { nowUtcMinus } from 'src/utils/date.util';
import { ConcurrencyService } from '../../../../common/concurrency/concurrency.service';
import { WhitecliffMapperService } from 'src/modules/casino/whitecliff/infrastructure/whitecliff-mapper.service';
import { RedisService } from 'src/infrastructure/redis/redis.service';
import {
  GameAggregatorType,
  GameProvider,
  Prisma,
  TransactionStatus,
} from '@repo/database';
import { GamingCurrencyCode } from 'src/utils/currency.util';

@Injectable()
export class WhitecliffPushedBetHistoryScheduler {
  private readonly logger = new Logger(
    WhitecliffPushedBetHistoryScheduler.name,
  );

  private readonly LAST_PROCESSED_TIME_KEY_PREFIX =
    'whitecliff:pushed-bet-history:last-processed';

  constructor(
    private readonly envService: EnvService,
    private readonly whitecliffApiService: WhitecliffApiService,
    private readonly prismaService: PrismaService,
    private readonly concurrencyService: ConcurrencyService,
    private readonly whitecliffMapperService: WhitecliffMapperService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 1분마다 푸시 베팅 내역을 조회하여 게임 트랜잭션을 업데이트합니다.
   * Evolution Live Casino - Baccarat 및 Blackjack 전용
   * 다중 인스턴스 환경에서 중복 실행 방지
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async updatePushedBetHistory() {
    // 스케줄러가 비활성화된 경우 실행하지 않음
    if (!this.envService.scheduler.enabled) {
      return;
    }

    // 푸시 베팅 내역 스케줄러가 비활성화된 경우 실행하지 않음
    if (!this.envService.scheduler.whitecliffPushedBetHistoryEnabled) {
      return;
    }

    // 글로벌 락을 사용하여 다중 인스턴스 환경에서 중복 실행 방지
    const lock = await this.concurrencyService.acquireGlobalLock(
      'whitecliff-pushed-bet-history-scheduler',
      {
        ttl: 300, // 5분 TTL (스케줄러 실행 시간보다 충분히 길게)
        retryCount: 0, // 락 획득 실패 시 즉시 종료
      },
    );

    if (!lock) {
      this.logger.debug(
        '다른 인스턴스에서 이미 푸시 베팅 내역 스케줄러가 실행 중입니다.',
      );
      return;
    }

    try {
      const endDate =
        nowUtcMinus({ seconds: 30 }).toISOString().slice(0, -5) + 'Z';
      const endDateObj = new Date(endDate);

      // env에서 모든 whitecliff 설정을 가져와서 각각 처리
      const whitecliffConfigs = this.envService.whitecliff;

      for (const config of whitecliffConfigs) {
        // API가 비활성화된 설정은 스킵
        if (!config.apiEnabled) {
          this.logger.debug(
            `Whitecliff 설정이 비활성화됨: currency=${config.currency}`,
          );
          continue;
        }

        const gameCurrency =
          this.whitecliffMapperService.convertWhitecliffCurrencyToGamingCurrency(
            config.currency,
          );

        // Evolution Live Casino 게임들 (Baccarat, Blackjack 등)
        // currency에 따라 다른 product ID 사용
        const liveCasinoProductIds =
          gameCurrency === 'KRW' ? [31] : gameCurrency === 'IDR' ? [29] : [1];

        for (const prdId of liveCasinoProductIds) {
          // 마지막 처리 시간 조회
          const lastProcessedTime = await this.getLastProcessedTime(
            gameCurrency,
            prdId,
          );

          // 마지막 처리 시간이 있으면 그 이후부터, 없으면 최근 2시간만
          const initialStartDate = lastProcessedTime
            ? new Date(lastProcessedTime)
            : nowUtcMinus({ minutes: 120 });

          // 한 번의 호출에서는 최대 2시간 범위만 처리
          const maxGapMs = 2 * 60 * 60 * 1000; // 2시간을 밀리초로
          const currentEnd = new Date(
            Math.min(
              initialStartDate.getTime() + maxGapMs,
              endDateObj.getTime(),
            ),
          );

          const startDateStr =
            initialStartDate.toISOString().slice(0, -5) + 'Z';
          const endDateStr = currentEnd.toISOString().slice(0, -5) + 'Z';

          this.logger.debug(
            `제품 ${prdId} 처리: ${startDateStr} ~ ${endDateStr}`,
          );

          const success = await this.processPushedBetHistoryForProduct({
            gameCurrency,
            prdId,
            startDate: startDateStr,
            endDate: endDateStr,
          });

          // 처리 성공한 경우에만 마지막 처리 시간 업데이트
          if (success) {
            await this.setLastProcessedTime(gameCurrency, prdId, endDateStr);
          }
        }
      }
    } catch (error) {
      this.logger.error(error, `푸시 베팅 내역 업데이트 스케줄러 실패`);
    } finally {
      // 락 해제
      await this.concurrencyService.releaseLock(lock);
    }
  }

  /**
   * 특정 제품에 대한 푸시 베팅 내역을 처리합니다.
   * @returns 처리 성공 여부
   */
  private async processPushedBetHistoryForProduct({
    gameCurrency,
    prdId,
    startDate,
    endDate,
  }: {
    gameCurrency: GamingCurrencyCode;
    prdId: number;
    startDate: string;
    endDate: string;
  }): Promise<boolean> {
    try {
      // API 호출만 (분당 1회 제한)
      const response = await this.whitecliffApiService.getPushedBetHistory({
        gameCurrency,
        prd_id: prdId,
        start_date: startDate,
        end_date: endDate,
      });

      if (response.status !== '1') {
        this.logger.warn(`API 실패: status=${response.status}`);
        return false; // 실패 시 false 반환
      }

      const pushedBetHistory = (
        response as PushedBetHistoryResponse
      ).data?.filter(
        (pushedBet) => pushedBet.total_pushed_amt > 0 || pushedBet.tie_amt > 0,
      );

      // API 응답에 포함된 txn_id Set 생성
      const apiResponseTxIds = new Set<string>();
      if (pushedBetHistory && pushedBetHistory.length > 0) {
        for (const pushedBet of pushedBetHistory) {
          apiResponseTxIds.add(pushedBet.txn_id);
        }
      }

      // API 응답에 포함된 트랜잭션 처리
      if (pushedBetHistory && pushedBetHistory.length > 0) {
        for (const pushedBet of pushedBetHistory) {
          const gameTransaction = await this.prismaService.gameRound.findUnique(
            {
              where: {
                aggregatorTxId_aggregatorType: {
                  aggregatorTxId: pushedBet.txn_id,
                  aggregatorType: GameAggregatorType.WHITECLIFF,
                },
              },
              select: {
                id: true,
                totalPushAmount: true,
              },
            },
          );

          if (!gameTransaction || gameTransaction.totalPushAmount !== null) {
            continue; // 이미 처리됨
          }

          // 푸시 베팅 금액 업데이트
          await this.prismaService.gameRound.update({
            where: { id: gameTransaction.id },
            data: {
              totalPushAmount: new Prisma.Decimal(pushedBet.total_pushed_amt),
              tieBetAmount: new Prisma.Decimal(pushedBet.tie_amt),
            },
          });
        }
      }

      // API 응답에 포함되지 않은 에볼루션 게임 트랜잭션을 0, 0으로 업데이트
      // (바카라/블랙잭이 아닌 게임들)
      await this.updateMissingPushBetTransactions({
        gameCurrency,
        prdId,
        startDate,
        endDate,
        apiResponseTxIds,
      });

      return true; // 성공 시 true 반환
    } catch (error) {
      this.logger.error(error, `제품 ${prdId} 푸시 베팅 내역 처리 실패`);
      return false; // 예외 발생 시 false 반환
    }
  }

  /**
   * API 응답에 포함되지 않은 에볼루션 게임 트랜잭션을 0, 0으로 업데이트합니다.
   * (바카라/블랙잭이 아닌 게임들)
   */
  private async updateMissingPushBetTransactions({
    gameCurrency,
    prdId,
    startDate,
    endDate,
    apiResponseTxIds,
  }: {
    gameCurrency: GamingCurrencyCode;
    prdId: number;
    startDate: string;
    endDate: string;
    apiResponseTxIds: Set<string>;
  }) {
    try {
      // 해당 시간 범위 내의 에볼루션 게임 트랜잭션 조회
      // (totalPushAmount가 null이고, API 응답에 포함되지 않은 것들)
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      const missingTransactions = await this.prismaService.gameRound.findMany({
        where: {
          aggregatorType: GameAggregatorType.WHITECLIFF,
          provider: GameProvider.EVOLUTION,
          totalPushAmount: null, // 아직 처리되지 않은 것들
          transaction: {
            currency: gameCurrency,
            status: TransactionStatus.COMPLETED,
            createdAt: {
              gte: startDateObj,
              lte: endDateObj,
            },
          },
          game: {
            provider: GameProvider.EVOLUTION,
          },
        },
        select: {
          id: true,
          aggregatorTxId: true,
        },
      });

      // API 응답에 포함되지 않은 트랜잭션만 필터링
      const toUpdate = missingTransactions.filter(
        (tx) => !apiResponseTxIds.has(tx.aggregatorTxId),
      );

      if (toUpdate.length === 0) {
        return;
      }

      this.logger.log(
        `API 응답에 포함되지 않은 에볼루션 게임 트랜잭션 ${toUpdate.length}개를 0, 0으로 업데이트합니다.`,
      );

      // 배치 업데이트
      for (const tx of toUpdate) {
        await this.prismaService.gameRound.update({
          where: { id: tx.id },
          data: {
            totalPushAmount: new Prisma.Decimal(0),
            tieBetAmount: new Prisma.Decimal(0),
          },
        });
      }

      this.logger.log(
        `업데이트 완료: ${toUpdate.length}개의 트랜잭션이 0, 0으로 설정되었습니다.`,
      );
    } catch (error) {
      this.logger.error(error, `누락된 푸시 베팅 트랜잭션 업데이트 실패`);
    }
  }

  /**
   * 마지막 처리 시간을 조회합니다.
   */
  private async getLastProcessedTime(
    gameCurrency: GamingCurrencyCode,
    prdId: number,
  ): Promise<string | null> {
    const key = `${this.LAST_PROCESSED_TIME_KEY_PREFIX}:${gameCurrency}:${prdId}`;
    return await this.redisService.get<string>(key);
  }

  /**
   * 마지막 처리 시간을 저장합니다.
   */
  private async setLastProcessedTime(
    gameCurrency: GamingCurrencyCode,
    prdId: number,
    processedTime: string,
  ): Promise<void> {
    const key = `${this.LAST_PROCESSED_TIME_KEY_PREFIX}:${gameCurrency}:${prdId}`;
    // 1일 TTL (충분히 긴 시간)
    await this.redisService.set(key, processedTime, 24 * 60 * 60);
  }
}
