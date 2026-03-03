// apps/api/src/modules/notification/infrastructure/processors/alert.processor.ts

import { Processor } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { ChannelType, Language } from '@prisma/client';
import { ClsService } from 'nestjs-cls';
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
import { BaseProcessor } from 'src/infrastructure/bullmq/base.processor';
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
  ) {
    super();
  }

  protected async processJob(job: Job<AlertJobData>): Promise<void> {
    const { data } = job;
    this.logger.debug(
      `Processing alert job ${job.id} for alert ${data.alertId}`,
    );

    // 1. Fetch Alert
    const alert = await this.alertRepository.getById(
      new Date(data.alertCreatedAt),
      BigInt(data.alertId),
    );

    // Status update to PROCESSING
    alert.startProcessing();
    await this.alertRepository.update(alert);

    // 2. Identify Target User
    const userId = alert.userId;
    if (!userId) {
      this.logger.warn(`Alert ${alert.id} has no userId. Skipping.`);
      alert.complete();
      await this.alertRepository.update(alert);
      return;
    }

    // [New]Fetch User metadata for fallback (locale, target)
    const user = await this.getUserService.findById(userId);

    // 3. Find applicable templates for this event
    const templates = await this.templateRepository.findByEvent(alert.event);
    if (templates.length === 0) {
      this.logger.warn(
        `No templates found for event ${alert.event}. Skipping.`,
      );
      alert.complete();
      await this.alertRepository.update(alert);
      return;
    }

    // 4. Process for each channel (template)
    for (const template of templates) {
      try {
        // Render Template
        // 1순위: 페이로드의 locale, 2순위: 유저 프로필의 language, 3순위: KO
        const { locale: localeFromPayload, channels: _, ...variables } = alert.payload as any;
        const locale = (localeFromPayload as Language) || user?.language || Language.KO;

        const renderResult = await this.renderService.execute({
          event: alert.event,
          channel: template.channel,
          locale,
          variables,
        });

        // Create NotificationLog
        const log = NotificationLog.create({
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
          // 1순위: 페이로드의 target, 2순위: 유저 프로필의 연락처
          target: this.extractTarget(alert, template.channel, user),
        });

        const savedLog = await this.notificationLogRepository.create(log);

        // Dispatch to Channel Queue
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
          await this.smsQueue.add(BULLMQ_QUEUES.NOTIFICATION.SMS.name, jobData);
        } else if (template.channel === ChannelType.IN_APP) {
          await this.socketQueue.add(
            BULLMQ_QUEUES.NOTIFICATION.SOCKET.name,
            jobData,
          );
        } else {
          this.logger.warn(
            `Unsupported channel type for queuing: ${template.channel}`,
          );
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

  private extractTarget(alert: any, channel: ChannelType, user: any): string | undefined {
    const payload = alert.payload;

    if (channel === ChannelType.EMAIL) {
      return payload.email ?? payload.target ?? user?.email;
    }

    if (channel === ChannelType.SMS) {
      return payload.phone ?? payload.phoneNumber ?? payload.target ?? user?.phoneNumber;
    }

    return undefined;
  }
}
