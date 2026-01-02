// src/modules/deposit/infrastructure/bank-config.mapper.ts
import { Injectable } from '@nestjs/common';
import { BankConfig as PrismaBankConfig } from '@repo/database';
import { BankConfig } from '../domain';

@Injectable()
export class BankConfigMapper {
    toDomain(prismaBankConfig: PrismaBankConfig): BankConfig {
        return BankConfig.fromPersistence({
            id: prismaBankConfig.id,
            uid: prismaBankConfig.uid,
            currency: prismaBankConfig.currency,
            bankName: prismaBankConfig.bankName,
            accountNumber: prismaBankConfig.accountNumber,
            accountHolder: prismaBankConfig.accountHolder,
            isActive: prismaBankConfig.isActive,
            priority: prismaBankConfig.priority,
            description: prismaBankConfig.description,
            notes: prismaBankConfig.notes,
            minAmount: prismaBankConfig.minAmount,
            maxAmount: prismaBankConfig.maxAmount,
            totalDeposits: prismaBankConfig.totalDeposits,
            totalDepositAmount: prismaBankConfig.totalDepositAmount,
            createdAt: prismaBankConfig.createdAt,
            updatedAt: prismaBankConfig.updatedAt,
            deletedAt: prismaBankConfig.deletedAt,
        });
    }

    toPrisma(bankConfig: BankConfig): Partial<PrismaBankConfig> {
        const persistence = bankConfig.toPersistence();
        return {
            uid: persistence.uid,
            currency: persistence.currency,
            bankName: persistence.bankName,
            accountNumber: persistence.accountNumber,
            accountHolder: persistence.accountHolder,
            isActive: persistence.isActive,
            priority: persistence.priority,
            description: persistence.description,
            notes: persistence.notes,
            minAmount: persistence.minAmount,
            maxAmount: persistence.maxAmount,
            totalDeposits: persistence.totalDeposits,
            totalDepositAmount: persistence.totalDepositAmount,
            deletedAt: persistence.deletedAt,
        };
    }
}
