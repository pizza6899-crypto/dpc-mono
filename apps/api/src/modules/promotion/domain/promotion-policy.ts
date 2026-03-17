// src/modules/promotion/domain/promotion-policy.ts
import type { Prisma } from '@prisma/client';
import {
  PromotionTargetType,
  PromotionBonusType,
} from '@prisma/client';
import type { Promotion } from './model/promotion.entity';
import type { UserPromotion } from './model/user-promotion.entity';
import type { PromotionCurrencyRule } from './model/promotion-currency-rule.entity';
import {
  PromotionNotEligibleException,
  PromotionAlreadyUsedException,
  PromotionNotActiveException,
  PromotionInvalidConfigurationException,
} from './promotion.exception';

/**
 * 프로모션 도메인 정책 (Policy)
 * 비즈니스 규칙과 검증 로직을 담당
 */
export class PromotionPolicy {
  /**
   * 프로모션이 현재 활성화되어 있는지 확인
   */
  isPromotionActive(promotion: Promotion, now: Date = new Date()): void {
    if (!promotion.isCurrentlyActive(now)) {
      throw new PromotionNotActiveException();
    }
  }

  /**
   * 입금 금액이 정책을 만족하는지 확인
   */
  validateDepositAmount(
    depositAmount: Prisma.Decimal,
    currencyRule: PromotionCurrencyRule,
  ): void {
    if (!currencyRule.validateDepositAmount(depositAmount)) {
      throw new PromotionNotEligibleException(
        `Required deposit range: ${currencyRule.minDepositAmount.toString()} ~ ${currencyRule.maxDepositAmount?.toString() ?? 'No limit'}`,
      );
    }
  }

  /**
   * 중복 참여 여부 확인
   */
  validateOneTimeParticipation(
    promotion: Promotion,
    existingUserPromotion: UserPromotion | null,
  ): void {
    // 신규 유저 첫 입금 보너스는 무조건 1회만 가능
    if (promotion.targetType === PromotionTargetType.NEW_USER_FIRST_DEPOSIT && existingUserPromotion) {
      throw new PromotionAlreadyUsedException('You have already used this welcome bonus');
    }
  }

  /**
   * 선착순 마감 확인
   */
  validateMaxUsageCount(promotion: Promotion): void {
    if (
      promotion.maxUsageCount !== null &&
      promotion.currentUsageCount >= promotion.maxUsageCount
    ) {
      throw new PromotionNotEligibleException('Promotion usage limit reached');
    }
  }

  /**
   * 첫 입금 프로모션 자격 확인
   */
  validateFirstDepositEligibility(
    promotion: Promotion,
    hasPreviousDeposits: boolean,
  ): void {
    if (
      promotion.targetType === PromotionTargetType.NEW_USER_FIRST_DEPOSIT &&
      hasPreviousDeposits
    ) {
      throw new PromotionNotEligibleException(
        'This promotion is only for users with no previous deposits',
      );
    }
  }

  /**
   * 프로모션 자격 종합 검증
   */
  validateEligibility(
    promotion: Promotion,
    depositAmount: Prisma.Decimal,
    currencyRule: PromotionCurrencyRule,
    existingUserPromotion: UserPromotion | null,
    hasPreviousDeposits: boolean,
    now: Date = new Date(),
  ): void {
    // 1. 활성화 여부 확인
    this.isPromotionActive(promotion, now);

    // 2. 금액 조건 확인
    this.validateDepositAmount(depositAmount, currencyRule);

    // 3. 중복 참여 확인
    this.validateOneTimeParticipation(promotion, existingUserPromotion);

    // 4. 첫 입금 자격 확인
    this.validateFirstDepositEligibility(promotion, hasPreviousDeposits);

    // 5. 마감 여부 확인
    this.validateMaxUsageCount(promotion);
  }

  /**
   * 프로모션 설정 유효성 검사
   */
  validateConfiguration(params: {
    bonusType: PromotionBonusType;
    currencyRules?: Array<{
      minDepositAmount: Prisma.Decimal;
      maxBonusAmount?: Prisma.Decimal | null;
      bonusRate?: Prisma.Decimal | null;
    }>;
  }): void {
    const { bonusType, currencyRules } = params;

    if (!currencyRules || currencyRules.length === 0) {
      throw new PromotionInvalidConfigurationException('At least one currency rule is required');
    }

    for (const rule of currencyRules) {
      // 1. PERCENTAGE 타입인 경우 bonusRate 필수 검증
      if (bonusType === PromotionBonusType.PERCENTAGE) {
        if (!rule.bonusRate || rule.bonusRate.lte(0)) {
          throw new PromotionInvalidConfigurationException(
            'PERCENTAGE type requires a positive bonus rate for all currency rules',
          );
        }
      }

      // 2. FIXED_AMOUNT 타입인 경우 지급할 고정 금액(maxBonusAmount)이 필수
      if (bonusType === PromotionBonusType.FIXED_AMOUNT) {
        if (!rule.maxBonusAmount || rule.maxBonusAmount.lte(0)) {
          throw new PromotionInvalidConfigurationException(
            'FIXED_AMOUNT type requires a positive maxBonusAmount (used as fixed bonus) for all currency rules',
          );
        }
      }
    }
  }
}
