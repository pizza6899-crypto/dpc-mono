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

    if (alert.channels.length === 0) {
      this.logger.error(
        `Alert ${alert.id} has no channels specified. Marking as FAILED.`,
      );
      alert.fail();
      await this.alertRepository.update(alert);
      return;
    }

    // Status update to PROCESSING
    alert.startProcessing();
    await this.alertRepository.update(alert);

    // Fetch User metadata if userId exists
    const user = userId ? await this.getUserService.findById(userId) : null;

    const {
      locale: localeFromPayload,
      channels: _,
      ...variables
    } = alert.payload || {};
    const locale =
      (localeFromPayload as Language) || user?.language || Language.KO;

    // 3. Process for each requested channel (지연 렌더링 라우팅)
    for (const channel of alert.channels) {
      try {
        // 4. Send or Log based on channel and target
        if (userId) {
          // Individual User Alert: Create NotificationLog and Dispatch
          if (channel === ChannelType.WEBSOCKET) {
            // WEBSOCKET은 DB 로그를 남기지 않는 휘발성 알림
            await this.socketQueue.add('volatile', {
              type: alert.event,
              userId: userId.toString(),
              data: {
                ...variables,
                alertId: alert.id?.toString(),
              },
            });
          } else {
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
              templateEvent: alert.event,
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
              await this.socketQueue.add(
                BULLMQ_QUEUES.NOTIFICATION.SOCKET.name,
                jobData,
              );
            }
          }
        } else {
          // Group Alert (targetGroup): Only support broadcastable channels
          if (channel === ChannelType.WEBSOCKET) {
            const targetRoom = this.mapTargetGroupToRoom(targetGroup);
            await this.socketQueue.add('volatile', {
              type: alert.event,
              userId: '0',
              room: targetRoom,
              data: {
                ...variables,
                alertId: alert.id?.toString(),
              },
            });
          } else {
            this.logger.warn(
              `Channel ${channel} not supported for group alerts yet. Skipping.`,
            );
          }
        }
      } catch (innerError) {
        this.logger.error(
          `Failed to route channel ${channel} for alert ${alert.id}:`,
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
