// src/modules/affiliate/commission/infrastructure/affiliate-wallet.mapper.spec.ts
import { ExchangeCurrencyCode, Prisma } from '@prisma/client';
import { AffiliateWallet } from '../domain';
import { AffiliateWalletMapper } from './affiliate-wallet.mapper';

describe('AffiliateWalletMapper', () => {
  let mapper: AffiliateWalletMapper;

  const mockAffiliateId = 'affiliate-123';
  const mockCurrency = ExchangeCurrencyCode.USD;
  const mockAvailableBalance = new Prisma.Decimal('1000');
  const mockPendingBalance = new Prisma.Decimal('500');
  const mockTotalEarned = new Prisma.Decimal('2000');
  const mockUpdatedAt = new Date('2024-01-01T00:00:00Z');

  beforeEach(() => {
    mapper = new AffiliateWalletMapper();
  });

  describe('toDomain', () => {
    it('Prisma 모델을 도메인 엔티티로 변환한다', () => {
      // Given
      const prismaModel = {
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        availableBalance: mockAvailableBalance,
        pendingBalance: mockPendingBalance,
        totalEarned: mockTotalEarned,
        updatedAt: mockUpdatedAt,
      };

      // When
      const domainEntity = mapper.toDomain(prismaModel);

      // Then
      expect(domainEntity).toBeInstanceOf(AffiliateWallet);
      expect(domainEntity.affiliateId).toBe(prismaModel.affiliateId);
      expect(domainEntity.currency).toBe(prismaModel.currency);
      expect(
        domainEntity.availableBalance.equals(prismaModel.availableBalance),
      ).toBe(true);
      expect(
        domainEntity.pendingBalance.equals(prismaModel.pendingBalance),
      ).toBe(true);
      expect(domainEntity.totalEarned.equals(prismaModel.totalEarned)).toBe(
        true,
      );
      expect(domainEntity.updatedAt).toEqual(prismaModel.updatedAt);
    });

    it('다양한 통화를 올바르게 변환한다', () => {
      // Given
      const krwCurrency = ExchangeCurrencyCode.KRW;
      const prismaModel = {
        affiliateId: mockAffiliateId,
        currency: krwCurrency,
        availableBalance: mockAvailableBalance,
        pendingBalance: mockPendingBalance,
        totalEarned: mockTotalEarned,
        updatedAt: mockUpdatedAt,
      };

      // When
      const domainEntity = mapper.toDomain(prismaModel);

      // Then
      expect(domainEntity.currency).toBe(krwCurrency);
    });

    it('0 잔액을 올바르게 처리한다', () => {
      // Given
      const zeroBalance = new Prisma.Decimal('0');
      const prismaModel = {
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        availableBalance: zeroBalance,
        pendingBalance: zeroBalance,
        totalEarned: zeroBalance,
        updatedAt: mockUpdatedAt,
      };

      // When
      const domainEntity = mapper.toDomain(prismaModel);

      // Then
      expect(domainEntity.availableBalance.equals(zeroBalance)).toBe(true);
      expect(domainEntity.pendingBalance.equals(zeroBalance)).toBe(true);
      expect(domainEntity.totalEarned.equals(zeroBalance)).toBe(true);
    });

    it('큰 금액 값을 올바르게 처리한다', () => {
      // Given
      const largeAmount = new Prisma.Decimal('999999999999.99');
      const prismaModel = {
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        availableBalance: largeAmount,
        pendingBalance: largeAmount,
        totalEarned: largeAmount,
        updatedAt: mockUpdatedAt,
      };

      // When
      const domainEntity = mapper.toDomain(prismaModel);

      // Then
      expect(domainEntity.availableBalance.equals(largeAmount)).toBe(true);
    });
  });

  describe('toPrisma', () => {
    it('도메인 엔티티를 Prisma 모델로 변환한다', () => {
      // Given
      const domainEntity = AffiliateWallet.fromPersistence({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        availableBalance: mockAvailableBalance,
        pendingBalance: mockPendingBalance,
        totalEarned: mockTotalEarned,
        updatedAt: mockUpdatedAt,
      });

      // When
      const prismaModel = mapper.toPrisma(domainEntity);

      // Then
      expect(prismaModel.affiliateId).toBe(domainEntity.affiliateId);
      expect(prismaModel.currency).toBe(domainEntity.currency);
      expect(
        prismaModel.availableBalance.equals(domainEntity.availableBalance),
      ).toBe(true);
      expect(
        prismaModel.pendingBalance.equals(domainEntity.pendingBalance),
      ).toBe(true);
      expect(prismaModel.totalEarned.equals(domainEntity.totalEarned)).toBe(
        true,
      );
      expect(prismaModel.updatedAt).toEqual(domainEntity.updatedAt);
    });

    it('도메인 엔티티의 모든 속성을 보존한다', () => {
      // Given
      const domainEntity = AffiliateWallet.fromPersistence({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        availableBalance: mockAvailableBalance,
        pendingBalance: mockPendingBalance,
        totalEarned: mockTotalEarned,
        updatedAt: mockUpdatedAt,
      });

      // When
      const prismaModel = mapper.toPrisma(domainEntity);
      const persistence = domainEntity.toPersistence();

      // Then
      expect(prismaModel.affiliateId).toBe(persistence.affiliateId);
      expect(prismaModel.currency).toBe(persistence.currency);
      expect(
        prismaModel.availableBalance.equals(persistence.availableBalance),
      ).toBe(true);
      expect(
        prismaModel.pendingBalance.equals(persistence.pendingBalance),
      ).toBe(true);
      expect(prismaModel.totalEarned.equals(persistence.totalEarned)).toBe(
        true,
      );
      expect(prismaModel.updatedAt).toEqual(persistence.updatedAt);
    });
  });

  describe('Round-trip conversion', () => {
    it('왕복 변환을 통해 데이터 무결성을 유지한다', () => {
      // Given
      const originalPrismaModel = {
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        availableBalance: mockAvailableBalance,
        pendingBalance: mockPendingBalance,
        totalEarned: mockTotalEarned,
        updatedAt: mockUpdatedAt,
      };

      // When
      const domainEntity = mapper.toDomain(originalPrismaModel);
      const convertedPrismaModel = mapper.toPrisma(domainEntity);

      // Then
      expect(convertedPrismaModel.affiliateId).toBe(
        originalPrismaModel.affiliateId,
      );
      expect(convertedPrismaModel.currency).toBe(originalPrismaModel.currency);
      expect(
        convertedPrismaModel.availableBalance.equals(
          originalPrismaModel.availableBalance,
        ),
      ).toBe(true);
      expect(
        convertedPrismaModel.pendingBalance.equals(
          originalPrismaModel.pendingBalance,
        ),
      ).toBe(true);
      expect(
        convertedPrismaModel.totalEarned.equals(
          originalPrismaModel.totalEarned,
        ),
      ).toBe(true);
      expect(convertedPrismaModel.updatedAt).toEqual(
        originalPrismaModel.updatedAt,
      );
    });

    it('다양한 통화로 왕복 변환을 수행한다', () => {
      // Given
      const jpyCurrency = ExchangeCurrencyCode.JPY;
      const originalPrismaModel = {
        affiliateId: mockAffiliateId,
        currency: jpyCurrency,
        availableBalance: mockAvailableBalance,
        pendingBalance: mockPendingBalance,
        totalEarned: mockTotalEarned,
        updatedAt: mockUpdatedAt,
      };

      // When
      const domainEntity = mapper.toDomain(originalPrismaModel);
      const convertedPrismaModel = mapper.toPrisma(domainEntity);

      // Then
      expect(convertedPrismaModel.currency).toBe(jpyCurrency);
    });
  });
});
