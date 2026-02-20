import { Module } from '@nestjs/common';
import {
  COMP_REPOSITORY,
  COMP_CONFIG_REPOSITORY,
  COMP_CLAIM_HISTORY_REPOSITORY,
} from './ports';
import { CompWalletRepository } from './infrastructure/comp-wallet.repository';
import { CompConfigRepository } from './infrastructure/comp-config.repository';
import { CompClaimHistoryRepository } from './infrastructure/comp-claim-history.repository';
import { CompMapper } from './infrastructure/comp.mapper';
import { CompPolicy } from './domain/comp.policy';
import { EarnCompService } from './application/earn-comp.service';
import { ClaimCompService } from './application/claim-comp.service';
import { FindCompBalanceService } from './application/find-comp-balance.service';
import { FindCompTransactionsService } from './application/find-comp-transactions.service';
import { DeductCompService } from './application/deduct-comp.service';
import { FindCompOverviewService } from './application/find-comp-overview.service';
import { FindCompDailyStatsService } from './application/find-comp-daily-stats.service';
import { FindCompTopEarnersService } from './application/find-comp-top-earners.service';
import { FindCompConfigService } from './application/find-comp-config.service';
import { UpdateCompConfigService } from './application/update-comp-config.service';
import { CompUserController } from './controllers/user/comp-user.controller';
import { CompAdminController } from './controllers/admin/comp-admin.controller';
import { CompStatsController } from './controllers/admin/comp-stats.controller';
import { WalletModule } from '../wallet/wallet.module';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';

@Module({
  imports: [WalletModule, ConcurrencyModule, SnowflakeModule],
  controllers: [CompUserController, CompAdminController, CompStatsController],
  providers: [
    CompMapper,
    CompPolicy,
    {
      provide: COMP_REPOSITORY,
      useClass: CompWalletRepository,
    },
    {
      provide: COMP_CONFIG_REPOSITORY,
      useClass: CompConfigRepository,
    },
    {
      provide: COMP_CLAIM_HISTORY_REPOSITORY,
      useClass: CompClaimHistoryRepository,
    },
    EarnCompService,
    ClaimCompService,
    FindCompBalanceService,
    FindCompTransactionsService,
    DeductCompService,
    FindCompOverviewService,
    FindCompDailyStatsService,
    FindCompTopEarnersService,
    FindCompConfigService,
    UpdateCompConfigService,
  ],
  exports: [
    EarnCompService,
    ClaimCompService,
    FindCompBalanceService,
    FindCompTransactionsService,
    DeductCompService,
    FindCompOverviewService,
    FindCompDailyStatsService,
    FindCompTopEarnersService,
    FindCompConfigService,
    UpdateCompConfigService,
    CompPolicy,
  ],
})
export class CompModule {}
