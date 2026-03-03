import { Module } from '@nestjs/common';
import { SyncUserAnalyticsService } from './application/sync/sync-user-analytics.service';
import { UserAnalyticsRepository } from './infrastructure/persistence/user-analytics.repository';
import { USER_ANALYTICS_REPOSITORY } from './ports/out/user-analytics.repository.port';
import { UserAnalyticsMapper } from './infrastructure/persistence/user-analytics.mapper';
import { UserAnalyticsProcessor } from './infrastructure/queue/user-analytics.processor';
import { BullModule } from '@nestjs/bullmq';
import { USER_ANALYTICS_QUEUES } from './infrastructure/queue/user-analytics.bullmq';

@Module({
    imports: [
        // 큐 등록
        BullModule.registerQueue(USER_ANALYTICS_QUEUES.SYNC),
    ],
    providers: [
        // Persistence
        {
            provide: USER_ANALYTICS_REPOSITORY,
            useClass: UserAnalyticsRepository,
        },
        UserAnalyticsMapper,

        // Application Services
        SyncUserAnalyticsService,

        // Queue Processors
        UserAnalyticsProcessor,
    ],
    exports: [
        SyncUserAnalyticsService,
    ],
})
export class UserAnalyticsModule { }
