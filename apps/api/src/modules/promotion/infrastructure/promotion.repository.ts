// src/modules/promotion/infrastructure/promotion.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Prisma, ExchangeCurrencyCode, Language } from '@repo/database';
import { generateUid } from 'src/utils/id.util';
import { Promotion, UserPromotion, PromotionCurrency } from '../domain';
import type { PromotionTranslation } from '../domain/model/promotion.entity';
import type { PromotionRepositoryPort } from '../ports/out/promotion.repository.port';
import { PromotionMapper } from './promotion.mapper';

@Injectable()
export class PromotionRepository implements PromotionRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: Transaction<TransactionalAdapterPrisma>,
    private readonly mapper: PromotionMapper,
  ) {}

  async findActivePromotions(now: Date = new Date()): Promise<Promotion[]> {
    const results = await this.tx.promotion.findMany({
      where: {
        isActive: true,
        deletedAt: null, // 소프트 삭제되지 않은 것만
        AND: [
          {
            OR: [
              { startDate: null },
              { startDate: { lte: now } },
            ],
          },
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
      include: {
        translations: true,
        currencies: true,
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
  }): Promise<{
    promotions: Promotion[];
    total: number;
  }> {
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
        {
          OR: [
            { startDate: null },
            { startDate: { lte: now } },
          ],
        },
        {
          OR: [
            { endDate: null },
            { endDate: { gte: now } },
          ],
        },
      ],
    };

    const orderBy: Prisma.PromotionOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [results, total] = await Promise.all([
      this.tx.promotion.findMany({
        where,
        include: {
          translations: true,
          currencies: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.tx.promotion.count({ where }),
    ]);

    return {
      promotions: results.map((result) =>
        this.mapper.toDomainWithRelations(result),
      ),
      total,
    };
  }

  async findById(id: bigint): Promise<Promotion | null> {
    const result = await this.tx.promotion.findFirst({
      where: {
        id,
        deletedAt: null, // 소프트 삭제되지 않은 것만
      },
      include: {
        translations: true,
        currencies: true,
      },
    });

    if (!result) {
      return null;
    }

    return this.mapper.toDomainWithRelations(result);
  }

  async findByTargetType(
    targetType: string,
    now: Date = new Date(),
  ): Promise<Promotion[]> {
    const results = await this.tx.promotion.findMany({
      where: {
        isActive: true,
        deletedAt: null, // 소프트 삭제되지 않은 것만
        targetType: targetType as any,
        AND: [
          {
            OR: [
              { startDate: null },
              { startDate: { lte: now } },
            ],
          },
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
      include: {
        translations: true,
        currencies: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return results.map((result) => this.mapper.toDomainWithRelations(result));
  }

  async findUserPromotion(
    userId: bigint,
    promotionId: bigint,
  ): Promise<UserPromotion | null> {
    const result = await this.tx.userPromotion.findFirst({
      where: {
        userId,
        promotionId,
      },
    });

    if (!result) {
      return null;
    }

    return this.mapper.userPromotionToDomain(result);
  }

  async findUserPromotions(
    userId: bigint,
    status?: string,
  ): Promise<UserPromotion[]> {
    const results = await this.tx.userPromotion.findMany({
      where: {
        userId,
        ...(status && { status: status as any }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        promotion: true,
      },
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
  }): Promise<{
    userPromotions: UserPromotion[];
    total: number;
  }> {
    const {
      userId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
    } = params;

    const skip = (page - 1) * limit;

    const where: Prisma.UserPromotionWhereInput = {
      userId,
      ...(status && { status: status as any }),
    };

    const orderBy: Prisma.UserPromotionOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [results, total] = await Promise.all([
      this.tx.userPromotion.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          promotion: true,
        },
      }),
      this.tx.userPromotion.count({ where }),
    ]);

    return {
      userPromotions: results.map((result) =>
        this.mapper.userPromotionToDomain(result),
      ),
      total,
    };
  }

  async hasUserUsedPromotion(
    userId: bigint,
    promotionId: bigint,
  ): Promise<boolean> {
    const count = await this.tx.userPromotion.count({
      where: {
        userId,
        promotionId,
        bonusAmount: {
          gt: 0,
        },
      },
    });

    return count > 0;
  }

  async createUserPromotion(params: {
    userId: bigint;
    promotionId: bigint;
    depositAmount: Prisma.Decimal;
    bonusAmount: Prisma.Decimal;
    targetRollingAmount: Prisma.Decimal;
    currency: ExchangeCurrencyCode;
  }): Promise<UserPromotion> {
    const result = await this.tx.userPromotion.create({
      data: {
        userId: params.userId,
        promotionId: params.promotionId,
        status: 'ACTIVE',
        depositAmount: params.depositAmount,
        bonusAmount: params.bonusAmount,
        targetRollingAmount: params.targetRollingAmount,
        currentRollingAmount: new Prisma.Decimal(0),
        currency: params.currency,
      },
    });

    return this.mapper.userPromotionToDomain(result);
  }

  async updateUserPromotion(
    userPromotion: UserPromotion,
  ): Promise<UserPromotion> {
    const persistence = userPromotion.toPersistence();

    const result = await this.tx.userPromotion.update({
      where: { id: userPromotion.id },
      data: {
        status: persistence.status,
        currentRollingAmount: persistence.currentRollingAmount,
        updatedAt: new Date(),
      },
    });

    return this.mapper.userPromotionToDomain(result);
  }

  async hasPreviousDeposits(userId: bigint): Promise<boolean> {
    const count = await this.tx.depositDetail.count({
      where: {
        userId,
        status: 'COMPLETED',
      },
    });

    return count > 0;
  }

  async hasWithdrawn(userId: bigint): Promise<boolean> {
    const count = await this.tx.withdrawDetail.count({
      where: {
        userId,
        status: 'COMPLETED',
      },
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
  }): Promise<{
    promotions: Promotion[];
    total: number;
  }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
      targetType,
      startDate,
      endDate,
    } = params;

    const skip = (page - 1) * limit;

    const where: Prisma.PromotionWhereInput = {
      deletedAt: null, // 소프트 삭제되지 않은 것만
      ...(isActive !== undefined && { isActive }),
      ...(targetType && { targetType: targetType as any }),
      ...(startDate &&
        endDate && {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        }),
    };

    const orderBy: Prisma.PromotionOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [results, total] = await Promise.all([
      this.tx.promotion.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.tx.promotion.count({ where }),
    ]);

    return {
      promotions: results.map((result) => this.mapper.toDomain(result)),
      total,
    };
  }

  async create(params: {
    managementName: string;
    isActive?: boolean;
    startDate?: Date | null;
    endDate?: Date | null;
    targetType: string;
    bonusType: string;
    bonusRate?: Prisma.Decimal | null;
    rollingMultiplier?: Prisma.Decimal | null;
    qualificationMaintainCondition: string;
    isOneTime?: boolean;
    uid?: string; // 선택적: 제공되지 않으면 생성
  }): Promise<Promotion> {
    const uid = params.uid || generateUid();

    const result = await this.tx.promotion.create({
      data: {
        uid,
        managementName: params.managementName,
        isActive: params.isActive ?? true,
        startDate: params.startDate ?? null,
        endDate: params.endDate ?? null,
        targetType: params.targetType as any,
        bonusType: params.bonusType as any,
        bonusRate: params.bonusRate ?? null,
        rollingMultiplier: params.rollingMultiplier ?? null,
        qualificationMaintainCondition: params.qualificationMaintainCondition as any,
        isOneTime: params.isOneTime ?? false,
      },
    });

    return this.mapper.toDomain(result);
  }

  async update(
    promotion: Partial<Promotion> & { id: bigint },
  ): Promise<Promotion> {
    const existing = await this.tx.promotion.findUnique({
      where: { id: promotion.id },
    });

    if (!existing) {
      throw new Error(`Promotion ${promotion.id} not found`);
    }

    const persistence = promotion.toPersistence?.() || promotion;

    const result = await this.tx.promotion.update({
      where: { id: promotion.id },
      data: {
        ...(promotion.managementName !== undefined && {
          managementName: promotion.managementName,
        }),
        ...(promotion.isActive !== undefined && {
          isActive: promotion.isActive,
        }),
        ...(promotion.startDate !== undefined && {
          startDate: promotion.startDate,
        }),
        ...(promotion.endDate !== undefined && { endDate: promotion.endDate }),
        ...(promotion.bonusRate !== undefined && {
          bonusRate: promotion.bonusRate,
        }),
        ...(promotion.rollingMultiplier !== undefined && {
          rollingMultiplier: promotion.rollingMultiplier,
        }),
        ...(promotion.isOneTime !== undefined && {
          isOneTime: promotion.isOneTime,
        }),
        updatedAt: new Date(),
      },
    });

    return this.mapper.toDomain(result);
  }

  async delete(id: bigint): Promise<void> {
    // 소프트 삭제: deletedAt 설정
    await this.tx.promotion.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async getCurrencySettings(
    promotionId: bigint,
    currency: ExchangeCurrencyCode,
  ): Promise<PromotionCurrency> {
    // 통화별 설정 조회
    const currencySettings = await this.tx.promotionCurrency.findUnique({
      where: {
        promotionId_currency: {
          promotionId: Number(promotionId),
          currency,
        },
      },
    });

    if (!currencySettings) {
      // 통화별 설정이 없으면 에러 (통화별 설정은 필수)
      throw new Error(
        `Currency settings not found for promotion ${promotionId} and currency ${currency}`,
      );
    }

    return this.mapper.currencyToDomain(currencySettings);
  }

  async getCurrencySettingsByPromotionId(
    promotionId: bigint,
  ): Promise<PromotionCurrency[]> {
    const currencySettings = await this.tx.promotionCurrency.findMany({
      where: {
        promotionId: Number(promotionId),
      },
      orderBy: {
        currency: 'asc',
      },
    });

    return currencySettings.map((cs) => this.mapper.currencyToDomain(cs));
  }

  async upsertCurrencySettings(params: {
    promotionId: bigint;
    currency: ExchangeCurrencyCode;
    minDepositAmount: Prisma.Decimal;
    maxBonusAmount?: Prisma.Decimal | null;
  }): Promise<void> {
    await this.tx.promotionCurrency.upsert({
      where: {
        promotionId_currency: {
          promotionId: Number(params.promotionId),
          currency: params.currency,
        },
      },
      create: {
        promotionId: Number(params.promotionId),
        currency: params.currency,
        minDepositAmount: params.minDepositAmount,
        maxBonusAmount: params.maxBonusAmount ?? null,
      },
      update: {
        minDepositAmount: params.minDepositAmount,
        maxBonusAmount: params.maxBonusAmount ?? null,
        updatedAt: new Date(),
      },
    });
  }

  async deleteCurrencySettings(
    promotionId: bigint,
    currency: ExchangeCurrencyCode,
  ): Promise<void> {
    await this.tx.promotionCurrency.delete({
      where: {
        promotionId_currency: {
          promotionId: Number(promotionId),
          currency,
        },
      },
    });
  }

  async findUserPromotionsByPromotionId(params: {
    promotionId: bigint;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'id';
    sortOrder?: 'asc' | 'desc';
    status?: string;
    userId?: bigint;
  }): Promise<{
    userPromotions: Array<{
      userPromotion: UserPromotion;
      user: {
        id: bigint;
        uid: string | null;
        email: string | null;
      } | null;
    }>;
    total: number;
  }> {
    const {
      promotionId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      userId,
    } = params;

    const skip = (page - 1) * limit;

    const where: Prisma.UserPromotionWhereInput = {
      promotionId,
      ...(status && { status: status as any }),
      ...(userId && { userId }),
    };

    const orderBy: Prisma.UserPromotionOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [results, total] = await Promise.all([
      this.tx.userPromotion.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              uid: true,
              email: true,
            },
          },
        },
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

  async getPromotionStatistics(promotionId: bigint): Promise<{
    totalParticipants: number;
    statusCounts: Record<string, number>;
  }> {
    const [total, statusGroups] = await Promise.all([
      this.tx.userPromotion.count({
        where: { promotionId },
      }),
      this.tx.userPromotion.groupBy({
        by: ['status'],
        where: { promotionId },
        _count: true,
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    statusGroups.forEach((group) => {
      statusCounts[group.status] = group._count;
    });

    return {
      totalParticipants: total,
      statusCounts,
    };
  }

  async createTranslation(params: {
    promotionId: bigint;
    language: Language;
    name: string;
    description?: string | null;
  }): Promise<PromotionTranslation> {
    const result = await this.tx.promotionTranslation.create({
      data: {
        promotionId: params.promotionId,
        language: params.language,
        name: params.name,
        description: params.description ?? null,
      },
    });

    return {
      id: result.id,
      promotionId: result.promotionId,
      language: result.language,
      name: result.name,
      description: result.description,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  async createTranslations(
    promotionId: bigint,
    translations: Array<{
      language: Language;
      name: string;
      description?: string | null;
    }>,
  ): Promise<PromotionTranslation[]> {
    if (translations.length === 0) {
      return [];
    }

    const results = await Promise.all(
      translations.map((translation) =>
        this.createTranslation({
          promotionId,
          language: translation.language,
          name: translation.name,
          description: translation.description,
        }),
      ),
    );

    return results;
  }

  async getTranslationsByPromotionId(
    promotionId: bigint,
  ): Promise<PromotionTranslation[]> {
    const translations = await this.tx.promotionTranslation.findMany({
      where: {
        promotionId,
      },
      orderBy: {
        language: 'asc',
      },
    });

    return translations.map((t) => ({
      id: t.id,
      promotionId: t.promotionId,
      language: t.language,
      name: t.name,
      description: t.description,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
  }

  async upsertTranslation(params: {
    promotionId: bigint;
    language: Language;
    name: string;
    description?: string | null;
  }): Promise<PromotionTranslation> {
    const result = await this.tx.promotionTranslation.upsert({
      where: {
        promotionId_language: {
          promotionId: params.promotionId,
          language: params.language,
        },
      },
      create: {
        promotionId: params.promotionId,
        language: params.language,
        name: params.name,
        description: params.description ?? null,
      },
      update: {
        name: params.name,
        description: params.description ?? null,
        updatedAt: new Date(),
      },
    });

    return {
      id: result.id,
      promotionId: result.promotionId,
      language: result.language,
      name: result.name,
      description: result.description,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  async deleteTranslation(
    promotionId: bigint,
    language: Language,
  ): Promise<void> {
    await this.tx.promotionTranslation.delete({
      where: {
        promotionId_language: {
          promotionId,
          language,
        },
      },
    });
  }
}

