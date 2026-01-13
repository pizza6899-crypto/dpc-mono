// apps/api/src/modules/notification/alert/alert.module.ts

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NOTIFICATION_QUEUES } from '../common';
import { CreateAlertService } from './application/create-alert.service';
import { FindAlertsService } from './application/find-alerts.service';
import { AlertMapper } from './infrastructure/alert.mapper';
import { AlertRepository } from './infrastructure/alert.repository';
import { AlertAdminController } from './controllers/admin/alert-admin.controller';
import { ALERT_REPOSITORY } from './ports';

@Module({
    imports: [
        BullModule.registerQueue({
            name: NOTIFICATION_QUEUES.ALERT,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
                removeOnComplete: 100,
                removeOnFail: 200,
            },
        }),
    ],
    controllers: [AlertAdminController],
    providers: [
        // Mapper
        AlertMapper,

        // Repository
        {
            provide: ALERT_REPOSITORY,
            useClass: AlertRepository,
        },

        // Services
        CreateAlertService,
        FindAlertsService,
    ],
    exports: [CreateAlertService, FindAlertsService, ALERT_REPOSITORY],
})
export class AlertModule { }
