// src/modules/affiliate/referral/domain/referral-policy.spec.ts
import { ReferralPolicy } from './referral-policy';
import { AffiliateCode } from '../../code/domain/model/affiliate-code.entity';
import {
  SelfReferralException,
  ReferralCodeInactiveException,
  ReferralCodeExpiredException,
} from './referral.exception';

describe('ReferralPolicy', () => {
  let policy: ReferralPolicy;
  const mockAffiliateId = 'affiliate-123';
  const mockSubUserId = 'sub-user-789';
  const mockCodeId = 'code-456';

  beforeEach(() => {
    policy = new ReferralPolicy();
  });

  describe('canCreateReferral', () => {
    it('유효한 레퍼럴 관계 생성이 가능하다', () => {
      const activeCode = AffiliateCode.fromPersistence({
        id: mockCodeId,
        userId: mockAffiliateId,
        code: 'VALIDCODE',
        campaignName: null,
        isActive: true,
        isDefault: false,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      });

      expect(() => {
        policy.canCreateReferral(mockAffiliateId, mockSubUserId, activeCode);
      }).not.toThrow();
    });

    it('셀프 추천인 경우 예외를 발생시킨다', () => {
      const activeCode = AffiliateCode.fromPersistence({
        id: mockCodeId,
        userId: mockAffiliateId,
        code: 'VALIDCODE',
        campaignName: null,
        isActive: true,
        isDefault: false,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      });

      expect(() => {
        policy.canCreateReferral(mockAffiliateId, mockAffiliateId, activeCode);
      }).toThrow(SelfReferralException);
    });

    it('비활성화된 코드인 경우 예외를 발생시킨다', () => {
      const inactiveCode = AffiliateCode.fromPersistence({
        id: mockCodeId,
        userId: mockAffiliateId,
        code: 'INACTIVECODE',
        campaignName: null,
        isActive: false, // 비활성화
        isDefault: false,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      });

      expect(() => {
        policy.canCreateReferral(mockAffiliateId, mockSubUserId, inactiveCode);
      }).toThrow(ReferralCodeInactiveException);
    });

    it('만료된 코드인 경우 예외를 발생시킨다', () => {
      const expiredCode = AffiliateCode.fromPersistence({
        id: mockCodeId,
        userId: mockAffiliateId,
        code: 'EXPIREDCODE',
        campaignName: null,
        isActive: true,
        isDefault: false,
        expiresAt: new Date('2020-01-01'), // 과거 날짜
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      });

      expect(() => {
        policy.canCreateReferral(mockAffiliateId, mockSubUserId, expiredCode);
      }).toThrow(ReferralCodeExpiredException);
    });

    it('만료일이 없는 코드는 만료되지 않은 것으로 간주한다', () => {
      const codeWithoutExpiry = AffiliateCode.fromPersistence({
        id: mockCodeId,
        userId: mockAffiliateId,
        code: 'NOEXPIRYCODE',
        campaignName: null,
        isActive: true,
        isDefault: false,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      });

      expect(() => {
        policy.canCreateReferral(
          mockAffiliateId,
          mockSubUserId,
          codeWithoutExpiry,
        );
      }).not.toThrow();
    });

    it('만료일이 미래인 코드는 유효하다', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1); // 1년 후

      const futureCode = AffiliateCode.fromPersistence({
        id: mockCodeId,
        userId: mockAffiliateId,
        code: 'FUTURECODE',
        campaignName: null,
        isActive: true,
        isDefault: false,
        expiresAt: futureDate,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      });

      expect(() => {
        policy.canCreateReferral(mockAffiliateId, mockSubUserId, futureCode);
      }).not.toThrow();
    });

    it('여러 검증 실패 시 첫 번째 검증 실패에서 예외를 발생시킨다 (셀프 추천 우선)', () => {
      const inactiveCode = AffiliateCode.fromPersistence({
        id: mockCodeId,
        userId: mockAffiliateId,
        code: 'INACTIVECODE',
        campaignName: null,
        isActive: false, // 비활성화
        isDefault: false,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      });

      // 셀프 추천이 먼저 체크되므로 SelfReferralException 발생
      expect(() => {
        policy.canCreateReferral(
          mockAffiliateId,
          mockAffiliateId,
          inactiveCode,
        );
      }).toThrow(SelfReferralException);
    });
  });
});
