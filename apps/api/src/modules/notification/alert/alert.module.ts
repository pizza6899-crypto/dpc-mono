import { Module } from '@nestjs/common';
import { NotificationQueueModule } from '../common/notification-queue.module';
import { CreateAlertService } from './application/create-alert.service';
import { AlertMapper } from './infrastructure/alert.mapper';
import { AlertRepository } from './infrastructure/alert.repository';
import { NotificationChannelPolicy } from './domain/policy/notification-channel.policy';
import { ALERT_REPOSITORY } from './ports';
import { SnowflakeModule } from '../../../common/snowflake/snowflake.module';

@Module({
  imports: [NotificationQueueModule, SnowflakeModule],
  controllers: [],
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
    NotificationChannelPolicy,
  ],
  exports: [CreateAlertService, ALERT_REPOSITORY],
})
export class AlertModule {}
