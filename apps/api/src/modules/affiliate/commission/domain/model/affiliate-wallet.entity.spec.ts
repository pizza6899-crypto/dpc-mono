// src/modules/affiliate/commission/domain/model/affiliate-wallet.entity.spec.ts
import { ExchangeCurrencyCode, Prisma } from '@repo/database';
import { AffiliateWallet } from './affiliate-wallet.entity';
import {
  InsufficientBalanceException,
  InvalidWalletBalanceException,
} from '../commission.exception';

describe('AffiliateWallet Entity', () => {
  const mockAffiliateId = 'affiliate-123';
  const mockCurrency = ExchangeCurrencyCode.USD;
  const mockAvailableBalance = new Prisma.Decimal('1000.50');
  const mockPendingBalance = new Prisma.Decimal('500.25');
  const mockTotalEarned = new Prisma.Decimal('2000.75');
  const mockUpdatedAt = new Date('2024-01-01T00:00:00Z');

  describe('create', () => {
    it('새로운 월렛 엔티티를 생성한다 (기본값 사용)', () => {
      const wallet = AffiliateWallet.create({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
      });

      expect(wallet.affiliateId).toBe(mockAffiliateId);
      expect(wallet.currency).toBe(mockCurrency);
      expect(wallet.availableBalance.toString()).toBe('0');
      expect(wallet.pendingBalance.toString()).toBe('0');
      expect(wallet.totalEarned.toString()).toBe('0');
      expect(wallet.updatedAt).toBeInstanceOf(Date);
    });

    it('모든 잔액 값을 제공하여 월렛을 생성한다', () => {
      const wallet = AffiliateWallet.create({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        availableBalance: mockAvailableBalance,
        pendingBalance: mockPendingBalance,
        totalEarned: mockTotalEarned,
      });

      expect(wallet.affiliateId).toBe(mockAffiliateId);
      expect(wallet.currency).toBe(mockCurrency);
      expect(wallet.availableBalance.toString()).toBe(
        mockAvailableBalance.toString(),
      );
      expect(wallet.pendingBalance.toString()).toBe(
        mockPendingBalance.toString(),
      );
      expect(wallet.totalEarned.toString()).toBe(mockTotalEarned.toString());
      expect(wallet.updatedAt).toBeInstanceOf(Date);
    });

    it('일부 잔액 값만 제공하여 월렛을 생성한다', () => {
      const wallet = AffiliateWallet.create({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        availableBalance: mockAvailableBalance,
      });

      expect(wallet.availableBalance.toString()).toBe(
        mockAvailableBalance.toString(),
      );
      expect(wallet.pendingBalance.toString()).toBe('0');
      expect(wallet.totalEarned.toString()).toBe('0');
    });

    it('음수 잔액으로 월렛을 생성할 수 없다', () => {
      expect(() => {
        AffiliateWallet.create({
          affiliateId: mockAffiliateId,
          currency: mockCurrency,
          availableBalance: new Prisma.Decimal('-100'),
        });
      }).toThrow(InvalidWalletBalanceException);

      expect(() => {
        AffiliateWallet.create({
          affiliateId: mockAffiliateId,
          currency: mockCurrency,
          pendingBalance: new Prisma.Decimal('-50'),
        });
      }).toThrow(InvalidWalletBalanceException);

      expect(() => {
        AffiliateWallet.create({
          affiliateId: mockAffiliateId,
          currency: mockCurrency,
          totalEarned: new Prisma.Decimal('-200'),
        });
      }).toThrow(InvalidWalletBalanceException);
    });

    it('totalEarned가 availableBalance + pendingBalance보다 작으면 예외를 발생시킨다', () => {
      expect(() => {
        AffiliateWallet.create({
          affiliateId: mockAffiliateId,
          currency: mockCurrency,
          availableBalance: new Prisma.Decimal('1000'),
          pendingBalance: new Prisma.Decimal('500'),
          totalEarned: new Prisma.Decimal('1000'), // 1000 + 500 = 1500보다 작음
        });
      }).toThrow(InvalidWalletBalanceException);
    });

    it('totalEarned가 availableBalance + pendingBalance와 같으면 생성할 수 있다', () => {
      const wallet = AffiliateWallet.create({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        availableBalance: new Prisma.Decimal('1000'),
        pendingBalance: new Prisma.Decimal('500'),
        totalEarned: new Prisma.Decimal('1500'), // 1000 + 500 = 1500
      });

      expect(wallet.totalEarned.toString()).toBe('1500');
    });

    it('totalEarned가 availableBalance + pendingBalance보다 크면 생성할 수 있다 (과거 출금 내역 포함)', () => {
      const wallet = AffiliateWallet.create({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        availableBalance: new Prisma.Decimal('1000'),
        pendingBalance: new Prisma.Decimal('500'),
        totalEarned: new Prisma.Decimal('3000'), // 1000 + 500 = 1500보다 큼 (과거에 1500 출금)
      });

      expect(wallet.totalEarned.toString()).toBe('3000');
    });
  });

  describe('fromPersistence', () => {
    it('영속화된 데이터로부터 엔티티를 생성한다', () => {
      const data = {
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        availableBalance: mockAvailableBalance,
        pendingBalance: mockPendingBalance,
        totalEarned: mockTotalEarned,
        updatedAt: mockUpdatedAt,
      };

      const wallet = AffiliateWallet.fromPersistence(data);

      expect(wallet.affiliateId).toBe(mockAffiliateId);
      expect(wallet.currency).toBe(mockCurrency);
      expect(wallet.availableBalance.toString()).toBe(
        mockAvailableBalance.toString(),
      );
      expect(wallet.pendingBalance.toString()).toBe(
        mockPendingBalance.toString(),
      );
      expect(wallet.totalEarned.toString()).toBe(mockTotalEarned.toString());
      expect(wallet.updatedAt).toEqual(mockUpdatedAt);
    });
  });

  describe('Getters', () => {
    it('availableBalance getter가 올바른 값을 반환한다', () => {
      const wallet = AffiliateWallet.create({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        availableBalance: mockAvailableBalance,
      });

      expect(wallet.availableBalance).toBeInstanceOf(Prisma.Decimal);
      expect(wallet.availableBalance.toString()).toBe(
        mockAvailableBalance.toString(),
      );
    });

    it('pendingBalance getter가 올바른 값을 반환한다', () => {
      const wallet = AffiliateWallet.create({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        pendingBalance: mockPendingBalance,
      });

      expect(wallet.pendingBalance).toBeInstanceOf(Prisma.Decimal);
      expect(wallet.pendingBalance.toString()).toBe(
        mockPendingBalance.toString(),
      );
    });

    it('totalEarned getter가 올바른 값을 반환한다', () => {
      const wallet = AffiliateWallet.create({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        totalEarned: mockTotalEarned,
      });

      expect(wallet.totalEarned).toBeInstanceOf(Prisma.Decimal);
      expect(wallet.totalEarned.toString()).toBe(mockTotalEarned.toString());
    });

    it('updatedAt getter가 올바른 값을 반환한다', () => {
      const wallet = AffiliateWallet.fromPersistence({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        availableBalance: new Prisma.Decimal(0),
        pendingBalance: new Prisma.Decimal(0),
        totalEarned: new Prisma.Decimal(0),
        updatedAt: mockUpdatedAt,
      });

      expect(wallet.updatedAt).toEqual(mockUpdatedAt);
    });
  });

  describe('canWithdraw', () => {
    it('출금 가능한 경우 true를 반환한다', () => {
      const wallet = AffiliateWallet.create({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        availableBalance: new Prisma.Decimal('1000'),
      });

      expect(wallet.canWithdraw(new Prisma.Decimal('500'))).toBe(true);
      expect(wallet.canWithdraw(new Prisma.Decimal('1000'))).toBe(true);
    });

    it('잔액이 부족한 경우 false를 반환한다', () => {
      const wallet = AffiliateWallet.create({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        availableBalance: new Prisma.Decimal('1000'),
      });

      expect(wallet.canWithdraw(new Prisma.Decimal('1001'))).toBe(false);
      expect(wallet.canWithdraw(new Prisma.Decimal('2000'))).toBe(false);
    });

    it('출금 금액이 0 이하인 경우 false를 반환한다', () => {
      const wallet = AffiliateWallet.create({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        availableBalance: new Prisma.Decimal('1000'),
      });

      expect(wallet.canWithdraw(new Prisma.Decimal('0'))).toBe(false);
      expect(wallet.canWithdraw(new Prisma.Decimal('-1'))).toBe(false);
    });
  });

  describe('addPendingCommission', () => {
    it('대기 중인 커미션을 추가한다', () => {
      const wallet = AffiliateWallet.create({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        pendingBalance: new Prisma.Decimal('100'),
        totalEarned: new Prisma.Decimal('500'),
      });

      const beforePending = wallet.pendingBalance;
      const beforeTotal = wallet.totalEarned;
      const beforeUpdatedAt = wallet.updatedAt;

      // 시간 지연을 위해 약간 대기
      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      wallet.addPendingCommission(new Prisma.Decimal('50'));

      expect(wallet.pendingBalance.toString()).toBe(
        beforePending.add(new Prisma.Decimal('50')).toString(),
      );
      expect(wallet.totalEarned.toString()).toBe(
        beforeTotal.add(new Prisma.Decimal('50')).toString(),
      );
      expect(wallet.updatedAt.getTime()).toBeGreaterThan(
        beforeUpdatedAt.getTime(),
      );

      jest.useRealTimers();
    });

    it('커미션 금액이 0 이하인 경우 InvalidWalletBalanceException을 발생시킨다', () => {
      const wallet = AffiliateWallet.create({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
      });

      expect(() => {
        wallet.addPendingCommission(new Prisma.Decimal('0'));
      }).toThrow(InvalidWalletBalanceException);

      expect(() => {
        wallet.addPendingCommission(new Prisma.Decimal('-1'));
      }).toThrow(InvalidWalletBalanceException);
    });
  });

  describe('settlePendingCommission', () => {
    it('전체 대기 중인 커미션을 정산한다', () => {
      const wallet = AffiliateWallet.create({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        availableBalance: new Prisma.Decimal('1000'),
        pendingBalance: new Prisma.Decimal('500'),
      });

      const beforeAvailable = wallet.availableBalance;
      const beforePending = wallet.pendingBalance;
      const beforeUpdatedAt = wallet.updatedAt;

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      wallet.settlePendingCommission();

      expect(wallet.availableBalance.toString()).toBe(
        beforeAvailable.add(beforePending).toString(),
      );
      expect(wallet.pendingBalance.toString()).toBe('0');
      expect(wallet.updatedAt.getTime()).toBeGreaterThan(
        beforeUpdatedAt.getTime(),
      );

      jest.useRealTimers();
    });

    it('지정한 금액만큼 대기 중인 커미션을 정산한다', () => {
      const wallet = AffiliateWallet.create({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        availableBalance: new Prisma.Decimal('1000'),
        pendingBalance: new Prisma.Decimal('500'),
      });

      const beforeAvailable = wallet.availableBalance;
      const beforePending = wallet.pendingBalance;

      wallet.settlePendingCommission(new Prisma.Decimal('200'));

      expect(wallet.availableBalance.toString()).toBe(
        beforeAvailable.add(new Prisma.Decimal('200')).toString(),
      );
      expect(wallet.pendingBalance.toString()).toBe(
        beforePending.sub(new Prisma.Decimal('200')).toString(),
      );
    });

    it('정산할 금액이 0 이하인 경우 아무것도 하지 않는다', () => {
      const wallet = AffiliateWallet.create({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        availableBalance: new Prisma.Decimal('1000'),
        pendingBalance: new Prisma.Decimal('0'),
      });

      const beforeAvailable = wallet.availableBalance;
      const beforePending = wallet.pendingBalance;

      wallet.settlePendingCommission(new Prisma.Decimal('0'));

      expect(wallet.availableBalance.toString()).toBe(
        beforeAvailable.toString(),
      );
      expect(wallet.pendingBalance.toString()).toBe(beforePending.toString());
    });

    it('정산할 금액이 대기 중인 커미션보다 큰 경우 InvalidWalletBalanceException을 발생시킨다', () => {
      const wallet = AffiliateWallet.create({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        pendingBalance: new Prisma.Decimal('500'),
      });

      expect(() => {
        wallet.settlePendingCommission(new Prisma.Decimal('501'));
      }).toThrow(InvalidWalletBalanceException);
    });
  });

  describe('withdraw', () => {
    it('출금 가능한 경우 출금을 처리한다', () => {
      const wallet = AffiliateWallet.create({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        availableBalance: new Prisma.Decimal('1000'),
      });

      const beforeAvailable = wallet.availableBalance;
      const beforeUpdatedAt = wallet.updatedAt;

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      wallet.withdraw(new Prisma.Decimal('300'));

      expect(wallet.availableBalance.toString()).toBe(
        beforeAvailable.sub(new Prisma.Decimal('300')).toString(),
      );
      expect(wallet.updatedAt.getTime()).toBeGreaterThan(
        beforeUpdatedAt.getTime(),
      );

      jest.useRealTimers();
    });

    it('전체 잔액을 출금한다', () => {
      const wallet = AffiliateWallet.create({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        availableBalance: new Prisma.Decimal('1000'),
      });

      wallet.withdraw(new Prisma.Decimal('1000'));

      expect(wallet.availableBalance.toString()).toBe('0');
    });

    it('잔액이 부족한 경우 InsufficientBalanceException을 발생시킨다', () => {
      const wallet = AffiliateWallet.create({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        availableBalance: new Prisma.Decimal('1000'),
      });

      expect(() => {
        wallet.withdraw(new Prisma.Decimal('1001'));
      }).toThrow(InsufficientBalanceException);
    });

    it('출금 금액이 0 이하인 경우 InsufficientBalanceException을 발생시킨다', () => {
      const wallet = AffiliateWallet.create({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        availableBalance: new Prisma.Decimal('1000'),
      });

      expect(() => {
        wallet.withdraw(new Prisma.Decimal('0'));
      }).toThrow(InsufficientBalanceException);

      expect(() => {
        wallet.withdraw(new Prisma.Decimal('-1'));
      }).toThrow(InsufficientBalanceException);
    });
  });

  describe('addAvailableBalance', () => {
    it('출금 가능 잔액을 추가한다', () => {
      const wallet = AffiliateWallet.create({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        availableBalance: new Prisma.Decimal('1000'),
      });

      const beforeAvailable = wallet.availableBalance;
      const beforeUpdatedAt = wallet.updatedAt;

      jest.useFakeTimers();
      jest.advanceTimersByTime(1000);

      wallet.addAvailableBalance(new Prisma.Decimal('500'));

      expect(wallet.availableBalance.toString()).toBe(
        beforeAvailable.add(new Prisma.Decimal('500')).toString(),
      );
      expect(wallet.updatedAt.getTime()).toBeGreaterThan(
        beforeUpdatedAt.getTime(),
      );

      jest.useRealTimers();
    });

    it('추가할 금액이 0 이하인 경우 InvalidWalletBalanceException을 발생시킨다', () => {
      const wallet = AffiliateWallet.create({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        availableBalance: new Prisma.Decimal('1000'),
      });

      expect(() => {
        wallet.addAvailableBalance(new Prisma.Decimal('0'));
      }).toThrow(InvalidWalletBalanceException);

      expect(() => {
        wallet.addAvailableBalance(new Prisma.Decimal('-1'));
      }).toThrow(InvalidWalletBalanceException);
    });
  });

  describe('toPersistence', () => {
    it('DB 저장을 위한 데이터를 올바르게 변환한다', () => {
      const wallet = AffiliateWallet.fromPersistence({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        availableBalance: mockAvailableBalance,
        pendingBalance: mockPendingBalance,
        totalEarned: mockTotalEarned,
        updatedAt: mockUpdatedAt,
      });

      const persistence = wallet.toPersistence();

      expect(persistence.affiliateId).toBe(mockAffiliateId);
      expect(persistence.currency).toBe(mockCurrency);
      expect(persistence.availableBalance.toString()).toBe(
        mockAvailableBalance.toString(),
      );
      expect(persistence.pendingBalance.toString()).toBe(
        mockPendingBalance.toString(),
      );
      expect(persistence.totalEarned.toString()).toBe(
        mockTotalEarned.toString(),
      );
      expect(persistence.updatedAt).toEqual(mockUpdatedAt);
    });

    it('Prisma.Decimal 타입이 유지된다', () => {
      const wallet = AffiliateWallet.create({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        availableBalance: mockAvailableBalance,
        pendingBalance: mockPendingBalance,
        totalEarned: mockTotalEarned,
      });

      const persistence = wallet.toPersistence();

      expect(persistence.availableBalance).toBeInstanceOf(Prisma.Decimal);
      expect(persistence.pendingBalance).toBeInstanceOf(Prisma.Decimal);
      expect(persistence.totalEarned).toBeInstanceOf(Prisma.Decimal);
    });
  });

  describe('통합 시나리오', () => {
    it('커미션 추가 -> 정산 -> 출금 시나리오를 처리한다', () => {
      const wallet = AffiliateWallet.create({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        availableBalance: new Prisma.Decimal('1000'),
        pendingBalance: new Prisma.Decimal('0'),
        totalEarned: new Prisma.Decimal('5000'),
      });

      // 1. 대기 중인 커미션 추가
      wallet.addPendingCommission(new Prisma.Decimal('500'));
      expect(wallet.pendingBalance.toString()).toBe('500');
      expect(wallet.totalEarned.toString()).toBe('5500');

      // 2. 정산 처리
      wallet.settlePendingCommission();
      expect(wallet.pendingBalance.toString()).toBe('0');
      expect(wallet.availableBalance.toString()).toBe('1500');

      // 3. 출금 처리
      wallet.withdraw(new Prisma.Decimal('300'));
      expect(wallet.availableBalance.toString()).toBe('1200');
    });

    it('부분 정산 후 출금 시나리오를 처리한다', () => {
      const wallet = AffiliateWallet.create({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        availableBalance: new Prisma.Decimal('1000'),
        pendingBalance: new Prisma.Decimal('1000'),
      });

      // 부분 정산
      wallet.settlePendingCommission(new Prisma.Decimal('300'));
      expect(wallet.availableBalance.toString()).toBe('1300');
      expect(wallet.pendingBalance.toString()).toBe('700');

      // 출금
      wallet.withdraw(new Prisma.Decimal('500'));
      expect(wallet.availableBalance.toString()).toBe('800');
    });
  });
});
