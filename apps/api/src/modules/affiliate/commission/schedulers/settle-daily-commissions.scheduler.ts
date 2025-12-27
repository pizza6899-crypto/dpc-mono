// src/modules/affiliate/commission/schedulers/settle-daily-commissions.scheduler.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EnvService } from 'src/platform/env/env.service';
import { ConcurrencyService } from 'src/platform/concurrency/concurrency.service';
import { SettleDailyCommissionsService } from '../application/settle-daily-commissions.service';
import { nowUtc } from 'src/utils/date.util';

@Injectable()
export class SettleDailyCommissionsScheduler {
  private readonly logger = new Logger(SettleDailyCommissionsScheduler.name);

  constructor(
    private readonly settleDailyCommissionsService: SettleDailyCommissionsService,
    private readonly envService: EnvService,
    private readonly concurrencyService: ConcurrencyService,
  ) {}

  /**
   * 매일 새벽 1시에 전날 커미션 정산 처리
   * - 전날 날짜 기준으로 PENDING 커미션을 AVAILABLE로 변경
   * - 월렛의 pendingBalance를 availableBalance로 이동
   * - 실행 시간: 매일 01:00 UTC (크론 표현식: '0 1 * * *')
   *   필요시 코드에서 크론 표현식을 수정하여 실행 시간 변경 가능
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async settleDailyCommissions() {
    // 스케줄러가 비활성화된 경우 실행하지 않음
    if (!this.envService.scheduler.enabled) {
      this.logger.debug('스케줄러가 비활성화되어 있습니다.');
      return;
    }

    // 커미션 정산 스케줄러가 비활성화된 경우 실행하지 않음
    if (!this.envService.scheduler.settleDailyCommissionsEnabled) {
      this.logger.debug('커미션 정산 스케줄러가 비활성화되어 있습니다.');
      return;
    }

    // 다중 인스턴스에서 중복 실행 방지용 글로벌 락
    const lock = await this.concurrencyService.acquireGlobalLock(
      'settle-daily-commissions-scheduler',
      {
        ttl: 3600, // 1시간 (정산 작업이 오래 걸릴 수 있음)
        retryCount: 0, // 락 못 잡으면 바로 종료
      },
    );

    if (!lock) {
      this.logger.debug(
        '다른 인스턴스에서 이미 커미션 정산 스케줄러가 실행 중입니다.',
      );
      return;
    }

    try {
      // 전날 날짜 기준으로 정산 (UTC 기준)
      const settlementDate = new Date(nowUtc());
      settlementDate.setUTCDate(settlementDate.getUTCDate() - 1);
      settlementDate.setUTCHours(0, 0, 0, 0); // 전날 00:00:00 UTC

      this.logger.log(
        `일일 커미션 정산 시작 - 정산 기준일: ${settlementDate.toISOString()}`,
      );

      const result = await this.settleDailyCommissionsService.execute({
        settlementDate,
      });

      this.logger.log(
        `일일 커미션 정산 완료 - 정산 건수: ${result.settledCount}, 총 금액: ${result.totalAmount.toString()}`,
      );
    } catch (error) {
      this.logger.error('일일 커미션 정산 중 오류 발생', error);
      // 에러 발생 시 로깅하고 다음 실행까지 대기 (스케줄러는 계속 실행됨)
    } finally {
      await this.concurrencyService.releaseLock(lock);
    }
  }
}
