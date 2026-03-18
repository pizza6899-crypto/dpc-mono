import type { Prisma, WageringSourceType } from '@prisma/client';
import { WageringRequirementException } from './wagering-requirement.exception';

export class WageringPolicy {
  /**
   * 웨이저링 생성 조건 검증
   * @throws WageringRequirementException
   */
  validateCreation(params: {
    principalAmount: Prisma.Decimal;
    multiplier: Prisma.Decimal;
  }): void {
    const { principalAmount, multiplier } = params;

    // 1. 원금 검증: 0 이하는 허용하지 않음
    if (principalAmount.lte(0)) {
      throw new WageringRequirementException(
        'Principal amount must be greater than zero.',
      );
    }

    // 2. 배수 검증: 마이너스 배수 불가
    if (multiplier.lessThan(0)) {
      throw new WageringRequirementException('Multiplier cannot be negative.');
    }

    // 3. 최대 배수 제한 (시스템 안전 범위 - 예: 200배 초과 비정상 데이터로 간주)
    if (multiplier.greaterThan(200)) {
      throw new WageringRequirementException(
        'Wagering multiplier exceeds system limit (max 200x).',
      );
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
