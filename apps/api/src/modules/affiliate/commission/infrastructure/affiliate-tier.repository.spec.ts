// src/modules/affiliate/commission/infrastructure/affiliate-tier.repository.spec.ts
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { AffiliateTierLevel, Prisma } from '@prisma/client';
import { AffiliateTier, TierNotFoundException } from '../domain';
import { AffiliateTierMapper } from './affiliate-tier.mapper';
import { AffiliateTierRepository } from './affiliate-tier.repository';

describe('AffiliateTierRepository', () => {
  let repository: AffiliateTierRepository;
  let mockTx: jest.Mocked<
    Transaction<TransactionalAdapterPrisma>['affiliateTier']
  >;
  let mockMapper: jest.Mocked<AffiliateTierMapper>;

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

  const createMockPrismaModel = (overrides?: {
    tier?: AffiliateTierLevel;
    baseRate?: Prisma.Decimal;
    customRate?: Prisma.Decimal | null;
    isCustomRate?: boolean;
    monthlyWagerAmount?: Prisma.Decimal;
    customRateSetBy?: string | null;
    customRateSetAt?: Date | null;
  }) => ({
    id: mockId,
    uid: mockUid,
    affiliateId: mockAffiliateId,
    tier: overrides?.tier ?? mockTier,
    baseRate: overrides?.baseRate ?? mockBaseRate,
    customRate: overrides?.customRate ?? null,
    isCustomRate: overrides?.isCustomRate ?? false,
    monthlyWagerAmount: overrides?.monthlyWagerAmount ?? mockMonthlyWagerAmount,
    customRateSetBy: overrides?.customRateSetBy ?? null,
    customRateSetAt: overrides?.customRateSetAt ?? null,
    createdAt: mockCreatedAt,
    updatedAt: mockUpdatedAt,
  });

  const createMockDomainEntity = (overrides?: {
    tier?: AffiliateTierLevel;
    baseRate?: Prisma.Decimal;
    customRate?: Prisma.Decimal | null;
    isCustomRate?: boolean;
    monthlyWagerAmount?: Prisma.Decimal;
    customRateSetBy?: string | null;
    customRateSetAt?: Date | null;
  }) => {
    return AffiliateTier.fromPersistence({
      id: mockId,
      uid: mockUid,
      affiliateId: mockAffiliateId,
      tier: overrides?.tier ?? mockTier,
      baseRate: overrides?.baseRate ?? mockBaseRate,
      customRate: overrides?.customRate ?? null,
      isCustomRate: overrides?.isCustomRate ?? false,
      monthlyWagerAmount:
        overrides?.monthlyWagerAmount ?? mockMonthlyWagerAmount,
      customRateSetBy: overrides?.customRateSetBy ?? null,
      customRateSetAt: overrides?.customRateSetAt ?? null,
      createdAt: mockCreatedAt,
      updatedAt: mockUpdatedAt,
    });
  };

  beforeEach(() => {
    // Mock Transaction
    mockTx = {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    } as any;

    const mockTransaction = {
      affiliateTier: mockTx,
    } as unknown as Transaction<TransactionalAdapterPrisma>;

    // Mock Mapper
    mockMapper = {
      toDomain: jest.fn(),
      toPrisma: jest.fn(),
    } as any;

    // InjectTransaction 데코레이터를 우회하기 위해 직접 인스턴스화
    repository = new AffiliateTierRepository(mockTransaction, mockMapper);

    jest.clearAllMocks();
  });

  describe('findByAffiliateId', () => {
    it('어필리에이트 ID로 티어를 조회한다', async () => {
      // Given
      const prismaModel = createMockPrismaModel();
      const domainEntity = createMockDomainEntity();
      mockTx.findUnique.mockResolvedValue(prismaModel as any);
      mockMapper.toDomain.mockReturnValue(domainEntity);

      // When
      const result = await repository.findByAffiliateId(mockAffiliateId);

      // Then
      expect(mockTx.findUnique).toHaveBeenCalledWith({
        where: { affiliateId: mockAffiliateId },
      });
      expect(mockMapper.toDomain).toHaveBeenCalledWith(prismaModel);
      expect(result).toBe(domainEntity);
    });

    it('티어가 없으면 null을 반환한다', async () => {
      // Given
      mockTx.findUnique.mockResolvedValue(null);

      // When
      const result = await repository.findByAffiliateId(mockAffiliateId);

      // Then
      expect(mockTx.findUnique).toHaveBeenCalledWith({
        where: { affiliateId: mockAffiliateId },
      });
      expect(mockMapper.toDomain).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('getByAffiliateId', () => {
    it('어필리에이트 ID로 티어를 조회하고 반환한다', async () => {
      // Given
      const prismaModel = createMockPrismaModel();
      const domainEntity = createMockDomainEntity();
      mockTx.findUnique.mockResolvedValue(prismaModel as any);
      mockMapper.toDomain.mockReturnValue(domainEntity);

      // When
      const result = await repository.getByAffiliateId(mockAffiliateId);

      // Then
      expect(mockTx.findUnique).toHaveBeenCalledWith({
        where: { affiliateId: mockAffiliateId },
      });
      expect(result).toBe(domainEntity);
    });

    it('티어가 없으면 TierNotFoundException을 던진다', async () => {
      // Given
      mockTx.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(
        repository.getByAffiliateId(mockAffiliateId),
      ).rejects.toThrow(TierNotFoundException);
      expect(mockTx.findUnique).toHaveBeenCalledWith({
        where: { affiliateId: mockAffiliateId },
      });
    });
  });

  describe('upsert', () => {
    it('새 티어를 생성한다', async () => {
      // Given
      const domainEntity = createMockDomainEntity();
      const prismaData = {
        id: null,
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
      const createdPrismaModel = createMockPrismaModel();
      const createdDomainEntity = createMockDomainEntity();

      mockMapper.toPrisma.mockReturnValue(prismaData);
      mockTx.upsert.mockResolvedValue(createdPrismaModel as any);
      mockMapper.toDomain.mockReturnValue(createdDomainEntity);

      // When
      const result = await repository.upsert(domainEntity);

      // Then
      expect(mockMapper.toPrisma).toHaveBeenCalledWith(domainEntity);
      expect(mockTx.upsert).toHaveBeenCalledWith({
        where: { affiliateId: prismaData.affiliateId },
        create: {
          uid: prismaData.uid,
          affiliateId: prismaData.affiliateId,
          tier: prismaData.tier,
          baseRate: prismaData.baseRate,
          customRate: prismaData.customRate,
          isCustomRate: prismaData.isCustomRate,
          monthlyWagerAmount: prismaData.monthlyWagerAmount,
          customRateSetBy: prismaData.customRateSetBy,
          customRateSetAt: prismaData.customRateSetAt,
          createdAt: prismaData.createdAt,
          updatedAt: prismaData.updatedAt,
        },
        update: {
          tier: prismaData.tier,
          baseRate: prismaData.baseRate,
          customRate: prismaData.customRate,
          isCustomRate: prismaData.isCustomRate,
          monthlyWagerAmount: prismaData.monthlyWagerAmount,
          customRateSetBy: prismaData.customRateSetBy,
          customRateSetAt: prismaData.customRateSetAt,
          updatedAt: prismaData.updatedAt,
        },
      });
      expect(mockMapper.toDomain).toHaveBeenCalledWith(createdPrismaModel);
      expect(result).toBe(createdDomainEntity);
    });

    it('기존 티어를 업데이트한다', async () => {
      // Given
      const domainEntity = createMockDomainEntity({
        tier: AffiliateTierLevel.SILVER,
        baseRate: new Prisma.Decimal('0.02'),
      });
      const prismaData = {
        id: mockId,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        tier: AffiliateTierLevel.SILVER,
        baseRate: new Prisma.Decimal('0.02'),
        customRate: null,
        isCustomRate: false,
        monthlyWagerAmount: mockMonthlyWagerAmount,
        customRateSetBy: null,
        customRateSetAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      };
      const updatedPrismaModel = createMockPrismaModel({
        tier: AffiliateTierLevel.SILVER,
        baseRate: new Prisma.Decimal('0.02'),
      });
      const updatedDomainEntity = createMockDomainEntity({
        tier: AffiliateTierLevel.SILVER,
        baseRate: new Prisma.Decimal('0.02'),
      });

      mockMapper.toPrisma.mockReturnValue(prismaData);
      mockTx.upsert.mockResolvedValue(updatedPrismaModel as any);
      mockMapper.toDomain.mockReturnValue(updatedDomainEntity);

      // When
      const result = await repository.upsert(domainEntity);

      // Then
      expect(mockTx.upsert).toHaveBeenCalled();
      expect(result).toBe(updatedDomainEntity);
    });
  });

  describe('updateTier', () => {
    it('티어와 기본 요율을 업데이트한다', async () => {
      // Given
      const newTier = AffiliateTierLevel.SILVER;
      const baseRateBigInt = 200n; // 0.02 = 200 (10000 기준)
      const expectedBaseRate = new Prisma.Decimal('0.02');
      const prismaModel = createMockPrismaModel({
        tier: newTier,
        baseRate: expectedBaseRate,
      });
      const domainEntity = createMockDomainEntity({
        tier: newTier,
        baseRate: expectedBaseRate,
      });

      mockTx.update.mockResolvedValue(prismaModel as any);
      mockMapper.toDomain.mockReturnValue(domainEntity);

      // When
      const result = await repository.updateTier(
        mockAffiliateId,
        newTier,
        baseRateBigInt,
      );

      // Then
      expect(mockTx.update).toHaveBeenCalledWith({
        where: { affiliateId: mockAffiliateId },
        data: {
          tier: newTier,
          baseRate: expectedBaseRate,
          updatedAt: expect.any(Date),
        },
      });
      expect(result).toBe(domainEntity);
    });

    it('bigint 요율을 올바르게 Prisma.Decimal로 변환한다', async () => {
      // Given
      const baseRateBigInt = 100n; // 0.01 = 100 (10000 기준)
      const expectedBaseRate = new Prisma.Decimal('0.01');
      const prismaModel = createMockPrismaModel();
      const domainEntity = createMockDomainEntity();

      mockTx.update.mockResolvedValue(prismaModel as any);
      mockMapper.toDomain.mockReturnValue(domainEntity);

      // When
      await repository.updateTier(mockAffiliateId, mockTier, baseRateBigInt);

      // Then
      expect(mockTx.update).toHaveBeenCalledWith({
        where: { affiliateId: mockAffiliateId },
        data: {
          tier: mockTier,
          baseRate: expectedBaseRate,
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe('updateMonthlyWagerAmount', () => {
    it('월간 베팅 금액을 업데이트한다', async () => {
      // Given
      const monthlyWagerAmountBigInt = 50000n;
      const expectedMonthlyWagerAmount = new Prisma.Decimal('50000');
      const prismaModel = createMockPrismaModel({
        monthlyWagerAmount: expectedMonthlyWagerAmount,
      });
      const domainEntity = createMockDomainEntity({
        monthlyWagerAmount: expectedMonthlyWagerAmount,
      });

      mockTx.update.mockResolvedValue(prismaModel as any);
      mockMapper.toDomain.mockReturnValue(domainEntity);

      // When
      const result = await repository.updateMonthlyWagerAmount(
        mockAffiliateId,
        monthlyWagerAmountBigInt,
      );

      // Then
      expect(mockTx.update).toHaveBeenCalledWith({
        where: { affiliateId: mockAffiliateId },
        data: {
          monthlyWagerAmount: expectedMonthlyWagerAmount,
          updatedAt: expect.any(Date),
        },
      });
      expect(result).toBe(domainEntity);
    });

    it('bigint 금액을 올바르게 Prisma.Decimal로 변환한다', async () => {
      // Given
      const monthlyWagerAmountBigInt = 100000n;
      const expectedMonthlyWagerAmount = new Prisma.Decimal('100000');
      const prismaModel = createMockPrismaModel();
      const domainEntity = createMockDomainEntity();

      mockTx.update.mockResolvedValue(prismaModel as any);
      mockMapper.toDomain.mockReturnValue(domainEntity);

      // When
      await repository.updateMonthlyWagerAmount(
        mockAffiliateId,
        monthlyWagerAmountBigInt,
      );

      // Then
      expect(mockTx.update).toHaveBeenCalledWith({
        where: { affiliateId: mockAffiliateId },
        data: {
          monthlyWagerAmount: expectedMonthlyWagerAmount,
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe('resetMonthlyWagerAmount', () => {
    it('월간 베팅 금액을 0으로 초기화한다', async () => {
      // Given
      const prismaModel = createMockPrismaModel({
        monthlyWagerAmount: new Prisma.Decimal('0'),
      });
      const domainEntity = createMockDomainEntity({
        monthlyWagerAmount: new Prisma.Decimal('0'),
      });

      mockTx.update.mockResolvedValue(prismaModel as any);
      mockMapper.toDomain.mockReturnValue(domainEntity);

      // When
      const result = await repository.resetMonthlyWagerAmount(mockAffiliateId);

      // Then
      expect(mockTx.update).toHaveBeenCalledWith({
        where: { affiliateId: mockAffiliateId },
        data: {
          monthlyWagerAmount: new Prisma.Decimal('0'),
          updatedAt: expect.any(Date),
        },
      });
      expect(result).toBe(domainEntity);
    });
  });
});
