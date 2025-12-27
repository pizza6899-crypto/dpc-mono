// src/modules/affiliate/commission/domain/model/affiliate-tier.entity.spec.ts
import { AffiliateTierLevel, Prisma } from '@prisma/client';
import { AffiliateTier } from './affiliate-tier.entity';
import {
  InvalidCommissionRateException,
  InvalidWalletBalanceException,
} from '../commission.exception';

describe('AffiliateTier Entity', () => {
  const mockId = 1n;
  const mockUid = 'tier-uid-123';
  const mockAffiliateId = 'affiliate-123';
  const mockTier = AffiliateTierLevel.GOLD;
  const mockBaseRate = new Prisma.Decimal('0.01'); // 1%
  const mockCustomRate = new Prisma.Decimal('0.015'); // 1.5%
  const mockMonthlyWagerAmount = new Prisma.Decimal('10000.50');
  const mockCustomRateSetBy = 'admin-123';
  const mockCustomRateSetAt = new Date('2024-01-01T00:00:00Z');
  const mockCreatedAt = new Date('2024-01-01T00:00:00Z');
  const mockUpdatedAt = new Date('2024-01-01T00:00:00Z');

  describe('create', () => {
    it('새로운 티어 엔티티를 생성한다 (기본값 사용)', () => {
      const tier = AffiliateTier.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: mockTier,
        baseRate: mockBaseRate,
      });

      expect(tier.id).toBeNull();
      expect(tier.uid).toBe(mockUid);
      expect(tier.affiliateId).toBe(mockAffiliateId);
      expect(tier.tier).toBe(mockTier);
      expect(tier.baseRate.toString()).toBe(mockBaseRate.toString());
      expect(tier.customRate).toBeNull();
      expect(tier.isCustomRate).toBe(false);
      expect(tier.monthlyWagerAmount.toString()).toBe('0');
      expect(tier.customRateSetBy).toBeNull();
      expect(tier.customRateSetAt).toBeNull();
      expect(tier.createdAt).toBeInstanceOf(Date);
      expect(tier.updatedAt).toBeInstanceOf(Date);
    });

    it('모든 값을 제공하여 티어를 생성한다', () => {
      const tier = AffiliateTier.create({
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: mockTier,
        baseRate: mockBaseRate,
        customRate: mockCustomRate,
        isCustomRate: true,
        monthlyWagerAmount: mockMonthlyWagerAmount,
        customRateSetBy: mockCustomRateSetBy,
        customRateSetAt: mockCustomRateSetAt,
      });

      expect(tier.id).toBe(mockId);
      expect(tier.uid).toBe(mockUid);
      expect(tier.tier).toBe(mockTier);
      expect(tier.baseRate.toString()).toBe(mockBaseRate.toString());
      expect(tier.customRate?.toString()).toBe(mockCustomRate.toString());
      expect(tier.isCustomRate).toBe(true);
      expect(tier.monthlyWagerAmount.toString()).toBe(
        mockMonthlyWagerAmount.toString(),
      );
      expect(tier.customRateSetBy).toBe(mockCustomRateSetBy);
      expect(tier.customRateSetAt).toEqual(mockCustomRateSetAt);
    });

    it('baseRate가 0 이하이면 예외를 발생시킨다', () => {
      expect(() => {
        AffiliateTier.create({
          uid: mockUid,
          affiliateId: mockAffiliateId,
          tier: mockTier,
          baseRate: new Prisma.Decimal('0'),
        });
      }).toThrow(InvalidCommissionRateException);

      expect(() => {
        AffiliateTier.create({
          uid: mockUid,
          affiliateId: mockAffiliateId,
          tier: mockTier,
          baseRate: new Prisma.Decimal('-0.01'),
        });
      }).toThrow(InvalidCommissionRateException);
    });

    it('baseRate가 1(100%)보다 크면 예외를 발생시킨다', () => {
      expect(() => {
        AffiliateTier.create({
          uid: mockUid,
          affiliateId: mockAffiliateId,
          tier: mockTier,
          baseRate: new Prisma.Decimal('1.01'),
        });
      }).toThrow(InvalidCommissionRateException);
    });

    it('customRate가 0 이하이면 예외를 발생시킨다', () => {
      expect(() => {
        AffiliateTier.create({
          uid: mockUid,
          affiliateId: mockAffiliateId,
          tier: mockTier,
          baseRate: mockBaseRate,
          customRate: new Prisma.Decimal('0'),
          isCustomRate: true,
        });
      }).toThrow(InvalidCommissionRateException);
    });

    it('customRate가 1(100%)보다 크면 예외를 발생시킨다', () => {
      expect(() => {
        AffiliateTier.create({
          uid: mockUid,
          affiliateId: mockAffiliateId,
          tier: mockTier,
          baseRate: mockBaseRate,
          customRate: new Prisma.Decimal('1.01'),
          isCustomRate: true,
        });
      }).toThrow(InvalidCommissionRateException);
    });

    it('isCustomRate가 true인데 customRate가 null이면 예외를 발생시킨다', () => {
      expect(() => {
        AffiliateTier.create({
          uid: mockUid,
          affiliateId: mockAffiliateId,
          tier: mockTier,
          baseRate: mockBaseRate,
          isCustomRate: true,
          customRate: null,
        });
      }).toThrow(InvalidWalletBalanceException);
    });

    it('isCustomRate가 false인데 customRate가 null이 아니면 예외를 발생시킨다', () => {
      expect(() => {
        AffiliateTier.create({
          uid: mockUid,
          affiliateId: mockAffiliateId,
          tier: mockTier,
          baseRate: mockBaseRate,
          isCustomRate: false,
          customRate: mockCustomRate,
        });
      }).toThrow(InvalidWalletBalanceException);
    });

    it('monthlyWagerAmount가 음수이면 예외를 발생시킨다', () => {
      expect(() => {
        AffiliateTier.create({
          uid: mockUid,
          affiliateId: mockAffiliateId,
          tier: mockTier,
          baseRate: mockBaseRate,
          monthlyWagerAmount: new Prisma.Decimal('-100'),
        });
      }).toThrow(InvalidWalletBalanceException);
    });
  });

  describe('fromPersistence', () => {
    it('영속화된 데이터로부터 엔티티를 생성한다', () => {
      const data = {
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: mockTier,
        baseRate: mockBaseRate,
        customRate: mockCustomRate,
        isCustomRate: true,
        monthlyWagerAmount: mockMonthlyWagerAmount,
        customRateSetBy: mockCustomRateSetBy,
        customRateSetAt: mockCustomRateSetAt,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      };

      const tier = AffiliateTier.fromPersistence(data);

      expect(tier.id).toBe(mockId);
      expect(tier.uid).toBe(mockUid);
      expect(tier.affiliateId).toBe(mockAffiliateId);
      expect(tier.tier).toBe(mockTier);
      expect(tier.baseRate.toString()).toBe(mockBaseRate.toString());
      expect(tier.customRate?.toString()).toBe(mockCustomRate.toString());
      expect(tier.isCustomRate).toBe(true);
      expect(tier.monthlyWagerAmount.toString()).toBe(
        mockMonthlyWagerAmount.toString(),
      );
      expect(tier.customRateSetBy).toBe(mockCustomRateSetBy);
      expect(tier.customRateSetAt).toEqual(mockCustomRateSetAt);
      expect(tier.createdAt).toEqual(mockCreatedAt);
      expect(tier.updatedAt).toEqual(mockUpdatedAt);
    });

    it('customRate가 null인 경우도 처리한다', () => {
      const data = {
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: mockTier,
        baseRate: mockBaseRate,
        customRate: null,
        isCustomRate: false,
        monthlyWagerAmount: new Prisma.Decimal('0'),
        customRateSetBy: null,
        customRateSetAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      };

      const tier = AffiliateTier.fromPersistence(data);

      expect(tier.customRate).toBeNull();
      expect(tier.isCustomRate).toBe(false);
    });
  });

  describe('Getters', () => {
    it('tier getter가 올바른 값을 반환한다', () => {
      const tier = AffiliateTier.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: mockTier,
        baseRate: mockBaseRate,
      });

      expect(tier.tier).toBe(mockTier);
    });

    it('baseRate getter가 올바른 값을 반환한다', () => {
      const tier = AffiliateTier.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: mockTier,
        baseRate: mockBaseRate,
      });

      expect(tier.baseRate).toBeInstanceOf(Prisma.Decimal);
      expect(tier.baseRate.toString()).toBe(mockBaseRate.toString());
    });

    it('customRate getter가 올바른 값을 반환한다', () => {
      const tier = AffiliateTier.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: mockTier,
        baseRate: mockBaseRate,
        customRate: mockCustomRate,
        isCustomRate: true,
      });

      expect(tier.customRate).toBeInstanceOf(Prisma.Decimal);
      expect(tier.customRate?.toString()).toBe(mockCustomRate.toString());
    });

    it('monthlyWagerAmount getter가 올바른 값을 반환한다', () => {
      const tier = AffiliateTier.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: mockTier,
        baseRate: mockBaseRate,
        monthlyWagerAmount: mockMonthlyWagerAmount,
      });

      expect(tier.monthlyWagerAmount).toBeInstanceOf(Prisma.Decimal);
      expect(tier.monthlyWagerAmount.toString()).toBe(
        mockMonthlyWagerAmount.toString(),
      );
    });

    it('updatedAt getter가 올바른 값을 반환한다', () => {
      const tier = AffiliateTier.fromPersistence({
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: mockTier,
        baseRate: mockBaseRate,
        customRate: null,
        isCustomRate: false,
        monthlyWagerAmount: new Prisma.Decimal('0'),
        customRateSetBy: null,
        customRateSetAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      expect(tier.updatedAt).toEqual(mockUpdatedAt);
    });
  });

  describe('getEffectiveRate', () => {
    it('수동 요율이 설정되지 않은 경우 baseRate를 반환한다', () => {
      const tier = AffiliateTier.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: mockTier,
        baseRate: mockBaseRate,
        isCustomRate: false,
      });

      expect(tier.getEffectiveRate().toString()).toBe(mockBaseRate.toString());
    });

    it('수동 요율이 설정된 경우 customRate를 반환한다', () => {
      const tier = AffiliateTier.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: mockTier,
        baseRate: mockBaseRate,
        customRate: mockCustomRate,
        isCustomRate: true,
      });

      expect(tier.getEffectiveRate().toString()).toBe(
        mockCustomRate.toString(),
      );
    });

    it('isCustomRate가 true지만 customRate가 null인 경우 baseRate를 반환한다', () => {
      // fromPersistence로는 이런 상태가 가능하지만 create로는 불가능
      const tier = AffiliateTier.fromPersistence({
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: mockTier,
        baseRate: mockBaseRate,
        customRate: null,
        isCustomRate: true, // 비정상 상태지만 테스트
        monthlyWagerAmount: new Prisma.Decimal('0'),
        customRateSetBy: null,
        customRateSetAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      // getEffectiveRate는 null 체크를 하므로 baseRate 반환
      expect(tier.getEffectiveRate().toString()).toBe(mockBaseRate.toString());
    });
  });

  describe('canSetCustomRate', () => {
    it('유효한 요율은 설정 가능하다', () => {
      const tier = AffiliateTier.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: mockTier,
        baseRate: mockBaseRate,
      });

      expect(tier.canSetCustomRate(new Prisma.Decimal('0.01'))).toBe(true);
      expect(tier.canSetCustomRate(new Prisma.Decimal('0.5'))).toBe(true);
      expect(tier.canSetCustomRate(new Prisma.Decimal('1'))).toBe(true);
    });

    it('0 이하의 요율은 설정할 수 없다', () => {
      const tier = AffiliateTier.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: mockTier,
        baseRate: mockBaseRate,
      });

      expect(tier.canSetCustomRate(new Prisma.Decimal('0'))).toBe(false);
      expect(tier.canSetCustomRate(new Prisma.Decimal('-0.01'))).toBe(false);
    });

    it('1(100%)보다 큰 요율은 설정할 수 없다', () => {
      const tier = AffiliateTier.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: mockTier,
        baseRate: mockBaseRate,
      });

      expect(tier.canSetCustomRate(new Prisma.Decimal('1.01'))).toBe(false);
    });
  });

  describe('updateTier', () => {
    it('티어와 기본 요율을 업데이트한다', () => {
      const tier = AffiliateTier.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: AffiliateTierLevel.BRONZE,
        baseRate: new Prisma.Decimal('0.005'),
      });

      const beforeUpdatedAt = tier.updatedAt;

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      tier.updateTier(AffiliateTierLevel.GOLD, new Prisma.Decimal('0.01'));

      expect(tier.tier).toBe(AffiliateTierLevel.GOLD);
      expect(tier.baseRate.toString()).toBe('0.01');
      expect(tier.updatedAt.getTime()).toBeGreaterThan(
        beforeUpdatedAt.getTime(),
      );

      jest.useRealTimers();
    });

    it('유효하지 않은 요율로 업데이트하면 예외를 발생시킨다', () => {
      const tier = AffiliateTier.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: mockTier,
        baseRate: mockBaseRate,
      });

      expect(() => {
        tier.updateTier(mockTier, new Prisma.Decimal('0'));
      }).toThrow(InvalidCommissionRateException);

      expect(() => {
        tier.updateTier(mockTier, new Prisma.Decimal('1.01'));
      }).toThrow(InvalidCommissionRateException);
    });
  });

  describe('setCustomRate', () => {
    it('수동 요율을 설정한다', () => {
      const tier = AffiliateTier.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: mockTier,
        baseRate: mockBaseRate,
      });

      const beforeUpdatedAt = tier.updatedAt;
      const setBy = 'admin-123';

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      tier.setCustomRate(new Prisma.Decimal('0.015'), setBy);

      expect(tier.customRate?.toString()).toBe('0.015');
      expect(tier.isCustomRate).toBe(true);
      expect(tier.customRateSetBy).toBe(setBy);
      expect(tier.customRateSetAt).toBeInstanceOf(Date);
      expect(tier.updatedAt.getTime()).toBeGreaterThan(
        beforeUpdatedAt.getTime(),
      );

      jest.useRealTimers();
    });

    it('유효하지 않은 요율로 설정하면 예외를 발생시킨다', () => {
      const tier = AffiliateTier.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: mockTier,
        baseRate: mockBaseRate,
      });

      expect(() => {
        tier.setCustomRate(new Prisma.Decimal('0'), 'admin-123');
      }).toThrow(InvalidCommissionRateException);

      expect(() => {
        tier.setCustomRate(new Prisma.Decimal('1.01'), 'admin-123');
      }).toThrow(InvalidCommissionRateException);
    });
  });

  describe('resetCustomRate', () => {
    it('수동 요율을 해제한다', () => {
      const tier = AffiliateTier.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: mockTier,
        baseRate: mockBaseRate,
        customRate: mockCustomRate,
        isCustomRate: true,
        customRateSetBy: mockCustomRateSetBy,
        customRateSetAt: mockCustomRateSetAt,
      });

      const beforeUpdatedAt = tier.updatedAt;

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      tier.resetCustomRate();

      expect(tier.customRate).toBeNull();
      expect(tier.isCustomRate).toBe(false);
      expect(tier.customRateSetBy).toBeNull();
      expect(tier.customRateSetAt).toBeNull();
      expect(tier.updatedAt.getTime()).toBeGreaterThan(
        beforeUpdatedAt.getTime(),
      );

      jest.useRealTimers();
    });
  });

  describe('updateMonthlyWagerAmount', () => {
    it('월간 베팅 금액을 추가한다', () => {
      const tier = AffiliateTier.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: mockTier,
        baseRate: mockBaseRate,
        monthlyWagerAmount: new Prisma.Decimal('1000'),
      });

      const beforeAmount = tier.monthlyWagerAmount;
      const beforeUpdatedAt = tier.updatedAt;

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      tier.updateMonthlyWagerAmount(new Prisma.Decimal('500'));

      expect(tier.monthlyWagerAmount.toString()).toBe(
        beforeAmount.add(new Prisma.Decimal('500')).toString(),
      );
      expect(tier.updatedAt.getTime()).toBeGreaterThan(
        beforeUpdatedAt.getTime(),
      );

      jest.useRealTimers();
    });

    it('음수 금액을 추가하면 예외를 발생시킨다', () => {
      const tier = AffiliateTier.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: mockTier,
        baseRate: mockBaseRate,
      });

      expect(() => {
        tier.updateMonthlyWagerAmount(new Prisma.Decimal('-100'));
      }).toThrow(InvalidWalletBalanceException);
    });
  });

  describe('resetMonthlyWagerAmount', () => {
    it('월간 베팅 금액을 초기화한다', () => {
      const tier = AffiliateTier.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: mockTier,
        baseRate: mockBaseRate,
        monthlyWagerAmount: new Prisma.Decimal('5000'),
      });

      const beforeUpdatedAt = tier.updatedAt;

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      tier.resetMonthlyWagerAmount();

      expect(tier.monthlyWagerAmount.toString()).toBe('0');
      expect(tier.updatedAt.getTime()).toBeGreaterThan(
        beforeUpdatedAt.getTime(),
      );

      jest.useRealTimers();
    });
  });

  describe('toPersistence', () => {
    it('DB 저장을 위한 데이터를 올바르게 변환한다', () => {
      const tier = AffiliateTier.create({
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: mockTier,
        baseRate: mockBaseRate,
        customRate: mockCustomRate,
        isCustomRate: true,
        monthlyWagerAmount: mockMonthlyWagerAmount,
        customRateSetBy: mockCustomRateSetBy,
        customRateSetAt: mockCustomRateSetAt,
      });

      const persistence = tier.toPersistence();

      expect(persistence.id).toBe(mockId);
      expect(persistence.uid).toBe(mockUid);
      expect(persistence.affiliateId).toBe(mockAffiliateId);
      expect(persistence.tier).toBe(mockTier);
      expect(persistence.baseRate.toString()).toBe(mockBaseRate.toString());
      expect(persistence.customRate?.toString()).toBe(
        mockCustomRate.toString(),
      );
      expect(persistence.isCustomRate).toBe(true);
      expect(persistence.monthlyWagerAmount.toString()).toBe(
        mockMonthlyWagerAmount.toString(),
      );
      expect(persistence.customRateSetBy).toBe(mockCustomRateSetBy);
      expect(persistence.customRateSetAt).toEqual(mockCustomRateSetAt);
      expect(persistence.createdAt).toBeInstanceOf(Date);
      expect(persistence.updatedAt).toBeInstanceOf(Date);
    });

    it('Prisma.Decimal 타입이 유지된다', () => {
      const tier = AffiliateTier.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: mockTier,
        baseRate: mockBaseRate,
      });

      const persistence = tier.toPersistence();

      expect(persistence.baseRate).toBeInstanceOf(Prisma.Decimal);
      expect(persistence.monthlyWagerAmount).toBeInstanceOf(Prisma.Decimal);
    });
  });
});
