// apps/api/src/modules/notification/infrastructure/notification-infrastructure.module.ts

import { BullMqModule } from 'src/infrastructure/bullmq/bullmq.module';
import { NotificationQueueModule } from '../common/notification-queue.module';
import { Module, forwardRef } from '@nestjs/common';
import { InboxModule } from '../inbox/inbox.module';
import { AlertModule } from '../alert/alert.module';
import { TemplateModule } from '../template/template.module';

// Channel Senders & Providers
import { SocketSender } from './channels/socket/socket.sender';
import { EmailSender } from './channels/email/email.sender';
import { NodemailerAdapter } from './channels/email/providers/nodemailer.adapter';
import { SMSSender } from './channels/sms/sms.sender';
import { NCloudAdapter } from './channels/sms/providers/ncloud.adapter';

// Processors
import { SocketProcessor } from './processors/socket.processor';
import { EmailProcessor } from './processors/email.processor';
import { SMSProcessor } from './processors/sms.processor';
import { AlertProcessor } from './processors/alert.processor';
import { EnvModule } from 'src/common/env/env.module';

@Module({
    imports: [
        EnvModule,
        forwardRef(() => InboxModule),
        AlertModule,
        TemplateModule,
        BullMqModule,
        NotificationQueueModule,
    ],
    providers: [
        // Providers
        NodemailerAdapter,
        NCloudAdapter,

        // Channel Senders
        SocketSender,
        EmailSender,
        SMSSender,

        // Processors
        SocketProcessor,
        EmailProcessor,
        SMSProcessor,
        AlertProcessor,
    ],
    exports: [SocketSender, EmailSender, SMSSender],
})
export class NotificationInfrastructureModule { }
