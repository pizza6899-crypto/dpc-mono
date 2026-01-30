// apps/api/src/modules/notification/processor/processor.module.ts
import { BullMqModule } from 'src/infrastructure/bullmq/bullmq.module';
import { BullModule } from '@nestjs/bullmq';
import { BULLMQ_QUEUES } from 'src/infrastructure/bullmq/bullmq.constants';
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

// Workers
import { SocketWorker } from './workers/socket.worker';
import { EmailWorker } from './workers/email.worker';
import { SMSWorker } from './workers/sms.worker';
import { AlertWorker } from './workers/alert.worker';
import { EnvModule } from 'src/common/env/env.module';

@Module({
    imports: [
        EnvModule,
        forwardRef(() => InboxModule),
        AlertModule,
        TemplateModule,
        BullMqModule,
        BullModule.registerQueue({
            name: BULLMQ_QUEUES.NOTIFICATION.ALERT.name,
        }),
        BullModule.registerQueue({
            name: BULLMQ_QUEUES.NOTIFICATION.EMAIL.name,
        }),
        BullModule.registerQueue({
            name: BULLMQ_QUEUES.NOTIFICATION.SMS.name,
        }),
        BullModule.registerQueue({
            name: BULLMQ_QUEUES.NOTIFICATION.SOCKET.name,
        }),
    ],
    providers: [
        // Providers
        NodemailerAdapter,
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
