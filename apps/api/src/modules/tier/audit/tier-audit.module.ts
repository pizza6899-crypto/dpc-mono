import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';
import { TierAuditRepositoryPort } from './infrastructure/audit.repository.port';
import { TierAuditRepository } from './infrastructure/tier-audit.repository';
import { TierAuditService } from './application/tier-audit.service';
import { TierAuditProcessor } from './infrastructure/tier-audit.processor';
import { TIER_AUDIT_QUEUE_NAME } from './infrastructure/tier-audit.constants';

@Module({
    imports: [
        SnowflakeModule,
        BullModule.registerQueue({
            name: TIER_AUDIT_QUEUE_NAME,
        }),
    ],
    providers: [
        { provide: TierAuditRepositoryPort, useClass: TierAuditRepository },
        TierAuditService,
        TierAuditProcessor,
    ],
    exports: [TierAuditRepositoryPort, TierAuditService],
})
export class TierAuditModule { }
