// src/modules/deposit/ports/out/bank-config.repository.port.ts
import { BankConfig } from '../../domain';
import { ExchangeCurrencyCode } from 'src/generated/prisma';

export interface BankConfigRepositoryPort {
    listActive(currency?: ExchangeCurrencyCode): Promise<BankConfig[]>;
    findByUid(uid: string): Promise<BankConfig | null>;
    getByUid(uid: string): Promise<BankConfig>;
    findById(id: bigint): Promise<BankConfig | null>;
    getById(id: bigint): Promise<BankConfig>;
    list(params: {
        skip?: number;
        take?: number;
        currency?: ExchangeCurrencyCode;
        isActive?: boolean;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<BankConfig[]>;
    count(params: {
        currency?: ExchangeCurrencyCode;
        isActive?: boolean;
    }): Promise<number>;
    create(bankConfig: BankConfig): Promise<BankConfig>;
    update(bankConfig: BankConfig): Promise<BankConfig>;
    delete(id: bigint): Promise<void>;
}
