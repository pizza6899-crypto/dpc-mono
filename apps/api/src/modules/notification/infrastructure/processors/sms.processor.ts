// apps/api/src/modules/notification/infrastructure/processors/sms.processor.ts

import { Processor } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ChannelSendParams, type NotificationJobData } from '../../common';
import { SMSSender } from '../channels/sms/sms.sender';
import { ClsService } from 'nestjs-cls';
import { Transactional } from '@nestjs-cls/transactional';
import {
  NOTIFICATION_LOG_REPOSITORY,
  type NotificationLogRepositoryPort,
} from '../../inbox/ports';
import { RenderTemplateService } from '../../template/application/render-template.service';
import { BaseProcessor } from 'src/infrastructure/bullmq/base.processor';
import { Language } from '@prisma/client';
import {
  BULLMQ_QUEUES,
  getQueueConfig,
} from 'src/infrastructure/bullmq/bullmq.constants';

const queueConfig = getQueueConfig(BULLMQ_QUEUES.NOTIFICATION.SMS);

@Processor(queueConfig.processorOptions, queueConfig.workerOptions)
export class SMSProcessor extends BaseProcessor<NotificationJobData, void> {
  protected readonly logger = new Logger(SMSProcessor.name);

  constructor(
    @Inject(NOTIFICATION_LOG_REPOSITORY)
    private readonly notificationLogRepository: NotificationLogRepositoryPort,
    private readonly smsSender: SMSSender,
    private readonly renderTemplateService: RenderTemplateService,
    protected readonly cls: ClsService,
  ) {
    super();
  }

  @Transactional()
  protected async processJob(job: Job<NotificationJobData>): Promise<void> {
    const { data } = job;
    this.logger.debug(`Processing SMS job ${job.id} for log ${data.logId}`);

    const log = await this.notificationLogRepository.getById(
      new Date(data.logCreatedAt),
      BigInt(data.logId),
    );

    // 발송 시작 상태 업데이트
    log.markAsSending();
    await this.notificationLogRepository.update(log);

    // 지연 렌더링 처리
    if (!log.title || !log.body) {
      if (!log.templateEvent) {
        throw new Error(
          `SMS sending failed: missing templateEvent for log ${log.id}`,
        );
      }

      const renderResult = await this.renderTemplateService.execute({
        event: log.templateEvent,
        channel: log.channel,
        locale: log.locale || Language.EN,
        variables: log.metadata || {},
      });

      log.updateContent(
        renderResult.title || '',
        renderResult.body,
        renderResult.actionUri || null,
      );
    }

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
      await this.smsSender.send(sendParams);

      // 성공 상태 업데이트
      log.markAsSuccess();
      await this.notificationLogRepository.update(log);

      this.logger.debug(`Successfully sent SMS for log ${log.id}`);
    } catch (error: any) {
      // 실패 상태 업데이트
      log.markAsFailed(error.message || 'SMS sending failed');
      await this.notificationLogRepository.update(log);

      // BullMQ가 에러를 감지하고 설정된 정책(예: 지수 백오프)에 따라 재시도하도록 에러 재발생
      throw error;
    }
  }
}
