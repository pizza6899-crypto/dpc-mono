import { Module } from '@nestjs/common';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';
import { PaymentModule } from 'src/modules/payment/payment.module';
import { WithdrawalPolicy } from './domain';
import { WITHDRAWAL_REPOSITORY } from './ports';
import { WithdrawalRepository } from './infrastructure/withdrawal.repository';
import { WithdrawalMapper } from './infrastructure/withdrawal.mapper';
import {
    RequestCryptoWithdrawalService,
    RequestBankWithdrawalService,
    CancelWithdrawalService,
    FindWithdrawalsService,
    GetWithdrawalService,
    GetWithdrawalOptionsService,
    ApproveWithdrawalService,
    RejectWithdrawalService,
    FindPendingWithdrawalsService,
    ProcessWithdrawalService,
} from './application';
import { WithdrawalUserController } from './controllers/user/withdrawal-user.controller';
import { WithdrawalAdminController } from './controllers/admin/withdrawal-admin.controller';

@Module({
    imports: [SnowflakeModule, PaymentModule],
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
        RequestBankWithdrawalService,
        CancelWithdrawalService,
        FindWithdrawalsService,
        GetWithdrawalService,
        GetWithdrawalOptionsService,
        ApproveWithdrawalService,
        RejectWithdrawalService,
        FindPendingWithdrawalsService,
        ProcessWithdrawalService,
    ],
    exports: [
        WITHDRAWAL_REPOSITORY,
        RequestCryptoWithdrawalService,
        RequestBankWithdrawalService,
        CancelWithdrawalService,
        FindWithdrawalsService,
        GetWithdrawalService,
        GetWithdrawalOptionsService,
        ProcessWithdrawalService,
    ],
})
export class WithdrawalModule { }

