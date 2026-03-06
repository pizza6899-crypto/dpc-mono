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
import { NotificationLog } from '../../inbox/domain';
import { Alert } from '../../alert/domain';
import { SnowflakeService } from '../../../../common/snowflake/snowflake.service';
import { BaseProcessor } from 'src/infrastructure/bullmq/base.processor';
import {
  getQueueConfig,
  BULLMQ_QUEUES,
} from 'src/infrastructure/bullmq/bullmq.constants';
import { type AlertJobData, type NotificationEventType } from '../../common';
import { GetUserService } from 'src/modules/user/profile/application/get-user.service';

const queueConfig = getQueueConfig(BULLMQ_QUEUES.NOTIFICATION.ALERT);

interface UserMetadata {
  id: bigint;
  email?: string | null;
  phoneNumber?: string | null;
  language?: Language | null;
}

@Processor(queueConfig.processorOptions, queueConfig.workerOptions)
export class AlertProcessor extends BaseProcessor<AlertJobData, void> {
  protected readonly logger = new Logger(AlertProcessor.name);

  constructor(
    @Inject(ALERT_REPOSITORY)
    private readonly alertRepository: AlertRepositoryPort,
    @Inject(NOTIFICATION_LOG_REPOSITORY)
    private readonly notificationLogRepository: NotificationLogRepositoryPort,
    @InjectQueue(BULLMQ_QUEUES.NOTIFICATION.EMAIL.name)
    private readonly emailQueue: Queue,
    @InjectQueue(BULLMQ_QUEUES.NOTIFICATION.SMS.name)
    private readonly smsQueue: Queue,
    @InjectQueue(BULLMQ_QUEUES.NOTIFICATION.INBOX.name)
    private readonly inboxQueue: Queue,
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
      `Processing alert job ${job.id} for alert ${alertId} (Attempt: ${job.attemptsMade + 1})`,
    );

    // 1. Fetch Alert
    const alert = await this.alertRepository.getById(
      new Date(alertCreatedAt),
      BigInt(alertId),
    );

    // ✅ 재시도 처리: 이미 완료되었거나 실패한 경우 처리 중단
    if (alert.isCompleted() || alert.isFailed()) {
      this.logger.warn(`Alert ${alert.id} is already ${alert.status}. Skipping.`);
      return;
    }

    // 2. Identify Target (User or Group)
    const userId = alert.userId;
    const targetGroup = alert.targetGroup;

    // [개선] 상태 업데이트 전 유효성 검사를 먼저 수행하여 불필요한 DB IO 방지
    if (!userId && !targetGroup) {
      this.logger.error(
        `Alert ${alert.id} has no destination (userId AND targetGroup are null). Marking as FAILED.`,
      );
      if (!alert.isFailed()) {
        alert.fail();
        await this.alertRepository.update(alert);
      }
      return;
    }

    if (alert.channels.length === 0) {
      this.logger.error(
        `Alert ${alert.id} has no channels specified. Marking as FAILED.`,
      );
      if (!alert.isFailed()) {
        alert.fail();
        await this.alertRepository.update(alert);
      }
      return;
    }

    // ✅ 상태 변화 (이미 PROCESSING이면 생략 - 재시도 대응)
    if (alert.isPending()) {
      alert.startProcessing();
      await this.alertRepository.update(alert);
    }

    // Fetch User metadata if userId exists
    const user: UserMetadata | null = userId ? await this.getUserService.findById(userId) : null;

    const {
      locale: localeFromPayload,
      channels: _,
      ...variables
    } = (alert.payload || {}) as Record<string, any>;

    const locale =
      (localeFromPayload as Language) || user?.language || Language.EN;

    let hasError = false;

    // 3. Process for each requested channel (지연 렌더링 라우팅)
    for (const channel of alert.channels) {
      try {
        // 4. Send or Log based on channel and target
        if (userId) {
          // Individual User Alert: Create NotificationLog and Dispatch
          // EMAIL, SMS, INBOX (영구 알림): PENDING 상태의 껍데기 로그 생성
          const { id, timestamp } = this.snowflakeService.generate();

          const log = NotificationLog.create({
            id,
            createdAt: timestamp,
            alertId: alert.id!,
            alertCreatedAt: alert.createdAt,
            receiverId: userId,
            channel,
            title: null, // 지연 렌더링
            body: null, // 지연 렌더링
            actionUri: null,
            templateEvent: alert.event as NotificationEventType,
            locale,
            target: this.extractTarget(alert, channel, user),
            metadata: variables,
          });

          const savedLog = await this.notificationLogRepository.create(log);

          const jobData = {
            logId: savedLog.id!.toString(),
            logCreatedAt: savedLog.createdAt.toISOString(),
          };

          if (channel === ChannelType.EMAIL) {
            await this.emailQueue.add(
              BULLMQ_QUEUES.NOTIFICATION.EMAIL.name,
              jobData,
            );
          } else if (channel === ChannelType.SMS) {
            await this.smsQueue.add(
              BULLMQ_QUEUES.NOTIFICATION.SMS.name,
              jobData,
            );
          } else if (channel === ChannelType.INBOX) {
            await this.inboxQueue.add(
              BULLMQ_QUEUES.NOTIFICATION.INBOX.name,
              jobData,
            );
          }
        } else {
          // Group Alert (targetGroup) - Not supported yet through Alert pipeline
          this.logger.warn(
            `Group alerts not supported through Alert pipeline yet. Use WebsocketService directly for broadcasts.`,
          );
        }
      } catch (innerError) {
        this.logger.error(
          `Failed to route channel ${channel} for alert ${alert.id}:`,
          innerError,
        );
        hasError = true;
      }
    }

    // ✅ 에러 전파: 하나라도 채널 라우팅에 실패했다면 워커가 재시도(Backoff) 루프를 타게 던짐
    if (hasError) {
      throw new Error(`One or more channels failed to route for alert ${alert.id}.`);
    }

    alert.complete();
    await this.alertRepository.update(alert);
    this.logger.debug(`Successfully processed alert ${alert.id}`);
  }

  private extractTarget(
    alert: Alert<any>,
    channel: ChannelType,
    user: UserMetadata | null,
  ): string | undefined {
    const payload = alert.payload as any;

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
}
