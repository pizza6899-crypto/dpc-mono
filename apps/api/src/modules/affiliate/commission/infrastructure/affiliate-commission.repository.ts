// src/modules/affiliate/commission/infrastructure/affiliate-commission.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { CommissionStatus, ExchangeCurrencyCode } from '@repo/database';
import { AffiliateCommission, CommissionNotFoundException } from '../domain';
import type { AffiliateCommissionRepositoryPort } from '../ports/out/affiliate-commission.repository.port';
import { AffiliateCommissionMapper } from './affiliate-commission.mapper';

@Injectable()
export class AffiliateCommissionRepository implements AffiliateCommissionRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: AffiliateCommissionMapper,
  ) { }

  async findByUid(uid: string): Promise<AffiliateCommission | null> {
    const result = await this.tx.affiliateCommission.findUnique({
      where: { uid },
    });

    return result ? this.mapper.toDomain(result) : null;
  }

  async getByUid(uid: string): Promise<AffiliateCommission> {
    const commission = await this.findByUid(uid);
    if (!commission) {
      throw new CommissionNotFoundException(uid);
    }
    return commission;
  }

  async findById(id: bigint): Promise<AffiliateCommission | null> {
    const result = await this.tx.affiliateCommission.findUnique({
      where: { id },
    });

    return result ? this.mapper.toDomain(result) : null;
  }

  async getById(id: bigint): Promise<AffiliateCommission> {
    const commission = await this.findById(id);
    if (!commission) {
      throw new CommissionNotFoundException(id.toString());
    }
    return commission;
  }

  async findByAffiliateId(
    affiliateId: bigint,
    options?: {
      status?: CommissionStatus;
      currency?: ExchangeCurrencyCode;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    },
  ): Promise<AffiliateCommission[]> {
    const where: any = { affiliateId };

    if (options?.status) {
      where.status = options.status;
    }
    if (options?.currency) {
      where.currency = options.currency;
    }
    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) {
        where.createdAt.gte = options.startDate;
      }
      if (options.endDate) {
        where.createdAt.lte = options.endDate;
      }
    }

    const results = await this.tx.affiliateCommission.findMany({
      where,
      take: options?.limit,
      skip: options?.offset,
      orderBy: { createdAt: 'desc' },
    });

    return results.map((result) => this.mapper.toDomain(result));
  }

  async countByAffiliateId(
    affiliateId: bigint,
    options?: {
      status?: CommissionStatus;
      currency?: ExchangeCurrencyCode;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<number> {
    const where: any = { affiliateId };

    if (options?.status) {
      where.status = options.status;
    }
    if (options?.currency) {
      where.currency = options.currency;
    }
    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) {
        where.createdAt.gte = options.startDate;
      }
      if (options.endDate) {
        where.createdAt.lte = options.endDate;
      }
    }

    return await this.tx.affiliateCommission.count({ where });
  }

  async findPendingByAffiliateId(
    affiliateId: bigint,
    currency: ExchangeCurrencyCode,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<AffiliateCommission[]> {
    const results = await this.tx.affiliateCommission.findMany({
      where: {
        affiliateId,
        currency,
        status: CommissionStatus.PENDING,
      },
      orderBy: { createdAt: 'asc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return results.map((result) => this.mapper.toDomain(result));
  }

  async findByGameRoundId(
    gameRoundId: bigint,
  ): Promise<AffiliateCommission | null> {
    const result = await this.tx.affiliateCommission.findFirst({
      where: { gameRoundId },
    });

    return result ? this.mapper.toDomain(result) : null;
  }

  async create(commission: AffiliateCommission): Promise<AffiliateCommission> {
    const data = this.mapper.toPrisma(commission);
    const result = await this.tx.affiliateCommission.create({
      data: {
        uid: data.uid,
        affiliateId: data.affiliateId,
        subUserId: data.subUserId,
        gameRoundId: data.gameRoundId,
        wagerAmount: data.wagerAmount,
        winAmount: data.winAmount,
        commission: data.commission,
        rateApplied: data.rateApplied,
        currency: data.currency,
        status: data.status,
        gameCategory: data.gameCategory,
        settlementDate: data.settlementDate,
        claimedAt: data.claimedAt,
        withdrawnAt: data.withdrawnAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });

    return this.mapper.toDomain(result);
  }

  async updateStatus(
    uid: string,
    status: CommissionStatus,
    settlementDate?: Date | null,
    claimedAt?: Date | null,
    withdrawnAt?: Date | null,
  ): Promise<AffiliateCommission> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (settlementDate !== undefined) {
      updateData.settlementDate = settlementDate;
    }
    if (claimedAt !== undefined) {
      updateData.claimedAt = claimedAt;
    }
    if (withdrawnAt !== undefined) {
      updateData.withdrawnAt = withdrawnAt;
    }

    const result = await this.tx.affiliateCommission.update({
      where: { uid },
      data: updateData,
    });

    return this.mapper.toDomain(result);
  }

  async settlePendingCommissions(
    commissionIds: bigint[],
    settlementDate: Date,
  ): Promise<number> {
    if (commissionIds.length === 0) {
      return 0;
    }

    // Prisma의 `in` 연산자는 대량 배열 처리 시 성능 이슈가 있을 수 있으므로
    // 배치 단위로 나눠서 처리 (배치 크기: 1000)
    const BATCH_SIZE = 1000;
    let totalCount = 0;

    for (let i = 0; i < commissionIds.length; i += BATCH_SIZE) {
      const batch = commissionIds.slice(i, i + BATCH_SIZE);
      const result = await this.tx.affiliateCommission.updateMany({
        where: {
          id: { in: batch },
          status: CommissionStatus.PENDING, // 안전장치: PENDING 상태인 것만 업데이트
        },
        data: {
          status: CommissionStatus.AVAILABLE,
          settlementDate,
          updatedAt: new Date(),
        },
      });
      totalCount += result.count;
    }

    return totalCount;
  }

  async findAffiliateIdsWithPendingCommissions(options?: {
    limit?: number;
    offset?: number;
  }): Promise<bigint[]> {
    // PENDING 상태 커미션이 있는 어필리에이트 ID 목록 조회 (중복 제거)
    const results = await this.tx.affiliateCommission.findMany({
      where: {
        status: CommissionStatus.PENDING,
      },
      select: {
        affiliateId: true,
      },
      distinct: ['affiliateId'],
      take: options?.limit,
      skip: options?.offset,
      orderBy: { affiliateId: 'asc' }, // 일관된 순서 보장
    });

    return results.map((result) => result.affiliateId);
  }
}
