// apps/api/src/modules/notification/realtime/realtime.module.ts

import { Module, forwardRef } from '@nestjs/common';
import { NotificationQueueModule } from '../common/notification-queue.module';
import { NotificationGateway } from './notification.gateway';
import { RealTimeService } from './realtime.service';
import { AlertModule } from '../alert/alert.module';

@Module({
    imports: [
        forwardRef(() => AlertModule),
        NotificationQueueModule,
    ],
    providers: [NotificationGateway, RealTimeService],
    exports: [RealTimeService, NotificationGateway],
})
export class RealTimeModule { }
