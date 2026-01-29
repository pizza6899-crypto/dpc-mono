import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';
import { TierAuditRepositoryPort } from './infrastructure/audit.repository.port';
import { TierAuditRepository } from './infrastructure/tier-audit.repository';
import { TierAuditService } from './application/tier-audit.service';
import { TierAuditProcessor } from './infrastructure/tier-audit.processor';
import { TIER_AUDIT_QUEUE_NAME } from './infrastructure/tier-audit.constants';
import { TierAuditScheduler } from './schedulers/tier-audit.scheduler';
import { TierProfileModule } from '../profile/tier-profile.module';
import { TierMasterModule } from '../master/tier-master.module';
import { TierAuditAdminController } from './controllers/admin/tier-audit-admin.controller';
import { GetTierDistributionService } from './application/get-tier-distribution.service';
import { ListEvaluationLogsService } from './application/list-evaluation-logs.service';

@Module({
    imports: [
        SnowflakeModule,
        ConcurrencyModule,
        BullModule.registerQueue({
            name: TIER_AUDIT_QUEUE_NAME,
        }),
        forwardRef(() => TierProfileModule),
        TierMasterModule,
    ],
    controllers: [TierAuditAdminController],
    providers: [
        { provide: TierAuditRepositoryPort, useClass: TierAuditRepository },
        TierAuditService,
        TierAuditProcessor,
        TierAuditScheduler,
        GetTierDistributionService,
        ListEvaluationLogsService,
    ],
    exports: [TierAuditRepositoryPort, TierAuditService, ListEvaluationLogsService],
})
export class TierAuditModule { }
