// src/modules/exchange/application/exchange-rate-validator.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ExchangeCurrencyCode, Prisma } from '@repo/database';
import { ExchangeRateValidator } from '../application/exchange-rate-validator.service';

describe('ExchangeRateValidator', () => {
  let validator: ExchangeRateValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExchangeRateValidator],
    }).compile();

    validator = module.get<ExchangeRateValidator>(ExchangeRateValidator);
  });

  describe('validate', () => {
    describe('기본 검증', () => {
      it('유효한 환율은 통과해야 함', () => {
        const result = validator.validate(new Prisma.Decimal('1300'));

        expect(result.isValid).toBe(true);
        expect(result.reason).toBeUndefined();
      });

      it('0 이하의 환율은 거부해야 함', () => {
        const result = validator.validate(new Prisma.Decimal('0'));

        expect(result.isValid).toBe(false);
        expect(result.reason).toBe(
          'Exchange rate must be greater than 0 and finite',
        );
      });

      it('음수 환율은 거부해야 함', () => {
        const result = validator.validate(new Prisma.Decimal('-100'));

        expect(result.isValid).toBe(false);
        expect(result.reason).toBe(
          'Exchange rate must be greater than 0 and finite',
        );
      });

      it('무한대 값은 거부해야 함', () => {
        const result = validator.validate(
          new Prisma.Decimal(Number.POSITIVE_INFINITY),
        );

        expect(result.isValid).toBe(false);
        expect(result.reason).toBe(
          'Exchange rate must be greater than 0 and finite',
        );
      });
    });

    describe('극단적 값 검증', () => {
      it('최대값을 초과하는 환율은 거부해야 함', () => {
        const tooLarge = new Prisma.Decimal('200000000000000'); // 200조
        const result = validator.validate(tooLarge);

        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('outside acceptable range');
      });

      it('최소값 미만의 환율은 거부해야 함', () => {
        const tooSmall = new Prisma.Decimal('0.0000000000001'); // 너무 작음
        const result = validator.validate(tooSmall);

        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('outside acceptable range');
      });

      it('허용 범위 내의 극단적 값은 통과해야 함', () => {
        const maxValue = new Prisma.Decimal('100000000000000'); // 최대값
        const minValue = new Prisma.Decimal('0.000000000001'); // 최소값

        expect(validator.validate(maxValue).isValid).toBe(true);
        expect(validator.validate(minValue).isValid).toBe(true);
      });
    });

    describe('변동률 검증', () => {
      it('이전 환율이 없으면 통과해야 함', () => {
        const result = validator.validate(new Prisma.Decimal('1300'));

        expect(result.isValid).toBe(true);
        expect(result.changeRate).toBeUndefined();
      });

      it('정상적인 변동률은 통과해야 함', () => {
        const previousRate = new Prisma.Decimal('1300');
        const newRate = new Prisma.Decimal('1310'); // 약 0.77% 상승

        const result = validator.validate(
          newRate,
          previousRate,
          ExchangeCurrencyCode.USD,
          ExchangeCurrencyCode.KRW,
        );

        expect(result.isValid).toBe(true);
        expect(result.changeRate).toBeDefined();
        expect(result.changeRate?.toNumber()).toBeCloseTo(0.0077, 3);
      });

      it('10%를 초과하는 변동률은 거부해야 함', () => {
        const previousRate = new Prisma.Decimal('1300');
        const newRate = new Prisma.Decimal('1500'); // 약 15.4% 상승

        const result = validator.validate(
          newRate,
          previousRate,
          ExchangeCurrencyCode.USD,
          ExchangeCurrencyCode.KRW,
        );

        expect(result.isValid).toBe(false);
        expect(result.changeRate).toBeDefined();
        expect(result.reason).toContain('Exchange rate changed by');
      });

      it('10% 하락도 거부해야 함', () => {
        const previousRate = new Prisma.Decimal('1300');
        const newRate = new Prisma.Decimal('1170'); // 10% 하락

        const result = validator.validate(
          newRate,
          previousRate,
          ExchangeCurrencyCode.USD,
          ExchangeCurrencyCode.KRW,
        );

        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('Exchange rate changed by');
      });

      it('정확히 10% 변동은 거부해야 함', () => {
        const previousRate = new Prisma.Decimal('100');
        const newRate = new Prisma.Decimal('110'); // 정확히 10% 상승

        const result = validator.validate(
          newRate,
          previousRate,
          ExchangeCurrencyCode.USD,
          ExchangeCurrencyCode.KRW,
        );

        expect(result.isValid).toBe(false);
      });

      it('이전 환율이 유효하지 않아도 새 환율은 통과해야 함', () => {
        const invalidPreviousRate = new Prisma.Decimal('0');
        const newRate = new Prisma.Decimal('1300');

        const result = validator.validate(
          newRate,
          invalidPreviousRate,
          ExchangeCurrencyCode.USD,
          ExchangeCurrencyCode.KRW,
        );

        expect(result.isValid).toBe(true);
      });

      it('이전 환율이 undefined이면 통과해야 함', () => {
        const result = validator.validate(
          new Prisma.Decimal('1300'),
          undefined,
          ExchangeCurrencyCode.USD,
          ExchangeCurrencyCode.KRW,
        );

        expect(result.isValid).toBe(true);
      });
    });

    describe('복합 시나리오', () => {
      it('정상적인 환율 업데이트 시나리오', () => {
        const previousRate = new Prisma.Decimal('1300');
        const newRate = new Prisma.Decimal('1305'); // 0.38% 상승

        const result = validator.validate(
          newRate,
          previousRate,
          ExchangeCurrencyCode.USD,
          ExchangeCurrencyCode.KRW,
        );

        expect(result.isValid).toBe(true);
        expect(result.changeRate).toBeDefined();
      });

      it('급격한 환율 변동 시나리오', () => {
        const previousRate = new Prisma.Decimal('1300');
        const newRate = new Prisma.Decimal('1500'); // 15.4% 상승

        const result = validator.validate(
          newRate,
          previousRate,
          ExchangeCurrencyCode.USD,
          ExchangeCurrencyCode.KRW,
        );

        expect(result.isValid).toBe(false);
        expect(result.changeRate).toBeDefined();
        expect(result.reason).toContain('max: 0.10');
      });
    });
  });
});
