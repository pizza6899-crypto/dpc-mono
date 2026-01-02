// src/modules/promotion/domain/promotion-policy.ts
import {
  Prisma,
  PromotionTargetType,
  PromotionQualification,
} from '@repo/database';
import type { Promotion } from './model/promotion.entity';
import type { UserPromotion } from './model/user-promotion.entity';
import type { PromotionCurrency } from './model/promotion-currency.entity';
import {
  PromotionNotEligibleException,
  PromotionAlreadyUsedException,
  PromotionNotActiveException,
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
      throw new PromotionNotActiveException(promotion.id);
    }
  }

  /**
   * 입금 금액이 최소 입금 금액을 만족하는지 확인
   */
  validateMinDepositAmount(
    depositAmount: Prisma.Decimal,
    currencySettings: PromotionCurrency,
  ): void {
    if (!currencySettings.validateMinDepositAmount(depositAmount)) {
      throw new PromotionNotEligibleException(
        `Minimum deposit amount is ${currencySettings.minDepositAmount.toString()}`,
      );
    }
  }

  /**
   * 1회성 프로모션인 경우 이미 사용했는지 확인
   */
  validateOneTimePromotion(
    promotion: Promotion,
    existingUserPromotion: UserPromotion | null,
  ): void {
    if (promotion.isOneTime && existingUserPromotion) {
      if (existingUserPromotion.bonusGranted) {
        throw new PromotionAlreadyUsedException(promotion.id);
      }
    }
  }

  /**
   * 반복 가능한 프로모션인 경우 시간 조건 확인
   * 현재는 추가 검증 없음 (향후 확장 가능)
   */
  validateRepeatablePromotion(
    promotion: Promotion,
    now: Date = new Date(),
  ): void {
    if (promotion.isOneTime) {
      return; // 1회성 프로모션은 시간 조건 없음
    }

    // 반복 가능한 프로모션의 경우 추가 시간 조건 검증이 필요하면 여기에 구현
    // 현재는 활성화 기간(startDate, endDate)만 확인하면 됨
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
        'This promotion is only for first deposit',
      );
    }
  }

  /**
   * 첫 출금까지 프로모션 자격 확인
   */
  validateUntilFirstWithdrawalEligibility(
    promotion: Promotion,
    hasWithdrawn: boolean,
  ): void {
    if (
      promotion.qualificationMaintainCondition ===
        PromotionQualification.UNTIL_FIRST_WITHDRAWAL &&
      hasWithdrawn
    ) {
      throw new PromotionNotEligibleException(
        'This promotion qualification is lost after first withdrawal',
      );
    }
  }

  /**
   * 프로모션 자격 종합 검증
   */
  validateEligibility(
    promotion: Promotion,
    depositAmount: Prisma.Decimal,
    currencySettings: PromotionCurrency,
    existingUserPromotion: UserPromotion | null,
    hasPreviousDeposits: boolean,
    hasWithdrawn: boolean,
    now: Date = new Date(),
  ): void {
    // 1. 활성화 여부 확인
    this.isPromotionActive(promotion, now);

    // 2. 최소 입금 금액 확인 (통화별 설정 사용)
    this.validateMinDepositAmount(depositAmount, currencySettings);

    // 3. 1회성 프로모션 확인
    this.validateOneTimePromotion(promotion, existingUserPromotion);

    // 4. 반복 가능 프로모션 시간 조건 확인
    this.validateRepeatablePromotion(promotion, now);

    // 5. 첫 입금 프로모션 확인
    this.validateFirstDepositEligibility(promotion, hasPreviousDeposits);

    // 6. 첫 출금까지 프로모션 확인
    this.validateUntilFirstWithdrawalEligibility(promotion, hasWithdrawn);
  }
}

