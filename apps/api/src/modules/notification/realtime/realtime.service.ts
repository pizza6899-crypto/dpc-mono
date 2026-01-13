// apps/api/src/modules/notification/realtime/realtime.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ChannelType } from '@repo/database';
import { NOTIFICATION_QUEUES } from '../common';
import { NotificationGateway } from './notification.gateway';
import { Alert } from '../alert/domain';
import { ALERT_REPOSITORY } from '../alert/ports';
import type { AlertRepositoryPort } from '../alert/ports';

interface SendNotificationParams {
    event: string;
    userId?: bigint;
    targetGroup?: string;
    payload: Record<string, unknown>;
    channels: ChannelType[];
    idempotencyKey?: string;
}

/**
 * RealTimeService
 *
 * 외부 모듈에서 알림을 발송할 때 사용하는 통합 서비스입니다.
 * - 영구 알림: Alert 저장 → Queue → Worker → 발송
 * - 휘발성 데이터: Queue → Worker → 소켓 직접 발송
 */
@Injectable()
export class RealTimeService {
    constructor(
        @Inject(ALERT_REPOSITORY)
        private readonly alertRepository: AlertRepositoryPort,
        @InjectQueue(NOTIFICATION_QUEUES.ALERT)
        private readonly alertQueue: Queue,
        @InjectQueue(NOTIFICATION_QUEUES.SOCKET)
        private readonly socketQueue: Queue,
        private readonly gateway: NotificationGateway,
    ) { }

    // ═══════════════════════════════════════════════════════════════════
    // 영구 알림 (DB 저장 → 채널별 발송)
    // ═══════════════════════════════════════════════════════════════════

    async sendNotification(params: SendNotificationParams): Promise<Alert> {
        const { event, userId, targetGroup, payload, channels, idempotencyKey } =
            params;

        // 1. Alert 생성
        const alert = Alert.create({
            event,
            userId,
            targetGroup,
            payload: { ...payload, channels },
            channels,
            idempotencyKey,
        });

        // 2. DB 저장
        const savedAlert = await this.alertRepository.create(alert);

        // 3. BullMQ에 Job 추가 (비동기 팬아웃)
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

    // ═══════════════════════════════════════════════════════════════════
    // 휘발성 데이터 (DB 저장 없음 → 소켓 직접 발송)
    // ═══════════════════════════════════════════════════════════════════

    async sendBalanceUpdate(userId: bigint, balance: string): Promise<void> {
        await this.socketQueue.add(
            'volatile',
            {
                type: 'balance:update',
                userId: userId.toString(),
                data: { balance },
            },
            { removeOnComplete: true },
        );
    }

    async sendBadgeUpdate(userId: bigint, count: number): Promise<void> {
        await this.socketQueue.add(
            'volatile',
            {
                type: 'badge:update',
                userId: userId.toString(),
                data: { count },
            },
            { removeOnComplete: true },
        );
    }

    async sendCustomEvent(
        userId: bigint,
        event: string,
        data: unknown,
    ): Promise<void> {
        await this.socketQueue.add(
            'volatile',
            {
                type: event,
                userId: userId.toString(),
                data,
            },
            { removeOnComplete: true },
        );
    }

    // 동기 발송 (즉시 발송이 필요한 경우)
    emitBalanceUpdateSync(userId: bigint, balance: string): void {
        this.gateway.emitBalanceUpdate(userId, balance);
    }

    emitBadgeUpdateSync(userId: bigint, count: number): void {
        this.gateway.emitBadgeUpdate(userId, count);
    }
}
