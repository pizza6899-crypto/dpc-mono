// src/modules/deposit/ports/out/bank-config.repository.port.ts
import { BankConfig } from '../../domain';
import { ExchangeCurrencyCode } from '@repo/database';

export interface BankConfigRepositoryPort {
    listActive(currency?: ExchangeCurrencyCode): Promise<BankConfig[]>;
    findByUid(uid: string): Promise<BankConfig | null>;
    getByUid(uid: string): Promise<BankConfig>;
    findById(id: bigint): Promise<BankConfig | null>;
    getById(id: bigint): Promise<BankConfig>;
    create(bankConfig: BankConfig): Promise<BankConfig>;
    update(bankConfig: BankConfig): Promise<BankConfig>;
}
