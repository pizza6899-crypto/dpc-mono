import { Inject, Injectable } from '@nestjs/common';
import { ExchangeCurrencyCode } from 'src/generated/prisma';
import { BankWithdrawConfig } from '../domain';
import { type WithdrawalRepositoryPort } from '../ports/withdrawal.repository.port';
import { WITHDRAWAL_REPOSITORY } from '../ports/withdrawal.repository.token';

export interface FindBankConfigsAdminParams {
    page?: number;
    limit?: number;
    bankName?: string;
    currency?: ExchangeCurrencyCode;
    isActive?: boolean;
}

@Injectable()
export class FindBankConfigsAdminService {
    constructor(
        @Inject(WITHDRAWAL_REPOSITORY)
        private readonly repository: WithdrawalRepositoryPort,
    ) { }

    async execute(params: FindBankConfigsAdminParams): Promise<{ configs: BankWithdrawConfig[]; total: number }> {
        return await this.repository.findBankConfigs(params);
    }
}
