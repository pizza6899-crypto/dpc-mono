// apps/api/src/modules/notification/infrastructure/processors/email.processor.ts

import { Processor } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ChannelSendParams } from '../../common';
import { EmailSender } from '../channels/email/email.sender';
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

const queueConfig = getQueueConfig(BULLMQ_QUEUES.NOTIFICATION.EMAIL);

interface NotificationJobData {
  logId: string;
  logCreatedAt: string;
}

@Processor(queueConfig.processorOptions, queueConfig.workerOptions)
export class EmailProcessor extends BaseProcessor<NotificationJobData, void> {
  protected readonly logger = new Logger(EmailProcessor.name);

  constructor(
    @Inject(NOTIFICATION_LOG_REPOSITORY)
    private readonly notificationLogRepository: NotificationLogRepositoryPort,
    private readonly emailSender: EmailSender,
    protected readonly cls: ClsService,
  ) {
    super();
  }

  @Transactional()
  protected async processJob(job: Job<NotificationJobData>): Promise<void> {
    const { data } = job;
    this.logger.debug(`Processing email job ${job.id} for log ${data.logId}`);

    const log = await this.notificationLogRepository.getById(
      new Date(data.logCreatedAt),
      BigInt(data.logId),
    );

    // 발송 시작 상태 업데이트
    log.markAsSending();
    await this.notificationLogRepository.update(log);

    // 채널 Sender 파라미터 구성
    const sendParams: ChannelSendParams = {
      logId: log.id!,
      logCreatedAt: log.createdAt,
      receiverId: log.receiverId,
      target: log.target,
      title: log.title || '',
      body: log.body || '',
      actionUri: log.actionUri,
      metadata: log.metadata,
    };

    // 발송
    try {
      await this.emailSender.send(sendParams);

      // 성공 상태 업데이트
      log.markAsSuccess();
      await this.notificationLogRepository.update(log);

      this.logger.debug(`Successfully sent email for log ${log.id}`);
    } catch (error: any) {
      // 실패 상태 업데이트
      log.markAsFailed(error.message || 'Email sending failed');
      await this.notificationLogRepository.update(log);

      // BullMQ가 에러를 감지하고 설정된 정책(예: 지수 백오프)에 따라 재시도하도록 에러 재발생
      throw error;
    }
  }
}
