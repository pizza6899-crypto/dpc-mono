// src/modules/affiliate/commission/domain/commission-policy.spec.ts
import { AffiliateTierLevel, CommissionStatus, Prisma } from '@repo/database';
import { CommissionPolicy } from './commission-policy';
import {
  InvalidCommissionRateException,
  CommissionNotAvailableException,
} from './commission.exception';

describe('CommissionPolicy', () => {
  let policy: CommissionPolicy;

  beforeEach(() => {
    policy = new CommissionPolicy();
  });

  describe('getBaseRateForTier', () => {
    it('BRONZE 티어의 기본 요율을 반환한다', () => {
      const rate = policy.getBaseRateForTier(AffiliateTierLevel.BRONZE);
      expect(rate.toString()).toBe('0.005'); // 0.5%
    });

    it('SILVER 티어의 기본 요율을 반환한다', () => {
      const rate = policy.getBaseRateForTier(AffiliateTierLevel.SILVER);
      expect(rate.toString()).toBe('0.0075'); // 0.75%
    });

    it('GOLD 티어의 기본 요율을 반환한다', () => {
      const rate = policy.getBaseRateForTier(AffiliateTierLevel.GOLD);
      expect(rate.toString()).toBe('0.01'); // 1.0%
    });

    it('PLATINUM 티어의 기본 요율을 반환한다', () => {
      const rate = policy.getBaseRateForTier(AffiliateTierLevel.PLATINUM);
      expect(rate.toString()).toBe('0.015'); // 1.5%
    });

    it('DIAMOND 티어의 기본 요율을 반환한다', () => {
      const rate = policy.getBaseRateForTier(AffiliateTierLevel.DIAMOND);
      expect(rate.toString()).toBe('0.02'); // 2.0%
    });

    it('반환된 요율은 Prisma.Decimal 타입이다', () => {
      const rate = policy.getBaseRateForTier(AffiliateTierLevel.GOLD);
      expect(rate).toBeInstanceOf(Prisma.Decimal);
    });
  });

  describe('calculateCommission', () => {
    it('커미션을 올바르게 계산한다', () => {
      const wagerAmount = new Prisma.Decimal('10000');
      const rate = new Prisma.Decimal('0.01'); // 1%

      const commission = policy.calculateCommission(wagerAmount, rate);

      expect(commission.toString()).toBe('100');
    });

    it('소수점이 있는 베팅 금액에 대해 커미션을 계산한다', () => {
      const wagerAmount = new Prisma.Decimal('1234.56');
      const rate = new Prisma.Decimal('0.01'); // 1%

      const commission = policy.calculateCommission(wagerAmount, rate);

      expect(commission.toString()).toBe('12.3456');
    });

    it('다양한 요율에 대해 커미션을 계산한다', () => {
      const wagerAmount = new Prisma.Decimal('10000');

      // 0.5%
      const commission1 = policy.calculateCommission(
        wagerAmount,
        new Prisma.Decimal('0.005'),
      );
      expect(commission1.toString()).toBe('50');

      // 1.5%
      const commission2 = policy.calculateCommission(
        wagerAmount,
        new Prisma.Decimal('0.015'),
      );
      expect(commission2.toString()).toBe('150');

      // 2%
      const commission3 = policy.calculateCommission(
        wagerAmount,
        new Prisma.Decimal('0.02'),
      );
      expect(commission3.toString()).toBe('200');
    });

    it('반환된 커미션은 Prisma.Decimal 타입이다', () => {
      const wagerAmount = new Prisma.Decimal('10000');
      const rate = new Prisma.Decimal('0.01');

      const commission = policy.calculateCommission(wagerAmount, rate);

      expect(commission).toBeInstanceOf(Prisma.Decimal);
    });
  });

  describe('validateRate', () => {
    it('유효한 요율은 예외를 발생시키지 않는다', () => {
      expect(() => {
        policy.validateRate(new Prisma.Decimal('0.01'));
      }).not.toThrow();

      expect(() => {
        policy.validateRate(new Prisma.Decimal('0.5'));
      }).not.toThrow();

      expect(() => {
        policy.validateRate(new Prisma.Decimal('1'));
      }).not.toThrow();
    });

    it('0 이하의 요율은 예외를 발생시킨다', () => {
      expect(() => {
        policy.validateRate(new Prisma.Decimal('0'));
      }).toThrow(InvalidCommissionRateException);

      expect(() => {
        policy.validateRate(new Prisma.Decimal('-0.01'));
      }).toThrow(InvalidCommissionRateException);
    });

    it('1(100%)보다 큰 요율은 예외를 발생시킨다', () => {
      expect(() => {
        policy.validateRate(new Prisma.Decimal('1.01'));
      }).toThrow(InvalidCommissionRateException);

      expect(() => {
        policy.validateRate(new Prisma.Decimal('2'));
      }).toThrow(InvalidCommissionRateException);
    });
  });

  describe('canSettle', () => {
    it('PENDING 상태는 정산 가능하다', () => {
      expect(() => {
        policy.canSettle(CommissionStatus.PENDING);
      }).not.toThrow();
    });

    it('AVAILABLE 상태는 정산 불가능하다', () => {
      expect(() => {
        policy.canSettle(CommissionStatus.AVAILABLE);
      }).toThrow(CommissionNotAvailableException);
    });

    it('CLAIMED 상태는 정산 불가능하다', () => {
      expect(() => {
        policy.canSettle(CommissionStatus.CLAIMED);
      }).toThrow(CommissionNotAvailableException);
    });

    it('WITHDRAWN 상태는 정산 불가능하다', () => {
      expect(() => {
        policy.canSettle(CommissionStatus.WITHDRAWN);
      }).toThrow(CommissionNotAvailableException);
    });

    it('CANCELLED 상태는 정산 불가능하다', () => {
      expect(() => {
        policy.canSettle(CommissionStatus.CANCELLED);
      }).toThrow(CommissionNotAvailableException);
    });
  });

  describe('통합 시나리오', () => {
    it('티어별 요율로 커미션을 계산하는 시나리오', () => {
      const wagerAmount = new Prisma.Decimal('10000');

      // GOLD 티어 (1%)
      const goldRate = policy.getBaseRateForTier(AffiliateTierLevel.GOLD);
      const goldCommission = policy.calculateCommission(wagerAmount, goldRate);
      expect(goldCommission.toString()).toBe('100');

      // DIAMOND 티어 (2%)
      const diamondRate = policy.getBaseRateForTier(AffiliateTierLevel.DIAMOND);
      const diamondCommission = policy.calculateCommission(
        wagerAmount,
        diamondRate,
      );
      expect(diamondCommission.toString()).toBe('200');
    });

    it('요율 검증 후 커미션 계산 시나리오', () => {
      const wagerAmount = new Prisma.Decimal('10000');
      const validRate = new Prisma.Decimal('0.01');

      // 요율 검증
      expect(() => {
        policy.validateRate(validRate);
      }).not.toThrow();

      // 커미션 계산
      const commission = policy.calculateCommission(wagerAmount, validRate);
      expect(commission.toString()).toBe('100');
    });
  });
});
