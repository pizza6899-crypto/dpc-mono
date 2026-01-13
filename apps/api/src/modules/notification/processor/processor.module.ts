// apps/api/src/modules/notification/processor/processor.module.ts

import { Module, forwardRef } from '@nestjs/common';
import { NotificationQueueModule } from '../common/notification-queue.module';
import { InboxModule } from '../inbox/inbox.module';
import { RealTimeModule } from '../realtime/realtime.module';
import { AlertModule } from '../alert/alert.module';
import { TemplateModule } from '../template/template.module';

// Channel Senders & Providers
import { SocketSender } from './channels/socket/socket.sender';
import { EmailSender } from './channels/email/email.sender';
import { SESAdapter } from './channels/email/providers/ses.adapter';
import { SMSSender } from './channels/sms/sms.sender';
import { NCloudAdapter } from './channels/sms/providers/ncloud.adapter';

// Workers
import { SocketWorker } from './workers/socket.worker';
import { EmailWorker } from './workers/email.worker';
import { SMSWorker } from './workers/sms.worker';
import { AlertWorker } from './workers/alert.worker';

@Module({
    imports: [
        forwardRef(() => InboxModule),
        forwardRef(() => RealTimeModule),
        AlertModule,
        TemplateModule,
        NotificationQueueModule,
    ],
    providers: [
        // Providers
        SESAdapter,
        NCloudAdapter,

        // Channel Senders
        SocketSender,
        EmailSender,
        SMSSender,

        // Workers
        SocketWorker,
        EmailWorker,
        SMSWorker,
        AlertWorker,
    ],
    exports: [SocketSender, EmailSender, SMSSender],
})
export class ProcessorModule { }
