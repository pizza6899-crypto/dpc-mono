// src/modules/promotion/domain/model/promotion.entity.spec.ts
import {
  Prisma,
  PromotionTargetType,
  PromotionBonusType,
  PromotionQualification,
  ExchangeCurrencyCode,
} from '@prisma/client';
import { Promotion } from './promotion.entity';
import { PromotionCurrency } from './promotion-currency.entity';

describe('Promotion Entity', () => {
  const createPromotion = (
    overrides: Partial<Parameters<typeof Promotion.fromPersistence>[0]> = {},
  ) => {
    return Promotion.fromPersistence({
      id: BigInt(1),
      code: 'PROMO_CODE',
      managementName: 'Test Promotion',
      isActive: true,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      targetType: PromotionTargetType.NEW_USER_FIRST_DEPOSIT,
      bonusType: PromotionBonusType.PERCENTAGE,
      bonusRate: new Prisma.Decimal(0.1), // 10%
      rollingMultiplier: new Prisma.Decimal(5),
      qualificationMaintainCondition:
        PromotionQualification.UNTIL_FIRST_WITHDRAWAL,
      isOneTime: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });
  };

  describe('fromPersistence', () => {
    it('should create promotion from persistence data', () => {
      const promotion = createPromotion();

      expect(promotion.id).toBe(BigInt(1));
      expect(promotion.managementName).toBe('Test Promotion');
      expect(promotion.isActive).toBe(true);
      expect(promotion.bonusType).toBe(PromotionBonusType.PERCENTAGE);
      expect(promotion.bonusRate).toEqual(new Prisma.Decimal(0.1));
    });

    it('should handle optional fields with defaults', () => {
      const promotion = Promotion.fromPersistence({
        id: BigInt(1),
        code: 'PROMO_CODE',
        managementName: 'Test',
        isActive: true,
        startDate: null,
        endDate: null,
        targetType: PromotionTargetType.NEW_USER_FIRST_DEPOSIT,
        bonusType: PromotionBonusType.PERCENTAGE,
        bonusRate: null,
        rollingMultiplier: null,
        qualificationMaintainCondition:
          PromotionQualification.UNTIL_FIRST_WITHDRAWAL,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(promotion.isOneTime).toBe(false);
      expect(promotion.deletedAt).toBeNull();
    });
  });

  describe('isCurrentlyActive', () => {
    it('should return true when promotion is active and within date range', () => {
      const promotion = createPromotion({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      const now = new Date('2024-06-15');
      expect(promotion.isCurrentlyActive(now)).toBe(true);
    });

    it('should return false when promotion is inactive', () => {
      const promotion = createPromotion({ isActive: false });

      expect(promotion.isCurrentlyActive()).toBe(false);
    });

    it('should return false when before start date', () => {
      const promotion = createPromotion({
        startDate: new Date('2024-06-01'),
      });

      const now = new Date('2024-05-15');
      expect(promotion.isCurrentlyActive(now)).toBe(false);
    });

    it('should return false when after end date', () => {
      const promotion = createPromotion({
        endDate: new Date('2024-06-01'),
      });

      const now = new Date('2024-06-15');
      expect(promotion.isCurrentlyActive(now)).toBe(false);
    });

    it('should return true when no start/end date restrictions', () => {
      const promotion = createPromotion({
        startDate: null,
        endDate: null,
      });

      expect(promotion.isCurrentlyActive()).toBe(true);
    });
  });

  describe('calculateBonus', () => {
    it('should calculate percentage bonus correctly', () => {
      const promotion = createPromotion({
        bonusType: PromotionBonusType.PERCENTAGE,
        bonusRate: new Prisma.Decimal(0.1), // 10%
      });

      const bonus = promotion.calculateBonus(new Prisma.Decimal(100));
      expect(bonus).toEqual(new Prisma.Decimal(10));
    });

    it('should respect maxBonusAmount', () => {
      const promotion = createPromotion({
        bonusType: PromotionBonusType.PERCENTAGE,
        bonusRate: new Prisma.Decimal(0.5), // 50%
      });

      const bonus = promotion.calculateBonus(
        new Prisma.Decimal(1000),
        new Prisma.Decimal(100), // max bonus
      );
      expect(bonus).toEqual(new Prisma.Decimal(100));
    });

    it('should return 0 when no bonusRate', () => {
      const promotion = createPromotion({
        bonusType: PromotionBonusType.PERCENTAGE,
        bonusRate: null,
      });

      const bonus = promotion.calculateBonus(new Prisma.Decimal(100));
      expect(bonus).toEqual(new Prisma.Decimal(0));
    });
  });

  describe('getRollingMultiplier', () => {
    it('should return rollingMultiplier when set', () => {
      const promotion = createPromotion({
        rollingMultiplier: new Prisma.Decimal(10),
      });

      expect(promotion.getRollingMultiplier()).toEqual(new Prisma.Decimal(10));
    });

    it('should return 1 as default when null', () => {
      const promotion = createPromotion({
        rollingMultiplier: null,
      });

      expect(promotion.getRollingMultiplier()).toEqual(new Prisma.Decimal(1));
    });
  });

  describe('toggleActive', () => {
    it('should toggle isActive from true to false', () => {
      const promotion = createPromotion({ isActive: true });

      promotion.toggleActive();

      expect(promotion.isActive).toBe(false);
    });

    it('should toggle isActive from false to true', () => {
      const promotion = createPromotion({ isActive: false });

      promotion.toggleActive();

      expect(promotion.isActive).toBe(true);
    });
  });

  describe('soft delete', () => {
    it('should mark as deleted', () => {
      const promotion = createPromotion();

      promotion.markAsDeleted();

      expect(promotion.isDeleted()).toBe(true);
      expect(promotion.deletedAt).toBeInstanceOf(Date);
    });

    it('should restore deleted promotion', () => {
      const promotion = createPromotion({ deletedAt: new Date() });

      promotion.restore();

      expect(promotion.isDeleted()).toBe(false);
      expect(promotion.deletedAt).toBeNull();
    });
  });

  describe('currency settings', () => {
    it('should get currency settings', () => {
      const currencies = [
        PromotionCurrency.fromPersistence({
          id: BigInt(1),
          promotionId: BigInt(1),
          currency: ExchangeCurrencyCode.USDT,
          minDepositAmount: new Prisma.Decimal(10),
          maxBonusAmount: new Prisma.Decimal(100),
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      const promotion = createPromotion({ currencies });

      expect(promotion.getCurrencies()).toHaveLength(1);
      expect(promotion.getCurrency(ExchangeCurrencyCode.USDT)).toBeDefined();
      expect(promotion.getCurrency(ExchangeCurrencyCode.KRW)).toBeUndefined();
    });
  });

  describe('toPersistence', () => {
    it('should convert to persistence format', () => {
      const promotion = createPromotion();

      const persistence = promotion.toPersistence();

      expect(persistence.id).toBe(BigInt(1));
      expect(persistence.code).toBe('PROMO_CODE');
      expect(persistence.managementName).toBe('Test Promotion');
      expect(persistence.isActive).toBe(true);
      expect(persistence.bonusRate).toEqual(new Prisma.Decimal(0.1));
    });
  });
});
