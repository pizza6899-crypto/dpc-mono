import { Module } from '@nestjs/common';
import { NotificationQueueModule } from '../common/notification-queue.module';
import { SendAlertService } from './application/send-alert.service';
import { SendRealtimeService } from './application/send-realtime.service';
import { FindAlertsService } from './application/find-alerts.service';
import { AlertMapper } from './infrastructure/alert.mapper';
import { AlertRepository } from './infrastructure/alert.repository';
import { AlertAdminController } from './controllers/admin/alert-admin.controller';
import { ALERT_REPOSITORY } from './ports';

@Module({
  imports: [NotificationQueueModule],
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
    SendAlertService,
    SendRealtimeService,
    FindAlertsService,
  ],
  exports: [
    SendAlertService,
    SendRealtimeService,
    FindAlertsService,
    ALERT_REPOSITORY,
  ],
})
export class AlertModule {}
