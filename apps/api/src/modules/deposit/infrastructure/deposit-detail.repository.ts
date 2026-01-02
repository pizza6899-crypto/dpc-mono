// src/modules/deposit/infrastructure/deposit-detail.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { DepositDetail, DepositNotFoundException } from '../domain';
import type { DepositDetailRepositoryPort } from '../ports/out/deposit-detail.repository.port';
import { DepositDetailMapper } from './deposit-detail.mapper';
import { TransactionStatus, TransactionType, ExchangeCurrencyCode, Prisma } from '@repo/database';
import { generateUid } from 'src/utils/id.util';

/**
 * DepositDetail Repository Implementation
 *
 * Prisma를 사용한 DepositDetailRepositoryPort 구현체입니다.
 */
@Injectable()
export class DepositDetailRepository implements DepositDetailRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: Transaction<TransactionalAdapterPrisma>,
    private readonly mapper: DepositDetailMapper,
  ) { }

  async findById(
    id: bigint,
    include?: {
      transaction?: boolean;
      BankConfig?: boolean;
      CryptoConfig?: boolean;
    },
  ): Promise<DepositDetail | null> {
    const result = await this.tx.depositDetail.findUnique({
      where: { id },
      include: {
        transaction: include?.transaction ?? false,
        BankConfig: include?.BankConfig ?? false,
        CryptoConfig: include?.CryptoConfig ?? false,
      },
    });

    return result ? this.mapper.toDomain(result) : null;
  }

  async getById(
    id: bigint,
    include?: {
      transaction?: boolean;
      BankConfig?: boolean;
      CryptoConfig?: boolean;
    },
  ): Promise<DepositDetail> {
    const deposit = await this.findById(id, include);
    if (!deposit) {
      throw new DepositNotFoundException(id);
    }
    return deposit;
  }

  async update(deposit: DepositDetail): Promise<DepositDetail> {
    const updateData = this.mapper.toPrismaUpdate(deposit);

    const result = await this.tx.depositDetail.update({
      where: { id: deposit.id },
      data: updateData,
    });

    return this.mapper.toDomain(result);
  }

  async getTransactionUserId(transactionId: bigint): Promise<bigint | null> {
    const transaction = await this.tx.transaction.findUnique({
      where: { id: transactionId },
      select: { userId: true },
    });

    return transaction?.userId ?? null;
  }

  async createTransaction(data: {
    userId: bigint;
    type: TransactionType;
    status: TransactionStatus;
    currency: ExchangeCurrencyCode;
    amount: Prisma.Decimal;
    beforeAmount: Prisma.Decimal;
    afterAmount: Prisma.Decimal;
  }): Promise<bigint> {
    const result = await this.tx.transaction.create({
      data,
    });
    return result.id;
  }

  async create(deposit: DepositDetail): Promise<DepositDetail> {
    const data = this.mapper.toPrismaCreate(deposit);
    const result = await this.tx.depositDetail.create({
      data: {
        ...data,
        uid: generateUid(),
        transactionId: null, // 초기 생성 시에는 트랜잭션 없음
      },
    });

    return this.mapper.toDomain(result);
  }

  async listByUserId(
    userId: bigint,
    query: any,
  ): Promise<{ items: DepositDetail[]; total: number }> {
    const {
      skip,
      take,
      status,
      methodType,
      currency,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = query;

    const where: Prisma.DepositDetailWhereInput = {
      userId,
      status: status ? { equals: status } : undefined,
      methodType: methodType ? { equals: methodType } : undefined,
      depositCurrency: currency ? { equals: currency } : undefined,
      createdAt: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    };

    const [total, items] = await Promise.all([
      this.tx.depositDetail.count({ where }),
      this.tx.depositDetail.findMany({
        where,
        skip,
        take,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          transaction: false,
          BankConfig: true,
          CryptoConfig: true,
        },
      }),
    ]);

    return {
      items: items.map((item) => this.mapper.toDomain(item)),
      total,
    };
  }

  async findByUidAndUserId(
    uid: string,
    userId: bigint,
  ): Promise<DepositDetail | null> {
    const result = await this.tx.depositDetail.findFirst({
      where: {
        uid,
        userId,
      },
      include: {
        transaction: false,
        BankConfig: true,
        CryptoConfig: true,
      },
    });

    return result ? this.mapper.toDomain(result) : null;
  }

  async existsPendingByUserId(userId: bigint): Promise<boolean> {
    const count = await this.tx.depositDetail.count({
      where: {
        userId,
        status: {
          in: ['PENDING', 'CONFIRMING'],
        },
      },
    });
    return count > 0;
  }
}

