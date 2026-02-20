// src/modules/promotion/infrastructure/promotion.mapper.ts
import { Injectable } from '@nestjs/common';
import { Promotion, UserPromotion, PromotionCurrency } from '../domain';
import type { PromotionTranslation } from '../domain/model/promotion.entity';

/**
 * Domain 엔티티와 Prisma 모델 간 변환을 담당하는 Mapper
 */
@Injectable()
export class PromotionMapper {
  /**
   * Prisma Promotion 모델 → Domain 엔티티 변환
   */
  toDomain(prismaModel: {
    id: bigint;
    code: string;
    managementName: string;
    isActive: boolean;
    startDate: Date | null;
    endDate: Date | null;
    targetType: string;
    bonusType: string;
    bonusRate: any;
    rollingMultiplier: any;
    qualificationMaintainCondition: string;
    createdAt: Date;
    updatedAt: Date;
    isOneTime?: boolean; // 스키마에 없을 수 있음
    isDepositRequired?: boolean;
    maxUsageCount?: number | null;
    currentUsageCount?: number;
    bonusExpiryMinutes?: number | null;
    note?: string[];
    deletedAt?: Date | null; // 스키마에 없을 수 있음
  }): Promotion {
    return Promotion.fromPersistence({
      id: prismaModel.id,
      code: prismaModel.code,
      managementName: prismaModel.managementName,
      isActive: prismaModel.isActive,
      startDate: prismaModel.startDate,
      endDate: prismaModel.endDate,
      targetType: prismaModel.targetType as any,
      bonusType: prismaModel.bonusType as any,
      bonusRate: prismaModel.bonusRate,
      rollingMultiplier: prismaModel.rollingMultiplier,
      qualificationMaintainCondition:
        prismaModel.qualificationMaintainCondition as any,
      isOneTime: prismaModel.isOneTime,
      isDepositRequired: prismaModel.isDepositRequired,
      maxUsageCount: prismaModel.maxUsageCount,
      currentUsageCount: prismaModel.currentUsageCount,
      bonusExpiryMinutes: prismaModel.bonusExpiryMinutes,
      note: prismaModel.note,
      createdAt: prismaModel.createdAt,
      updatedAt: prismaModel.updatedAt,
      deletedAt: prismaModel.deletedAt,
    });
  }

  /**
   * Prisma Promotion 모델 (관계 포함) → Domain 엔티티 변환
   */
  toDomainWithRelations(prismaModel: {
    id: bigint;
    code: string;
    managementName: string;
    isActive: boolean;
    startDate: Date | null;
    endDate: Date | null;
    targetType: string;
    bonusType: string;
    bonusRate: any;
    rollingMultiplier: any;
    qualificationMaintainCondition: string;
    createdAt: Date;
    updatedAt: Date;
    isOneTime?: boolean;
    isDepositRequired?: boolean;
    maxUsageCount?: number | null;
    currentUsageCount?: number;
    bonusExpiryMinutes?: number | null;
    note?: string[];
    deletedAt?: Date | null;
    translations?: Array<{
      id: bigint;
      promotionId: bigint;
      language: string;
      name: string;
      description: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
    currencies?: Array<{
      id: bigint;
      promotionId: bigint;
      currency: string;
      minDepositAmount: any;
      maxBonusAmount: any;
      maxWithdrawAmount: any;
      createdAt: Date;
      updatedAt: Date;
    }>;
  }): Promotion {
    const promotion = Promotion.fromPersistence({
      id: prismaModel.id,
      code: prismaModel.code,
      managementName: prismaModel.managementName,
      isActive: prismaModel.isActive,
      startDate: prismaModel.startDate,
      endDate: prismaModel.endDate,
      targetType: prismaModel.targetType as any,
      bonusType: prismaModel.bonusType as any,
      bonusRate: prismaModel.bonusRate,
      rollingMultiplier: prismaModel.rollingMultiplier,
      qualificationMaintainCondition:
        prismaModel.qualificationMaintainCondition as any,
      isOneTime: prismaModel.isOneTime,
      isDepositRequired: prismaModel.isDepositRequired,
      maxUsageCount: prismaModel.maxUsageCount,
      currentUsageCount: prismaModel.currentUsageCount,
      bonusExpiryMinutes: prismaModel.bonusExpiryMinutes,
      note: prismaModel.note,
      createdAt: prismaModel.createdAt,
      updatedAt: prismaModel.updatedAt,
      deletedAt: prismaModel.deletedAt,
    });

    // 번역 정보 설정
    if (prismaModel.translations) {
      const translations: PromotionTranslation[] = prismaModel.translations.map(
        (t) => ({
          id: t.id,
          promotionId: t.promotionId,
          language: t.language as any,
          name: t.name,
          description: t.description,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        }),
      );
      promotion.setTranslations(translations);
    }

    // 통화별 설정 정보 설정
    if (prismaModel.currencies) {
      const currencies = prismaModel.currencies.map((c) =>
        this.currencyToDomain(c),
      );
      promotion.setCurrencies(currencies);
    }

    return promotion;
  }

  /**
   * Prisma UserPromotion 모델 → Domain 엔티티 변환
   */
  userPromotionToDomain(prismaModel: {
    id: bigint;
    userId: bigint;
    promotionId: bigint;
    status: string;
    depositAmount: any;
    lockedAmount: any;
    bonusAmount: any;
    targetRollingAmount: any;
    currentRollingAmount: any;
    currency: string;
    createdAt: Date;
    updatedAt: Date;
    expiresAt?: Date | null;
    promotion?: {
      code: string;
    };
  }): UserPromotion {
    return UserPromotion.fromPersistence({
      id: prismaModel.id,
      userId: prismaModel.userId,
      promotionId: prismaModel.promotionId,
      status: prismaModel.status as any,
      depositAmount: prismaModel.depositAmount,
      lockedAmount: prismaModel.lockedAmount,
      bonusAmount: prismaModel.bonusAmount,
      targetRollingAmount: prismaModel.targetRollingAmount,
      currentRollingAmount: prismaModel.currentRollingAmount,
      currency: prismaModel.currency as any,
      expiresAt: prismaModel.expiresAt ?? null,
      createdAt: prismaModel.createdAt,
      updatedAt: prismaModel.updatedAt,
      promotionCode: prismaModel.promotion?.code,
    });
  }

  /**
   * Prisma PromotionCurrency 모델 → Domain 엔티티 변환
   */
  currencyToDomain(prismaModel: {
    id: bigint;
    promotionId: bigint;
    currency: string;
    minDepositAmount: any;
    maxBonusAmount: any;
    maxWithdrawAmount: any;
    createdAt: Date;
    updatedAt: Date;
  }): PromotionCurrency {
    return PromotionCurrency.fromPersistence({
      id: prismaModel.id,
      promotionId: prismaModel.promotionId,
      currency: prismaModel.currency as any,
      minDepositAmount: prismaModel.minDepositAmount,
      maxBonusAmount: prismaModel.maxBonusAmount,
      maxWithdrawAmount: prismaModel.maxWithdrawAmount,
      createdAt: prismaModel.createdAt,
      updatedAt: prismaModel.updatedAt,
    });
  }
}
