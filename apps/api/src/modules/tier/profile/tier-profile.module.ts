import { Module, forwardRef } from '@nestjs/common';
import { UserTierRepository } from './infrastructure/user-tier.repository';
import { UserTierRepositoryPort } from './infrastructure/user-tier.repository.port';
import { InitializeUserTierService } from './application/initialize-user-tier.service';
import { GetUserTierService } from './application/get-user-tier.service';
import { GetUserTierDetailService } from './application/get-user-tier-detail.service';
import { GetUserTierHistoryService } from './application/get-user-tier-history.service';
import { ListUserTiersService } from './application/list-user-tiers.service';
import { UpdateUserTierCustomService } from './application/update-user-tier-custom.service';
import { UpdateUserTierStatusService } from './application/update-user-tier-status.service';
import { ForceUpdateUserTierService } from './application/force-update-user-tier.service';
import { ResetUserTierPerformanceService } from './application/reset-user-tier-performance.service';

import { UserTierPublicController } from './controllers/public/user-tier-public.controller';
import { UserTierAdminController } from './controllers/admin/user-tier-admin.controller';
import { TierAuditModule } from '../audit/tier-audit.module';
import { TierMasterModule } from '../master/tier-master.module';

@Module({
    imports: [
        forwardRef(() => TierAuditModule),
        TierMasterModule,
    ],
    controllers: [UserTierPublicController, UserTierAdminController],
    providers: [
        { provide: UserTierRepositoryPort, useClass: UserTierRepository },
        InitializeUserTierService,
        GetUserTierService,
        GetUserTierDetailService,
        GetUserTierHistoryService,
        ListUserTiersService,
        UpdateUserTierCustomService,
        UpdateUserTierStatusService,
        ForceUpdateUserTierService,
        ResetUserTierPerformanceService,
    ],
    exports: [
        UserTierRepositoryPort,
        InitializeUserTierService,
        GetUserTierService,
        GetUserTierDetailService,
        GetUserTierHistoryService,
        ListUserTiersService,
        UpdateUserTierCustomService,
        UpdateUserTierStatusService,
        ForceUpdateUserTierService,
        ResetUserTierPerformanceService,
    ],
})
export class TierProfileModule { }
