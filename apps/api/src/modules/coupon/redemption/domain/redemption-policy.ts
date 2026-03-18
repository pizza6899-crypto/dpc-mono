import { Coupon, CouponStatus } from '@prisma/client';
import { DomainException } from '../../../common/exception/domain.exception';
import { MessageCode } from '../../../../shared/src/constants/message-codes';

export class RedemptionPolicy {
  /**
   * 쿠폰 사용 가능 여부 검증
   */
  static validate(
    coupon: Coupon,
    userId: bigint,
    userUsageCount: number,
    isUserInAllowlist: boolean,
  ): void {
    // 1. 상태값 확인
    if (coupon.status !== CouponStatus.ACTIVE) {
      throw new DomainException(MessageCode.COUPON_NOT_ACTIVE);
    }

    // 2. 전체 수량 확인
    if (coupon.maxUsage > 0 && coupon.usageCount >= coupon.maxUsage) {
      throw new DomainException(MessageCode.COUPON_EXHAUSTED);
    }

    // 3. 유저당 사용 횟수 확인
    if (userUsageCount >= coupon.maxUsagePerUser) {
      throw new DomainException(MessageCode.COUPON_ALREADY_USED);
    }

    // 4. 유효 기간 확인
    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      throw new DomainException(MessageCode.COUPON_NOT_STARTED);
    }
    if (coupon.expiresAt && coupon.expiresAt < now) {
      throw new DomainException(MessageCode.COUPON_EXPIRED);
    }

    // 5. 화이트리스트 확인
    if (coupon.isAllowlistOnly && !isUserInAllowlist) {
      throw new DomainException(MessageCode.COUPON_NOT_TARGETED);
    }
  }
}
