// src/modules/deposit/infrastructure/bank-config.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { BankConfig } from '../domain';
import { BankConfigNotFoundException } from '../domain';
import { BankConfigRepositoryPort } from '../ports/out';
import { BankConfigMapper } from './bank-config.mapper';
import { ExchangeCurrencyCode } from '@repo/database';

@Injectable()
export class BankConfigRepository implements BankConfigRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: Transaction<TransactionalAdapterPrisma>,
        private readonly mapper: BankConfigMapper,
    ) { }

    async listActive(currency?: ExchangeCurrencyCode): Promise<BankConfig[]> {
        const configs = await this.tx.bankConfig.findMany({
            where: {
                isActive: true,
                deletedAt: null,
                ...(currency && { currency }),
            },
            orderBy: {
                priority: 'desc',
            },
        });
        return configs.map((config) => this.mapper.toDomain(config));
    }

    async findByUid(uid: string): Promise<BankConfig | null> {
        const config = await this.tx.bankConfig.findFirst({
            where: { uid, deletedAt: null },
        });
        return config ? this.mapper.toDomain(config) : null;
    }

    async getByUid(uid: string): Promise<BankConfig> {
        const config = await this.findByUid(uid);
        if (!config) {
            throw new BankConfigNotFoundException(uid);
        }
        return config;
    }

    async findById(id: bigint): Promise<BankConfig | null> {
        const config = await this.tx.bankConfig.findFirst({
            where: { id, deletedAt: null },
        });
        return config ? this.mapper.toDomain(config) : null;
    }

    async getById(id: bigint): Promise<BankConfig> {
        const config = await this.findById(id);
        if (!config) {
            throw new BankConfigNotFoundException(id);
        }
        return config;
    }

    async create(bankConfig: BankConfig): Promise<BankConfig> {
        const data = this.mapper.toPrisma(bankConfig);
        const result = await this.tx.bankConfig.create({
            data: data as any,
        });
        return this.mapper.toDomain(result);
    }

    async update(bankConfig: BankConfig): Promise<BankConfig> {
        const persistence = bankConfig.toPersistence();
        const data = this.mapper.toPrisma(bankConfig);
        const result = await this.tx.bankConfig.update({
            where: { id: persistence.id },
            data: data as any,
        });
        return this.mapper.toDomain(result);
    }
}
