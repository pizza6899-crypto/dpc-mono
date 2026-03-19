import type { Prisma } from '@prisma/client';
import {
  InvalidBaseAmountException,
  InvalidWageringMultiplierException,
  WageringExceedsLimitException,
} from './wagering-requirement.exception';

export class WageringPolicy {
  /**
   * 웨이저링 생성 조건 검증
   * @throws WageringRequirementException
   */
  validateCreation(params: {
    principalAmount: Prisma.Decimal;
    bonusAmount: Prisma.Decimal;
    multiplier: Prisma.Decimal;
  }): void {
    const { principalAmount, bonusAmount, multiplier } = params;

    // 1. 기초 자산 검증: 원금 또는 보너스 중 하나는 반드시 존재해야 함 기초 자산이 존재하지 않으면 안됨
    const totalBaseAmount = principalAmount.add(bonusAmount);
    if (totalBaseAmount.lte(0)) {
      throw new InvalidBaseAmountException();
    }

    // 2. 배수 검증: 마이너스 배수 불가
    if (multiplier.lessThan(0)) {
      throw new InvalidWageringMultiplierException();
    }

    // 3. 최대 배수 제한 (시스템 안전 범위 - 예: 200배 초과 비정상 데이터로 간주)
    if (multiplier.greaterThan(200)) {
      throw new WageringExceedsLimitException(200);
    }
  }

  /**
   * 취소 가능 잔액 임계값 체크
   * (유저 잔액이 임계값보다 작으면 오링으로 간주하여 롤링 취소 가능)
   */
  canBeCancelled(
    currentBalance: Prisma.Decimal,
    threshold: Prisma.Decimal | null,
  ): boolean {
    if (!threshold) {
      return false;
    }
    return currentBalance.lessThan(threshold);
  }

  /**
   * 기여도 계산 (게임별 가중치 적용)
   */
  calculateContribution(
    betAmount: Prisma.Decimal,
    contributionRate: number,
  ): Prisma.Decimal {
    return betAmount.mul(contributionRate);
  }
}
