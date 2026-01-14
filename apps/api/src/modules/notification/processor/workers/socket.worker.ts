import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger, OnApplicationShutdown } from '@nestjs/common';
import { Job } from 'bullmq';
import { NOTIFICATION_QUEUES } from '../../common';
import { SocketService } from 'src/modules/socket/socket.service';
import { ClsService } from 'nestjs-cls';
import {
    NOTIFICATION_LOG_REPOSITORY,
} from '../../inbox/ports';
import type { NotificationLogRepositoryPort } from '../../inbox/ports';

interface NotificationJobData {
    logId: string;
    logCreatedAt: string;
}

interface VolatileJobData {
    type: string;
    userId: string;
    data: unknown;
}

@Processor(NOTIFICATION_QUEUES.SOCKET)
export class SocketWorker extends WorkerHost implements OnApplicationShutdown {
    private readonly logger = new Logger(SocketWorker.name);

    constructor(
        @Inject(NOTIFICATION_LOG_REPOSITORY)
        private readonly notificationLogRepository: NotificationLogRepositoryPort,
        private readonly socketService: SocketService,
        private readonly cls: ClsService,
    ) {
        super();
    }

    async process(job: Job<NotificationJobData | VolatileJobData>): Promise<void> {
        return this.cls.run(async () => {
            const { name, data } = job;

            try {
                if (name === 'send-in-app') {
                    await this.processNotification(data as NotificationJobData);
                } else if (name === 'volatile') {
                    await this.processVolatile(data as VolatileJobData);
                }
            } catch (error) {
                this.logger.error(`Failed to process job ${job.id}:`, error);
                throw error;
            }
        });
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

    async onApplicationShutdown(signal?: string): Promise<void> {
        try {
            const worker = this.worker;
            if (worker) {
                await worker.close();
                this.logger.log('SocketWorker closed successfully');
            }
        } catch (error) {
            this.logger.error('Failed to close SocketWorker:', error);
        }
    }
}
