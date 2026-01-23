import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClsService } from 'nestjs-cls';
import {
  PushedBetHistoryResponse,
  WhitecliffApiService,
} from 'src/modules/casino/providers/whitecliff/infrastructure/whitecliff-api.service';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { nowUtcMinus } from 'src/utils/date.util';
import { WhitecliffMapperService } from 'src/modules/casino/providers/whitecliff/infrastructure/whitecliff-mapper.service';
import { RedisService } from 'src/infrastructure/redis/redis.service';
import {
  GameAggregatorType,
  GameProvider,
  Prisma,
  TransactionStatus,
} from '@prisma/client';
import { GamingCurrencyCode } from 'src/utils/currency.util';
import { ConcurrencyService } from 'src/common/concurrency/concurrency.service';
import { EnvService } from 'src/common/env/env.service';

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
    private readonly cls: ClsService,
  ) { }

  /**
   * 1분마다 푸시 베팅 내역을 조회하여 게임 트랜잭션을 업데이트합니다.
   * Evolution Live Casino - Baccarat 및 Blackjack 전용
   * 다중 인스턴스 환경에서 중복 실행 방지
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async updatePushedBetHistory() {
    await this.cls.run(async () => {
      // 스케줄러가 비활성화된 경우 실행하지 않음
      if (!this.envService.scheduler.enabled) {
        return;
      }

      // 푸시 베팅 내역 스케줄러가 비활성화된 경우 실행하지 않음
      if (!this.envService.scheduler.whitecliffPushedBetHistoryEnabled) {
        return;
      }

      // 글로벌 락을 사용하여 다중 인스턴스 환경에서 중복 실행 방지
      await this.concurrencyService.runExclusive(
        'whitecliff-pushed-bet-history-scheduler',
        async () => {
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
        },
        {
          timeoutSeconds: 300, // 5분 TTL
        },
      );
    });
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
      // API 호출 (분당 1회 제한)
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

      // API 응답에 포함된 트랜잭션 처리
      if (pushedBetHistory && pushedBetHistory.length > 0) {
        for (const pushedBet of pushedBetHistory) {
          // V2 조회: aggregatorRoundId (txn_id) 사용
          // findFirst 사용 (복합키 및 파티셔닝 키 startedAt 몰라서)
          const gameRound = await this.prismaService.gameRoundV2.findFirst({
            where: {
              aggregatorRoundId: pushedBet.txn_id,
              aggregatorType: GameAggregatorType.WHITECLIFF,
            },
            select: {
              id: true,
              startedAt: true, // PK 구성요소
              exchangeRate: true,
              totalGameRefundAmount: true,
            },
          });

          // 이미 처리되었거나(Refund > 0), 라운드를 찾을 수 없으면 건너뜀
          if (
            !gameRound ||
            (gameRound.totalGameRefundAmount &&
              gameRound.totalGameRefundAmount.gt(0))
          ) {
            continue;
          }

          const pushedAmountGame = new Prisma.Decimal(pushedBet.total_pushed_amt);

          // Wallet Currency 환산: GameAmount * ExchangeRate
          const pushedAmountWallet = pushedAmountGame.mul(
            gameRound.exchangeRate,
          );

          // 업데이트 (복합키 사용)
          await this.prismaService.gameRoundV2.update({
            where: {
              id_startedAt: {
                id: gameRound.id,
                startedAt: gameRound.startedAt,
              },
            },
            data: {
              totalGameRefundAmount: pushedAmountGame,
              totalRefundAmount: pushedAmountWallet,
              // tieBetAmount는 V2에 없으므로 resultMeta 등을 활용하거나 생략
              // 여기서는 우선 Refund 금액 반영에 집중
            },
          });
        }
      }

      // NOTE: 기존의 updateMissingPushBetTransactions 로직은 제거함.
      // GameRoundV2 구조에서는 초기값이 0이며,
      // GamePostProcessProcessor가 null 체크 대기 로직 대신 isCompleted를 사용하므로
      // 0으로 강제 초기화할 필요가 없음.

      return true; // 성공 시 true 반환
    } catch (error) {
      this.logger.error(error, `제품 ${prdId} 푸시 베팅 내역 처리 실패`);
      return false; // 예외 발생 시 false 반환
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
