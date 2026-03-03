// src/modules/deposit/infrastructure/deposit-detail.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { DepositDetail, DepositNotFoundException } from '../domain';
import type {
  DepositDetailRepositoryPort,
  DepositListQuery,
  DepositStats,
  DepositWithUser,
} from '../ports/out/deposit-detail.repository.port';
import { DepositDetailMapper } from './deposit-detail.mapper';
import {
  Prisma,
  DepositDetailStatus,
  DepositMethodType,
} from '@prisma/client';

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
      bankDepositConfig?: boolean;
      cryptoDepositConfig?: boolean;
    },
  ): Promise<DepositDetail | null> {
    const result = await this.tx.depositDetail.findUnique({
      where: { id },
      include: {
        bankDepositConfig: include?.bankDepositConfig ?? false,
        cryptoDepositConfig: include?.cryptoDepositConfig ?? false,
      },
    });

    return result ? this.mapper.toDomain(result) : null;
  }

  async getById(
    id: bigint,
    include?: {
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
      data: updateData,
    });

    return this.mapper.toDomain(result);
  }

  async create(deposit: DepositDetail): Promise<DepositDetail> {
    const data = this.mapper.toPrismaCreate(deposit);
    const result = await this.tx.depositDetail.create({
      data,
    });

    return this.mapper.toDomain(result);
  }

  async listByUserId(
    userId: bigint,
    query: DepositListQuery,
  ): Promise<{ items: DepositDetail[]; total: number }> {
    const {
      skip = 0,
      take = 20,
      status,
      methodType,
      currency,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
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

  // Admin queries
  async list(
    query: DepositListQuery,
  ): Promise<{ items: DepositWithUser[]; total: number }> {
    const {
      skip = 0,
      take = 20,
      status,
      methodType,
      userId,
      currency,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.DepositDetailWhereInput = {
      ...(status && { status }),
      ...(methodType && { methodType }),
      ...(userId && { userId }),
      ...(currency && { depositCurrency: currency }),
      ...(startDate &&
        endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const orderBy: Prisma.DepositDetailOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [deposits, total] = await Promise.all([
      this.tx.depositDetail.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          bankDepositConfig: true,
          cryptoDepositConfig: true,
        },
      }),
      this.tx.depositDetail.count({ where }),
    ]);

    return {
      items: deposits.map((deposit) => ({
        deposit: this.mapper.toDomain(deposit),
        userEmail: null, // TODO: User 테이블에서 직접 조회하도록 변경 필요
      })),
      total,
    };
  }

  async getByIdWithUser(id: bigint): Promise<DepositWithUser> {
    const result = await this.tx.depositDetail.findUnique({
      where: { id },
      include: {
        bankDepositConfig: true,
        cryptoDepositConfig: true,
      },
    });

    if (!result) {
      throw new DepositNotFoundException(id);
    }

    return {
      deposit: this.mapper.toDomain(result),
      userEmail: null, // TODO: User 테이블에서 직접 조회하도록 변경 필요
    };
  }

  async getStats(): Promise<DepositStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayDeposits, pendingDeposits, methodStats] = await Promise.all([
      // 오늘 총 입금액
      this.tx.depositDetail.aggregate({
        where: {
          status: DepositDetailStatus.COMPLETED,
          createdAt: {
            gte: today,
          },
        },
        _sum: {
          actuallyPaid: true,
        },
      }),
      // 대기 중인 요청 수
      this.tx.depositDetail.count({
        where: {
          status: {
            in: [DepositDetailStatus.PENDING, DepositDetailStatus.CONFIRMING],
          },
        },
      }),
      // 수단별 점유율
      this.tx.depositDetail.groupBy({
        by: ['methodType'],
        where: {
          status: DepositDetailStatus.COMPLETED,
          createdAt: {
            gte: today,
          },
        },
        _count: {
          id: true,
        },
      }),
    ]);

    return {
      todayTotalAmount:
        todayDeposits._sum.actuallyPaid || new Prisma.Decimal(0),
      pendingCount: pendingDeposits,
      methodDistribution: {
        crypto:
          methodStats.find(
            (s) => s.methodType === DepositMethodType.CRYPTO_WALLET,
          )?._count.id || 0,
        bank:
          methodStats.find(
            (s) => s.methodType === DepositMethodType.BANK_TRANSFER,
          )?._count.id || 0,
      },
    };
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
}
