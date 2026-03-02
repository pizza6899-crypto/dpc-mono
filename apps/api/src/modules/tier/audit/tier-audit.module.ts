import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';
import { TierAuditRepositoryPort } from './infrastructure/tier-audit.repository.port';
import { TierAuditRepository } from './infrastructure/tier-audit.repository';
import { RecordTierHistoryService } from './application/record-tier-history.service';
import { RecordUserExpLogService } from './application/record-user-exp-log.service';
import { TierStatsService } from './application/tier-stats.service';
import { HandleTierStatsService } from './application/handle-tier-stats.service';
import { TierStatsAggregationProcessor } from './infrastructure/tier-stats-aggregation.processor';
import { TierStatsRecordProcessor } from './infrastructure/tier-stats-record.processor';
import { TierProfileModule } from '../profile/tier-profile.module';
import { TierConfigModule } from '../config/tier-config.module';
import { TierAuditAdminController } from './controllers/admin/tier-audit-admin.controller';
import { GetTierDistributionService } from './application/get-tier-distribution.service';
import { BullMqModule } from 'src/infrastructure/bullmq/bullmq.module';
import { TIER_QUEUES } from './infrastructure/tier-audit.bullmq';

@Module({
  imports: [
    SnowflakeModule,
    BullMqModule,
    BullModule.registerQueue(
      { name: TIER_QUEUES.STATS_AGGREGATION.name },
      { name: TIER_QUEUES.STATS_RECORD.name },
    ),
    forwardRef(() => TierProfileModule),
    TierConfigModule,
  ],
  controllers: [TierAuditAdminController],
  providers: [
    { provide: TierAuditRepositoryPort, useClass: TierAuditRepository },
    RecordTierHistoryService,
    RecordUserExpLogService,
    TierStatsService,
    HandleTierStatsService,
    TierStatsAggregationProcessor,
    TierStatsRecordProcessor,
    GetTierDistributionService,
  ],
  exports: [
    TierAuditRepositoryPort,
    RecordTierHistoryService,
    RecordUserExpLogService,
    TierStatsService,
    HandleTierStatsService,
  ],
})
export class TierAuditModule {}
