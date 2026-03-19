// src/modules/promotion/campaign/domain/promotion-policy.ts
import type { Prisma } from '@prisma/client';
import { PromotionTargetType } from '@prisma/client';
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
   * 사용자별 참여 제한 및 중복 참여 확인
   */
  validateUserParticipation(
    promotion: Promotion,
    participationCountInPeriod: number,
    activeParticipations: UserPromotion[],
  ): void {
    // 1. 현재 진행 중인 동일 프로모션이 있는지 확인 (중복 참여 방지)
    const isAlreadyParticipating = activeParticipations.some(
      (up) => up.promotionId === promotion.id,
    );
    if (isAlreadyParticipating) {
      throw new PromotionAlreadyUsedException(
        'You are already participating in this promotion',
      );
    }

    // 2. 누적 참여 횟수(또는 주기별 참여 횟수) 제한 확인
    if (
      promotion.maxUsagePerUser !== null &&
      participationCountInPeriod >= promotion.maxUsagePerUser
    ) {
      throw new PromotionAlreadyUsedException(
        'You have reached the maximum usage limit for this promotion',
      );
    }
  }

  /**
   * 입금/출금 기록 기반 타겟 자격 확인
   */
  validateTargetEligibility(
    promotion: Promotion,
    depositCount: number,
    withdrawalCount: number,
  ): void {
    switch (promotion.targetType) {
      case PromotionTargetType.FIRST_DEPOSIT:
        if (depositCount > 0) {
          throw new PromotionNotEligibleException(
            'Only for your very first deposit',
          );
        }
        break;
      case PromotionTargetType.SECOND_DEPOSIT:
        if (depositCount !== 1) {
          throw new PromotionNotEligibleException(
            'Only for your second deposit',
          );
        }
        break;
      case PromotionTargetType.THIRD_DEPOSIT:
        if (depositCount !== 2) {
          throw new PromotionNotEligibleException(
            'Only for your third deposit',
          );
        }
        break;
      case PromotionTargetType.BEFORE_FIRST_WITHDRAWAL:
        if (withdrawalCount > 0) {
          throw new PromotionNotEligibleException(
            'Only available before your first withdrawal',
          );
        }
        break;
      case PromotionTargetType.RELOAD_DEPOSIT:
        // 재충전은 별도 입금 횟수 제한 없음 (UsageLimit에서 처리)
        break;
    }
  }

  /**
   * 요일 및 시간대 제한 확인 (Happy Hour 등)
   */
  validateTimeConstraints(promotion: Promotion, now: Date): void {
    // 1. 요일 확인
    if (promotion.applicableDays.length > 0) {
      const day = now.getDay(); // 0: 일요일 ~ 6: 토요일
      if (!promotion.applicableDays.includes(day)) {
        throw new PromotionNotEligibleException('Not available today');
      }
    }

    // 2. 시간 확인 (시/분 정밀 비교)
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (promotion.applicableStartTime !== null) {
      const startMinutes =
        promotion.applicableStartTime.getHours() * 60 +
        promotion.applicableStartTime.getMinutes();
      if (currentMinutes < startMinutes) {
        throw new PromotionNotEligibleException(
          'Not yet available at this hour',
        );
      }
    }

    if (promotion.applicableEndTime !== null) {
      const endMinutes =
        promotion.applicableEndTime.getHours() * 60 +
        promotion.applicableEndTime.getMinutes();
      if (currentMinutes >= endMinutes) {
        throw new PromotionNotEligibleException('Expired for this hour');
      }
    }
  }

  /**
   * 프로모션 자격 종합 검증
   */
  validateEligibility(params: {
    promotion: Promotion;
    currencyRule: PromotionCurrencyRule;
    depositAmount: Prisma.Decimal;
    depositCount: number;
    withdrawalCount: number;
    participationCountInPeriod: number;
    activeParticipations: UserPromotion[];
    now?: Date;
  }): void {
    const {
      promotion,
      currencyRule,
      depositAmount,
      depositCount,
      withdrawalCount,
      participationCountInPeriod,
      activeParticipations,
      now = new Date(),
    } = params;

    // 1. 활성화 및 기간 여부 확인
    this.isPromotionActive(promotion, now);

    // 2. 요일 및 시간대 확인
    this.validateTimeConstraints(promotion, now);

    // 3. 입금 금액 조건 확인
    this.validateDepositAmount(depositAmount, currencyRule);

    // 4. 타겟 자격 확인 (N차 입금, 출금 전 등)
    this.validateTargetEligibility(promotion, depositCount, withdrawalCount);

    // 5. 유저별 참여 횟수 및 중복 참여 확인
    this.validateUserParticipation(
      promotion,
      participationCountInPeriod,
      activeParticipations,
    );
  }

  /**
   * 프로모션 설정 유효성 검사
   */
  validateConfiguration(params: {
    currencyRules?: Array<{
      minDepositAmount: Prisma.Decimal;
      maxBonusAmount?: Prisma.Decimal | null;
      bonusRate?: Prisma.Decimal | null;
    }>;
  }): void {
    const { currencyRules } = params;

    if (!currencyRules || currencyRules.length === 0) {
      return;
    }

    for (const rule of currencyRules) {
      if (!rule.bonusRate || rule.bonusRate.lte(0)) {
        throw new PromotionInvalidConfigurationException(
          'Promotion requires a positive bonus rate',
        );
      }
    }
  }
}
