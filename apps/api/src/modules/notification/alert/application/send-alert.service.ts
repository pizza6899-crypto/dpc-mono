// apps/api/src/modules/notification/alert/application/create-alert.service.ts

import { HttpStatus, Injectable, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Transactional } from '@nestjs-cls/transactional';
import { ChannelType } from '@prisma/client';
import { MessageCode } from '@repo/shared';
import { Alert, DuplicateAlertException, AlertException } from '../domain';
import { ALERT_REPOSITORY } from '../ports';
import type { AlertRepositoryPort } from '../ports';
import { NotificationPayloadMap, NOTIFICATION_QUEUES, NOTIFICATION_EVENTS } from '../../common';

interface SendAlertParams<T extends keyof NotificationPayloadMap> {
    event: T;
    userId?: bigint;
    targetGroup?: string;
    payload: NotificationPayloadMap[T];
    channels: ChannelType[];
    idempotencyKey?: string;
}

@Injectable()
export class SendAlertService {
    constructor(
        @Inject(ALERT_REPOSITORY)
        private readonly alertRepository: AlertRepositoryPort,
        @InjectQueue(NOTIFICATION_QUEUES.ALERT)
        private readonly alertQueue: Queue,
    ) { }

    @Transactional()
    async execute<T extends keyof NotificationPayloadMap>(params: SendAlertParams<T>): Promise<Alert> {
        const { event, userId, targetGroup, payload, channels, idempotencyKey } =
            params;

        // 0. Payload 검증
        this.validatePayload(event, payload);

        // 1. 멱등성 체크
        if (idempotencyKey) {
            const existing = await this.alertRepository.findByIdempotencyKey(
                idempotencyKey,
                new Date(),
            );
            if (existing) {
                throw new DuplicateAlertException(idempotencyKey);
            }
        }

        // 2. Alert 생성
        const alert = Alert.create({
            event: event as string,
            userId,
            targetGroup,
            payload: { ...payload, channels }, // channels도 payload에 저장
            channels,
            idempotencyKey,
        });

        // 3. DB 저장
        const savedAlert = await this.alertRepository.create(alert);

        // 4. BullMQ에 Job 추가 (비동기 처리)
        await this.alertQueue.add(
            'process-alert',
            {
                alertId: savedAlert.id!.toString(),
                alertCreatedAt: savedAlert.createdAt.toISOString(),
            },
            {
                jobId: `alert-${savedAlert.id}`,
                removeOnComplete: true,
                removeOnFail: 100,
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
            case NOTIFICATION_EVENTS.DEPOSIT_COMPLETED:
            case NOTIFICATION_EVENTS.DEPOSIT_REJECTED:
                if (!p.amount) missingFields.push('amount');
                if (!p.currency) missingFields.push('currency');
                if (!p.txId) missingFields.push('txId');
                break;

            case NOTIFICATION_EVENTS.WITHDRAWAL_COMPLETED:
            case NOTIFICATION_EVENTS.WITHDRAWAL_REJECTED:
                if (!p.amount) missingFields.push('amount');
                if (!p.currency) missingFields.push('currency');
                if (!p.txId) missingFields.push('txId');
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
