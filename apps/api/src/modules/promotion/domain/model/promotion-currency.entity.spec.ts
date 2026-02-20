// src/modules/promotion/domain/model/promotion-currency.entity.spec.ts
import { Prisma, ExchangeCurrencyCode } from '@prisma/client';
import { PromotionCurrency } from './promotion-currency.entity';

describe('PromotionCurrency Entity', () => {
  const createCurrency = (
    overrides: Partial<
      Parameters<typeof PromotionCurrency.fromPersistence>[0]
    > = {},
  ) => {
    return PromotionCurrency.fromPersistence({
      id: 1,
      promotionId: 1,
      currency: ExchangeCurrencyCode.USDT,
      minDepositAmount: new Prisma.Decimal(10),
      maxBonusAmount: new Prisma.Decimal(100),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });
  };

  describe('fromPersistence', () => {
    it('should create from persistence data', () => {
      const currency = createCurrency();

      expect(currency.id).toBe(1);
      expect(currency.promotionId).toBe(1);
      expect(currency.currency).toBe(ExchangeCurrencyCode.USDT);
      expect(currency.minDepositAmount).toEqual(new Prisma.Decimal(10));
      expect(currency.maxBonusAmount).toEqual(new Prisma.Decimal(100));
    });

    it('should handle null maxBonusAmount', () => {
      const currency = createCurrency({ maxBonusAmount: null });

      expect(currency.maxBonusAmount).toBeNull();
    });
  });

  describe('validateMinDepositAmount', () => {
    it('should return true when deposit meets minimum', () => {
      const currency = createCurrency({
        minDepositAmount: new Prisma.Decimal(10),
      });

      expect(currency.validateMinDepositAmount(new Prisma.Decimal(10))).toBe(
        true,
      );
      expect(currency.validateMinDepositAmount(new Prisma.Decimal(100))).toBe(
        true,
      );
    });

    it('should return false when deposit below minimum', () => {
      const currency = createCurrency({
        minDepositAmount: new Prisma.Decimal(10),
      });

      expect(currency.validateMinDepositAmount(new Prisma.Decimal(5))).toBe(
        false,
      );
      expect(currency.validateMinDepositAmount(new Prisma.Decimal(9.99))).toBe(
        false,
      );
    });
  });

  describe('validateMaxBonusAmount', () => {
    it('should return true when bonus is within limit', () => {
      const currency = createCurrency({
        maxBonusAmount: new Prisma.Decimal(100),
      });

      expect(currency.validateMaxBonusAmount(new Prisma.Decimal(50))).toBe(
        true,
      );
      expect(currency.validateMaxBonusAmount(new Prisma.Decimal(100))).toBe(
        true,
      );
    });

    it('should return false when bonus exceeds limit', () => {
      const currency = createCurrency({
        maxBonusAmount: new Prisma.Decimal(100),
      });

      expect(currency.validateMaxBonusAmount(new Prisma.Decimal(150))).toBe(
        false,
      );
    });

    it('should return true when no max limit set', () => {
      const currency = createCurrency({ maxBonusAmount: null });

      expect(currency.validateMaxBonusAmount(new Prisma.Decimal(10000))).toBe(
        true,
      );
    });
  });

  describe('toPersistence', () => {
    it('should convert to persistence format', () => {
      const currency = createCurrency();

      const persistence = currency.toPersistence();

      expect(persistence.id).toBe(1);
      expect(persistence.currency).toBe(ExchangeCurrencyCode.USDT);
      expect(persistence.minDepositAmount).toEqual(new Prisma.Decimal(10));
    });
  });
});
