// src/modules/deposit/infrastructure/bank-config.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { BankConfig } from '../domain';
import { BankConfigNotFoundException } from '../domain';
import { BankConfigRepositoryPort } from '../ports/out';
import { BankConfigMapper } from './bank-config.mapper';
import { ExchangeCurrencyCode } from '@prisma/client';

@Injectable()
export class BankConfigRepository implements BankConfigRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: BankConfigMapper,
  ) { }

  async listActive(currency?: ExchangeCurrencyCode): Promise<BankConfig[]> {
    const configs = await this.tx.bankDepositConfig.findMany({
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

  async findById(id: bigint): Promise<BankConfig | null> {
    const config = await this.tx.bankDepositConfig.findFirst({
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
    const result = await this.tx.bankDepositConfig.create({
      data: data as any,
    });
    return this.mapper.toDomain(result);
  }

  async update(bankConfig: BankConfig): Promise<BankConfig> {
    const data = this.mapper.toPrisma(bankConfig);
    const result = await this.tx.bankDepositConfig.update({
      where: { id: bankConfig.id! },
      data: data as any,
    });
    return this.mapper.toDomain(result);
  }

  async list(params: {
    skip?: number;
    take?: number;
    currency?: ExchangeCurrencyCode;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<BankConfig[]> {
    const {
      skip,
      take,
      currency,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;
    const configs = await this.tx.bankDepositConfig.findMany({
      where: {
        deletedAt: null,
        ...(currency && { currency }),
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
    currency?: ExchangeCurrencyCode;
    isActive?: boolean;
  }): Promise<number> {
    const { currency, isActive } = params;
    return await this.tx.bankDepositConfig.count({
      where: {
        deletedAt: null,
        ...(currency && { currency }),
        ...(isActive !== undefined && { isActive }),
      },
    });
  }

  async delete(id: bigint): Promise<void> {
    await this.tx.bankDepositConfig.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
