// src/modules/promotion/infrastructure/promotion.mapper.ts
import { Injectable } from '@nestjs/common';
import { Promotion, UserPromotion, PromotionCurrencyRule } from '../domain';
import type { PromotionTranslation } from '../domain/model/promotion.entity';

/**
 * Domain 엔티티와 Prisma 모델 간 변환을 담당하는 Mapper
 */
@Injectable()
export class PromotionMapper {
  /**
   * Prisma Promotion 모델 → Domain 엔티티 변환
   */
  toDomain(prismaModel: any): Promotion {
    return Promotion.fromPersistence({
      id: prismaModel.id,
      isActive: prismaModel.isActive,
      startDate: prismaModel.startDate,
      endDate: prismaModel.endDate,
      targetType: prismaModel.targetType,
      maxUsageCount: prismaModel.maxUsageCount,
      currentUsageCount: prismaModel.currentUsageCount,
      bonusExpiryMinutes: prismaModel.bonusExpiryMinutes,
      createdAt: prismaModel.createdAt,
      updatedAt: prismaModel.updatedAt,
      deletedAt: prismaModel.deletedAt,
      createdBy: prismaModel.createdBy,
      updatedBy: prismaModel.updatedBy,
    });
  }

  /**
   * Prisma Promotion 모델 (관계 포함) → Domain 엔티티 변환
   */
  toDomainWithRelations(prismaModel: any): Promotion {
    const promotion = this.toDomain(prismaModel);

    // 번역 정보 설정
    if (prismaModel.translations) {
      const translations: PromotionTranslation[] = prismaModel.translations.map(
        (t: any) => ({
          id: t.id,
          promotionId: t.promotionId,
          language: t.language,
          title: t.title,
          description: t.description,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        }),
      );
      promotion.setTranslations(translations);
    }

    // 통화별 규칙 정보 설정
    if (prismaModel.currencyRules) {
      const currencyRules = prismaModel.currencyRules.map((c: any) =>
        this.currencyRuleToDomain(c),
      );
      promotion.setCurrencyRules(currencyRules);
    }

    return promotion;
  }

  /**
   * Prisma UserPromotion 모델 → Domain 엔티티 변환
   */
  userPromotionToDomain(prismaModel: any): UserPromotion {
    return UserPromotion.fromPersistence({
      id: prismaModel.id,
      userId: prismaModel.userId,
      promotionId: prismaModel.promotionId,
      status: prismaModel.status,
      depositAmount: prismaModel.depositAmount,
      bonusAmount: prismaModel.bonusAmount,
      currency: prismaModel.currency,
      policySnapshot: prismaModel.policySnapshot as any,
      createdAt: prismaModel.createdAt,
      updatedAt: prismaModel.updatedAt,
      completedAt: prismaModel.completedAt,
      voidedAt: prismaModel.voidedAt,
      depositId: prismaModel.depositId,
      wageringRequirementId: prismaModel.wageringRequirementId,
    });
  }

  /**
   * Prisma PromotionCurrencyRule 모델 → Domain 엔티티 변환
   */
  currencyRuleToDomain(prismaModel: any): PromotionCurrencyRule {
    return PromotionCurrencyRule.fromPersistence({
      id: prismaModel.id,
      promotionId: prismaModel.promotionId,
      currency: prismaModel.currency,
      minDepositAmount: prismaModel.minDepositAmount,
      maxDepositAmount: prismaModel.maxDepositAmount,
      maxBonusAmount: prismaModel.maxBonusAmount,
      maxWithdrawAmount: prismaModel.maxWithdrawAmount,
      bonusRate: prismaModel.bonusRate,
      wageringMultiplier: prismaModel.wageringMultiplier,
      createdAt: prismaModel.createdAt,
      updatedAt: prismaModel.updatedAt,
      updatedBy: prismaModel.updatedBy,
    });
  }
}
