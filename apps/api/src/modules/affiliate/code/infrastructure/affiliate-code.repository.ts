// src/modules/affiliate/code/infrastructure/affiliate-code.repository.ts
import { Injectable, HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { Prisma } from '@prisma/client';
import { AffiliateCode } from '../domain';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';
import { AffiliateCodeMapper } from './affiliate-code.mapper';


@Injectable()
export class AffiliateCodeRepository implements AffiliateCodeRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: AffiliateCodeMapper,
  ) { }

  async create(params: {
    uid: string;
    userId: bigint;
    code: string;
    campaignName?: string | null;
    isDefault?: boolean;
    expiresAt?: Date | null;
  }): Promise<AffiliateCode> {
    const result = await this.tx.affiliateCode.create({
      data: {
        uid: params.uid,
        userId: params.userId,
        code: params.code,
        campaignName: params.campaignName || null,
        isActive: true, // 기본값: 활성화
        isDefault: params.isDefault || false,
        expiresAt: params.expiresAt || null,
      },
    });

    return this.mapper.toDomain(result);
  }

  async findByUserId(
    userId: bigint,
    params?: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<AffiliateCode[]> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params || {};

    const skip = (page - 1) * limit;

    const results = await this.tx.affiliateCode.findMany({
      where: { userId },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    return results.map((result) => this.mapper.toDomain(result));
  }

  async findById(id: bigint): Promise<AffiliateCode | null> {
    const result = await this.tx.affiliateCode.findFirst({
      where: {
        id,
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

    if (!data.id) {
      throw new Error('Cannot update affiliate code without ID');
    }

    const result = await this.tx.affiliateCode.update({
      where: { id: data.id },
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

  async delete(uid: string, userId: bigint): Promise<void> {
    // Correction for delete logic above:
    // Prisma `delete` requires a unique constraint in `where`.
    // `uid` is unique. `userId` acts as an extra filter which `delete` does not support directly in `where` unless it's a compound unique.
    // We should use `deleteMany` to include `userId` filter for safety.
    // OR `findFirst` then `delete` by ID.
    // Since we are implementing `delete(uid, userId)`, we should ensure the code belongs to user.
    // Implementation:

    // Check ownership or use deleteMany
    await this.tx.affiliateCode.deleteMany({
      where: {
        uid,
        userId,
      }
    });
  }

  async updateMany(
    updates: Array<{ code: AffiliateCode }>,
  ): Promise<AffiliateCode[]> {
    // Note: This is inefficient in loop. Prisma doesn't support bulk update with different values easily.
    const results = await Promise.all(
      updates.map(async ({ code }) => {
        const data = this.mapper.toPrisma(code);
        if (!data.id) throw new Error("Missing ID for update");
        return await this.tx.affiliateCode.update({
          where: { id: data.id },
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

  async findByIdAdmin(id: bigint): Promise<AffiliateCode | null> {
    const result = await this.tx.affiliateCode.findUnique({
      where: { id },
    });

    if (!result) {
      return null;
    }

    return this.mapper.toDomain(result);
  }

  async deleteById(id: bigint): Promise<void> {
    await this.tx.affiliateCode.delete({
      where: { id },
    });
  }
}
