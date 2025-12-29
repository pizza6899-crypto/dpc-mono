import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuditLogAdapter } from './infrastructure/audit-log.adapter';
import {
  CriticalLogProcessor,
  HeavyLogProcessor,
} from './infrastructure/audit-log.processor';
import { DispatchLogService } from './application/dispatch-log.service';
import { PrismaModule } from 'src/platform/prisma/prisma.module';
import { AUDIT_LOG_REPOSITORY } from './ports/out';
import {
  CRITICAL_LOG_QUEUE_CONFIG,
  HEAVY_LOG_QUEUE_CONFIG,
} from './infrastructure/queue.constants';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue(CRITICAL_LOG_QUEUE_CONFIG),
    BullModule.registerQueue(HEAVY_LOG_QUEUE_CONFIG),
  ],
  providers: [
    {
      provide: AUDIT_LOG_REPOSITORY,
      useClass: AuditLogAdapter,
    },
    CriticalLogProcessor,
    HeavyLogProcessor,
    DispatchLogService,
  ],
  exports: [AUDIT_LOG_REPOSITORY, DispatchLogService],
})
export class AuditLogModule {}

