// apps/api/src/modules/notification/alert/alert.module.ts

import { Module } from '@nestjs/common';
import { NotificationQueueModule } from '../common/notification-queue.module';
import { CreateAlertService } from './application/create-alert.service';
import { FindAlertsService } from './application/find-alerts.service';
import { AlertMapper } from './infrastructure/alert.mapper';
import { AlertRepository } from './infrastructure/alert.repository';
import { AlertAdminController } from './controllers/admin/alert-admin.controller';
import { ALERT_REPOSITORY } from './ports';

@Module({
    imports: [
        NotificationQueueModule,
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
