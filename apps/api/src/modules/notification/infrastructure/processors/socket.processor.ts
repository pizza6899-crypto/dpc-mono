import { Processor } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SocketSender } from '../channels/socket/socket.sender';
import { ClsService } from 'nestjs-cls';
import { Transactional } from '@nestjs-cls/transactional';
import {
  NOTIFICATION_LOG_REPOSITORY,
  type NotificationLogRepositoryPort,
} from '../../inbox/ports';
import {
  ALERT_REPOSITORY,
  type AlertRepositoryPort,
} from '../../alert/ports';
import { RenderTemplateService } from '../../template/application/render-template.service';
import { BaseProcessor } from 'src/infrastructure/bullmq/base.processor';
import { Language } from '@prisma/client';
import { NOTIFICATION_TARGET_GROUPS } from '../../common/constants/target-group.constants';
import { SOCKET_ROOMS } from 'src/infrastructure/websocket/constants/websocket-rooms.constant';
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
  alertId: string;
  alertCreatedAt: string;
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
    @Inject(ALERT_REPOSITORY)
    private readonly alertRepository: AlertRepositoryPort,
    private readonly socketSender: SocketSender,
    private readonly renderTemplateService: RenderTemplateService,
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
      // 지연 렌더링 처리
      if (!log.title || !log.body) {
        if (!log.templateEvent) {
          throw new Error(`Socket notification failed: missing templateEvent for log ${log.id}`);
        }

        const renderResult = await this.renderTemplateService.execute({
          event: log.templateEvent,
          channel: log.channel,
          locale: log.locale || Language.KO,
          variables: log.metadata || {},
        });

        log.updateContent(
          renderResult.title || '',
          renderResult.body,
          renderResult.actionUri || null,
        );
      }

      // SocketSender를 통해 알림 발송 ('NEW_INBOX_ITEM' 푸시를 위해 DB에 들어갈 값들을 같이 보내줌)
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
    const alert = await this.alertRepository.getById(
      new Date(data.alertCreatedAt),
      BigInt(data.alertId),
    );

    const { userId, targetGroup, event, payload } = alert;

    const socketData = {
      ...(payload as any),
      alertId: alert.id?.toString(),
    };

    if (userId) {
      await this.socketSender.sendVolatile(event as any, socketData, { userId });
      this.logger.debug(`Sent volatile notification:volatile (type: ${event}) to user ${userId}`);
    } else if (targetGroup) {
      let room: string = SOCKET_ROOMS.GLOBAL;
      if (targetGroup === NOTIFICATION_TARGET_GROUPS.ADMIN) {
        room = SOCKET_ROOMS.ADMIN;
      }

      await this.socketSender.sendVolatile(event as any, socketData, { room: room as any });
      this.logger.debug(`Sent volatile notification:volatile (type: ${event}) to room ${room}`);
    }
  }
}
