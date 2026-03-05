import { Processor } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { WebsocketService } from 'src/infrastructure/websocket/websocket.service';
import { SocketSender } from '../channels/socket/socket.sender';
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

const queueConfig = getQueueConfig(BULLMQ_QUEUES.NOTIFICATION.SOCKET);

interface NotificationJobData {
  logId: string;
  logCreatedAt: string;
}

interface VolatileJobData {
  type: string;
  userId?: string;
  room?: string;
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
    private readonly socketSender: SocketSender,
    private readonly websocketService: WebsocketService,
    protected readonly cls: ClsService,
  ) {
    super();
  }

  @Transactional()
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
      // SocketSender를 통해 알림 발송
      await this.socketSender.send({
        logId: log.id!,
        logCreatedAt: log.createdAt,
        receiverId: log.receiverId,
        target: log.target,
        title: log.title || '',
        body: log.body || '',
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
    if (data.userId && data.userId !== '0') {
      const userId = BigInt(data.userId);
      this.websocketService.sendToUser(userId, data.type, data.data);
      this.logger.debug(`Sent volatile ${data.type} to user ${userId}`);
    } else if (data.room) {
      this.websocketService.sendToRoom(data.room as any, data.type, data.data);
      this.logger.debug(`Sent volatile ${data.type} to room ${data.room}`);
    }
  }
}
