// apps/api/src/modules/notification/infrastructure/notification-infrastructure.module.ts

import { BullMqModule } from 'src/infrastructure/bullmq/bullmq.module';
import { NotificationQueueModule } from '../common/notification-queue.module';
import { Module, forwardRef } from '@nestjs/common';
import { InboxModule } from '../inbox/inbox.module';
import { AlertModule } from '../alert/alert.module';
import { TemplateModule } from '../template/template.module';

// Channel Senders & Providers
import { EmailSender } from './channels/email/email.sender';
import { NodemailerAdapter } from './channels/email/providers/nodemailer.adapter';
import { SMSSender } from './channels/sms/sms.sender';
import { NCloudAdapter } from './channels/sms/providers/ncloud.adapter';

// Processors
import { InboxProcessor } from './processors/inbox.processor';
import { EmailProcessor } from './processors/email.processor';
import { SMSProcessor } from './processors/sms.processor';
import { TelegramProcessor } from './processors/telegram.processor';
import { AlertProcessor } from './processors/alert.processor';
import { EnvModule } from 'src/common/env/env.module';
import { UserProfileModule } from 'src/modules/user/profile/user-profile.module';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';

@Module({
  imports: [
    EnvModule,
    forwardRef(() => InboxModule),
    forwardRef(() => AlertModule),
    forwardRef(() => UserProfileModule),
    TemplateModule,
    BullMqModule,
    NotificationQueueModule,
    SnowflakeModule,
  ],
  providers: [
    // Providers
    NodemailerAdapter,
    NCloudAdapter,

    // Channel Senders
    EmailSender,
    SMSSender,

    // Processors
    InboxProcessor,
    EmailProcessor,
    SMSProcessor,
    TelegramProcessor,
    AlertProcessor,
  ],
  exports: [EmailSender, SMSSender],
})
export class NotificationInfrastructureModule { }
