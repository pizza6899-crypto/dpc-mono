import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma';
import { BankWithdrawConfig } from '../domain';
import { type WithdrawalRepositoryPort } from '../ports/withdrawal.repository.port';
import { WITHDRAWAL_REPOSITORY } from '../ports/withdrawal.repository.token';

export interface UpdateBankConfigParams {
    id: bigint;
    isActive?: boolean;
    minWithdrawAmount?: string;
    maxWithdrawAmount?: string | null;
    withdrawFeeFixed?: string;
    withdrawFeeRate?: string;
    description?: string;
    notes?: string;
}

@Injectable()
export class UpdateBankConfigService {
    constructor(
        @Inject(WITHDRAWAL_REPOSITORY)
        private readonly repository: WithdrawalRepositoryPort,
    ) { }

    async execute(params: UpdateBankConfigParams): Promise<BankWithdrawConfig> {
        const config = await this.repository.getBankConfigById(params.id);

        const updates: any = {};
        if (params.isActive !== undefined) updates.isActive = params.isActive;
        if (params.minWithdrawAmount) updates.minWithdrawAmount = new Prisma.Decimal(params.minWithdrawAmount);
        if (params.maxWithdrawAmount !== undefined) updates.maxWithdrawAmount = params.maxWithdrawAmount ? new Prisma.Decimal(params.maxWithdrawAmount) : null;
        if (params.withdrawFeeFixed) updates.withdrawFeeFixed = new Prisma.Decimal(params.withdrawFeeFixed);
        if (params.withdrawFeeRate) updates.withdrawFeeRate = new Prisma.Decimal(params.withdrawFeeRate);
        if (params.description !== undefined) updates.description = params.description ?? null;
        if (params.notes !== undefined) updates.notes = params.notes ?? null;

        config.update(updates);

        return await this.repository.saveBankConfig(config);
    }
}
