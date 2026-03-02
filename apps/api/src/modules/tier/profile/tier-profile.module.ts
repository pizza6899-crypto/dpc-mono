import { Module, forwardRef } from '@nestjs/common';
import { UserTierRepository } from './infrastructure/user-tier.repository';
import { UserTierRepositoryPort } from './infrastructure/user-tier.repository.port';
import { InitializeUserTierService } from './application/initialize-user-tier.service';
import { GetMyTierService } from './application/get-my-tier.service';
import { GetNextTierProgressService } from './application/get-next-tier-progress.service';
import { GetUserTierDetailService } from './application/get-user-tier-detail.service';
import { GetUserTierHistoryService } from './application/get-user-tier-history.service';
import { ListUserTiersService } from './application/list-user-tiers.service';
import { UpdateUserTierCustomService } from './application/update-user-tier-custom.service';
import { UpdateUserTierStatusService } from './application/update-user-tier-status.service';
import { ForceUpdateUserTierService } from './application/force-update-user-tier.service';
import { ResetUserTierPerformanceService } from './application/reset-user-tier-performance.service';
import { GetTierBenefitsService } from './application/get-tier-benefits.service';

import { UserTierController } from './controllers/user/user-tier.controller';
import { UserTierAdminController } from './controllers/admin/user-tier-admin.controller';
import { TierAuditModule } from '../audit/tier-audit.module';
import { TierConfigModule } from '../config/tier-config.module';
import { TierEvaluatorModule } from '../evaluator/tier-evaluator.module';
import { EnvModule } from 'src/common/env/env.module';
import { TierTestAdminController } from './controllers/admin/tier-test-admin.controller';
import { RewardCoreModule } from 'src/modules/reward/core/reward-core.module';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';

@Module({
  imports: [
    forwardRef(() => TierAuditModule),
    forwardRef(() => TierEvaluatorModule),
    TierConfigModule,
    EnvModule,
    RewardCoreModule,
    ConcurrencyModule,
  ],
  controllers: [
    UserTierController,
    UserTierAdminController,
    TierTestAdminController,
  ],
  providers: [
    { provide: UserTierRepositoryPort, useClass: UserTierRepository },
    InitializeUserTierService,
    GetMyTierService,
    GetNextTierProgressService,
    GetUserTierDetailService,
    GetUserTierHistoryService,
    ListUserTiersService,
    UpdateUserTierCustomService,
    UpdateUserTierStatusService,
    ForceUpdateUserTierService,
    ResetUserTierPerformanceService,
    GetTierBenefitsService,
  ],
  exports: [
    UserTierRepositoryPort,
    InitializeUserTierService,
    GetMyTierService,
    GetNextTierProgressService,
    GetUserTierDetailService,
    GetUserTierHistoryService,
    ListUserTiersService,
    UpdateUserTierCustomService,
    UpdateUserTierStatusService,
    ForceUpdateUserTierService,
    ResetUserTierPerformanceService,
    GetTierBenefitsService,
  ],
})
export class TierProfileModule {}
