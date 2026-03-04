// apps/api/src/modules/notification/infrastructure/processors/socket.processor.ts

import { Processor } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { WebsocketService } from 'src/infrastructure/websocket/websocket.service';
import { ClsService } from 'nestjs-cls';
import {
  NOTIFICATION_LOG_REPOSITORY,
  type NotificationLogRepositoryPort,
} from '../../inbox/ports';
import { BaseProcessor } from 'src/infrastructure/bullmq/base.processor';
import {
  BULLMQ_QUEUES,
  getQueueConfig,
} from 'src/infrastructure/bullmq/bullmq.constants';

const queueConfig = getQueueConfig(BULLMQ_QUEUES.NOTIFICATION.SOCKET);

interface NotificationJobData {
  logId: string;
  logCreatedAt: string;
}

interface VolatileJobData {
  type: string;
  userId: string;
  data: unknown;
}

@Processor(queueConfig.processorOptions, queueConfig.workerOptions)
export class SocketProcessor extends BaseProcessor<
  NotificationJobData | VolatileJobData,
  void
> {
  protected readonly logger = new Logger(SocketProcessor.name);

  constructor(
    @Inject(NOTIFICATION_LOG_REPOSITORY)
    private readonly notificationLogRepository: NotificationLogRepositoryPort,
    private readonly websocketService: WebsocketService,
    protected readonly cls: ClsService,
  ) {
    super();
  }

  protected async processJob(
    job: Job<NotificationJobData | VolatileJobData>,
  ): Promise<void> {
    const { name, data } = job;

    if (name === BULLMQ_QUEUES.NOTIFICATION.SOCKET.name) {
      await this.processNotification(data as NotificationJobData);
    } else if (name === 'volatile') {
      await this.processVolatile(data as VolatileJobData);
    }
  }

  private async processNotification(data: NotificationJobData): Promise<void> {
    const log = await this.notificationLogRepository.getById(
      new Date(data.logCreatedAt),
      BigInt(data.logId),
    );

    // 발송 시작
    log.markAsSending();
    await this.notificationLogRepository.update(log);

    try {
      // 소켓 발송
      this.websocketService.sendToUser(log.receiverId, 'notification:new', {
        id: log.id!.toString(),
        createdAt: log.createdAt.toISOString(),
        title: log.title,
        body: log.body,
        actionUri: log.actionUri,
        metadata: log.metadata,
      });

      // 성공 처리
      log.markAsSuccess();
      await this.notificationLogRepository.update(log);

      this.logger.debug(`Sent notification ${log.id} to user ${log.receiverId}`);
    } catch (error: any) {
      log.markAsFailed(error.message || 'Socket sending failed');
      await this.notificationLogRepository.update(log);

      throw error;
    }
  }

  private async processVolatile(data: VolatileJobData): Promise<void> {
    const userId = BigInt(data.userId);
    this.websocketService.sendToUser(userId, data.type, data.data);
    this.logger.debug(`Sent volatile ${data.type} to user ${userId}`);
  }
}
