// apps/api/src/modules/notification/alert/application/create-alert.service.ts

import { HttpStatus, Injectable, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Transactional } from '@nestjs-cls/transactional';
import { ChannelType } from '@prisma/client';
import { MessageCode } from '@repo/shared';
import { BULLMQ_QUEUES } from 'src/infrastructure/bullmq/bullmq.constants';
import { Alert, DuplicateAlertException, AlertException } from '../domain';
import { ALERT_REPOSITORY } from '../ports';
import type { AlertRepositoryPort } from '../ports';
import {
  NotificationPayloadMap,
  NOTIFICATION_QUEUES,
  NOTIFICATION_EVENTS,
} from '../../common';
import { Language } from '@prisma/client';
import { SnowflakeService } from '../../../../common/snowflake/snowflake.service';

interface SendAlertParams<T extends keyof NotificationPayloadMap> {
  event: T;
  userId?: bigint;
  targetGroup?: string;
  payload: NotificationPayloadMap[T];
  channels: ChannelType[];
  idempotencyKey?: string;
  locale?: Language;
}

@Injectable()
export class SendAlertService {
  constructor(
    @Inject(ALERT_REPOSITORY)
    private readonly alertRepository: AlertRepositoryPort,
    @InjectQueue(NOTIFICATION_QUEUES.ALERT)
    private readonly alertQueue: Queue,
    private readonly snowflakeService: SnowflakeService,
  ) { }

  @Transactional()
  async execute<T extends keyof NotificationPayloadMap>(
    params: SendAlertParams<T>,
  ): Promise<Alert> {
    const { event, userId, targetGroup, payload, channels, idempotencyKey, locale } =
      params;

    // 0. Payload 검증
    this.validatePayload(event, payload);

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
      event: event as string,
      userId,
      targetGroup,
      payload: { ...payload, channels, locale }, // locale도 payload에 저장
      channels,
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

  private validatePayload<T extends keyof NotificationPayloadMap>(
    event: T,
    payload: NotificationPayloadMap[T],
  ): void {
    const missingFields: string[] = [];
    const p = payload as Record<string, unknown>;

    switch (event) {
      case NOTIFICATION_EVENTS.FIAT_DEPOSIT_REQUESTED:
        if (!p.depositorName) missingFields.push('depositorName');
      // fallthrough
      case NOTIFICATION_EVENTS.FIAT_DEPOSIT_COMPLETED:
      case NOTIFICATION_EVENTS.FIAT_DEPOSIT_REJECTED:
      case NOTIFICATION_EVENTS.CRYPTO_DEPOSIT_REQUESTED:
      case NOTIFICATION_EVENTS.CRYPTO_DEPOSIT_COMPLETED:
      case NOTIFICATION_EVENTS.CRYPTO_DEPOSIT_REJECTED:
        if (!p.amount) missingFields.push('amount');
        if (!p.currency) missingFields.push('currency');
        break;

      case NOTIFICATION_EVENTS.FIAT_WITHDRAWAL_REQUESTED:
      case NOTIFICATION_EVENTS.FIAT_WITHDRAWAL_COMPLETED:
      case NOTIFICATION_EVENTS.FIAT_WITHDRAWAL_REJECTED:
      case NOTIFICATION_EVENTS.CRYPTO_WITHDRAWAL_REQUESTED:
      case NOTIFICATION_EVENTS.CRYPTO_WITHDRAWAL_COMPLETED:
      case NOTIFICATION_EVENTS.CRYPTO_WITHDRAWAL_REJECTED:
        if (!p.amount) missingFields.push('amount');
        if (!p.currency) missingFields.push('currency');
        break;

      case NOTIFICATION_EVENTS.PROMOTION_APPLIED:
        if (!p.promotionName) missingFields.push('promotionName');
        break;

      case NOTIFICATION_EVENTS.USER_REGISTERED:
        if (!p.email) missingFields.push('email');
        if (!p.registeredAt) missingFields.push('registeredAt');
        break;

      case NOTIFICATION_EVENTS.SYSTEM_ANNOUNCEMENT:
      case NOTIFICATION_EVENTS.MAINTENANCE_NOTICE:
        if (!p.title) missingFields.push('title');
        if (!p.message) missingFields.push('message');
        break;

      case NOTIFICATION_EVENTS.PHONE_VERIFICATION_CODE:
        if (!p.code) missingFields.push('code');
        break;
    }

    if (missingFields.length > 0) {
      throw new AlertException(
        `Missing required payload fields for event ${event}: ${missingFields.join(', ')}`,
        MessageCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
