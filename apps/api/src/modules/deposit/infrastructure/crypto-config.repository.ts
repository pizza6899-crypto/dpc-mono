// src/modules/deposit/infrastructure/crypto-config.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { CryptoConfig } from '../domain';
import { CryptoConfigNotFoundException } from '../domain';
import { CryptoConfigRepositoryPort } from '../ports/out';
import { CryptoConfigMapper } from './crypto-config.mapper';

@Injectable()
export class CryptoConfigRepository implements CryptoConfigRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: Transaction<TransactionalAdapterPrisma>,
        private readonly mapper: CryptoConfigMapper,
    ) { }

    async listActive(): Promise<CryptoConfig[]> {
        const configs = await this.tx.cryptoConfig.findMany({
            where: {
                isActive: true,
                deletedAt: null,
            },
        });
        return configs.map((config) => this.mapper.toDomain(config));
    }

    async findByUid(uid: string): Promise<CryptoConfig | null> {
        const config = await this.tx.cryptoConfig.findUnique({
            where: {
                uid,
                deletedAt: null,
            },
        });
        return config ? this.mapper.toDomain(config) : null;
    }

    async getByUid(uid: string): Promise<CryptoConfig> {
        const config = await this.findByUid(uid);
        if (!config) {
            throw new CryptoConfigNotFoundException(uid);
        }
        return config;
    }

    async findById(id: bigint): Promise<CryptoConfig | null> {
        const config = await this.tx.cryptoConfig.findUnique({
            where: {
                id,
                deletedAt: null,
            },
        });
        return config ? this.mapper.toDomain(config) : null;
    }

    async getById(id: bigint): Promise<CryptoConfig> {
        const config = await this.findById(id);
        if (!config) {
            throw new CryptoConfigNotFoundException(id);
        }
        return config;
    }

    async findBySymbolAndNetwork(symbol: string, network: string): Promise<CryptoConfig | null> {
        const config = await this.tx.cryptoConfig.findFirst({
            where: {
                symbol,
                network,
                deletedAt: null,
            },
        });
        return config ? this.mapper.toDomain(config) : null;
    }

    async getBySymbolAndNetwork(symbol: string, network: string): Promise<CryptoConfig> {
        const config = await this.findBySymbolAndNetwork(symbol, network);
        if (!config) {
            throw new CryptoConfigNotFoundException(`${symbol}/${network}`);
        }
        return config;
    }
}
