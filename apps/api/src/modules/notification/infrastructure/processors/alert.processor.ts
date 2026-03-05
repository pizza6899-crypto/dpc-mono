import { Processor } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { ChannelType, Language } from '@prisma/client';
import { ClsService } from 'nestjs-cls';
import { Transactional } from '@nestjs-cls/transactional';
import { ALERT_REPOSITORY, type AlertRepositoryPort } from '../../alert/ports';
import {
  NOTIFICATION_LOG_REPOSITORY,
  type NotificationLogRepositoryPort,
} from '../../inbox/ports';
import { RenderTemplateService } from '../../template/application/render-template.service';
import {
  NOTIFICATION_TEMPLATE_REPOSITORY,
  type NotificationTemplateRepositoryPort,
} from '../../template/ports';
import { NotificationLog } from '../../inbox/domain';
import { SnowflakeService } from '../../../../common/snowflake/snowflake.service';
import { BaseProcessor } from 'src/infrastructure/bullmq/base.processor';
import { NOTIFICATION_TARGET_GROUPS } from '../../common/constants/target-group.constants';
import { SOCKET_ROOMS } from 'src/infrastructure/websocket/constants/websocket-rooms.constant';
import {
  getQueueConfig,
  BULLMQ_QUEUES,
} from 'src/infrastructure/bullmq/bullmq.constants';
import { GetUserService } from 'src/modules/user/profile/application/get-user.service';

const queueConfig = getQueueConfig(BULLMQ_QUEUES.NOTIFICATION.ALERT);

interface AlertJobData {
  alertId: string;
  alertCreatedAt: string;
}

@Processor(queueConfig.processorOptions, queueConfig.workerOptions)
export class AlertProcessor extends BaseProcessor<AlertJobData, void> {
  protected readonly logger = new Logger(AlertProcessor.name);

  constructor(
    @Inject(ALERT_REPOSITORY)
    private readonly alertRepository: AlertRepositoryPort,
    @Inject(NOTIFICATION_LOG_REPOSITORY)
    private readonly notificationLogRepository: NotificationLogRepositoryPort,
    @Inject(NOTIFICATION_TEMPLATE_REPOSITORY)
    private readonly templateRepository: NotificationTemplateRepositoryPort,
    private readonly renderService: RenderTemplateService,
    @InjectQueue(BULLMQ_QUEUES.NOTIFICATION.EMAIL.name)
    private readonly emailQueue: Queue,
    @InjectQueue(BULLMQ_QUEUES.NOTIFICATION.SMS.name)
    private readonly smsQueue: Queue,
    @InjectQueue(BULLMQ_QUEUES.NOTIFICATION.SOCKET.name)
    private readonly socketQueue: Queue,
    protected readonly cls: ClsService,
    private readonly getUserService: GetUserService,
    private readonly snowflakeService: SnowflakeService,
  ) {
    super();
  }

  @Transactional()
  protected async processJob(job: Job<AlertJobData>): Promise<void> {
    const { data } = job;
    const { alertId, alertCreatedAt } = data;

    this.logger.debug(
      `Processing alert job ${job.id} for alert ${alertId}`,
    );

    // 1. Fetch Alert
    const alert = await this.alertRepository.getById(
      new Date(alertCreatedAt),
      BigInt(alertId),
    );

    // 2. Identify Target (User or Group)
    const userId = alert.userId;
    const targetGroup = alert.targetGroup;

    // [개선] 상태 업데이트 전 유효성 검사를 먼저 수행하여 불필요한 DB IO 방지
    if (!userId && !targetGroup) {
      this.logger.error(
        `Alert ${alert.id} has no destination (userId AND targetGroup are null). Marking as FAILED.`,
      );
      alert.fail();
      await this.alertRepository.update(alert);
      return;
    }

    // Status update to PROCESSING
    alert.startProcessing();
    await this.alertRepository.update(alert);

    // 3. Find applicable templates for this event
    const allTemplates = await this.templateRepository.findByEvent(alert.event);

    // [개선] 요청된 채널(alert.channels)에 해당하는 템플릿만 필터링
    const templates = allTemplates.filter((t) =>
      alert.channels.includes(t.channel),
    );

    if (templates.length === 0) {
      this.logger.warn(
        `No matching templates found for event ${alert.event} and requested channels [${alert.channels}]. Marking as COMPLETED.`,
      );
      alert.complete();
      await this.alertRepository.update(alert);
      return;
    }
    // Fetch User metadata if userId exists
    const user = userId ? await this.getUserService.findById(userId) : null;

    // 4. Process for each channel (template)
    for (const template of templates) {
      try {
        // Render Template
        // 1순위: 페이로드의 locale, 2순위: 유저 프로필의 language, 3순위: KO
        const {
          locale: localeFromPayload,
          channels: _,
          ...variables
        } = alert.payload as any;
        const locale =
          (localeFromPayload as Language) || user?.language || Language.KO;

        const renderResult = await this.renderService.execute({
          event: alert.event,
          channel: template.channel,
          locale,
          variables,
        });

        // 5. Send or Log based on channel and target
        if (userId) {
          // Individual User Alert: Create NotificationLog and Dispatch
          const { id, timestamp } = this.snowflakeService.generate();

          const log = NotificationLog.create({
            id,
            createdAt: timestamp,
            alertId: alert.id!,
            alertCreatedAt: alert.createdAt,
            receiverId: userId,
            channel: template.channel,
            title: renderResult.title,
            body: renderResult.body,
            actionUri: renderResult.actionUri,
            templateId: template.id,
            templateEvent: alert.event,
            locale,
            target: this.extractTarget(alert, template.channel, user),
          });

          const savedLog = await this.notificationLogRepository.create(log);

          const jobData = {
            logId: savedLog.id!.toString(),
            logCreatedAt: savedLog.createdAt.toISOString(),
          };

          if (template.channel === ChannelType.EMAIL) {
            await this.emailQueue.add(
              BULLMQ_QUEUES.NOTIFICATION.EMAIL.name,
              jobData,
            );
          } else if (template.channel === ChannelType.SMS) {
            await this.smsQueue.add(
              BULLMQ_QUEUES.NOTIFICATION.SMS.name,
              jobData,
            );
          } else if (template.channel === ChannelType.IN_APP) {
            await this.socketQueue.add(
              BULLMQ_QUEUES.NOTIFICATION.SOCKET.name,
              jobData,
            );
          } else if (template.channel === ChannelType.WEBSOCKET) {
            await this.socketQueue.add('volatile', {
              type: alert.event,
              userId: userId.toString(),
              data: {
                ...variables,
                title: renderResult.title,
                body: renderResult.body,
                alertId: alert.id?.toString(),
              },
            });
          }
        } else {
          // Group Alert (targetGroup): Only support broadcastable channels
          if (template.channel === ChannelType.WEBSOCKET) {
            const targetRoom = this.mapTargetGroupToRoom(targetGroup);
            await this.socketQueue.add('volatile', {
              type: alert.event,
              userId: '0',
              room: targetRoom,
              data: {
                ...variables,
                title: renderResult.title,
                body: renderResult.body,
                alertId: alert.id?.toString(),
              },
            });
          } else {
            this.logger.warn(
              `Channel ${template.channel} not supported for group alerts yet. Skipping.`,
            );
          }
        }
      } catch (innerError) {
        this.logger.error(
          `Failed to process template ${template.id} for alert ${alert.id}:`,
          innerError,
        );
      }
    }

    alert.complete();
    await this.alertRepository.update(alert);
    this.logger.debug(`Successfully processed alert ${alert.id}`);
  }

  private extractTarget(
    alert: any,
    channel: ChannelType,
    user: any,
  ): string | undefined {
    const payload = alert.payload;

    if (channel === ChannelType.EMAIL) {
      return payload.email ?? payload.target ?? user?.email;
    }

    if (channel === ChannelType.SMS) {
      return (
        payload.phone ??
        payload.phoneNumber ??
        payload.target ??
        user?.phoneNumber
      );
    }

    return undefined;
  }

  private mapTargetGroupToRoom(targetGroup: string | null): string {
    if (targetGroup === NOTIFICATION_TARGET_GROUPS.ADMIN) {
      return SOCKET_ROOMS.ADMIN;
    }
    return SOCKET_ROOMS.GLOBAL;
  }
}
