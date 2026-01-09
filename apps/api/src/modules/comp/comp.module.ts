import { Module, forwardRef } from '@nestjs/common';
import { COMP_REPOSITORY } from './ports';
import { CompRepository } from './infrastructure/comp.repository';
import { CompMapper } from './infrastructure/comp.mapper';
import { EarnCompService } from './application/earn-comp.service';
import { ClaimCompService } from './application/claim-comp.service';
import { FindCompBalanceService } from './application/find-comp-balance.service';
import { CompUserController } from './controllers/user/comp-user.controller';
import { CompAdminController } from './controllers/admin/comp-admin.controller';
import { CompStatsController } from './controllers/admin/comp-stats.controller';
import { WalletModule } from '../wallet/wallet.module';

@Module({
    imports: [
        forwardRef(() => WalletModule),
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
    ],
    exports: [
        EarnCompService,
        ClaimCompService,
        FindCompBalanceService,
    ],
})
export class CompModule { }
