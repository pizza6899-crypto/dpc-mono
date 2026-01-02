// src/modules/deposit/application/create-bank-config.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@repo/database';
import { ExchangeCurrencyCode } from '@repo/database';
import { BankConfig } from '../domain';
import { BANK_CONFIG_REPOSITORY } from '../ports/out';
import type { BankConfigRepositoryPort } from '../ports/out';
import { generateUid } from 'src/utils/id.util';

interface CreateBankConfigParams {
    currency: ExchangeCurrencyCode;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    isActive?: boolean;
    priority?: number;
    description?: string;
    notes?: string;
    minAmount: string;
    maxAmount?: string;
}

@Injectable()
export class CreateBankConfigService {
    constructor(
        @Inject(BANK_CONFIG_REPOSITORY)
        private readonly repository: BankConfigRepositoryPort,
    ) { }

    async execute({
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
    }: CreateBankConfigParams): Promise<BankConfig> {
        const bankConfig = BankConfig.create({
            uid: generateUid(),
            currency,
            bankName,
            accountNumber,
            accountHolder,
            isActive,
            priority,
            description,
            notes,
            minAmount: new Prisma.Decimal(minAmount),
            maxAmount: maxAmount ? new Prisma.Decimal(maxAmount) : null,
        });

        return await this.repository.create(bankConfig);
    }
}
