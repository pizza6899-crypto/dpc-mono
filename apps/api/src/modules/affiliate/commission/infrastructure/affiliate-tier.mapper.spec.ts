// src/modules/affiliate/commission/infrastructure/affiliate-tier.mapper.spec.ts
import { AffiliateTierLevel, Prisma } from '@prisma/client';
import { AffiliateTier } from '../domain';
import { AffiliateTierMapper } from './affiliate-tier.mapper';

describe('AffiliateTierMapper', () => {
  let mapper: AffiliateTierMapper;

  const mockId = BigInt(1);
  const mockUid = 'tier-uid-123';
  const mockAffiliateId = 'affiliate-123';
  const mockTier = AffiliateTierLevel.BRONZE;
  const mockBaseRate = new Prisma.Decimal('0.01');
  const mockCustomRate = new Prisma.Decimal('0.02');
  const mockMonthlyWagerAmount = new Prisma.Decimal('10000');
  const mockCustomRateSetBy = 'admin-123';
  const mockCustomRateSetAt = new Date('2024-01-15T00:00:00Z');
  const mockCreatedAt = new Date('2024-01-01T00:00:00Z');
  const mockUpdatedAt = new Date('2024-01-01T00:00:00Z');

  beforeEach(() => {
    mapper = new AffiliateTierMapper();
  });

  describe('toDomain', () => {
    it('Prisma 모델을 도메인 엔티티로 변환한다', () => {
      // Given
      const prismaModel = {
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: mockTier,
        baseRate: mockBaseRate,
        customRate: null,
        isCustomRate: false,
        monthlyWagerAmount: mockMonthlyWagerAmount,
        customRateSetBy: null,
        customRateSetAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      };

      // When
      const domainEntity = mapper.toDomain(prismaModel);

      // Then
      expect(domainEntity).toBeInstanceOf(AffiliateTier);
      expect(domainEntity.id).toBe(prismaModel.id);
      expect(domainEntity.uid).toBe(prismaModel.uid);
      expect(domainEntity.affiliateId).toBe(prismaModel.affiliateId);
      expect(domainEntity.tier).toBe(prismaModel.tier);
      expect(domainEntity.baseRate.equals(prismaModel.baseRate)).toBe(true);
      expect(domainEntity.customRate).toBeNull();
      expect(domainEntity.isCustomRate).toBe(false);
      expect(
        domainEntity.monthlyWagerAmount.equals(prismaModel.monthlyWagerAmount),
      ).toBe(true);
      expect(domainEntity.customRateSetBy).toBeNull();
      expect(domainEntity.customRateSetAt).toBeNull();
      expect(domainEntity.createdAt).toEqual(prismaModel.createdAt);
      expect(domainEntity.updatedAt).toEqual(prismaModel.updatedAt);
    });

    it('수동 요율이 설정된 티어를 올바르게 변환한다', () => {
      // Given
      const prismaModel = {
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

      // When
      const domainEntity = mapper.toDomain(prismaModel);

      // Then
      expect(domainEntity.customRate?.equals(mockCustomRate)).toBe(true);
      expect(domainEntity.isCustomRate).toBe(true);
      expect(domainEntity.customRateSetBy).toBe(mockCustomRateSetBy);
      expect(domainEntity.customRateSetAt).toEqual(mockCustomRateSetAt);
    });

    it('다양한 티어 레벨을 올바르게 변환한다', () => {
      // Given
      const tiers = [
        AffiliateTierLevel.BRONZE,
        AffiliateTierLevel.SILVER,
        AffiliateTierLevel.GOLD,
        AffiliateTierLevel.PLATINUM,
        AffiliateTierLevel.DIAMOND,
      ];

      tiers.forEach((tier) => {
        const prismaModel = {
          id: mockId,
          uid: mockUid,
          affiliateId: mockAffiliateId,
          tier,
          baseRate: mockBaseRate,
          customRate: null,
          isCustomRate: false,
          monthlyWagerAmount: mockMonthlyWagerAmount,
          customRateSetBy: null,
          customRateSetAt: null,
          createdAt: mockCreatedAt,
          updatedAt: mockUpdatedAt,
        };

        // When
        const domainEntity = mapper.toDomain(prismaModel);

        // Then
        expect(domainEntity.tier).toBe(tier);
      });
    });

    it('0 월간 베팅 금액을 올바르게 처리한다', () => {
      // Given
      const zeroAmount = new Prisma.Decimal('0');
      const prismaModel = {
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: mockTier,
        baseRate: mockBaseRate,
        customRate: null,
        isCustomRate: false,
        monthlyWagerAmount: zeroAmount,
        customRateSetBy: null,
        customRateSetAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      };

      // When
      const domainEntity = mapper.toDomain(prismaModel);

      // Then
      expect(domainEntity.monthlyWagerAmount.equals(zeroAmount)).toBe(true);
    });
  });

  describe('toPrisma', () => {
    it('도메인 엔티티를 Prisma 모델로 변환한다', () => {
      // Given
      const domainEntity = AffiliateTier.fromPersistence({
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: mockTier,
        baseRate: mockBaseRate,
        customRate: null,
        isCustomRate: false,
        monthlyWagerAmount: mockMonthlyWagerAmount,
        customRateSetBy: null,
        customRateSetAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      // When
      const prismaModel = mapper.toPrisma(domainEntity);

      // Then
      expect(prismaModel.id).toBe(domainEntity.id);
      expect(prismaModel.uid).toBe(domainEntity.uid);
      expect(prismaModel.affiliateId).toBe(domainEntity.affiliateId);
      expect(prismaModel.tier).toBe(domainEntity.tier);
      expect(prismaModel.baseRate.equals(domainEntity.baseRate)).toBe(true);
      expect(prismaModel.customRate).toBeNull();
      expect(prismaModel.isCustomRate).toBe(false);
      expect(
        prismaModel.monthlyWagerAmount.equals(domainEntity.monthlyWagerAmount),
      ).toBe(true);
      expect(prismaModel.customRateSetBy).toBeNull();
      expect(prismaModel.customRateSetAt).toBeNull();
      expect(prismaModel.createdAt).toEqual(domainEntity.createdAt);
      expect(prismaModel.updatedAt).toEqual(domainEntity.updatedAt);
    });

    it('도메인 엔티티의 모든 속성을 보존한다', () => {
      // Given
      const domainEntity = AffiliateTier.fromPersistence({
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: mockTier,
        baseRate: mockBaseRate,
        customRate: null,
        isCustomRate: false,
        monthlyWagerAmount: mockMonthlyWagerAmount,
        customRateSetBy: null,
        customRateSetAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      // When
      const prismaModel = mapper.toPrisma(domainEntity);
      const persistence = domainEntity.toPersistence();

      // Then
      expect(prismaModel.id).toBe(persistence.id);
      expect(prismaModel.uid).toBe(persistence.uid);
      expect(prismaModel.affiliateId).toBe(persistence.affiliateId);
      expect(prismaModel.tier).toBe(persistence.tier);
      expect(prismaModel.baseRate.equals(persistence.baseRate)).toBe(true);
      expect(prismaModel.customRate).toEqual(persistence.customRate);
      expect(prismaModel.isCustomRate).toBe(persistence.isCustomRate);
      expect(
        prismaModel.monthlyWagerAmount.equals(persistence.monthlyWagerAmount),
      ).toBe(true);
      expect(prismaModel.customRateSetBy).toEqual(persistence.customRateSetBy);
      expect(prismaModel.customRateSetAt).toEqual(persistence.customRateSetAt);
      expect(prismaModel.createdAt).toEqual(persistence.createdAt);
      expect(prismaModel.updatedAt).toEqual(persistence.updatedAt);
    });

    it('수동 요율이 설정된 엔티티를 올바르게 변환한다', () => {
      // Given
      const domainEntity = AffiliateTier.fromPersistence({
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
      });

      // When
      const prismaModel = mapper.toPrisma(domainEntity);

      // Then
      expect(prismaModel.customRate?.equals(mockCustomRate)).toBe(true);
      expect(prismaModel.isCustomRate).toBe(true);
      expect(prismaModel.customRateSetBy).toBe(mockCustomRateSetBy);
      expect(prismaModel.customRateSetAt).toEqual(mockCustomRateSetAt);
    });

    it('새로 생성된 엔티티(id=null)를 올바르게 변환한다', () => {
      // Given
      const domainEntity = AffiliateTier.create({
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: mockTier,
        baseRate: mockBaseRate,
      });

      // When
      const prismaModel = mapper.toPrisma(domainEntity);

      // Then
      expect(prismaModel.id).toBeNull();
      expect(prismaModel.uid).toBe(mockUid);
    });
  });

  describe('Round-trip conversion', () => {
    it('왕복 변환을 통해 데이터 무결성을 유지한다', () => {
      // Given
      const originalPrismaModel = {
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: mockTier,
        baseRate: mockBaseRate,
        customRate: null,
        isCustomRate: false,
        monthlyWagerAmount: mockMonthlyWagerAmount,
        customRateSetBy: null,
        customRateSetAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      };

      // When
      const domainEntity = mapper.toDomain(originalPrismaModel);
      const convertedPrismaModel = mapper.toPrisma(domainEntity);

      // Then
      expect(convertedPrismaModel.id).toBe(originalPrismaModel.id);
      expect(convertedPrismaModel.uid).toBe(originalPrismaModel.uid);
      expect(convertedPrismaModel.affiliateId).toBe(
        originalPrismaModel.affiliateId,
      );
      expect(convertedPrismaModel.tier).toBe(originalPrismaModel.tier);
      expect(
        convertedPrismaModel.baseRate.equals(originalPrismaModel.baseRate),
      ).toBe(true);
      expect(convertedPrismaModel.customRate).toEqual(
        originalPrismaModel.customRate,
      );
      expect(convertedPrismaModel.isCustomRate).toBe(
        originalPrismaModel.isCustomRate,
      );
      expect(
        convertedPrismaModel.monthlyWagerAmount.equals(
          originalPrismaModel.monthlyWagerAmount,
        ),
      ).toBe(true);
      expect(convertedPrismaModel.customRateSetBy).toEqual(
        originalPrismaModel.customRateSetBy,
      );
      expect(convertedPrismaModel.customRateSetAt).toEqual(
        originalPrismaModel.customRateSetAt,
      );
      expect(convertedPrismaModel.createdAt).toEqual(
        originalPrismaModel.createdAt,
      );
      expect(convertedPrismaModel.updatedAt).toEqual(
        originalPrismaModel.updatedAt,
      );
    });

    it('수동 요율이 설정된 티어로 왕복 변환을 수행한다', () => {
      // Given
      const originalPrismaModel = {
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

      // When
      const domainEntity = mapper.toDomain(originalPrismaModel);
      const convertedPrismaModel = mapper.toPrisma(domainEntity);

      // Then
      expect(
        convertedPrismaModel.customRate?.equals(
          originalPrismaModel.customRate!,
        ),
      ).toBe(true);
      expect(convertedPrismaModel.isCustomRate).toBe(
        originalPrismaModel.isCustomRate,
      );
      expect(convertedPrismaModel.customRateSetBy).toBe(
        originalPrismaModel.customRateSetBy,
      );
      expect(convertedPrismaModel.customRateSetAt).toEqual(
        originalPrismaModel.customRateSetAt,
      );
    });

    it('다양한 티어 레벨로 왕복 변환을 수행한다', () => {
      // Given
      const tiers = [
        AffiliateTierLevel.BRONZE,
        AffiliateTierLevel.SILVER,
        AffiliateTierLevel.GOLD,
        AffiliateTierLevel.PLATINUM,
        AffiliateTierLevel.DIAMOND,
      ];

      tiers.forEach((tier) => {
        const originalPrismaModel = {
          id: mockId,
          uid: mockUid,
          affiliateId: mockAffiliateId,
          tier,
          baseRate: mockBaseRate,
          customRate: null,
          isCustomRate: false,
          monthlyWagerAmount: mockMonthlyWagerAmount,
          customRateSetBy: null,
          customRateSetAt: null,
          createdAt: mockCreatedAt,
          updatedAt: mockUpdatedAt,
        };

        // When
        const domainEntity = mapper.toDomain(originalPrismaModel);
        const convertedPrismaModel = mapper.toPrisma(domainEntity);

        // Then
        expect(convertedPrismaModel.tier).toBe(tier);
      });
    });
  });
});
