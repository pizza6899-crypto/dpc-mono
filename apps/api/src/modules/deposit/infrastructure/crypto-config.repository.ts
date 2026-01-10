// src/modules/deposit/infrastructure/crypto-config.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { CryptoConfig } from '../domain';
import { CryptoConfigNotFoundException } from '../domain';
import { CryptoConfigRepositoryPort } from '../ports/out';
import { CryptoConfigMapper } from './crypto-config.mapper';

@Injectable()
export class CryptoConfigRepository implements CryptoConfigRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
        private readonly mapper: CryptoConfigMapper,
    ) { }

    async listActive(): Promise<CryptoConfig[]> {
        const configs = await this.tx.cryptoDepositConfig.findMany({
            where: {
                isActive: true,
                deletedAt: null,
            },
        });
        return configs.map((config) => this.mapper.toDomain(config));
    }

    async findByUid(uid: string): Promise<CryptoConfig | null> {
        const config = await this.tx.cryptoDepositConfig.findUnique({
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
        const config = await this.tx.cryptoDepositConfig.findUnique({
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
        const config = await this.tx.cryptoDepositConfig.findFirst({
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

    async create(config: CryptoConfig): Promise<CryptoConfig> {
        const data = this.mapper.toPrisma(config);
        const result = await this.tx.cryptoDepositConfig.create({
            data: data as any,
        });
        return this.mapper.toDomain(result);
    }

    async update(config: CryptoConfig): Promise<CryptoConfig> {
        const data = this.mapper.toPrisma(config);
        const result = await this.tx.cryptoDepositConfig.update({
            where: { id: config.id! },
            data: data as any,
        });
        return this.mapper.toDomain(result);
    }

    async list(params: {
        skip?: number;
        take?: number;
        symbol?: string;
        network?: string;
        isActive?: boolean;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<CryptoConfig[]> {
        const { skip, take, symbol, network, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = params;
        const configs = await this.tx.cryptoDepositConfig.findMany({
            where: {
                deletedAt: null,
                ...(symbol && { symbol }),
                ...(network && { network }),
                ...(isActive !== undefined && { isActive }),
            },
            skip,
            take,
            orderBy: {
                [sortBy]: sortOrder,
            },
        });
        return configs.map((config) => this.mapper.toDomain(config));
    }

    async count(params: {
        symbol?: string;
        network?: string;
        isActive?: boolean;
    }): Promise<number> {
        const { symbol, network, isActive } = params;
        return await this.tx.cryptoDepositConfig.count({
            where: {
                deletedAt: null,
                ...(symbol && { symbol }),
                ...(network && { network }),
                ...(isActive !== undefined && { isActive }),
            },
        });
    }

    async delete(id: bigint): Promise<void> {
        await this.tx.cryptoDepositConfig.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
}
