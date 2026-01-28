// src/modules/affiliate/commission/schedulers/settle-daily-commissions.scheduler.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EnvService } from 'src/common/env/env.service';
import { ConcurrencyService } from 'src/common/concurrency/concurrency.service';
import { GlobalLockKey } from 'src/common/concurrency/concurrency.constants';
import { SettleDailyCommissionsService } from '../application/settle-daily-commissions.service';
import { nowUtc } from 'src/utils/date.util';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class SettleDailyCommissionsScheduler {
  private readonly logger = new Logger(SettleDailyCommissionsScheduler.name);

  constructor(
    private readonly settleDailyCommissionsService: SettleDailyCommissionsService,
    private readonly envService: EnvService,
    private readonly concurrencyService: ConcurrencyService,
    private readonly cls: ClsService,
  ) { }

  /**
   * 매일 새벽 1시에 전날 커미션 정산 처리
   * - 전날 날짜 기준으로 PENDING 커미션을 AVAILABLE로 변경
   * - 월렛의 pendingBalance를 availableBalance로 이동
   * - 실행 시간: 매일 01:00 UTC (크론 표현식: '0 1 * * *')
   *   필요시 코드에서 크론 표현식을 수정하여 실행 시간 변경 가능
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async settleDailyCommissions() {
    await this.cls.run(async () => {
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
      await this.concurrencyService.runExclusive(
        GlobalLockKey.AFFILIATE_DAILY_COMMISSION,
        async () => {
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
        },
        {
          timeoutSeconds: 3600, // 1시간 (정산 작업이 오래 걸릴 수 있음)
        },
      );
    });
  }
}
