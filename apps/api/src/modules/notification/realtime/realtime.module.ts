// apps/api/src/modules/notification/realtime/realtime.module.ts

import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NOTIFICATION_QUEUES } from '../common';
import { NotificationGateway } from './notification.gateway';
import { RealTimeService } from './realtime.service';
import { AlertModule } from '../alert/alert.module';

@Module({
    imports: [
        forwardRef(() => AlertModule),
        BullModule.registerQueue(
            {
                name: NOTIFICATION_QUEUES.SOCKET,
                defaultJobOptions: {
                    attempts: 1,
                    removeOnComplete: true,
                    removeOnFail: 50,
                },
            },
        ),
    ],
    providers: [NotificationGateway, RealTimeService],
    exports: [RealTimeService, NotificationGateway],
})
export class RealTimeModule { }
