import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import {
  ExchangeCurrencyCode,
  WithdrawalStatus,
  WithdrawalMethodType,
  Prisma,
} from '@prisma/client';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import {
  WithdrawalDetail,
  CryptoWithdrawConfig,
  BankWithdrawConfig,
  WithdrawalNotFoundException,
  CryptoWithdrawConfigNotFoundException,
  BankWithdrawConfigNotFoundException,
} from '../domain';
import type { WithdrawalRepositoryPort } from '../ports/withdrawal.repository.port';
import { WithdrawalMapper } from './withdrawal.mapper';

@Injectable()
export class WithdrawalRepository implements WithdrawalRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: WithdrawalMapper,
  ) {}

  // ===== WithdrawalDetail CRUD =====

  async create(withdrawal: WithdrawalDetail): Promise<WithdrawalDetail> {
    const data = this.mapper.toPrismaCreate(withdrawal);
    const result = await this.tx.withdrawalDetail.create({
      data: {
        ...data,
        createdAt: withdrawal.props.createdAt,
        updatedAt: withdrawal.props.updatedAt,
      },
    });
    return this.mapper.toDomain(result);
  }

  async save(withdrawal: WithdrawalDetail): Promise<WithdrawalDetail> {
    const result = await this.tx.withdrawalDetail.update({
      where: { id: withdrawal.id },
      data: {
        status: withdrawal.props.status,
        processingMode: withdrawal.props.processingMode,
        netAmount: withdrawal.props.netAmount,
        feeAmount: withdrawal.props.feeAmount,
        feeCurrency: withdrawal.props.feeCurrency,
        feePaidBy: withdrawal.props.feePaidBy,
        transactionHash: withdrawal.props.transactionHash,
        providerWithdrawalId: withdrawal.props.providerWithdrawalId,
        providerMetadata: withdrawal.props
          .providerMetadata as Prisma.InputJsonValue,
        processedBy: withdrawal.props.processedBy,
        adminNotes: withdrawal.props.adminNotes,
        failureReason: withdrawal.props.failureReason,
        confirmedAt: withdrawal.props.confirmedAt,
        failedAt: withdrawal.props.failedAt,
        cancelledAt: withdrawal.props.cancelledAt,
        updatedAt: new Date(),
      },
    });
    return this.mapper.toDomain(result);
  }

  async findById(id: bigint): Promise<WithdrawalDetail | null> {
    const result = await this.tx.withdrawalDetail.findUnique({
      where: { id },
    });
    return result ? this.mapper.toDomain(result) : null;
  }

  async getById(id: bigint): Promise<WithdrawalDetail> {
    const withdrawal = await this.findById(id);
    if (!withdrawal) {
      throw new WithdrawalNotFoundException();
    }
    return withdrawal;
  }

  // ===== 조회 =====

  async findByUserId(
    userId: bigint,
    options?: {
      status?: WithdrawalStatus;
      methodType?: WithdrawalMethodType;
      limit?: number;
      offset?: number;
    },
  ): Promise<WithdrawalDetail[]> {
    const results = await this.tx.withdrawalDetail.findMany({
      where: {
        userId,
        ...(options?.status && { status: options.status }),
        ...(options?.methodType && { methodType: options.methodType }),
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    });
    return results.map((r) => this.mapper.toDomain(r));
  }

  async findByStatus(
    status: WithdrawalStatus,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<WithdrawalDetail[]> {
    const results = await this.tx.withdrawalDetail.findMany({
      where: { status },
      orderBy: { createdAt: 'asc' },
      take: options?.limit ?? 100,
      skip: options?.offset ?? 0,
    });
    return results.map((r) => this.mapper.toDomain(r));
  }

  async countByUserId(
    userId: bigint,
    status?: WithdrawalStatus,
  ): Promise<number> {
    return this.tx.withdrawalDetail.count({
      where: {
        userId,
        ...(status && { status }),
      },
    });
  }

  async hasPendingWithdrawal(userId: bigint): Promise<boolean> {
    const pendingStatuses: WithdrawalStatus[] = [
      WithdrawalStatus.PENDING,
      WithdrawalStatus.PENDING_REVIEW,
      WithdrawalStatus.PROCESSING,
      WithdrawalStatus.SENDING,
    ];

    const count = await this.tx.withdrawalDetail.count({
      where: {
        userId,
        status: { in: pendingStatuses },
      },
    });

    return count > 0;
  }

  // ===== CryptoWithdrawConfig =====

  async findCryptoConfigBySymbolAndNetwork(
    symbol: string,
    network: string,
    includeDeleted = false,
  ): Promise<CryptoWithdrawConfig | null> {
    const result = await this.tx.cryptoWithdrawConfig.findFirst({
      where: {
        symbol,
        network,
        ...(!includeDeleted && { deletedAt: null }),
      },
    });
    return result ? this.mapper.cryptoConfigToDomain(result) : null;
  }

  async getCryptoConfigBySymbolAndNetwork(
    symbol: string,
    network: string,
  ): Promise<CryptoWithdrawConfig> {
    const config = await this.findCryptoConfigBySymbolAndNetwork(
      symbol,
      network,
    );
    if (!config) {
      throw new CryptoWithdrawConfigNotFoundException();
    }
    return config;
  }

  async findCryptoConfigById(id: bigint): Promise<CryptoWithdrawConfig | null> {
    const result = await this.tx.cryptoWithdrawConfig.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
    return result ? this.mapper.cryptoConfigToDomain(result) : null;
  }

  async findActiveCryptoConfigs(): Promise<CryptoWithdrawConfig[]> {
    const results = await this.tx.cryptoWithdrawConfig.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      orderBy: { symbol: 'asc' },
    });
    return results.map((r) => this.mapper.cryptoConfigToDomain(r));
  }

  async getCryptoConfigById(id: bigint): Promise<CryptoWithdrawConfig> {
    const config = await this.findCryptoConfigById(id);
    if (!config) {
      throw new CryptoWithdrawConfigNotFoundException();
    }
    return config;
  }

  async findCryptoConfigs(options?: {
    page?: number;
    limit?: number;
    symbol?: string;
    network?: string;
    isActive?: boolean;
  }): Promise<{ configs: CryptoWithdrawConfig[]; total: number }> {
    const where: Prisma.CryptoWithdrawConfigWhereInput = {
      deletedAt: null,
      ...(options?.symbol && {
        symbol: { contains: options.symbol, mode: 'insensitive' },
      }),
      ...(options?.network && { network: options.network }),
      ...(options?.isActive !== undefined && { isActive: options.isActive }),
    };

    const [configs, total] = await Promise.all([
      this.tx.cryptoWithdrawConfig.findMany({
        where,
        skip: ((options?.page ?? 1) - 1) * (options?.limit ?? 20),
        take: options?.limit ?? 20,
        orderBy: { createdAt: 'desc' },
      }),
      this.tx.cryptoWithdrawConfig.count({ where }),
    ]);

    return {
      configs: configs.map((c) => this.mapper.cryptoConfigToDomain(c)),
      total,
    };
  }

  async saveCryptoConfig(
    config: CryptoWithdrawConfig,
  ): Promise<CryptoWithdrawConfig> {
    const data = this.mapper.toPrismaCryptoConfig(config);
    const result = await this.tx.cryptoWithdrawConfig.upsert({
      where: { id: config.id },
      create: data,
      update: {
        ...data,
        id: undefined, // ID는 업데이트 불가
        createdAt: undefined, // 생성일은 업데이트 불가
      },
    });
    return this.mapper.cryptoConfigToDomain(result);
  }

  // ===== BankWithdrawConfig =====

  async findBankConfigById(id: bigint): Promise<BankWithdrawConfig | null> {
    const result = await this.tx.bankWithdrawConfig.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
    return result ? this.mapper.bankConfigToDomain(result) : null;
  }

  async getBankConfigById(id: bigint): Promise<BankWithdrawConfig> {
    const config = await this.findBankConfigById(id);
    if (!config) {
      throw new BankWithdrawConfigNotFoundException();
    }
    return config;
  }

  async findBankConfigByCurrencyAndName(
    currency: ExchangeCurrencyCode,
    bankName: string,
    includeDeleted = false,
  ): Promise<BankWithdrawConfig | null> {
    const result = await this.tx.bankWithdrawConfig.findFirst({
      where: {
        currency,
        bankName,
        ...(!includeDeleted && { deletedAt: null }),
      },
    });
    return result ? this.mapper.bankConfigToDomain(result) : null;
  }

  async findBankConfigsByCurrency(
    currency: ExchangeCurrencyCode,
  ): Promise<BankWithdrawConfig[]> {
    const results = await this.tx.bankWithdrawConfig.findMany({
      where: {
        currency,
        isActive: true,
        deletedAt: null,
      },
    });
    return results.map((r) => this.mapper.bankConfigToDomain(r));
  }

  async findActiveBankConfigs(): Promise<BankWithdrawConfig[]> {
    const results = await this.tx.bankWithdrawConfig.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      orderBy: [{ currency: 'asc' }, { bankName: 'asc' }],
    });
    return results.map((r) => this.mapper.bankConfigToDomain(r));
  }

  async findBankConfigs(options?: {
    page?: number;
    limit?: number;
    bankName?: string;
    currency?: ExchangeCurrencyCode;
    isActive?: boolean;
  }): Promise<{ configs: BankWithdrawConfig[]; total: number }> {
    const where: Prisma.BankWithdrawConfigWhereInput = {
      deletedAt: null,
      ...(options?.bankName && {
        bankName: { contains: options.bankName, mode: 'insensitive' },
      }),
      ...(options?.currency && { currency: options.currency }),
      ...(options?.isActive !== undefined && { isActive: options.isActive }),
    };

    const [configs, total] = await Promise.all([
      this.tx.bankWithdrawConfig.findMany({
        where,
        skip: ((options?.page ?? 1) - 1) * (options?.limit ?? 20),
        take: options?.limit ?? 20,
        orderBy: { createdAt: 'desc' },
      }),
      this.tx.bankWithdrawConfig.count({ where }),
    ]);

    return {
      configs: configs.map((c) => this.mapper.bankConfigToDomain(c)),
      total,
    };
  }

  async saveBankConfig(
    config: BankWithdrawConfig,
  ): Promise<BankWithdrawConfig> {
    const data = this.mapper.toPrismaBankConfig(config);
    const result = await this.tx.bankWithdrawConfig.upsert({
      where: { id: config.id },
      create: data,
      update: {
        ...data,
        id: undefined,
        createdAt: undefined,
      },
    });
    return this.mapper.bankConfigToDomain(result);
  }
}
