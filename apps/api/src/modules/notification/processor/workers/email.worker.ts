// apps/api/src/modules/notification/processor/workers/email.worker.ts

import { Processor } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ChannelSendParams } from '../../common';
import { EmailSender } from '../channels/email/email.sender';
import { ClsService } from 'nestjs-cls';
import {
    NOTIFICATION_LOG_REPOSITORY,
    type NotificationLogRepositoryPort,
} from '../../inbox/ports';
import { BaseProcessor } from 'src/infrastructure/bullmq/base.processor';
import { getQueueConfig } from 'src/infrastructure/bullmq/bullmq.constants';

const queueConfig = getQueueConfig('NOTIFICATION', 'EMAIL');

interface NotificationJobData {
    logId: string;
    logCreatedAt: string;
}

@Processor(queueConfig.processorOptions, queueConfig.workerOptions)
export class EmailWorker extends BaseProcessor<NotificationJobData, void> {
    protected readonly logger = new Logger(EmailWorker.name);

    constructor(
        @Inject(NOTIFICATION_LOG_REPOSITORY)
        private readonly notificationLogRepository: NotificationLogRepositoryPort,
        private readonly emailSender: EmailSender,
        protected readonly cls: ClsService,
    ) {
        super();
    }

    protected async processJob(job: Job<NotificationJobData>): Promise<void> {
        const { data } = job;
        this.logger.debug(`Processing email job ${job.id} for log ${data.logId}`);

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
    }
}
