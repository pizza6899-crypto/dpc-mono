import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NOTIFICATION_QUEUES } from '../infrastructure/notification.bullmq';

@Module({
    imports: [
        BullModule.registerQueue(
            { ...NOTIFICATION_QUEUES.ALERT },
            { ...NOTIFICATION_QUEUES.SOCKET },
            { ...NOTIFICATION_QUEUES.EMAIL },
            { ...NOTIFICATION_QUEUES.SMS },
        ),
    ],
    exports: [BullModule],
})
export class NotificationQueueModule { }
