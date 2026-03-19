// apps/api/src/modules/notification/inbox/inbox.module.ts

import { Module } from '@nestjs/common';
import { FindNotificationsService } from './application/find-notifications.service';
import { GetUnreadCountService } from './application/get-unread-count.service';
import { MarkAsReadService } from './application/mark-as-read.service';
import { MarkAllAsReadService } from './application/mark-all-as-read.service';
import { DeleteNotificationService } from './application/delete-notification.service';
import { NotificationLogMapper } from './infrastructure/notification-log.mapper';
import { NotificationLogRepository } from './infrastructure/notification-log.repository';
import { InboxUserController } from './controllers/user/inbox-user.controller';
import { NOTIFICATION_LOG_REPOSITORY } from './ports';

import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';
import { SqidsModule } from 'src/common/sqids/sqids.module';

@Module({
  imports: [SnowflakeModule, SqidsModule],
  controllers: [InboxUserController],
  providers: [
    // Mapper
    NotificationLogMapper,

    // Repository
    {
      provide: NOTIFICATION_LOG_REPOSITORY,
      useClass: NotificationLogRepository,
    },

    // Services
    FindNotificationsService,
    GetUnreadCountService,
    MarkAsReadService,
    MarkAllAsReadService,
    DeleteNotificationService,
  ],
  exports: [
    FindNotificationsService,
    GetUnreadCountService,
    MarkAsReadService,
    MarkAllAsReadService,
    DeleteNotificationService,
    NOTIFICATION_LOG_REPOSITORY,
  ],
})
export class InboxModule {}
