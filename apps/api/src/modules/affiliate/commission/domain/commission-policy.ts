// src/modules/affiliate/commission/domain/commission-policy.ts
import type { Prisma } from '@prisma/client';
import { CommissionStatus } from '@prisma/client';
import {
  InvalidCommissionRateException,
  CommissionNotAvailableException,
} from './commission.exception';

/**
 * 커미션 도메인 정책 (Policy)
 * 비즈니스 규칙과 검증 로직을 담당
 * @description 엔티티와 일관성을 위해 Prisma.Decimal 사용
 * @description 티어별 기본 요율은 이제 Tier 테이블의 affiliateCommissionRate에서 관리
 */
export class CommissionPolicy {
  /**
   * 커미션 계산
   * @param wagerAmount - 베팅 금액
   * @param rate - 적용 요율 (예: 0.01 = 1%)
   * @returns 커미션 금액
   */
  calculateCommission(
    wagerAmount: Prisma.Decimal,
    rate: Prisma.Decimal,
  ): Prisma.Decimal {
    // commission = wagerAmount * rate
    // 예: wagerAmount = 10000, rate = 0.01 (1%) → commission = 100
    return wagerAmount.mul(rate);
  }

  /**
   * 요율 유효성 검증
   * @param rate - 검증할 요율 (예: 0.01 = 1%)
   * @throws {InvalidCommissionRateException} 요율이 유효하지 않은 경우
   */
  validateRate(rate: Prisma.Decimal): void {
    // 요율은 0보다 크고 1(100%) 이하여야 함
    if (rate.lte(0) || rate.gt(1)) {
      // 예외는 bigint를 받으므로 변환 필요
      const rateAsBigInt = BigInt(rate.mul(10000).toFixed(0));
      throw new InvalidCommissionRateException(rateAsBigInt);
    }
  }

  /**
   * 커미션 정산 가능 여부 검증
   * @param status - 커미션 상태
   * @throws {CommissionNotAvailableException} 정산 불가능한 경우
   */
  canSettle(status: CommissionStatus): void {
    if (status !== CommissionStatus.PENDING) {
      throw new CommissionNotAvailableException(
        `Commission cannot be settled in the current status: ${status}`,
      );
    }
  }
}
