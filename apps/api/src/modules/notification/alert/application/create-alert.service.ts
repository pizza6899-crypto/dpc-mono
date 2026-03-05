// apps/api/src/modules/notification/alert/application/create-alert.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Transactional } from '@nestjs-cls/transactional';
import { ChannelType } from '@prisma/client';
import { BULLMQ_QUEUES } from 'src/infrastructure/bullmq/bullmq.constants';
import { Alert, DuplicateAlertException } from '../domain';
import { ALERT_REPOSITORY } from '../ports';
import type { AlertRepositoryPort } from '../ports';
import {
  NotificationPayloadMap,
  NOTIFICATION_QUEUES,
} from '../../common';
import { SnowflakeService } from '../../../../common/snowflake/snowflake.service';
import { NotificationChannelPolicy } from '../domain/policy/notification-channel.policy';

interface CreateAlertParams<T extends keyof NotificationPayloadMap> {
  event: T;
  userId?: bigint;
  targetGroup?: string;
  payload: NotificationPayloadMap[T];
  idempotencyKey?: string;
}

@Injectable()
export class CreateAlertService {
  constructor(
    @Inject(ALERT_REPOSITORY)
    private readonly alertRepository: AlertRepositoryPort,
    @InjectQueue(NOTIFICATION_QUEUES.ALERT)
    private readonly alertQueue: Queue,
    private readonly snowflakeService: SnowflakeService,
    private readonly channelPolicy: NotificationChannelPolicy,
  ) { }

  @Transactional()
  async execute<T extends keyof NotificationPayloadMap>(
    params: CreateAlertParams<T>,
  ): Promise<Alert<T>> {
    const { event, userId, targetGroup, payload, idempotencyKey } = params;

    // 1. 멱등성 체크
    if (idempotencyKey) {
      const existing = await this.alertRepository.findByIdempotencyKey(
        idempotencyKey,
      );
      if (existing) {
        throw new DuplicateAlertException(idempotencyKey);
      }
    }

    // 2. ID 생성
    const { id, timestamp } = this.snowflakeService.generate();

    // 3. Alert 생성
    const alert = Alert.create({
      id,
      createdAt: timestamp,
      event: event,
      userId,
      targetGroup,
      payload: { ...payload },
      channels: this.channelPolicy.getDefaultChannels(event as string),
      idempotencyKey,
    });

    // 3. DB 저장
    const savedAlert = await this.alertRepository.create(alert);

    // 4. BullMQ에 Job 추가 (비동기 처리)
    await this.alertQueue.add(
      BULLMQ_QUEUES.NOTIFICATION.ALERT.name,
      {
        alertId: savedAlert.id!.toString(),
        alertCreatedAt: savedAlert.createdAt.toISOString(),
      },
      {
        jobId: `alert-${savedAlert.id}`,
      },
    );

    return savedAlert;
  }
}
