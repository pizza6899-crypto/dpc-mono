// src/modules/affiliate/referral/domain/referral-policy.ts
import type { AffiliateCode } from '../../code/domain/model/affiliate-code.entity';
import {
  SelfReferralException,
  ReferralCodeInactiveException,
  ReferralCodeExpiredException,
} from './referral.exception';

/**
 * 레퍼럴 도메인 정책 (Policy)
 * 비즈니스 규칙과 검증 로직을 담당
 */
export class ReferralPolicy {
  /**
   * 레퍼럴 관계 생성 가능 여부 검증
   * @param affiliateId - 어플리에이트 사용자 ID
   * @param subUserId - 피추천인 사용자 ID
   * @param code - 레퍼럴 코드 엔티티
   * @throws {SelfReferralException} 셀프 추천인 경우
   * @throws {ReferralCodeInactiveException} 코드가 비활성화된 경우
   * @throws {ReferralCodeExpiredException} 코드가 만료된 경우
   */
  canCreateReferral(
    affiliateId: string,
    subUserId: string,
    code: AffiliateCode,
  ): void {
    // 1. 셀프 추천 방지
    if (affiliateId === subUserId) {
      throw new SelfReferralException();
    }

    // 2. 코드 활성화 확인
    if (!code.isActive) {
      throw new ReferralCodeInactiveException(code.code);
    }

    // 3. 코드 만료 확인
    if (code.isExpired()) {
      throw new ReferralCodeExpiredException(code.code);
    }
  }
}
