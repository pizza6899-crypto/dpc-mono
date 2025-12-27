// src/modules/affiliate/code/domain/affiliate-code-policy.spec.ts
import { AffiliateCodePolicy } from './affiliate-code-policy';
import { AffiliateCode } from './model/affiliate-code.entity';
import {
  AffiliateCodeLimitExceededException,
  AffiliateCodeCannotDeleteException,
} from './affiliate-code.exception';

describe('AffiliateCodePolicy', () => {
  let policy: AffiliateCodePolicy;

  beforeEach(() => {
    policy = new AffiliateCodePolicy();
  });

  describe('canCreateCode', () => {
    it('should allow creating code when under limit', () => {
      expect(() => {
        policy.canCreateCode(0);
      }).not.toThrow();

      expect(() => {
        policy.canCreateCode(19);
      }).not.toThrow();
    });

    it('should throw error when code limit exceeded', () => {
      expect(() => {
        policy.canCreateCode(20);
      }).toThrow(AffiliateCodeLimitExceededException);
    });

    it('should throw error when code limit exceeded (over limit)', () => {
      expect(() => {
        policy.canCreateCode(21);
      }).toThrow(AffiliateCodeLimitExceededException);
    });
  });

  describe('isFirstCode', () => {
    it('should return true for first code', () => {
      expect(policy.isFirstCode(0)).toBe(true);
    });

    it('should return false for subsequent codes', () => {
      expect(policy.isFirstCode(1)).toBe(false);
      expect(policy.isFirstCode(5)).toBe(false);
    });
  });

  describe('canDeleteCode', () => {
    it('should allow deleting non-default code', () => {
      const code = AffiliateCode.fromPersistence({
        id: 'code-123',
        userId: 'user-123',
        code: 'SUMMER2024',
        campaignName: null,
        isActive: true,
        isDefault: false,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      });

      expect(() => {
        policy.canDeleteCode(code, 1);
      }).not.toThrow();

      expect(() => {
        policy.canDeleteCode(code, 5);
      }).not.toThrow();
    });

    it('should allow deleting default code when multiple codes exist', () => {
      const code = AffiliateCode.fromPersistence({
        id: 'code-123',
        userId: 'user-123',
        code: 'SUMMER2024',
        campaignName: null,
        isActive: true,
        isDefault: true,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      });

      expect(() => {
        policy.canDeleteCode(code, 2);
      }).not.toThrow();
    });

    it('should throw error when trying to delete only default code', () => {
      const code = AffiliateCode.fromPersistence({
        id: 'code-123',
        userId: 'user-123',
        code: 'SUMMER2024',
        campaignName: null,
        isActive: true,
        isDefault: true,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      });

      expect(() => {
        policy.canDeleteCode(code, 1);
      }).toThrow(AffiliateCodeCannotDeleteException);
    });
  });

  describe('getMaxCodesPerUser', () => {
    it('should return maximum codes per user', () => {
      expect(policy.getMaxCodesPerUser()).toBe(20);
    });
  });
});
