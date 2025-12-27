// src/modules/affiliate/code/domain/model/affiliate-code.entity.spec.ts
import { AffiliateCode } from './affiliate-code.entity';
import { AffiliateCodeValue } from './affiliate-code-value';

describe('AffiliateCode Entity', () => {
  const userId = 'user-123';
  const codeId = 'code-123';

  describe('fromPersistence', () => {
    it('should create entity from persistence data', () => {
      const data = {
        id: codeId,
        userId,
        code: 'SUMMER2024',
        campaignName: 'Summer Campaign',
        isActive: true,
        isDefault: false,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      };

      const code = AffiliateCode.fromPersistence(data);

      expect(code.id).toBe(codeId);
      expect(code.userId).toBe(userId);
      expect(code.code).toBe('SUMMER2024');
      expect(code.campaignName).toBe('Summer Campaign');
      expect(code.isActive).toBe(true);
      expect(code.isDefault).toBe(false);
    });

    it('should create entity with default values', () => {
      const data = {
        id: codeId,
        userId,
        code: 'FIRSTCODE',
        campaignName: null,
        isActive: true,
        isDefault: true,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      };

      const code = AffiliateCode.fromPersistence(data);

      expect(code.isDefault).toBe(true);
    });

    it('should throw error for invalid code format', () => {
      expect(() => {
        AffiliateCodeValue.create('SHORT'); // 5자 - 너무 짧음
      }).toThrow();
    });
  });

  describe('updateCampaignName', () => {
    it('should update campaign name', () => {
      const code = AffiliateCode.fromPersistence({
        id: codeId,
        userId,
        code: 'SUMMER2024',
        campaignName: 'Old Campaign',
        isActive: true,
        isDefault: false,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      });

      code.updateCampaignName('New Campaign');

      expect(code.campaignName).toBe('New Campaign');
    });

    it('should update campaign name to null', () => {
      const code = AffiliateCode.fromPersistence({
        id: codeId,
        userId,
        code: 'SUMMER2024',
        campaignName: 'Old Campaign',
        isActive: true,
        isDefault: false,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      });

      code.updateCampaignName(null);

      expect(code.campaignName).toBeNull();
    });

    it('should not update when undefined', () => {
      const code = AffiliateCode.fromPersistence({
        id: codeId,
        userId,
        code: 'SUMMER2024',
        campaignName: 'Old Campaign',
        isActive: true,
        isDefault: false,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      });

      code.updateCampaignName(undefined);

      expect(code.campaignName).toBe('Old Campaign'); // 변경되지 않음
    });
  });

  describe('toggleActive', () => {
    it('should toggle active status', () => {
      const code = AffiliateCode.fromPersistence({
        id: codeId,
        userId,
        code: 'SUMMER2024',
        campaignName: null,
        isActive: true,
        isDefault: false,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      });

      expect(code.isActive).toBe(true);

      code.toggleActive();
      expect(code.isActive).toBe(false);

      code.toggleActive();
      expect(code.isActive).toBe(true);
    });
  });

  describe('setAsDefault / unsetAsDefault', () => {
    it('should set and unset default status', () => {
      const code = AffiliateCode.fromPersistence({
        id: codeId,
        userId,
        code: 'SUMMER2024',
        campaignName: null,
        isActive: true,
        isDefault: false,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      });

      expect(code.isDefault).toBe(false);

      code.setAsDefault();
      expect(code.isDefault).toBe(true);

      code.unsetAsDefault();
      expect(code.isDefault).toBe(false);
    });
  });

  describe('markAsUsed', () => {
    it('should update lastUsedAt timestamp', () => {
      const code = AffiliateCode.fromPersistence({
        id: codeId,
        userId,
        code: 'SUMMER2024',
        campaignName: null,
        isActive: true,
        isDefault: false,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      });

      expect(code.lastUsedAt).toBeNull();

      code.markAsUsed();
      expect(code.lastUsedAt).toBeInstanceOf(Date);
    });
  });

  describe('isExpired', () => {
    it('should return false when expiresAt is null', () => {
      const code = AffiliateCode.fromPersistence({
        id: codeId,
        userId,
        code: 'SUMMER2024',
        campaignName: null,
        isActive: true,
        isDefault: false,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      });

      expect(code.isExpired()).toBe(false);
    });

    it('should return false when expiresAt is in the future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const code = AffiliateCode.fromPersistence({
        id: codeId,
        userId,
        code: 'SUMMER2024',
        campaignName: null,
        isActive: true,
        isDefault: false,
        expiresAt: futureDate,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      });

      expect(code.isExpired()).toBe(false);
    });

    it('should return true when expiresAt is in the past', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const code = AffiliateCode.fromPersistence({
        id: codeId,
        userId,
        code: 'SUMMER2024',
        campaignName: null,
        isActive: true,
        isDefault: false,
        expiresAt: pastDate,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      });

      expect(code.isExpired()).toBe(true);
    });
  });

  describe('canBeDeleted', () => {
    it('should return true when not default', () => {
      const code = AffiliateCode.fromPersistence({
        id: codeId,
        userId,
        code: 'SUMMER2024',
        campaignName: null,
        isActive: true,
        isDefault: false,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      });

      expect(code.canBeDeleted(1)).toBe(true);
      expect(code.canBeDeleted(5)).toBe(true);
    });

    it('should return false when default and only code', () => {
      const code = AffiliateCode.fromPersistence({
        id: codeId,
        userId,
        code: 'SUMMER2024',
        campaignName: null,
        isActive: true,
        isDefault: true,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      });

      expect(code.canBeDeleted(1)).toBe(false);
    });

    it('should return true when default but not only code', () => {
      const code = AffiliateCode.fromPersistence({
        id: codeId,
        userId,
        code: 'SUMMER2024',
        campaignName: null,
        isActive: true,
        isDefault: true,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      });

      expect(code.canBeDeleted(2)).toBe(true);
      expect(code.canBeDeleted(5)).toBe(true);
    });
  });

  describe('toPersistence', () => {
    it('should convert entity to persistence format', () => {
      const code = AffiliateCode.fromPersistence({
        id: codeId,
        userId,
        code: 'SUMMER2024',
        campaignName: 'Summer Campaign',
        isActive: true,
        isDefault: false,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      });

      const persistence = code.toPersistence();

      expect(persistence.id).toBe(codeId);
      expect(persistence.userId).toBe(userId);
      expect(persistence.code).toBe('SUMMER2024');
      expect(persistence.campaignName).toBe('Summer Campaign');
      expect(persistence.isActive).toBe(true);
      expect(persistence.isDefault).toBe(false);
    });
  });
});
