import { Inject, Injectable } from '@nestjs/common';
import { Prisma, ExchangeCurrencyCode } from '@repo/database';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import { BankWithdrawConfig } from '../domain';
import { type WithdrawalRepositoryPort } from '../ports/withdrawal.repository.port';
import { WITHDRAWAL_REPOSITORY } from '../ports/withdrawal.repository.token';

export interface CreateBankConfigParams {
    currency: ExchangeCurrencyCode;
    bankName: string;
    isActive: boolean;
    minWithdrawAmount: string;
    maxWithdrawAmount?: string;
    withdrawFeeFixed: string;
    withdrawFeeRate: string;
    description?: string;
    notes?: string;
}

@Injectable()
export class CreateBankConfigService {
    constructor(
        @Inject(WITHDRAWAL_REPOSITORY)
        private readonly repository: WithdrawalRepositoryPort,
        private readonly snowflakeService: SnowflakeService,
    ) { }

    async execute(params: CreateBankConfigParams): Promise<BankWithdrawConfig> {
        // 이미 존재하는지 확인 (currency + bankName)
        // Bank는 bankName이 같아도 통화가 다르면 될 수 있음.
        // 하지만 중복 체크는 필요할 수 있음. 여기서는 생략하거나 bankConfig 조회 로직 추가 필요.
        // 현재 Repository에는 currency로 찾는 것만 있음.

        const now = new Date();
        const id = this.snowflakeService.generate(now);
        const config = BankWithdrawConfig.createNew(id, {
            currency: params.currency,
            bankName: params.bankName,
            isActive: params.isActive,
            minWithdrawAmount: new Prisma.Decimal(params.minWithdrawAmount),
            maxWithdrawAmount: params.maxWithdrawAmount ? new Prisma.Decimal(params.maxWithdrawAmount) : null,
            withdrawFeeFixed: new Prisma.Decimal(params.withdrawFeeFixed),
            withdrawFeeRate: new Prisma.Decimal(params.withdrawFeeRate),
            description: params.description ?? null,
            notes: params.notes ?? null,
        });

        return await this.repository.saveBankConfig(config);
    }
}
