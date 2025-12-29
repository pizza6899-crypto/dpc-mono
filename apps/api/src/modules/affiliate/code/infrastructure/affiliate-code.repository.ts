// src/modules/affiliate/code/infrastructure/affiliate-code.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Prisma } from '@repo/database';
import { AffiliateCode } from '../domain';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';
import { AffiliateCodeMapper } from './affiliate-code.mapper';

@Injectable()
export class AffiliateCodeRepository implements AffiliateCodeRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: Transaction<TransactionalAdapterPrisma>,
    private readonly mapper: AffiliateCodeMapper,
  ) {}

  async create(params: {
    userId: bigint;
    code: string;
    campaignName?: string | null;
    isDefault?: boolean;
    expiresAt?: Date | null;
  }): Promise<AffiliateCode> {
    const result = await this.tx.affiliateCode.create({
      data: {
        userId: params.userId,
        code: params.code,
        campaignName: params.campaignName || null,
        isActive: true, // 기본값: 활성화
        isDefault: params.isDefault || false,
        expiresAt: params.expiresAt || null,
      },
    });

    // 저장된 결과를 Domain 엔티티로 변환
    return this.mapper.toDomain(result);
  }

  async findByUserId(userId: bigint): Promise<AffiliateCode[]> {
    const results = await this.tx.affiliateCode.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return results.map((result) => this.mapper.toDomain(result));
  }

  async findById(id: string, userId: bigint): Promise<AffiliateCode | null> {
    const result = await this.tx.affiliateCode.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!result) {
      return null;
    }

    return this.mapper.toDomain(result);
  }

  async findByCode(code: string): Promise<AffiliateCode | null> {
    const result = await this.tx.affiliateCode.findFirst({
      where: {
        code,
        isActive: true,
      },
    });

    if (!result) {
      return null;
    }

    return this.mapper.toDomain(result);
  }

  async countByUserId(userId: bigint): Promise<number> {
    return await this.tx.affiliateCode.count({
      where: { userId },
    });
  }

  async existsByCode(code: string): Promise<boolean> {
    const count = await this.tx.affiliateCode.count({
      where: { code },
    });

    return count > 0;
  }

  async findDefaultByUserId(userId: bigint): Promise<AffiliateCode | null> {
    const result = await this.tx.affiliateCode.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });

    if (!result) {
      return null;
    }

    return this.mapper.toDomain(result);
  }

  async update(code: AffiliateCode): Promise<AffiliateCode> {
    const data = this.mapper.toPrisma(code);

    const result = await this.tx.affiliateCode.update({
      where: { id: code.id },
      data: {
        campaignName: data.campaignName,
        isActive: data.isActive,
        isDefault: data.isDefault,
        expiresAt: data.expiresAt,
        lastUsedAt: data.lastUsedAt,
        updatedAt: new Date(),
      },
    });

    return this.mapper.toDomain(result);
  }

  async delete(id: string, userId: bigint): Promise<void> {
    await this.tx.affiliateCode.delete({
      where: {
        id,
        userId,
      },
    });
  }

  async updateMany(
    updates: Array<{ code: AffiliateCode }>,
  ): Promise<AffiliateCode[]> {
    const results = await Promise.all(
      updates.map(async ({ code }) => {
        const data = this.mapper.toPrisma(code);
        return await this.tx.affiliateCode.update({
          where: { id: code.id },
          data: {
            campaignName: data.campaignName,
            isActive: data.isActive,
            isDefault: data.isDefault,
            expiresAt: data.expiresAt,
            lastUsedAt: data.lastUsedAt,
            updatedAt: new Date(),
          },
        });
      }),
    );

    return results.map((result) => this.mapper.toDomain(result));
  }

  async findManyForAdmin(params: {
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'code';
    sortOrder?: 'asc' | 'desc';
    userId?: bigint;
    code?: string;
    isActive?: boolean;
    isDefault?: boolean;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    codes: AffiliateCode[];
    total: number;
  }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      userId,
      code,
      isActive,
      isDefault,
      startDate,
      endDate,
    } = params;

    const skip = (page - 1) * limit;

    // Where 조건 구성
    const where: Prisma.AffiliateCodeWhereInput = {
      ...(userId && { userId }),
      ...(code && {
        code: {
          contains: code,
          mode: 'insensitive',
        },
      }),
      ...(isActive !== undefined && { isActive }),
      ...(isDefault !== undefined && { isDefault }),
      ...(startDate &&
        endDate && {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        }),
    };

    // 정렬 조건 구성
    const orderBy: Prisma.AffiliateCodeOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // 데이터 조회 및 총 개수 조회
    const [results, total] = await Promise.all([
      this.tx.affiliateCode.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.tx.affiliateCode.count({ where }),
    ]);

    return {
      codes: results.map((result) => this.mapper.toDomain(result)),
      total,
    };
  }
}
