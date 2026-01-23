import { Module } from '@nestjs/common';
import { COMP_REPOSITORY } from './ports';
import { CompRepository } from './infrastructure/comp.repository';
import { CompMapper } from './infrastructure/comp.mapper';
import { EarnCompService } from './application/earn-comp.service';
import { ClaimCompService } from './application/claim-comp.service';
import { FindCompBalanceService } from './application/find-comp-balance.service';
import { FindCompTransactionsService } from './application/find-comp-transactions.service';
import { DeductCompService } from './application/deduct-comp.service';
import { FindCompOverviewService } from './application/find-comp-overview.service';
import { FindCompDailyStatsService } from './application/find-comp-daily-stats.service';
import { FindCompTopEarnersService } from './application/find-comp-top-earners.service';
import { CompUserController } from './controllers/user/comp-user.controller';
import { CompAdminController } from './controllers/admin/comp-admin.controller';
import { CompStatsController } from './controllers/admin/comp-stats.controller';
import { WalletModule } from '../wallet/wallet.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';

@Module({
    imports: [
        WalletModule,
        AnalyticsModule,
        ConcurrencyModule,
    ],
    controllers: [
        CompUserController,
        CompAdminController,
        CompStatsController,
    ],
    providers: [
        CompMapper,
        {
            provide: COMP_REPOSITORY,
            useClass: CompRepository,
        },
        EarnCompService,
        ClaimCompService,
        FindCompBalanceService,
        FindCompTransactionsService,
        DeductCompService,
        FindCompOverviewService,
        FindCompDailyStatsService,
        FindCompTopEarnersService,
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
    ],
})
export class CompModule { }
