// apps/api/src/modules/notification/notification.module.ts

import { Module } from '@nestjs/common';
import { AlertModule } from './alert/alert.module';
import { InboxModule } from './inbox/inbox.module';
import { ProcessorModule } from './processor/processor.module';
import { TemplateModule } from './template/template.module';

@Module({
    imports: [
        AlertModule,
        InboxModule,
        ProcessorModule,
        TemplateModule,
    ],
    exports: [
        AlertModule,
        InboxModule,
    ],
})
export class NotificationModule { }
