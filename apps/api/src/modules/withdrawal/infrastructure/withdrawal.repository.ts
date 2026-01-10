import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { ExchangeCurrencyCode, WithdrawalStatus, WithdrawalMethodType, Prisma } from '@repo/database';
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
    ) { }

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
                providerMetadata: withdrawal.props.providerMetadata as Prisma.InputJsonValue,
                processedBy: withdrawal.props.processedBy,
                adminNotes: withdrawal.props.adminNotes,
                failureReason: withdrawal.props.failureReason,
                transactionId: withdrawal.props.transactionId,
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
            throw new WithdrawalNotFoundException(id);
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

    async countByUserId(userId: bigint, status?: WithdrawalStatus): Promise<number> {
        return this.tx.withdrawalDetail.count({
            where: {
                userId,
                ...(status && { status }),
            },
        });
    }

    // ===== CryptoWithdrawConfig =====

    async findCryptoConfigBySymbolAndNetwork(
        symbol: string,
        network: string,
    ): Promise<CryptoWithdrawConfig | null> {
        const result = await this.tx.cryptoWithdrawConfig.findFirst({
            where: {
                symbol,
                network,
                isActive: true,
                deletedAt: null,
            },
        });
        return result ? this.mapper.cryptoConfigToDomain(result) : null;
    }

    async getCryptoConfigBySymbolAndNetwork(
        symbol: string,
        network: string,
    ): Promise<CryptoWithdrawConfig> {
        const config = await this.findCryptoConfigBySymbolAndNetwork(symbol, network);
        if (!config) {
            throw new CryptoWithdrawConfigNotFoundException(symbol, network);
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
            throw new BankWithdrawConfigNotFoundException(id);
        }
        return config;
    }

    async findBankConfigsByCurrency(currency: ExchangeCurrencyCode): Promise<BankWithdrawConfig[]> {
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
}
