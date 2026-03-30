import { Processor } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { WebsocketService } from 'src/infrastructure/websocket/websocket.service';
import { SOCKET_EVENT_TYPES } from 'src/infrastructure/websocket/types/socket-payload.types';
import { type NotificationJobData } from '../../common';
import { SqidsService } from 'src/infrastructure/sqids/sqids.service';
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
import { SqidsPrefix } from 'src/infrastructure/sqids/sqids.constants';

const queueConfig = getQueueConfig(BULLMQ_QUEUES.NOTIFICATION.INBOX);

@Processor(queueConfig.processorOptions, queueConfig.workerOptions)
export class InboxProcessor extends BaseProcessor<NotificationJobData, void> {
  protected readonly logger = new Logger(InboxProcessor.name);

  constructor(
    @Inject(NOTIFICATION_LOG_REPOSITORY)
    private readonly notificationLogRepository: NotificationLogRepositoryPort,
    private readonly websocketService: WebsocketService,
    private readonly renderTemplateService: RenderTemplateService,
    private readonly sqidsService: SqidsService,
    protected readonly cls: ClsService,
  ) {
    super();
  }

  @Transactional()
  protected async processJob(job: Job<NotificationJobData>): Promise<void> {
    const { data } = job;
    await this.processNotification(data);
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
          throw new Error(
            `Socket notification failed: missing templateEvent for log ${log.id}`,
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

      // WebSocket을 통해 INBOX_NEW 이벤트 발송
      this.websocketService.sendToUser(
        log.receiverId,
        SOCKET_EVENT_TYPES.INBOX_NEW,
        {
          id: this.sqidsService.encode(log.id!, SqidsPrefix.INBOX), // 사용자용 인코딩 미리 처리
          event: log.templateEvent,
          createdAt: log.createdAt.toISOString(),
          title: log.title || null,
          body: log.body || null,
          actionUri: log.actionUri || null,
          isRead: false,
          readAt: null,
          metadata: log.metadata || null,
        },
      );

      // 성공 처리
      log.markAsSuccess();
      await this.notificationLogRepository.update(log);

      this.logger.debug(
        `Sent notification push: log ${log.id} → user ${log.receiverId}`,
      );
    } catch (error: any) {
      log.markAsFailed(error.message || 'Socket sending failed');
      await this.notificationLogRepository.update(log);

      throw error;
    }
  }
}
