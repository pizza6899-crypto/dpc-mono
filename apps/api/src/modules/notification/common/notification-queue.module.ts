// apps/api/src/modules/notification/common/notification-queue.module.ts

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NOTIFICATION_QUEUES } from './constants/queue.constants';

@Module({
    imports: [
        BullModule.registerQueue(
            {
                name: NOTIFICATION_QUEUES.ALERT,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 2000 },
                    removeOnComplete: 100,
                    removeOnFail: 500,
                },
            },
            {
                name: NOTIFICATION_QUEUES.SOCKET,
                defaultJobOptions: {
                    attempts: 1,
                    removeOnComplete: true,
                    removeOnFail: 50,
                },
            },
            {
                name: NOTIFICATION_QUEUES.EMAIL,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 5000 },
                    removeOnComplete: 100,
                    removeOnFail: 500,
                },
            },
            {
                name: NOTIFICATION_QUEUES.SMS,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 10000 },
                    removeOnComplete: 100,
                    removeOnFail: 500,
                },
            },
        ),
    ],
    exports: [BullModule],
})
export class NotificationQueueModule { }
