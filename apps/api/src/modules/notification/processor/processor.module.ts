// apps/api/src/modules/notification/processor/processor.module.ts

import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NOTIFICATION_QUEUES } from '../common';
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
        BullModule.registerQueue(
            {
                name: NOTIFICATION_QUEUES.ALERT,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 2000 },
                    removeOnComplete: 100,
                    removeOnFail: 500,
                },
            },
            {
                name: NOTIFICATION_QUEUES.EMAIL,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 5000 },
                    removeOnComplete: 100,
                    removeOnFail: 500,
                },
                // limiter: { max: 100, duration: 60000 }, // 분당 100건
            },
            {
                name: NOTIFICATION_QUEUES.SMS,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 10000 },
                    removeOnComplete: 100,
                    removeOnFail: 500,
                },
                // limiter: { max: 10, duration: 60000 }, // 분당 10건
            },
        ),
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
