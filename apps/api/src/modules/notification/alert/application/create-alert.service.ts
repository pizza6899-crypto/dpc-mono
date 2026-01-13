// apps/api/src/modules/notification/alert/application/create-alert.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Transactional } from '@nestjs-cls/transactional';
import { ChannelType } from '@repo/database';
import { Alert, DuplicateAlertException } from '../domain';
import { ALERT_REPOSITORY } from '../ports';
import type { AlertRepositoryPort } from '../ports';
import { NOTIFICATION_QUEUES } from '../../common';

interface CreateAlertParams {
    event: string;
    userId?: bigint;
    targetGroup?: string;
    payload: Record<string, unknown>;
    channels: ChannelType[];
    idempotencyKey?: string;
}

@Injectable()
export class CreateAlertService {
    constructor(
        @Inject(ALERT_REPOSITORY)
        private readonly alertRepository: AlertRepositoryPort,
        @InjectQueue(NOTIFICATION_QUEUES.ALERT)
        private readonly alertQueue: Queue,
    ) { }

    @Transactional()
    async execute(params: CreateAlertParams): Promise<Alert> {
        const { event, userId, targetGroup, payload, channels, idempotencyKey } =
            params;

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
            event,
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
}
