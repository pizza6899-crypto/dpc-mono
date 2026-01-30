// apps/api/src/modules/notification/processor/workers/socket.worker.ts

import { Processor } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SocketService } from 'src/modules/socket/socket.service';
import { ClsService } from 'nestjs-cls';
import {
    NOTIFICATION_LOG_REPOSITORY,
    type NotificationLogRepositoryPort,
} from '../../inbox/ports';
import { BaseProcessor } from 'src/infrastructure/bullmq/base.processor';
import { getQueueConfig } from 'src/infrastructure/bullmq/bullmq.constants';

const queueConfig = getQueueConfig('NOTIFICATION', 'SOCKET');

interface NotificationJobData {
    logId: string;
    logCreatedAt: string;
}

interface VolatileJobData {
    type: string;
    userId: string;
    data: unknown;
}

@Processor(queueConfig.processorOptions, queueConfig.workerOptions)
export class SocketWorker extends BaseProcessor<NotificationJobData | VolatileJobData, void> {
    protected readonly logger = new Logger(SocketWorker.name);

    constructor(
        @Inject(NOTIFICATION_LOG_REPOSITORY)
        private readonly notificationLogRepository: NotificationLogRepositoryPort,
        private readonly socketService: SocketService,
        protected readonly cls: ClsService,
    ) {
        super();
    }

    protected async processJob(job: Job<NotificationJobData | VolatileJobData>): Promise<void> {
        const { name, data } = job;

        if (name === 'send-in-app') {
            await this.processNotification(data as NotificationJobData);
        } else if (name === 'volatile') {
            await this.processVolatile(data as VolatileJobData);
        }
    }

    private async processNotification(data: NotificationJobData): Promise<void> {
        const log = await this.notificationLogRepository.getById(
            new Date(data.logCreatedAt),
            BigInt(data.logId),
        );

        // 발송 시작
        log.markAsSending();
        await this.notificationLogRepository.update(log);

        // 소켓 발송
        this.socketService.sendToUser(log.receiverId, 'notification:new', {
            id: log.id!.toString(),
            createdAt: log.createdAt.toISOString(),
            title: log.title,
            body: log.body,
            actionUri: log.actionUri,
            metadata: log.metadata,
        });

        // 성공 처리
        log.markAsSuccess();
        await this.notificationLogRepository.update(log);

        this.logger.debug(`Sent notification ${log.id} to user ${log.receiverId}`);
    }

    private async processVolatile(data: VolatileJobData): Promise<void> {
        const userId = BigInt(data.userId);
        this.socketService.sendToUser(userId, data.type, data.data);
        this.logger.debug(`Sent volatile ${data.type} to user ${userId}`);
    }
}
