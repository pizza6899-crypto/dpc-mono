import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';
import { TierAuditRepositoryPort } from './infrastructure/audit.repository.port';
import { TierAuditRepository } from './infrastructure/tier-audit.repository';
import { TierAuditService } from './application/tier-audit.service';
import { TierAuditProcessor } from './infrastructure/tier-audit.processor';
import { BULLMQ_QUEUES } from 'src/infrastructure/bullmq/bullmq.constants';
import { TierProfileModule } from '../profile/tier-profile.module';
import { TierMasterModule } from '../master/tier-master.module';
import { TierAuditAdminController } from './controllers/admin/tier-audit-admin.controller';
import { GetTierDistributionService } from './application/get-tier-distribution.service';
import { ListEvaluationLogsService } from './application/list-evaluation-logs.service';

@Module({
    imports: [
        SnowflakeModule,
        BullModule.registerQueue({
            name: BULLMQ_QUEUES.TIER.AUDIT.name,
        }),
        forwardRef(() => TierProfileModule),
        TierMasterModule,
    ],
    controllers: [TierAuditAdminController],
    providers: [
        { provide: TierAuditRepositoryPort, useClass: TierAuditRepository },
        TierAuditService,
        TierAuditProcessor,
        GetTierDistributionService,
        ListEvaluationLogsService,
    ],
    exports: [TierAuditRepositoryPort, TierAuditService, ListEvaluationLogsService],
})
export class TierAuditModule { }
