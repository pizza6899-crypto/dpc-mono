// src/modules/deposit/infrastructure/deposit-detail.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { DepositDetail, DepositNotFoundException } from '../domain';
import type { DepositDetailRepositoryPort } from '../ports/out/deposit-detail.repository.port';
import { DepositDetailMapper } from './deposit-detail.mapper';
import { TransactionStatus, TransactionType, ExchangeCurrencyCode, Prisma } from '@repo/database';
import { generateUid } from 'src/utils/id.util';
import { LockNamespace } from 'src/common/concurrency/lock-namespace';
import { DomainException } from 'src/common/exception/domain.exception';
import { MessageCode } from '@repo/shared';
import { HttpStatus } from '@nestjs/common';

/**
 * DepositDetail Repository Implementation
 *
 * Prisma를 사용한 DepositDetailRepositoryPort 구현체입니다.
 */
@Injectable()
export class DepositDetailRepository implements DepositDetailRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: DepositDetailMapper,
  ) { }

  async findById(
    id: bigint,
    include?: {
      transaction?: boolean;
      bankDepositConfig?: boolean;
      cryptoDepositConfig?: boolean;
    },
  ): Promise<DepositDetail | null> {
    const result = await this.tx.depositDetail.findUnique({
      where: { id },
      include: {
        transaction: include?.transaction ?? false,
        bankDepositConfig: include?.bankDepositConfig ?? false,
        cryptoDepositConfig: include?.cryptoDepositConfig ?? false,
      },
    });

    return result ? this.mapper.toDomain(result) : null;
  }

  async getById(
    id: bigint,
    include?: {
      transaction?: boolean;
      bankDepositConfig?: boolean;
      cryptoDepositConfig?: boolean;
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
      where: { id: deposit.id! },
      data: updateData as any,
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
          bankDepositConfig: true,
          cryptoDepositConfig: true,
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
        bankDepositConfig: true,
        cryptoDepositConfig: true,
      },
    });

    return result ? this.mapper.toDomain(result) : null;
  }

  async findByIdAndUserId(
    id: bigint,
    userId: bigint,
  ): Promise<DepositDetail | null> {
    const result = await this.tx.depositDetail.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        transaction: false,
        bankDepositConfig: true,
        cryptoDepositConfig: true,
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

  async acquireUserLock(userId: bigint): Promise<void> {
    try {
      await this.tx.$executeRaw`SET LOCAL lock_timeout = '3s'`;
      await this.tx.$executeRaw`SELECT pg_advisory_xact_lock(('x' || substr(md5(${LockNamespace.USER_DEPOSIT}::text || ${userId.toString()}), 1, 16))::bit(64)::bigint)`;
    } catch (error: any) {
      if (this.isLockTimeout(error)) {
        throw new DomainException(
          'Your deposit is being processed. Please try again later.',
          MessageCode.THROTTLE_TOO_MANY_REQUESTS,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw error;
    }
  }

  async acquireDepositLock(depositId: bigint): Promise<void> {
    try {
      await this.tx.$executeRaw`SET LOCAL lock_timeout = '3s'`;
      await this.tx.$executeRaw`SELECT pg_advisory_xact_lock(('x' || substr(md5(${LockNamespace.DEPOSIT}::text || ${depositId.toString()}), 1, 16))::bit(64)::bigint)`;
    } catch (error: any) {
      if (this.isLockTimeout(error)) {
        throw new DomainException(
          'This deposit is being processed by another administrator. Please try again later.',
          MessageCode.THROTTLE_TOO_MANY_REQUESTS,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw error;
    }
  }

  private isLockTimeout(error: any): boolean {
    return (
      error.code === '55P03' ||
      error.meta?.code === '55P03' ||
      error.message?.includes('55P03') ||
      error.message?.includes('lock timeout')
    );
  }
}

