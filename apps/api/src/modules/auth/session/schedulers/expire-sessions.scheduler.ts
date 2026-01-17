// src/modules/auth/session/schedulers/expire-sessions.scheduler.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EnvService } from 'src/common/env/env.service';
import { ConcurrencyService } from 'src/common/concurrency/concurrency.service';
import { ExpireSessionsBatchService } from '../application/expire-sessions-batch.service';

@Injectable()
export class ExpireSessionsScheduler {
  private readonly logger = new Logger(ExpireSessionsScheduler.name);

  constructor(
    private readonly expireSessionsBatchService: ExpireSessionsBatchService,
    private readonly envService: EnvService,
    private readonly concurrencyService: ConcurrencyService,
  ) { }

  /**
   * 매 5분마다 만료된 세션 일괄 처리
   * - 만료 시간이 지난 활성 세션들을 EXPIRED 상태로 변경
   * - Redis 세션 스토어에서 세션 삭제 (HTTP 세션인 경우)
   * - WebSocket 연결 해제 (WebSocket 세션인 경우)
   * - 실행 시간: 매 5분마다
   */
  // @Cron(CronExpression.EVERY_5_MINUTES)
  @Cron(CronExpression.EVERY_SECOND)
  async expireSessions() {
    // 스케줄러가 비활성화된 경우 실행하지 않음
    if (!this.envService.scheduler.enabled) {
      this.logger.debug('스케줄러가 비활성화되어 있습니다.');
      return;
    }

    // 다중 인스턴스에서 중복 실행 방지용 글로벌 락
    const lock = await this.concurrencyService.acquireGlobalLock(
      'expire-sessions-scheduler',
      {
        ttl: 300, // 5분 (작업이 5분 이상 걸리지 않음)
        retryCount: 0, // 락 못 잡으면 바로 종료
      },
    );

    if (!lock) {
      this.logger.debug(
        '다른 인스턴스에서 이미 세션 만료 스케줄러가 실행 중입니다.',
      );
      return;
    }

    try {
      this.logger.log('만료된 세션 일괄 처리 시작');

      const result = await this.expireSessionsBatchService.execute({
        batchSize: 100, // 한 번에 최대 100개 세션 처리
      });

      this.logger.log(
        `만료된 세션 일괄 처리 완료 - 만료 처리된 세션 수: ${result.expiredCount}`,
      );
    } catch (error) {
      this.logger.error('만료된 세션 일괄 처리 중 오류 발생', error);
      // 에러 발생 시 로깅하고 다음 실행까지 대기 (스케줄러는 계속 실행됨)
    } finally {
      await this.concurrencyService.releaseLock(lock);
    }
  }
}

