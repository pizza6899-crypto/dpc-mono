// src/modules/deposit/application/update-bank-config-admin.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@repo/database';
import { ExchangeCurrencyCode } from '@repo/database';
import { BANK_CONFIG_REPOSITORY } from '../ports/out';
import type { BankConfigRepositoryPort } from '../ports/out';
import { BankConfig } from '../domain';

interface UpdateBankConfigAdminParams {
    id: bigint;
    currency?: ExchangeCurrencyCode;
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
    isActive?: boolean;
    priority?: number;
    description?: string;
    notes?: string;
    minAmount?: string;
    maxAmount?: string;
}

@Injectable()
export class UpdateBankConfigAdminService {
    constructor(
        @Inject(BANK_CONFIG_REPOSITORY)
        private readonly repository: BankConfigRepositoryPort,
    ) { }

    async execute({
        id,
        currency,
        bankName,
        accountNumber,
        accountHolder,
        isActive,
        priority,
        description,
        notes,
        minAmount,
        maxAmount,
    }: UpdateBankConfigAdminParams): Promise<BankConfig> {
        const bankConfig = await this.repository.getById(id);

        const updatedConfig = bankConfig.update({
            currency,
            bankName,
            accountNumber,
            accountHolder,
            isActive,
            priority,
            description,
            notes,
            minAmount: minAmount ? new Prisma.Decimal(minAmount) : undefined,
            maxAmount: maxAmount !== undefined ? (maxAmount ? new Prisma.Decimal(maxAmount) : null) : undefined,
        });

        return await this.repository.update(updatedConfig);
    }
}
