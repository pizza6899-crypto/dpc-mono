// apps/api/src/modules/notification/processor/workers/alert.worker.ts

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NOTIFICATION_QUEUES, ChannelSendParams } from '../../common';
import {
    ALERT_REPOSITORY,
} from '../../alert/ports';
import type { AlertRepositoryPort } from '../../alert/ports';
import {
    NOTIFICATION_LOG_REPOSITORY,
} from '../../inbox/ports';
import type { NotificationLogRepositoryPort } from '../../inbox/ports';
import { RenderTemplateService } from '../../template/application/render-template.service';
import { NOTIFICATION_TEMPLATE_REPOSITORY } from '../../template/ports';
import type { NotificationTemplateRepositoryPort } from '../../template/ports';
import { NotificationLog } from '../../inbox/domain';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AlertStatus, ChannelType } from '@repo/database';

interface AlertJobData {
    alertId: string;
    alertCreatedAt: string;
}

@Processor(NOTIFICATION_QUEUES.ALERT)
export class AlertWorker extends WorkerHost {
    private readonly logger = new Logger(AlertWorker.name);

    constructor(
        @Inject(ALERT_REPOSITORY)
        private readonly alertRepository: AlertRepositoryPort,
        @Inject(NOTIFICATION_LOG_REPOSITORY)
        private readonly notificationLogRepository: NotificationLogRepositoryPort,
        @Inject(NOTIFICATION_TEMPLATE_REPOSITORY)
        private readonly templateRepository: NotificationTemplateRepositoryPort,
        private readonly renderService: RenderTemplateService,
        @InjectQueue(NOTIFICATION_QUEUES.EMAIL) private readonly emailQueue: Queue,
        @InjectQueue(NOTIFICATION_QUEUES.SMS) private readonly smsQueue: Queue,
        // Add other queues here
    ) {
        super();
    }

    async process(job: Job<AlertJobData>): Promise<void> {
        const { data } = job;
        this.logger.debug(`Processing alert job ${job.id} for alert ${data.alertId}`);

        try {
            // 1. Fetch Alert
            const alert = await this.alertRepository.getById(
                new Date(data.alertCreatedAt),
                BigInt(data.alertId),
            );

            // Status update to PROCESSING
            alert.startProcessing();
            await this.alertRepository.update(alert);

            // 2. Identify Target User
            // For MVP, we assume alert.userId is present.
            // If targetGroup exists, we would need logic to expand that to multiple users.
            // Doing single user for now.
            const userId = alert.userId;
            if (!userId) {
                this.logger.warn(`Alert ${alert.id} has no userId. Skipping.`);
                alert.complete(); // Or fail?
                await this.alertRepository.update(alert);
                return;
            }

            // 3. Find applicable templates for this event
            const templates = await this.templateRepository.findByEvent(alert.event);
            if (templates.length === 0) {
                this.logger.warn(`No templates found for event ${alert.event}. Skipping.`);
                alert.complete();
                await this.alertRepository.update(alert);
                return;
            }

            // 4. Process for each channel (template)
            for (const template of templates) {
                try {
                    // Render Template
                    // Locale: Hardcoded 'ko' for now, or fetch from User entity if available
                    const locale = 'ko';
                    const renderResult = await this.renderService.execute({
                        event: alert.event,
                        channel: template.channel,
                        locale,
                        variables: alert.payload as Record<string, unknown>,
                    });

                    // Create NotificationLog
                    const log = NotificationLog.create({
                        alertId: alert.id!,
                        alertCreatedAt: alert.createdAt,
                        receiverId: userId,
                        channel: template.channel,
                        title: renderResult.title,
                        body: renderResult.body,
                        actionUri: renderResult.actionUri,
                        templateId: template.id,
                        templateEvent: alert.event, // snapshot
                        locale,
                        target: this.extractTarget(alert, template.channel), // Helper to get email/phone
                    });

                    const savedLog = await this.notificationLogRepository.create(log);

                    // Dispatch to Channel Queue
                    const jobData = {
                        logId: savedLog.id!.toString(),
                        logCreatedAt: savedLog.createdAt.toISOString(),
                    };

                    if (template.channel === ChannelType.EMAIL) {
                        await this.emailQueue.add('send-email', jobData);
                    } else if (template.channel === ChannelType.SMS) {
                        await this.smsQueue.add('send-sms', jobData);
                    } else {
                        this.logger.warn(`Unsupported channel type for queuing: ${template.channel}`);
                    }

                } catch (innerError) {
                    this.logger.error(
                        `Failed to process template ${template.id} for alert ${alert.id}:`,
                        innerError,
                    );
                    // Continue to next template? Yes.
                }
            }

            alert.complete();
            await this.alertRepository.update(alert);
            this.logger.debug(`Successfully processed alert ${alert.id}`);

        } catch (error: any) {
            this.logger.error(`Failed to process alert job ${job.id}:`, error);
            // Let BullMQ retry?
            // If alert fetch failed, maybe.
            throw error;
        }
    }

    private extractTarget(alert: any, channel: ChannelType): string | undefined {
        // In a real app, we would fetch User entity to get email/phone.
        // For this MVP, we might expect it in payload or we need UserRepository.
        // Let's assume payload has target info for now to simplify, 
        // OR we can't send without user info.
        //
        // CRITICAL for MVP: Since we don't have easy User entity access in this worker yet (UserModule separation),
        // we will look for target in `alert.payload.target` or `alert.payload.email`/`phone`.
        // OR just use a placeholder if user integration is missing.
        //
        // Let's look in payload first.
        const payload = alert.payload as any;
        if (channel === ChannelType.EMAIL) return payload.email ?? payload.target;
        if (channel === ChannelType.SMS) return payload.phone ?? payload.phoneNumber ?? payload.target;
        return undefined;
    }
}
