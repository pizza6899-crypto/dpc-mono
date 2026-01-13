// apps/api/src/modules/notification/processor/workers/email.worker.ts

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NOTIFICATION_QUEUES, ChannelSendParams } from '../../common';
import { EmailSender } from '../channels/email/email.sender';
import {
    NOTIFICATION_LOG_REPOSITORY,
} from '../../inbox/ports';
import type { NotificationLogRepositoryPort } from '../../inbox/ports';

interface NotificationJobData {
    logId: string;
    logCreatedAt: string;
}

@Processor(NOTIFICATION_QUEUES.EMAIL)
export class EmailWorker extends WorkerHost {
    private readonly logger = new Logger(EmailWorker.name);

    constructor(
        @Inject(NOTIFICATION_LOG_REPOSITORY)
        private readonly notificationLogRepository: NotificationLogRepositoryPort,
        private readonly emailSender: EmailSender,
    ) {
        super();
    }

    async process(job: Job<NotificationJobData>): Promise<void> {
        const { data } = job;
        this.logger.debug(`Processing email job ${job.id} for log ${data.logId}`);

        try {
            const log = await this.notificationLogRepository.getById(
                new Date(data.logCreatedAt),
                BigInt(data.logId),
            );

            // 발송 시작 상태 업데이트
            log.markAsSending();
            await this.notificationLogRepository.update(log);

            // 채널 Sender 파라미터 구성
            const sendParams: ChannelSendParams = {
                logId: log.id!,
                logCreatedAt: log.createdAt,
                receiverId: log.receiverId,
                target: log.target,
                title: log.title,
                body: log.body,
                actionUri: log.actionUri,
                metadata: log.metadata,
            };

            // 발송
            await this.emailSender.send(sendParams);

            // 성공 상태 업데이트
            log.markAsSuccess();
            await this.notificationLogRepository.update(log);

            this.logger.debug(`Successfully sent email for log ${log.id}`);
        } catch (error: any) {
            this.logger.error(`Failed to process email job ${job.id}:`, error);
            throw error; // BullMQ가 재시도(Retry) 처리함
        }
    }
}
