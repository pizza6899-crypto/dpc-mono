// apps/api/src/modules/notification/notification.module.ts

import { Module } from '@nestjs/common';
import { AlertModule } from './alert/alert.module';
import { InboxModule } from './inbox/inbox.module';
import { RealTimeModule } from './realtime/realtime.module';
import { ProcessorModule } from './processor/processor.module';
import { TemplateModule } from './template/template.module';

@Module({
    imports: [
        AlertModule,
        InboxModule,
        RealTimeModule,
        ProcessorModule,
        TemplateModule,
    ],
    exports: [
        AlertModule,
        InboxModule,
        RealTimeModule,
    ],
})
export class NotificationModule { }
