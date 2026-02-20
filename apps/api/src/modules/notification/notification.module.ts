// apps/api/src/modules/notification/notification.module.ts

import { Module } from '@nestjs/common';
import { AlertModule } from './alert/alert.module';
import { InboxModule } from './inbox/inbox.module';
import { NotificationInfrastructureModule } from './infrastructure/notification-infrastructure.module';
import { TemplateModule } from './template/template.module';

@Module({
  imports: [
    AlertModule,
    InboxModule,
    NotificationInfrastructureModule,
    TemplateModule,
  ],
  exports: [AlertModule, InboxModule],
})
export class NotificationModule {}
