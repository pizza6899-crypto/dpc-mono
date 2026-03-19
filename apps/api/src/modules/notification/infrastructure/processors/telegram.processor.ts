// apps/api/src/modules/notification/infrastructure/processors/telegram.processor.ts

import { Processor } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { type NotificationJobData } from '../../common';
import { ClsService } from 'nestjs-cls';
import { Transactional } from '@nestjs-cls/transactional';
import {
  NOTIFICATION_LOG_REPOSITORY,
  type NotificationLogRepositoryPort,
} from '../../inbox/ports';
import { BaseProcessor } from 'src/infrastructure/bullmq/base.processor';
import {
  BULLMQ_QUEUES,
  getQueueConfig,
} from 'src/infrastructure/bullmq/bullmq.constants';

const queueConfig = getQueueConfig(BULLMQ_QUEUES.NOTIFICATION.TELEGRAM);

@Processor(queueConfig.processorOptions, queueConfig.workerOptions)
export class TelegramProcessor extends BaseProcessor<
  NotificationJobData,
  void
> {
  protected readonly logger = new Logger(TelegramProcessor.name);

  constructor(
    @Inject(NOTIFICATION_LOG_REPOSITORY)
    private readonly notificationLogRepository: NotificationLogRepositoryPort,
    protected readonly cls: ClsService,
  ) {
    super();
  }

  @Transactional()
  protected async processJob(job: Job<NotificationJobData>): Promise<void> {
    const { data } = job;
    this.logger.debug(
      `Processing Telegram job ${job.id} for log ${data.logId}`,
    );

    const log = await this.notificationLogRepository.getById(
      new Date(data.logCreatedAt),
      BigInt(data.logId),
    );

    // TODO: Implement Telegram Bot sender
    this.logger.warn(
      `Telegram sender not implemented yet. Skipping log ${log.id}`,
    );

    // 임시로 성공 처리
    log.markAsSuccess();
    await this.notificationLogRepository.update(log);
  }
}
