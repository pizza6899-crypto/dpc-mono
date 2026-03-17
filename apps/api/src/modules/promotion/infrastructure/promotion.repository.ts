// src/modules/promotion/infrastructure/promotion.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { Prisma, ExchangeCurrencyCode, Language } from '@prisma/client';
import { Promotion, UserPromotion, PromotionCurrencyRule } from '../domain';
import type { PromotionRepositoryPort } from '../ports/promotion.repository.port';
import { PromotionMapper } from './promotion.mapper';

@Injectable()
export class PromotionRepository implements PromotionRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: PromotionMapper,
  ) { }

  async findActivePromotions(now: Date = new Date()): Promise<Promotion[]> {
    const results = await this.tx.promotion.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      include: {
        translations: true,
        currencyRules: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return results.map((result) => this.mapper.toDomainWithRelations(result));
  }

  async findActivePromotionsPaginated(params: {
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'id';
    sortOrder?: 'asc' | 'desc';
    now?: Date;
  }): Promise<{ promotions: Promotion[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      now = new Date(),
    } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.PromotionWhereInput = {
      isActive: true,
      deletedAt: null,
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
    };

    const [results, total] = await Promise.all([
      this.tx.promotion.findMany({
        where,
        include: { translations: true, currencyRules: true },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.tx.promotion.count({ where }),
    ]);

    return {
      promotions: results.map((result) => this.mapper.toDomainWithRelations(result)),
      total,
    };
  }

  async findById(id: bigint): Promise<Promotion | null> {
    const result = await this.tx.promotion.findFirst({
      where: { id, deletedAt: null },
      include: { translations: true, currencyRules: true },
    });
    return result ? this.mapper.toDomainWithRelations(result) : null;
  }

  async findByTargetType(targetType: string, now: Date = new Date()): Promise<Promotion[]> {
    const results = await this.tx.promotion.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        targetType: targetType as any,
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      include: { translations: true, currencyRules: true },
      orderBy: { createdAt: 'desc' },
    });
    return results.map((result) => this.mapper.toDomainWithRelations(result));
  }

  async findUserPromotions(userId: bigint, status?: string): Promise<UserPromotion[]> {
    const results = await this.tx.userPromotion.findMany({
      where: { userId, ...(status && { status: status as any }) },
      orderBy: { createdAt: 'desc' },
    });
    return results.map((result) => this.mapper.userPromotionToDomain(result));
  }

  async findUserPromotionsPaginated(params: {
    userId: bigint;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'id';
    sortOrder?: 'asc' | 'desc';
    status?: string;
  }): Promise<{ userPromotions: UserPromotion[]; total: number }> {
    const { userId, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', status } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.UserPromotionWhereInput = {
      userId,
      ...(status && { status: status as any }),
    };

    const [results, total] = await Promise.all([
      this.tx.userPromotion.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.tx.userPromotion.count({ where }),
    ]);

    return {
      userPromotions: results.map((result) => this.mapper.userPromotionToDomain(result)),
      total,
    };
  }

  async hasUserUsedPromotion(userId: bigint, promotionId: bigint): Promise<boolean> {
    const count = await this.tx.userPromotion.count({
      where: { userId, promotionId, bonusAmount: { gt: 0 } },
    });
    return count > 0;
  }

  async createUserPromotion(params: {
    userId: bigint;
    promotionId: bigint;
    depositId: bigint;
    wageringRequirementId?: bigint;
    depositAmount: Prisma.Decimal;
    bonusAmount: Prisma.Decimal;
    currency: ExchangeCurrencyCode;
    policySnapshot: any;
  }): Promise<UserPromotion> {
    const result = await this.tx.userPromotion.create({
      data: {
        userId: params.userId,
        promotionId: params.promotionId,
        depositId: params.depositId,
        wageringRequirementId: params.wageringRequirementId,
        depositAmount: params.depositAmount,
        bonusAmount: params.bonusAmount,
        currency: params.currency,
        policySnapshot: params.policySnapshot,
        status: 'ACTIVE',
      },
    });
    return this.mapper.userPromotionToDomain(result);
  }

  async hasPreviousDeposits(userId: bigint): Promise<boolean> {
    const count = await this.tx.depositDetail.count({
      where: { userId, status: 'COMPLETED' },
    });
    return count > 0;
  }

  async findManyForAdmin(params: {
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'id';
    sortOrder?: 'asc' | 'desc';
    isActive?: boolean;
    targetType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ promotions: Promotion[]; total: number }> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', isActive, targetType, startDate, endDate } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.PromotionWhereInput = {
      deletedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(targetType && { targetType: targetType as any }),
      ...(startDate && endDate && { createdAt: { gte: startDate, lte: endDate } }),
    };

    const [results, total] = await Promise.all([
      this.tx.promotion.findMany({
        where,
        include: { translations: true, currencyRules: true },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.tx.promotion.count({ where }),
    ]);

    return {
      promotions: results.map((result) => this.mapper.toDomainWithRelations(result)),
      total,
    };
  }

  async create(params: {
    isActive?: boolean;
    startDate?: Date | null;
    endDate?: Date | null;
    targetType: string;
    bonusType: string;
    maxUsageCount?: number | null;
    bonusExpiryMinutes?: number | null;
  }): Promise<Promotion> {
    const result = await this.tx.promotion.create({
      data: {
        isActive: params.isActive ?? true,
        startDate: params.startDate,
        endDate: params.endDate,
        targetType: params.targetType as any,
        bonusType: params.bonusType as any,
        maxUsageCount: params.maxUsageCount,
        bonusExpiryMinutes: params.bonusExpiryMinutes,
      },
    });
    return this.mapper.toDomain(result);
  }

  async update(id: bigint, params: any): Promise<Promotion> {
    const result = await this.tx.promotion.update({
      where: { id },
      data: {
        ...params,
        updatedAt: new Date(),
      },
    });
    return this.mapper.toDomain(result);
  }


  async incrementUsageCount(id: bigint): Promise<Promotion> {
    const result = await this.tx.promotion.update({
      where: { id },
      data: { currentUsageCount: { increment: 1 } },
    });
    return this.mapper.toDomain(result);
  }

  async getCurrencyRule(promotionId: bigint, currency: ExchangeCurrencyCode): Promise<PromotionCurrencyRule | null> {
    const result = await this.tx.promotionCurrencyRule.findUnique({
      where: { promotionId_currency: { promotionId, currency } },
    });
    return result ? this.mapper.currencyRuleToDomain(result) : null;
  }

  async upsertCurrencySettings(params: {
    promotionId: bigint;
    currency: ExchangeCurrencyCode;
    minDepositAmount: Prisma.Decimal;
    maxDepositAmount?: Prisma.Decimal | null;
    maxBonusAmount?: Prisma.Decimal | null;
    maxWithdrawAmount?: Prisma.Decimal | null;
    bonusRate?: Prisma.Decimal | null;
    wageringMultiplier?: Prisma.Decimal | null;
  }): Promise<void> {
    await this.tx.promotionCurrencyRule.upsert({
      where: { promotionId_currency: { promotionId: params.promotionId, currency: params.currency } },
      create: { ...params },
      update: { ...params, updatedAt: new Date() },
    });
  }


  async findUserPromotionsByPromotionId(params: any): Promise<any> {
    const { promotionId, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', status, userId } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.UserPromotionWhereInput = {
      promotionId,
      ...(status && { status: status as any }),
      ...(userId && { userId }),
    };

    const [results, total] = await Promise.all([
      this.tx.userPromotion.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        include: { user: { select: { id: true, email: true } } },
        skip,
        take: limit,
      }),
      this.tx.userPromotion.count({ where }),
    ]);

    return {
      userPromotions: results.map((up) => ({
        userPromotion: this.mapper.userPromotionToDomain(up),
        user: up.user,
      })),
      total,
    };
  }

  async getPromotionStatistics(promotionId: bigint): Promise<any> {
    const [total, statusGroups] = await Promise.all([
      this.tx.userPromotion.count({ where: { promotionId } }),
      this.tx.userPromotion.groupBy({
        by: ['status'],
        where: { promotionId },
        _count: true,
      }),
    ]);
    const statusCounts: Record<string, number> = {};
    statusGroups.forEach((g) => { statusCounts[g.status] = g._count; });
    return { totalParticipants: total, statusCounts };
  }

  async upsertTranslation(params: {
    promotionId: bigint;
    language: Language;
    title: string;
    description?: string | null;
  }): Promise<any> {
    const result = await this.tx.promotionTranslation.upsert({
      where: { promotionId_language: { promotionId: params.promotionId, language: params.language } },
      create: { ...params },
      update: { ...params, updatedAt: new Date() },
    });
    return result;
  }

}
