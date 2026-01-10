import { Module } from '@nestjs/common';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';
import { WithdrawalPolicy } from './domain';
import { WITHDRAWAL_REPOSITORY } from './ports';
import { WithdrawalRepository } from './infrastructure/withdrawal.repository';
import { WithdrawalMapper } from './infrastructure/withdrawal.mapper';
import {
    RequestCryptoWithdrawalService,
    CancelWithdrawalService,
    FindWithdrawalsService,
    GetWithdrawalService,
    ApproveWithdrawalService,
    RejectWithdrawalService,
    FindPendingWithdrawalsService,
} from './application';
import { WithdrawalUserController } from './controllers/user/withdrawal-user.controller';
import { WithdrawalAdminController } from './controllers/admin/withdrawal-admin.controller';

@Module({
    imports: [SnowflakeModule],
    controllers: [
        WithdrawalUserController,
        WithdrawalAdminController,
    ],
    providers: [
        // Domain
        WithdrawalPolicy,

        // Infrastructure
        WithdrawalMapper,
        {
            provide: WITHDRAWAL_REPOSITORY,
            useClass: WithdrawalRepository,
        },

        // Application Services
        RequestCryptoWithdrawalService,
        CancelWithdrawalService,
        FindWithdrawalsService,
        GetWithdrawalService,
        ApproveWithdrawalService,
        RejectWithdrawalService,
        FindPendingWithdrawalsService,
    ],
    exports: [
        WITHDRAWAL_REPOSITORY,
        RequestCryptoWithdrawalService,
        CancelWithdrawalService,
        FindWithdrawalsService,
        GetWithdrawalService,
    ],
})
export class WithdrawalModule { }
