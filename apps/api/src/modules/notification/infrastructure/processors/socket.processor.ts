import { Processor } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { WebsocketService } from 'src/infrastructure/websocket/websocket.service';
import { SOCKET_EVENT_TYPES } from 'src/infrastructure/websocket/types/socket-payload.types';
import type { SocketEventType } from 'src/infrastructure/websocket/types/socket-payload.types';
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
import { SOCKET_JOB_NAMES } from '../../common/constants/queue.constants';

const queueConfig = getQueueConfig(BULLMQ_QUEUES.NOTIFICATION.SOCKET);

interface NotificationJobData {
  logId: string;
  logCreatedAt: string;
}

interface EventJobData {
  alertId: string;
  alertCreatedAt: string;
}

@Processor(queueConfig.processorOptions, queueConfig.workerOptions)
export class SocketProcessor extends BaseProcessor<
  NotificationJobData | EventJobData,
  void
> {
  protected readonly logger = new Logger(SocketProcessor.name);

  constructor(
    @Inject(NOTIFICATION_LOG_REPOSITORY)
    private readonly notificationLogRepository: NotificationLogRepositoryPort,
    @Inject(ALERT_REPOSITORY)
    private readonly alertRepository: AlertRepositoryPort,
    private readonly websocketService: WebsocketService,
    private readonly renderTemplateService: RenderTemplateService,
    protected readonly cls: ClsService,
  ) {
    super();
  }

  @Transactional()
  protected async processJob(
    job: Job<NotificationJobData | EventJobData>,
  ): Promise<void> {
    const { name, data } = job;

    if (name === SOCKET_JOB_NAMES.INBOX) {
      await this.processNotification(data as NotificationJobData);
    } else if (name === SOCKET_JOB_NAMES.EVENT) {
      await this.processEvent(data as EventJobData);
    }
  }

  /**
   * 영구 알림(NotificationLog) 발송 처리
   * NotificationLog를 조회 → 템플릿 렌더링 → 소켓 이벤트 발송 → 상태 갱신
   */
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

      // WebSocket을 통해 INBOX_NEW 이벤트 발송
      this.websocketService.sendToUser(log.receiverId, SOCKET_EVENT_TYPES.INBOX_NEW, {
        id: log.id!.toString(),
        createdAt: log.createdAt.toISOString(),
        title: log.title || null,
        body: log.body || null,
        actionUri: log.actionUri || null,
        metadata: log.metadata || null,
      });

      // 성공 처리
      log.markAsSuccess();
      await this.notificationLogRepository.update(log);

      this.logger.debug(`Sent notification push: log ${log.id} → user ${log.receiverId}`);
    } catch (error: any) {
      log.markAsFailed(error.message || 'Socket sending failed');
      await this.notificationLogRepository.update(log);

      throw error;
    }
  }

  /**
   * 휘발성 이벤트 발송 처리
   * Alert를 조회 → 대상(유저/룸)에 따라 소켓 이벤트 발송 (상태 추적 없음)
   */
  private async processEvent(data: EventJobData): Promise<void> {
    const alert = await this.alertRepository.getById(
      new Date(data.alertCreatedAt),
      BigInt(data.alertId),
    );

    const { userId, targetGroup, event, payload } = alert;
    const eventType = event as unknown as SocketEventType;

    const eventPayload = {
      ...(payload as any),
      alertId: alert.id?.toString(),
    };

    if (userId) {
      this.websocketService.sendToUser(userId, eventType, eventPayload as any);
      this.logger.debug(`Sent event push (type: ${event}) → user ${userId}`);
    } else if (targetGroup) {
      let room: string = SOCKET_ROOMS.GLOBAL;
      if (targetGroup === NOTIFICATION_TARGET_GROUPS.ADMIN) {
        room = SOCKET_ROOMS.ADMIN;
      }

      this.websocketService.sendToRoom(room as any, eventType, eventPayload as any);
      this.logger.debug(`Sent event push (type: ${event}) → room ${room}`);
    }
  }
}
