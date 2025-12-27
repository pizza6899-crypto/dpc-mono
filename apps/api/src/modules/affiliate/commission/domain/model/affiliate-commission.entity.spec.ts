// src/modules/affiliate/commission/domain/model/affiliate-commission.entity.spec.ts
import {
  CommissionStatus,
  ExchangeCurrencyCode,
  GameCategory,
  Prisma,
} from '@prisma/client';
import { AffiliateCommission } from './affiliate-commission.entity';
import {
  CommissionNotAvailableException,
  InvalidCommissionCalculationException,
  InvalidSettlementDateException,
} from '../commission.exception';

describe('AffiliateCommission Entity', () => {
  const mockUid = 'cmt-1234567890';
  const mockId = BigInt(1);
  const mockAffiliateId = 'affiliate-123';
  const mockSubUserId = 'sub-user-456';
  const mockGameRoundId = BigInt(789);
  const mockWagerAmount = new Prisma.Decimal('10000');
  const mockWinAmount = new Prisma.Decimal('5000');
  const mockCommission = new Prisma.Decimal('100');
  const mockRateApplied = new Prisma.Decimal('0.01'); // 1%
  const mockCurrency = ExchangeCurrencyCode.USD;
  const mockGameCategory = GameCategory.SLOTS;
  const mockCreatedAt = new Date('2024-01-01T00:00:00Z');
  const mockUpdatedAt = new Date('2024-01-02T00:00:00Z');

  describe('create', () => {
    it('새 커미션 엔티티를 생성한다', () => {
      const commission = AffiliateCommission.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: mockWinAmount,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        gameCategory: mockGameCategory,
      });

      expect(commission.id).toBeNull();
      expect(commission.uid).toBe(mockUid);
      expect(commission.affiliateId).toBe(mockAffiliateId);
      expect(commission.subUserId).toBe(mockSubUserId);
      expect(commission.gameRoundId).toBe(mockGameRoundId);
      expect(commission.wagerAmount.toString()).toBe(
        mockWagerAmount.toString(),
      );
      expect(commission.winAmount?.toString()).toBe(mockWinAmount.toString());
      expect(commission.commission.toString()).toBe(mockCommission.toString());
      expect(commission.rateApplied.toString()).toBe(
        mockRateApplied.toString(),
      );
      expect(commission.currency).toBe(mockCurrency);
      expect(commission.gameCategory).toBe(mockGameCategory);
      expect(commission.status).toBe(CommissionStatus.PENDING);
      expect(commission.settlementDate).toBeNull();
      expect(commission.claimedAt).toBeNull();
      expect(commission.withdrawnAt).toBeNull();
      expect(commission.createdAt).toBeInstanceOf(Date);
      expect(commission.updatedAt).toBeInstanceOf(Date);
    });

    it('id를 제공하면 영속화된 엔티티로 생성한다', () => {
      const commission = AffiliateCommission.create({
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        gameCategory: null,
      });

      expect(commission.id).toBe(mockId);
      expect(commission.uid).toBe(mockUid);
      expect(commission.winAmount).toBeNull();
      expect(commission.gameCategory).toBeNull();
    });

    it('gameRoundId가 null인 경우도 처리한다', () => {
      const commission = AffiliateCommission.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: null,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        gameCategory: null,
      });

      expect(commission.gameRoundId).toBeNull();
    });

    it('커미션 계산이 올바르지 않으면 예외를 발생시킨다', () => {
      const wrongCommission = new Prisma.Decimal('200'); // 올바른 값은 100

      expect(() => {
        AffiliateCommission.create({
          uid: mockUid,
          affiliateId: mockAffiliateId,
          subUserId: mockSubUserId,
          gameRoundId: mockGameRoundId,
          wagerAmount: mockWagerAmount, // 10000
          winAmount: null,
          commission: wrongCommission, // 200 (잘못된 값)
          rateApplied: mockRateApplied, // 0.01 (1%)
          currency: mockCurrency,
          gameCategory: null,
        });
      }).toThrow(InvalidCommissionCalculationException);
    });

    it('커미션 계산이 정확하면 엔티티를 생성한다', () => {
      // wagerAmount: 10000, rateApplied: 0.01 (1%) → commission: 100
      const correctCommission = new Prisma.Decimal('100');

      const commission = AffiliateCommission.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: correctCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        gameCategory: null,
      });

      expect(commission.commission.toString()).toBe('100');
    });
  });

  describe('fromPersistence', () => {
    it('영속화된 데이터로부터 엔티티를 생성한다', () => {
      const data = {
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: mockWinAmount,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: CommissionStatus.PENDING,
        gameCategory: mockGameCategory,
        settlementDate: null,
        claimedAt: null,
        withdrawnAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      };

      const commission = AffiliateCommission.fromPersistence(data);

      expect(commission.id).toBe(mockId);
      expect(commission.uid).toBe(mockUid);
      expect(commission.affiliateId).toBe(mockAffiliateId);
      expect(commission.subUserId).toBe(mockSubUserId);
      expect(commission.gameRoundId).toBe(mockGameRoundId);
      expect(commission.wagerAmount.toString()).toBe(
        mockWagerAmount.toString(),
      );
      expect(commission.winAmount?.toString()).toBe(mockWinAmount.toString());
      expect(commission.commission.toString()).toBe(mockCommission.toString());
      expect(commission.rateApplied.toString()).toBe(
        mockRateApplied.toString(),
      );
      expect(commission.currency).toBe(mockCurrency);
      expect(commission.status).toBe(CommissionStatus.PENDING);
      expect(commission.gameCategory).toBe(mockGameCategory);
      expect(commission.createdAt).toEqual(mockCreatedAt);
      expect(commission.updatedAt).toEqual(mockUpdatedAt);
    });

    it('Prisma.Decimal 타입의 값을 올바르게 처리한다', () => {
      const data = {
        id: BigInt(1),
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: BigInt(789),
        wagerAmount: new Prisma.Decimal('10000'),
        winAmount: new Prisma.Decimal('5000'),
        commission: new Prisma.Decimal('100'),
        rateApplied: new Prisma.Decimal('0.01'),
        currency: mockCurrency,
        status: CommissionStatus.PENDING,
        gameCategory: mockGameCategory,
        settlementDate: null,
        claimedAt: null,
        withdrawnAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      };

      const commission = AffiliateCommission.fromPersistence(data);

      expect(commission.id).toBe(BigInt(1));
      expect(commission.gameRoundId).toBe(BigInt(789));
      expect(commission.wagerAmount.toString()).toBe('10000');
      expect(commission.winAmount?.toString()).toBe('5000');
      expect(commission.commission.toString()).toBe('100');
      expect(commission.rateApplied.toString()).toBe('0.01');
    });

    it('null 값들을 올바르게 처리한다', () => {
      const data = {
        id: null,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: null,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: CommissionStatus.PENDING,
        gameCategory: null,
        settlementDate: null,
        claimedAt: null,
        withdrawnAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      };

      const commission = AffiliateCommission.fromPersistence(data);

      expect(commission.id).toBeNull();
      expect(commission.gameRoundId).toBeNull();
      expect(commission.winAmount).toBeNull();
      expect(commission.gameCategory).toBeNull();
    });

    it('다양한 상태의 엔티티를 생성할 수 있다', () => {
      const settlementDate = new Date('2024-02-01T00:00:00Z');
      const claimedAt = new Date('2024-02-15T00:00:00Z');
      const withdrawnAt = new Date('2024-02-20T00:00:00Z');

      const data = {
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: mockWinAmount,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: CommissionStatus.WITHDRAWN,
        gameCategory: mockGameCategory,
        settlementDate,
        claimedAt,
        withdrawnAt,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      };

      const commission = AffiliateCommission.fromPersistence(data);

      expect(commission.status).toBe(CommissionStatus.WITHDRAWN);
      expect(commission.settlementDate).toEqual(settlementDate);
      expect(commission.claimedAt).toEqual(claimedAt);
      expect(commission.withdrawnAt).toEqual(withdrawnAt);
    });
  });

  describe('Getters', () => {
    let commission: AffiliateCommission;

    beforeEach(() => {
      commission = AffiliateCommission.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: mockWinAmount,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        gameCategory: mockGameCategory,
      });
    });

    it('모든 getter가 올바른 값을 반환한다', () => {
      expect(commission.wagerAmount.toString()).toBe(
        mockWagerAmount.toString(),
      );
      expect(commission.winAmount?.toString()).toBe(mockWinAmount.toString());
      expect(commission.commission.toString()).toBe(mockCommission.toString());
      expect(commission.rateApplied.toString()).toBe(
        mockRateApplied.toString(),
      );
      expect(commission.status).toBe(CommissionStatus.PENDING);
      expect(commission.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('canSettle', () => {
    it('PENDING 상태일 때 true를 반환한다', () => {
      const commission = AffiliateCommission.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        gameCategory: null,
      });

      expect(commission.canSettle()).toBe(true);
    });

    it('PENDING이 아닌 상태일 때 false를 반환한다', () => {
      const commission = AffiliateCommission.fromPersistence({
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: CommissionStatus.AVAILABLE,
        gameCategory: null,
        settlementDate: null,
        claimedAt: null,
        withdrawnAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      expect(commission.canSettle()).toBe(false);
    });
  });

  describe('canClaim', () => {
    it('AVAILABLE 상태일 때 true를 반환한다', () => {
      const commission = AffiliateCommission.fromPersistence({
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: CommissionStatus.AVAILABLE,
        gameCategory: null,
        settlementDate: new Date(),
        claimedAt: null,
        withdrawnAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      expect(commission.canClaim()).toBe(true);
    });

    it('AVAILABLE이 아닌 상태일 때 false를 반환한다', () => {
      const commission = AffiliateCommission.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        gameCategory: null,
      });

      expect(commission.canClaim()).toBe(false);
    });
  });

  describe('canCancel', () => {
    it('PENDING 상태일 때 true를 반환한다', () => {
      const commission = AffiliateCommission.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        gameCategory: null,
      });

      expect(commission.canCancel()).toBe(true);
    });

    it('AVAILABLE 상태일 때 true를 반환한다', () => {
      const commission = AffiliateCommission.fromPersistence({
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: CommissionStatus.AVAILABLE,
        gameCategory: null,
        settlementDate: new Date(),
        claimedAt: null,
        withdrawnAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      expect(commission.canCancel()).toBe(true);
    });

    it('CLAIMED 상태일 때 false를 반환한다', () => {
      const commission = AffiliateCommission.fromPersistence({
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: CommissionStatus.CLAIMED,
        gameCategory: null,
        settlementDate: new Date(),
        claimedAt: new Date(),
        withdrawnAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      expect(commission.canCancel()).toBe(false);
    });
  });

  describe('settle', () => {
    it('PENDING 상태의 커미션을 정산한다', () => {
      const commission = AffiliateCommission.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        gameCategory: null,
      });

      // createdAt 이후의 날짜로 설정
      const settlementDate = new Date(
        commission.createdAt.getTime() + 86400000,
      ); // 1일 후
      const beforeUpdatedAt = commission.updatedAt;

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      commission.settle(settlementDate);

      expect(commission.status).toBe(CommissionStatus.AVAILABLE);
      expect(commission.settlementDate).toEqual(settlementDate);
      expect(commission.updatedAt.getTime()).toBeGreaterThan(
        beforeUpdatedAt.getTime(),
      );

      jest.useRealTimers();
    });

    it('AVAILABLE 상태에서 정산 시 예외를 발생시킨다', () => {
      const commission = AffiliateCommission.fromPersistence({
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: CommissionStatus.AVAILABLE,
        gameCategory: null,
        settlementDate: new Date(),
        claimedAt: null,
        withdrawnAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      expect(() => {
        commission.settle(new Date());
      }).toThrow(CommissionNotAvailableException);
    });

    it('CLAIMED 상태에서 정산 시 예외를 발생시킨다', () => {
      const commission = AffiliateCommission.fromPersistence({
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: CommissionStatus.CLAIMED,
        gameCategory: null,
        settlementDate: new Date(),
        claimedAt: new Date(),
        withdrawnAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      expect(() => {
        commission.settle(new Date());
      }).toThrow(CommissionNotAvailableException);
    });

    it('WITHDRAWN 상태에서 정산 시 예외를 발생시킨다', () => {
      const commission = AffiliateCommission.fromPersistence({
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: CommissionStatus.WITHDRAWN,
        gameCategory: null,
        settlementDate: new Date(),
        claimedAt: new Date(),
        withdrawnAt: new Date(),
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      expect(() => {
        commission.settle(new Date());
      }).toThrow(CommissionNotAvailableException);
    });

    it('CANCELLED 상태에서 정산 시 예외를 발생시킨다', () => {
      const commission = AffiliateCommission.fromPersistence({
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: CommissionStatus.CANCELLED,
        gameCategory: null,
        settlementDate: null,
        claimedAt: null,
        withdrawnAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      expect(() => {
        commission.settle(new Date());
      }).toThrow(CommissionNotAvailableException);
    });

    it('정산일이 생성일보다 이전이면 예외를 발생시킨다', () => {
      const commission = AffiliateCommission.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        gameCategory: null,
      });

      // 생성일보다 이전 날짜
      const pastDate = new Date(commission.createdAt.getTime() - 86400000); // 1일 전

      expect(() => {
        commission.settle(pastDate);
      }).toThrow(InvalidSettlementDateException);
    });

    it('정산일이 생성일과 같으면 정산할 수 있다', () => {
      const commission = AffiliateCommission.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        gameCategory: null,
      });

      // 생성일과 같은 날짜
      const sameDate = new Date(commission.createdAt);

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      commission.settle(sameDate);

      expect(commission.status).toBe(CommissionStatus.AVAILABLE);
      expect(commission.settlementDate).toEqual(sameDate);

      jest.useRealTimers();
    });
  });

  describe('claim', () => {
    it('AVAILABLE 상태의 커미션을 출금 요청한다', () => {
      const commission = AffiliateCommission.fromPersistence({
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: CommissionStatus.AVAILABLE,
        gameCategory: null,
        settlementDate: new Date(),
        claimedAt: null,
        withdrawnAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      const beforeUpdatedAt = commission.updatedAt;
      const beforeClaimedAt = commission.claimedAt;

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      commission.claim();

      expect(commission.status).toBe(CommissionStatus.CLAIMED);
      expect(commission.claimedAt).not.toBeNull();
      expect(commission.claimedAt).not.toEqual(beforeClaimedAt);
      expect(commission.updatedAt.getTime()).toBeGreaterThan(
        beforeUpdatedAt.getTime(),
      );

      jest.useRealTimers();
    });

    it('PENDING 상태에서 출금 요청 시 예외를 발생시킨다', () => {
      const commission = AffiliateCommission.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        gameCategory: null,
      });

      expect(() => {
        commission.claim();
      }).toThrow(CommissionNotAvailableException);
    });

    it('CLAIMED 상태에서 출금 요청 시 예외를 발생시킨다', () => {
      const commission = AffiliateCommission.fromPersistence({
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: CommissionStatus.CLAIMED,
        gameCategory: null,
        settlementDate: new Date(),
        claimedAt: new Date(),
        withdrawnAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      expect(() => {
        commission.claim();
      }).toThrow(CommissionNotAvailableException);
    });

    it('WITHDRAWN 상태에서 출금 요청 시 예외를 발생시킨다', () => {
      const commission = AffiliateCommission.fromPersistence({
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: CommissionStatus.WITHDRAWN,
        gameCategory: null,
        settlementDate: new Date(),
        claimedAt: new Date(),
        withdrawnAt: new Date(),
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      expect(() => {
        commission.claim();
      }).toThrow(CommissionNotAvailableException);
    });

    it('CANCELLED 상태에서 출금 요청 시 예외를 발생시킨다', () => {
      const commission = AffiliateCommission.fromPersistence({
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: CommissionStatus.CANCELLED,
        gameCategory: null,
        settlementDate: null,
        claimedAt: null,
        withdrawnAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      expect(() => {
        commission.claim();
      }).toThrow(CommissionNotAvailableException);
    });
  });

  describe('withdraw', () => {
    it('CLAIMED 상태의 커미션을 출금 완료 처리한다', () => {
      const commission = AffiliateCommission.fromPersistence({
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: CommissionStatus.CLAIMED,
        gameCategory: null,
        settlementDate: new Date(),
        claimedAt: new Date(),
        withdrawnAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      const beforeUpdatedAt = commission.updatedAt;
      const beforeWithdrawnAt = commission.withdrawnAt;

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      commission.withdraw();

      expect(commission.status).toBe(CommissionStatus.WITHDRAWN);
      expect(commission.withdrawnAt).not.toBeNull();
      expect(commission.withdrawnAt).not.toEqual(beforeWithdrawnAt);
      expect(commission.updatedAt.getTime()).toBeGreaterThan(
        beforeUpdatedAt.getTime(),
      );

      jest.useRealTimers();
    });

    it('PENDING 상태에서 출금 완료 처리 시 예외를 발생시킨다', () => {
      const commission = AffiliateCommission.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        gameCategory: null,
      });

      expect(() => {
        commission.withdraw();
      }).toThrow(CommissionNotAvailableException);
    });

    it('AVAILABLE 상태에서 출금 완료 처리 시 예외를 발생시킨다', () => {
      const commission = AffiliateCommission.fromPersistence({
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: CommissionStatus.AVAILABLE,
        gameCategory: null,
        settlementDate: new Date(),
        claimedAt: null,
        withdrawnAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      expect(() => {
        commission.withdraw();
      }).toThrow(CommissionNotAvailableException);
    });

    it('WITHDRAWN 상태에서 출금 완료 처리 시 예외를 발생시킨다', () => {
      const commission = AffiliateCommission.fromPersistence({
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: CommissionStatus.WITHDRAWN,
        gameCategory: null,
        settlementDate: new Date(),
        claimedAt: new Date(),
        withdrawnAt: new Date(),
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      expect(() => {
        commission.withdraw();
      }).toThrow(CommissionNotAvailableException);
    });

    it('CANCELLED 상태에서 출금 완료 처리 시 예외를 발생시킨다', () => {
      const commission = AffiliateCommission.fromPersistence({
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: CommissionStatus.CANCELLED,
        gameCategory: null,
        settlementDate: null,
        claimedAt: null,
        withdrawnAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      expect(() => {
        commission.withdraw();
      }).toThrow(CommissionNotAvailableException);
    });
  });

  describe('cancel', () => {
    it('PENDING 상태의 커미션을 취소한다', () => {
      const commission = AffiliateCommission.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        gameCategory: null,
      });

      const beforeUpdatedAt = commission.updatedAt;

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      commission.cancel();

      expect(commission.status).toBe(CommissionStatus.CANCELLED);
      expect(commission.updatedAt.getTime()).toBeGreaterThan(
        beforeUpdatedAt.getTime(),
      );

      jest.useRealTimers();
    });

    it('AVAILABLE 상태의 커미션을 취소한다', () => {
      const commission = AffiliateCommission.fromPersistence({
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: CommissionStatus.AVAILABLE,
        gameCategory: null,
        settlementDate: new Date(),
        claimedAt: null,
        withdrawnAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      commission.cancel();

      expect(commission.status).toBe(CommissionStatus.CANCELLED);
    });

    it('CLAIMED 상태에서 취소 시 예외를 발생시킨다', () => {
      const commission = AffiliateCommission.fromPersistence({
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: CommissionStatus.CLAIMED,
        gameCategory: null,
        settlementDate: new Date(),
        claimedAt: new Date(),
        withdrawnAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      expect(() => {
        commission.cancel();
      }).toThrow(CommissionNotAvailableException);
    });

    it('WITHDRAWN 상태에서 취소 시 예외를 발생시킨다', () => {
      const commission = AffiliateCommission.fromPersistence({
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: CommissionStatus.WITHDRAWN,
        gameCategory: null,
        settlementDate: new Date(),
        claimedAt: new Date(),
        withdrawnAt: new Date(),
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      expect(() => {
        commission.cancel();
      }).toThrow(CommissionNotAvailableException);
    });
  });

  describe('toPersistence', () => {
    it('엔티티를 영속화 데이터로 변환한다', () => {
      const commission = AffiliateCommission.fromPersistence({
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: mockWinAmount,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: CommissionStatus.AVAILABLE,
        gameCategory: mockGameCategory,
        settlementDate: new Date('2024-02-01T00:00:00Z'),
        claimedAt: null,
        withdrawnAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      const persistence = commission.toPersistence();

      expect(persistence.id).toBe(mockId);
      expect(persistence.uid).toBe(mockUid);
      expect(persistence.affiliateId).toBe(mockAffiliateId);
      expect(persistence.subUserId).toBe(mockSubUserId);
      expect(persistence.gameRoundId).toBe(mockGameRoundId);
      expect(persistence.wagerAmount.toString()).toBe(
        mockWagerAmount.toString(),
      );
      expect(persistence.winAmount?.toString()).toBe(mockWinAmount.toString());
      expect(persistence.commission.toString()).toBe(mockCommission.toString());
      expect(persistence.rateApplied.toString()).toBe(
        mockRateApplied.toString(),
      );
      expect(persistence.currency).toBe(mockCurrency);
      expect(persistence.status).toBe(CommissionStatus.AVAILABLE);
      expect(persistence.gameCategory).toBe(mockGameCategory);
      expect(persistence.createdAt).toEqual(mockCreatedAt);
      expect(persistence.updatedAt).toEqual(mockUpdatedAt);
    });

    it('Prisma.Decimal 타입이 유지된다', () => {
      const commission = AffiliateCommission.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: mockWinAmount,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        gameCategory: mockGameCategory,
      });

      const persistence = commission.toPersistence();

      expect(persistence.wagerAmount).toBeInstanceOf(Prisma.Decimal);
      expect(persistence.winAmount).toBeInstanceOf(Prisma.Decimal);
      expect(persistence.commission).toBeInstanceOf(Prisma.Decimal);
      expect(persistence.rateApplied).toBeInstanceOf(Prisma.Decimal);
    });

    it('null 값들을 올바르게 변환한다', () => {
      const commission = AffiliateCommission.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: null,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        gameCategory: null,
      });

      const persistence = commission.toPersistence();

      expect(persistence.id).toBeNull();
      expect(persistence.gameRoundId).toBeNull();
      expect(persistence.winAmount).toBeNull();
      expect(persistence.gameCategory).toBeNull();
      expect(persistence.settlementDate).toBeNull();
      expect(persistence.claimedAt).toBeNull();
      expect(persistence.withdrawnAt).toBeNull();
    });
  });

  describe('상태 전이 시나리오', () => {
    it('전체 상태 전이 흐름을 테스트한다', () => {
      // 1. PENDING 상태로 생성
      const commission = AffiliateCommission.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        gameCategory: null,
      });

      expect(commission.status).toBe(CommissionStatus.PENDING);
      expect(commission.canSettle()).toBe(true);

      // 2. PENDING → AVAILABLE (정산)
      // createdAt 이후의 날짜로 설정
      const settlementDate = new Date(
        commission.createdAt.getTime() + 86400000,
      ); // 1일 후
      commission.settle(settlementDate);

      expect(commission.status).toBe(CommissionStatus.AVAILABLE);
      expect(commission.settlementDate).toEqual(settlementDate);
      expect(commission.canClaim()).toBe(true);

      // 3. AVAILABLE → CLAIMED (출금 요청)
      commission.claim();

      expect(commission.status).toBe(CommissionStatus.CLAIMED);
      expect(commission.claimedAt).not.toBeNull();

      // 4. CLAIMED → WITHDRAWN (출금 완료)
      commission.withdraw();

      expect(commission.status).toBe(CommissionStatus.WITHDRAWN);
      expect(commission.withdrawnAt).not.toBeNull();
    });

    it('PENDING 상태에서 취소할 수 있다', () => {
      const commission = AffiliateCommission.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        gameCategory: null,
      });

      commission.cancel();

      expect(commission.status).toBe(CommissionStatus.CANCELLED);
    });

    it('AVAILABLE 상태에서 취소할 수 있다', () => {
      const commission = AffiliateCommission.fromPersistence({
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        commission: mockCommission,
        rateApplied: mockRateApplied,
        currency: mockCurrency,
        status: CommissionStatus.AVAILABLE,
        gameCategory: null,
        settlementDate: new Date(),
        claimedAt: null,
        withdrawnAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      commission.cancel();

      expect(commission.status).toBe(CommissionStatus.CANCELLED);
    });
  });
});
