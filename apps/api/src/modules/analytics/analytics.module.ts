import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AnalyticsUserController } from './controllers/user/analytics-user.controller';
import { AnalyticsAdminController } from './controllers/admin/analytics-admin.controller';
import { RecordUserActivityService } from './application/record-user-activity.service';
import { FindUserStatsService } from './application/find-user-stats.service';
import { AnalyticsRepository } from './infrastructure/analytics.repository';
import { AnalyticsMapper } from './infrastructure/analytics.mapper';
import { AnalyticsConsumer, ANALYTICS_QUEUE_NAME } from './consumers/analytics.consumer';
import { ANALYTICS_REPOSITORY } from './ports/analytics.repository.token';

import { AnalyticsQueueService } from './application/analytics-queue.service';

@Module({
    imports: [
        BullModule.registerQueue({
            name: ANALYTICS_QUEUE_NAME,
        }),
    ],
    controllers: [AnalyticsUserController, AnalyticsAdminController],
    providers: [
        RecordUserActivityService,
        FindUserStatsService,
        AnalyticsQueueService,
        AnalyticsConsumer,
        AnalyticsMapper,
        {
            provide: ANALYTICS_REPOSITORY,
            useClass: AnalyticsRepository,
        },
    ],
    exports: [RecordUserActivityService, AnalyticsQueueService],
})
export class AnalyticsModule { }
