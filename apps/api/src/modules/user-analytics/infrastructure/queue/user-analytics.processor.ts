import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { BaseProcessor } from 'src/infrastructure/bullmq/base.processor';
import {
  USER_ANALYTICS_QUEUES,
  UserAnalyticsSyncPayload,
} from './user-analytics.bullmq';
import {
  SyncUserAnalyticsService,
  SyncAnalyticsCommand,
} from '../../application/sync/sync-user-analytics.service';
import { Prisma } from '@prisma/client';

/**
 * 전역 통계 동기화 프로세서
 *
 * 지갑 트랜잭션 완료 이벤트를 받아 USD 환산 통계를 업데이트합니다.
 */
@Processor(USER_ANALYTICS_QUEUES.SYNC.name)
export class UserAnalyticsProcessor extends BaseProcessor<UserAnalyticsSyncPayload> {
  protected readonly logger = new Logger(UserAnalyticsProcessor.name);

  constructor(
    protected readonly cls: ClsService,
    private readonly syncService: SyncUserAnalyticsService,
  ) {
    super();
  }

  /**
   * BullMQ 작업(Job) 처리
   */
  async processJob(job: Job<UserAnalyticsSyncPayload>): Promise<void> {
    const { userId, type, amountUsd, timestamp } = job.data;

    // 작업 데이터 유효성 검사 및 타입 변환 (BullMQ 페이로드는 JSON이므로 Decimal 수동 변환 필요)
    const command: SyncAnalyticsCommand = {
      userId: BigInt(userId),
      type,
      amountUsd: new Prisma.Decimal(amountUsd),
      timestamp: new Date(timestamp),
    };

    await this.syncService.sync(command);
  }
}
