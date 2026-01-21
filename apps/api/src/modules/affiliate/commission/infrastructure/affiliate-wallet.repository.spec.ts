// src/modules/affiliate/commission/infrastructure/affiliate-wallet.repository.spec.ts
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { ExchangeCurrencyCode, Prisma } from '@prisma/client';
import { AffiliateWallet, WalletNotFoundException } from '../domain';
import type { AffiliateWalletMapper } from './affiliate-wallet.mapper';
import { AffiliateWalletRepository } from './affiliate-wallet.repository';

describe('AffiliateWalletRepository', () => {
  let repository: AffiliateWalletRepository;
  let mockTx: jest.Mocked<
    Transaction<TransactionalAdapterPrisma>['affiliateWallet']
  >;
  let mockMapper: jest.Mocked<AffiliateWalletMapper>;

  const mockAffiliateId = 'affiliate-123';
  const mockCurrency = ExchangeCurrencyCode.USD;
  const mockAvailableBalance = new Prisma.Decimal('1000');
  const mockPendingBalance = new Prisma.Decimal('500');
  const mockTotalEarned = new Prisma.Decimal('2000');
  const mockUpdatedAt = new Date('2024-01-01T00:00:00Z');

  const createMockPrismaModel = (overrides?: {
    availableBalance?: Prisma.Decimal;
    pendingBalance?: Prisma.Decimal;
    totalEarned?: Prisma.Decimal;
    currency?: ExchangeCurrencyCode;
  }) => ({
    affiliateId: mockAffiliateId,
    currency: overrides?.currency ?? mockCurrency,
    availableBalance: overrides?.availableBalance ?? mockAvailableBalance,
    pendingBalance: overrides?.pendingBalance ?? mockPendingBalance,
    totalEarned: overrides?.totalEarned ?? mockTotalEarned,
    updatedAt: mockUpdatedAt,
  });

  const createMockDomainEntity = (overrides?: {
    availableBalance?: Prisma.Decimal;
    pendingBalance?: Prisma.Decimal;
    totalEarned?: Prisma.Decimal;
    currency?: ExchangeCurrencyCode;
  }) => {
    return AffiliateWallet.fromPersistence({
      affiliateId: mockAffiliateId,
      currency: overrides?.currency ?? mockCurrency,
      availableBalance: overrides?.availableBalance ?? mockAvailableBalance,
      pendingBalance: overrides?.pendingBalance ?? mockPendingBalance,
      totalEarned: overrides?.totalEarned ?? mockTotalEarned,
      updatedAt: mockUpdatedAt,
    });
  };

  beforeEach(() => {
    // Mock Transaction
    mockTx = {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    } as any;

    const mockTransaction = {
      affiliateWallet: mockTx,
    } as unknown as Transaction<TransactionalAdapterPrisma>;

    // Mock Mapper
    mockMapper = {
      toDomain: jest.fn(),
      toPrisma: jest.fn(),
    } as any;

    // InjectTransaction 데코레이터를 우회하기 위해 직접 인스턴스화
    repository = new AffiliateWalletRepository(mockTransaction, mockMapper);

    jest.clearAllMocks();
  });

  describe('findByAffiliateIdAndCurrency', () => {
    it('어필리에이트 ID와 통화로 월렛을 조회한다', async () => {
      // Given
      const prismaModel = createMockPrismaModel();
      const domainEntity = createMockDomainEntity();
      mockTx.findUnique.mockResolvedValue(prismaModel as any);
      mockMapper.toDomain.mockReturnValue(domainEntity);

      // When
      const result = await repository.findByAffiliateIdAndCurrency(
        mockAffiliateId,
        mockCurrency,
      );

      // Then
      expect(mockTx.findUnique).toHaveBeenCalledWith({
        where: {
          affiliateId_currency: {
            affiliateId: mockAffiliateId,
            currency: mockCurrency,
          },
        },
      });
      expect(mockMapper.toDomain).toHaveBeenCalledWith(prismaModel);
      expect(result).toBe(domainEntity);
    });

    it('월렛이 없으면 null을 반환한다', async () => {
      // Given
      mockTx.findUnique.mockResolvedValue(null);

      // When
      const result = await repository.findByAffiliateIdAndCurrency(
        mockAffiliateId,
        mockCurrency,
      );

      // Then
      expect(mockTx.findUnique).toHaveBeenCalledWith({
        where: {
          affiliateId_currency: {
            affiliateId: mockAffiliateId,
            currency: mockCurrency,
          },
        },
      });
      expect(mockMapper.toDomain).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('다양한 통화로 월렛을 조회한다', async () => {
      // Given
      const krwCurrency = ExchangeCurrencyCode.KRW;
      const prismaModel = createMockPrismaModel({ currency: krwCurrency });
      const domainEntity = createMockDomainEntity({ currency: krwCurrency });
      mockTx.findUnique.mockResolvedValue(prismaModel as any);
      mockMapper.toDomain.mockReturnValue(domainEntity);

      // When
      const result = await repository.findByAffiliateIdAndCurrency(
        mockAffiliateId,
        krwCurrency,
      );

      // Then
      expect(mockTx.findUnique).toHaveBeenCalledWith({
        where: {
          affiliateId_currency: {
            affiliateId: mockAffiliateId,
            currency: krwCurrency,
          },
        },
      });
      expect(result).toBe(domainEntity);
    });
  });

  describe('getByAffiliateIdAndCurrency', () => {
    it('어필리에이트 ID와 통화로 월렛을 조회하고 반환한다', async () => {
      // Given
      const prismaModel = createMockPrismaModel();
      const domainEntity = createMockDomainEntity();
      mockTx.findUnique.mockResolvedValue(prismaModel as any);
      mockMapper.toDomain.mockReturnValue(domainEntity);

      // When
      const result = await repository.getByAffiliateIdAndCurrency(
        mockAffiliateId,
        mockCurrency,
      );

      // Then
      expect(mockTx.findUnique).toHaveBeenCalledWith({
        where: {
          affiliateId_currency: {
            affiliateId: mockAffiliateId,
            currency: mockCurrency,
          },
        },
      });
      expect(result).toBe(domainEntity);
    });

    it('월렛이 없으면 WalletNotFoundException을 던진다', async () => {
      // Given
      mockTx.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(
        repository.getByAffiliateIdAndCurrency(mockAffiliateId, mockCurrency),
      ).rejects.toThrow(WalletNotFoundException);
      expect(mockTx.findUnique).toHaveBeenCalledWith({
        where: {
          affiliateId_currency: {
            affiliateId: mockAffiliateId,
            currency: mockCurrency,
          },
        },
      });
    });
  });

  describe('findByAffiliateId', () => {
    it('어필리에이트 ID로 모든 월렛을 조회한다', async () => {
      // Given
      const prismaModels = [
        createMockPrismaModel({ currency: ExchangeCurrencyCode.USD }),
        createMockPrismaModel({ currency: ExchangeCurrencyCode.KRW }),
      ];
      const domainEntities = [
        createMockDomainEntity({ currency: ExchangeCurrencyCode.USD }),
        createMockDomainEntity({ currency: ExchangeCurrencyCode.KRW }),
      ];
      mockTx.findMany.mockResolvedValue(prismaModels as any);
      mockMapper.toDomain
        .mockReturnValueOnce(domainEntities[0])
        .mockReturnValueOnce(domainEntities[1]);

      // When
      const result = await repository.findByAffiliateId(mockAffiliateId);

      // Then
      expect(mockTx.findMany).toHaveBeenCalledWith({
        where: { affiliateId: mockAffiliateId },
      });
      expect(mockMapper.toDomain).toHaveBeenCalledTimes(2);
      expect(result).toEqual(domainEntities);
    });

    it('월렛이 없으면 빈 배열을 반환한다', async () => {
      // Given
      mockTx.findMany.mockResolvedValue([]);

      // When
      const result = await repository.findByAffiliateId(mockAffiliateId);

      // Then
      expect(mockTx.findMany).toHaveBeenCalledWith({
        where: { affiliateId: mockAffiliateId },
      });
      expect(mockMapper.toDomain).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('upsert', () => {
    it('새 월렛을 생성한다', async () => {
      // Given
      const domainEntity = createMockDomainEntity();
      const prismaData = {
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        availableBalance: mockAvailableBalance,
        pendingBalance: mockPendingBalance,
        totalEarned: mockTotalEarned,
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
        where: {
          affiliateId_currency: {
            affiliateId: prismaData.affiliateId,
            currency: prismaData.currency,
          },
        },
        create: {
          affiliateId: prismaData.affiliateId,
          currency: prismaData.currency,
          availableBalance: prismaData.availableBalance,
          pendingBalance: prismaData.pendingBalance,
          totalEarned: prismaData.totalEarned,
          updatedAt: prismaData.updatedAt,
        },
        update: {
          availableBalance: prismaData.availableBalance,
          pendingBalance: prismaData.pendingBalance,
          totalEarned: prismaData.totalEarned,
          updatedAt: prismaData.updatedAt,
        },
      });
      expect(mockMapper.toDomain).toHaveBeenCalledWith(createdPrismaModel);
      expect(result).toBe(createdDomainEntity);
    });

    it('기존 월렛을 업데이트한다', async () => {
      // Given
      const updatedAvailableBalance = new Prisma.Decimal('2000');
      const domainEntity = createMockDomainEntity({
        availableBalance: updatedAvailableBalance,
      });
      const prismaData = {
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        availableBalance: updatedAvailableBalance,
        pendingBalance: mockPendingBalance,
        totalEarned: mockTotalEarned,
        updatedAt: mockUpdatedAt,
      };
      const updatedPrismaModel = createMockPrismaModel({
        availableBalance: updatedAvailableBalance,
      });
      const updatedDomainEntity = createMockDomainEntity({
        availableBalance: updatedAvailableBalance,
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

  describe('updateBalance', () => {
    it('월렛 잔액을 업데이트한다', async () => {
      // Given
      const availableBalanceBigInt = 2000n;
      const pendingBalanceBigInt = 1000n;
      const totalEarnedBigInt = 5000n;
      const expectedAvailableBalance = new Prisma.Decimal('2000');
      const expectedPendingBalance = new Prisma.Decimal('1000');
      const expectedTotalEarned = new Prisma.Decimal('5000');
      const prismaModel = createMockPrismaModel({
        availableBalance: expectedAvailableBalance,
        pendingBalance: expectedPendingBalance,
        totalEarned: expectedTotalEarned,
      });
      const domainEntity = createMockDomainEntity({
        availableBalance: expectedAvailableBalance,
        pendingBalance: expectedPendingBalance,
        totalEarned: expectedTotalEarned,
      });

      mockTx.update.mockResolvedValue(prismaModel as any);
      mockMapper.toDomain.mockReturnValue(domainEntity);

      // When
      const result = await repository.updateBalance(
        mockAffiliateId,
        mockCurrency,
        availableBalanceBigInt,
        pendingBalanceBigInt,
        totalEarnedBigInt,
      );

      // Then
      expect(mockTx.update).toHaveBeenCalledWith({
        where: {
          affiliateId_currency: {
            affiliateId: mockAffiliateId,
            currency: mockCurrency,
          },
        },
        data: {
          availableBalance: expectedAvailableBalance,
          pendingBalance: expectedPendingBalance,
          totalEarned: expectedTotalEarned,
        },
      });
      expect(result).toBe(domainEntity);
    });

    it('bigint 잔액을 올바르게 Prisma.Decimal로 변환한다', async () => {
      // Given
      const availableBalanceBigInt = 50000n;
      const pendingBalanceBigInt = 30000n;
      const totalEarnedBigInt = 100000n;
      const expectedAvailableBalance = new Prisma.Decimal('50000');
      const expectedPendingBalance = new Prisma.Decimal('30000');
      const expectedTotalEarned = new Prisma.Decimal('100000');
      const prismaModel = createMockPrismaModel();
      const domainEntity = createMockDomainEntity();

      mockTx.update.mockResolvedValue(prismaModel as any);
      mockMapper.toDomain.mockReturnValue(domainEntity);

      // When
      await repository.updateBalance(
        mockAffiliateId,
        mockCurrency,
        availableBalanceBigInt,
        pendingBalanceBigInt,
        totalEarnedBigInt,
      );

      // Then
      expect(mockTx.update).toHaveBeenCalledWith({
        where: {
          affiliateId_currency: {
            affiliateId: mockAffiliateId,
            currency: mockCurrency,
          },
        },
        data: {
          availableBalance: expectedAvailableBalance,
          pendingBalance: expectedPendingBalance,
          totalEarned: expectedTotalEarned,
        },
      });
    });

    it('0 값으로 잔액을 초기화한다', async () => {
      // Given
      const zeroBigInt = 0n;
      const expectedZero = new Prisma.Decimal('0');
      const prismaModel = createMockPrismaModel({
        availableBalance: expectedZero,
        pendingBalance: expectedZero,
        totalEarned: expectedZero,
      });
      const domainEntity = createMockDomainEntity({
        availableBalance: expectedZero,
        pendingBalance: expectedZero,
        totalEarned: expectedZero,
      });

      mockTx.update.mockResolvedValue(prismaModel as any);
      mockMapper.toDomain.mockReturnValue(domainEntity);

      // When
      const result = await repository.updateBalance(
        mockAffiliateId,
        mockCurrency,
        zeroBigInt,
        zeroBigInt,
        zeroBigInt,
      );

      // Then
      expect(mockTx.update).toHaveBeenCalledWith({
        where: {
          affiliateId_currency: {
            affiliateId: mockAffiliateId,
            currency: mockCurrency,
          },
        },
        data: {
          availableBalance: expectedZero,
          pendingBalance: expectedZero,
          totalEarned: expectedZero,
        },
      });
      expect(result).toBe(domainEntity);
    });
  });
});
