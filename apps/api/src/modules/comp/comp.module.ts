import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BULLMQ_QUEUES } from 'src/infrastructure/bullmq/bullmq.constants';
import {
  COMP_REPOSITORY,
  COMP_CONFIG_REPOSITORY,
  COMP_DAILY_SETTLEMENT_REPOSITORY,
} from './ports';
import { CompAccountRepository } from './infrastructure/comp-account.repository';
import { CompConfigRepository } from './infrastructure/comp-config.repository';
import { CompDailySettlementRepository } from './infrastructure/comp-daily-settlement.repository';
import { CompMapper } from './infrastructure/comp.mapper';
import { CompPolicy } from './domain/comp.policy';
import { EarnCompService } from './application/earn-comp.service';
import { FindCompAccountService } from './application/find-comp-account.service';
import { FindCompTransactionsService } from './application/find-comp-transactions.service';
import { FindAdminCompStatsService } from './application/find-admin-comp-stats.service';
import { FindCompConfigService } from './application/find-comp-config.service';
import { UpdateCompConfigService } from './application/update-comp-config.service';
import { UpdateCompAccountStatusService } from './application/update-comp-account-status.service';
import { CompAdminController } from './controllers/admin/comp-admin.controller';
import { WalletModule } from '../wallet/wallet.module';
import { ConcurrencyModule } from 'src/infrastructure/concurrency/concurrency.module';
import { SnowflakeModule } from 'src/infrastructure/snowflake/snowflake.module';
import { RewardCoreModule } from '../reward/core/reward-core.module';
import { EnvModule } from 'src/infrastructure/env/env.module';
import { SettleDailyCompService } from './application/settle-daily-comp.service';
import { CompDailySettlementProcessor } from './infrastructure/processors/comp-daily-settlement.processor';

@Module({
  imports: [
    WalletModule,
    ConcurrencyModule,
    SnowflakeModule,
    RewardCoreModule,
    EnvModule,
    BullModule.registerQueue(BULLMQ_QUEUES.COMP.DAILY_SETTLEMENT),
  ],
  controllers: [CompAdminController],
  providers: [
    CompMapper,
    CompPolicy,
    {
      provide: COMP_REPOSITORY,
      useClass: CompAccountRepository,
    },
    {
      provide: COMP_CONFIG_REPOSITORY,
      useClass: CompConfigRepository,
    },
    {
      provide: COMP_DAILY_SETTLEMENT_REPOSITORY,
      useClass: CompDailySettlementRepository,
    },
    EarnCompService,
    FindCompAccountService,
    FindCompTransactionsService,
    FindAdminCompStatsService,
    FindCompConfigService,
    UpdateCompConfigService,
    UpdateCompAccountStatusService,
    SettleDailyCompService,
    CompDailySettlementProcessor,
  ],
  exports: [
    EarnCompService,
    FindCompAccountService,
    FindCompTransactionsService,
    FindAdminCompStatsService,
    FindCompConfigService,
    UpdateCompConfigService,
    UpdateCompAccountStatusService,
    CompPolicy,
  ],
})
export class CompModule {}
