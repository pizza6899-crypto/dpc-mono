// src/modules/affiliate/commission/infrastructure/affiliate-commission.repository.spec.ts
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import {
  CommissionStatus,
  ExchangeCurrencyCode,
  Prisma,
} from '@prisma/client';
import { AffiliateCommission, CommissionNotFoundException } from '../domain';
import type { AffiliateCommissionMapper } from './affiliate-commission.mapper';
import { AffiliateCommissionRepository } from './affiliate-commission.repository';

describe('AffiliateCommissionRepository', () => {
  let repository: AffiliateCommissionRepository;
  let mockTx: jest.Mocked<
    Transaction<TransactionalAdapterPrisma>['affiliateCommission']
  >;
  let mockMapper: jest.Mocked<AffiliateCommissionMapper>;

  const mockUid = 'cmt-1234567890';
  const mockId = BigInt(1);
  const mockAffiliateId = 'affiliate-123';
  const mockSubUserId = 'user-456';
  const mockGameRoundId = BigInt(789);
  const mockCurrency = ExchangeCurrencyCode.USD;
  const mockCreatedAt = new Date('2024-01-01T00:00:00Z');
  const mockUpdatedAt = new Date('2024-01-01T00:00:00Z');

  const createMockPrismaModel = (overrides?: {
    status?: CommissionStatus;
    settlementDate?: Date | null;
    claimedAt?: Date | null;
    withdrawnAt?: Date | null;
  }) => ({
    id: mockId,
    uid: mockUid,
    affiliateId: mockAffiliateId,
    subUserId: mockSubUserId,
    gameRoundId: mockGameRoundId,
    wagerAmount: new Prisma.Decimal('10000'),
    winAmount: new Prisma.Decimal('5000'),
    commission: new Prisma.Decimal('100'),
    rateApplied: new Prisma.Decimal('0.01'),
    currency: mockCurrency,
    status: overrides?.status ?? CommissionStatus.PENDING,
    gameCategory: "SLOTS",
    settlementDate: overrides?.settlementDate ?? null,
    claimedAt: overrides?.claimedAt ?? null,
    withdrawnAt: overrides?.withdrawnAt ?? null,
    createdAt: mockCreatedAt,
    updatedAt: mockUpdatedAt,
  });

  const createMockDomainEntity = () => {
    return AffiliateCommission.fromPersistence({
      id: mockId,
      uid: mockUid,
      affiliateId: mockAffiliateId,
      subUserId: mockSubUserId,
      gameRoundId: mockGameRoundId,
      wagerAmount: new Prisma.Decimal('10000'),
      winAmount: new Prisma.Decimal('5000'),
      commission: new Prisma.Decimal('100'),
      rateApplied: new Prisma.Decimal('0.01'),
      currency: mockCurrency,
      status: CommissionStatus.PENDING,
      gameCategory: "SLOTS",
      settlementDate: null,
      claimedAt: null,
      withdrawnAt: null,
      createdAt: mockCreatedAt,
      updatedAt: mockUpdatedAt,
    });
  };

  beforeEach(() => {
    // Mock Transaction
    mockTx = {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    } as any;

    const mockTransaction = {
      affiliateCommission: mockTx,
    } as unknown as Transaction<TransactionalAdapterPrisma>;

    // Mock Mapper
    mockMapper = {
      toDomain: jest.fn(),
      toPrisma: jest.fn(),
    } as any;

    // InjectTransaction 데코레이터를 우회하기 위해 직접 인스턴스화
    repository = new AffiliateCommissionRepository(mockTransaction, mockMapper);

    jest.clearAllMocks();
  });

  describe('findByUid', () => {
    it('UID로 커미션을 조회한다', async () => {
      // Given
      const prismaModel = createMockPrismaModel();
      const domainEntity = createMockDomainEntity();
      mockTx.findUnique.mockResolvedValue(prismaModel as any);
      mockMapper.toDomain.mockReturnValue(domainEntity);

      // When
      const result = await repository.findByUid(mockUid);

      // Then
      expect(mockTx.findUnique).toHaveBeenCalledWith({
        where: { uid: mockUid },
      });
      expect(mockMapper.toDomain).toHaveBeenCalledWith(prismaModel);
      expect(result).toBe(domainEntity);
    });

    it('커미션이 없으면 null을 반환한다', async () => {
      // Given
      mockTx.findUnique.mockResolvedValue(null);

      // When
      const result = await repository.findByUid(mockUid);

      // Then
      expect(mockTx.findUnique).toHaveBeenCalledWith({
        where: { uid: mockUid },
      });
      expect(mockMapper.toDomain).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('getByUid', () => {
    it('UID로 커미션을 조회하고 반환한다', async () => {
      // Given
      const prismaModel = createMockPrismaModel();
      const domainEntity = createMockDomainEntity();
      mockTx.findUnique.mockResolvedValue(prismaModel as any);
      mockMapper.toDomain.mockReturnValue(domainEntity);

      // When
      const result = await repository.getByUid(mockUid);

      // Then
      expect(mockTx.findUnique).toHaveBeenCalledWith({
        where: { uid: mockUid },
      });
      expect(result).toBe(domainEntity);
    });

    it('커미션이 없으면 CommissionNotFoundException을 던진다', async () => {
      // Given
      mockTx.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(repository.getByUid(mockUid)).rejects.toThrow(
        CommissionNotFoundException,
      );
      expect(mockTx.findUnique).toHaveBeenCalledWith({
        where: { uid: mockUid },
      });
    });
  });

  describe('findById', () => {
    it('ID로 커미션을 조회한다', async () => {
      // Given
      const prismaModel = createMockPrismaModel();
      const domainEntity = createMockDomainEntity();
      mockTx.findUnique.mockResolvedValue(prismaModel as any);
      mockMapper.toDomain.mockReturnValue(domainEntity);

      // When
      const result = await repository.findById(mockId);

      // Then
      expect(mockTx.findUnique).toHaveBeenCalledWith({
        where: { id: mockId },
      });
      expect(mockMapper.toDomain).toHaveBeenCalledWith(prismaModel);
      expect(result).toBe(domainEntity);
    });

    it('커미션이 없으면 null을 반환한다', async () => {
      // Given
      mockTx.findUnique.mockResolvedValue(null);

      // When
      const result = await repository.findById(mockId);

      // Then
      expect(mockTx.findUnique).toHaveBeenCalledWith({
        where: { id: mockId },
      });
      expect(result).toBeNull();
    });
  });

  describe('getById', () => {
    it('ID로 커미션을 조회하고 반환한다', async () => {
      // Given
      const prismaModel = createMockPrismaModel();
      const domainEntity = createMockDomainEntity();
      mockTx.findUnique.mockResolvedValue(prismaModel as any);
      mockMapper.toDomain.mockReturnValue(domainEntity);

      // When
      const result = await repository.getById(mockId);

      // Then
      expect(mockTx.findUnique).toHaveBeenCalledWith({
        where: { id: mockId },
      });
      expect(result).toBe(domainEntity);
    });

    it('커미션이 없으면 CommissionNotFoundException을 던진다', async () => {
      // Given
      mockTx.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(repository.getById(mockId)).rejects.toThrow(
        CommissionNotFoundException,
      );
    });
  });

  describe('findByAffiliateId', () => {
    it('어필리에이트 ID로 커미션 목록을 조회한다', async () => {
      // Given
      const prismaModels = [createMockPrismaModel()];
      const domainEntities = [createMockDomainEntity()];
      mockTx.findMany.mockResolvedValue(prismaModels as any);
      mockMapper.toDomain.mockReturnValue(domainEntities[0]);

      // When
      const result = await repository.findByAffiliateId(mockAffiliateId);

      // Then
      expect(mockTx.findMany).toHaveBeenCalledWith({
        where: { affiliateId: mockAffiliateId },
        take: undefined,
        skip: undefined,
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(domainEntities);
    });

    it('상태 필터로 커미션 목록을 조회한다', async () => {
      // Given
      const prismaModels = [createMockPrismaModel()];
      const domainEntities = [createMockDomainEntity()];
      mockTx.findMany.mockResolvedValue(prismaModels as any);
      mockMapper.toDomain.mockReturnValue(domainEntities[0]);

      // When
      const result = await repository.findByAffiliateId(mockAffiliateId, {
        status: CommissionStatus.PENDING,
      });

      // Then
      expect(mockTx.findMany).toHaveBeenCalledWith({
        where: {
          affiliateId: mockAffiliateId,
          status: CommissionStatus.PENDING,
        },
        take: undefined,
        skip: undefined,
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(domainEntities);
    });

    it('통화 필터로 커미션 목록을 조회한다', async () => {
      // Given
      const prismaModels = [createMockPrismaModel()];
      const domainEntities = [createMockDomainEntity()];
      mockTx.findMany.mockResolvedValue(prismaModels as any);
      mockMapper.toDomain.mockReturnValue(domainEntities[0]);

      // When
      const result = await repository.findByAffiliateId(mockAffiliateId, {
        currency: mockCurrency,
      });

      // Then
      expect(mockTx.findMany).toHaveBeenCalledWith({
        where: {
          affiliateId: mockAffiliateId,
          currency: mockCurrency,
        },
        take: undefined,
        skip: undefined,
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(domainEntities);
    });

    it('날짜 범위 필터로 커미션 목록을 조회한다', async () => {
      // Given
      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-12-31T23:59:59Z');
      const prismaModels = [createMockPrismaModel()];
      const domainEntities = [createMockDomainEntity()];
      mockTx.findMany.mockResolvedValue(prismaModels as any);
      mockMapper.toDomain.mockReturnValue(domainEntities[0]);

      // When
      const result = await repository.findByAffiliateId(mockAffiliateId, {
        startDate,
        endDate,
      });

      // Then
      expect(mockTx.findMany).toHaveBeenCalledWith({
        where: {
          affiliateId: mockAffiliateId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        take: undefined,
        skip: undefined,
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(domainEntities);
    });

    it('limit와 offset으로 페이지네이션한다', async () => {
      // Given
      const prismaModels = [createMockPrismaModel()];
      const domainEntities = [createMockDomainEntity()];
      mockTx.findMany.mockResolvedValue(prismaModels as any);
      mockMapper.toDomain.mockReturnValue(domainEntities[0]);

      // When
      const result = await repository.findByAffiliateId(mockAffiliateId, {
        limit: 10,
        offset: 20,
      });

      // Then
      expect(mockTx.findMany).toHaveBeenCalledWith({
        where: { affiliateId: mockAffiliateId },
        take: 10,
        skip: 20,
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(domainEntities);
    });
  });

  describe('countByAffiliateId', () => {
    it('어필리에이트 ID로 커미션 개수를 조회한다', async () => {
      // Given
      mockTx.count.mockResolvedValue(5);

      // When
      const result = await repository.countByAffiliateId(mockAffiliateId);

      // Then
      expect(mockTx.count).toHaveBeenCalledWith({
        where: { affiliateId: mockAffiliateId },
      });
      expect(result).toBe(5);
    });

    it('필터 옵션으로 커미션 개수를 조회한다', async () => {
      // Given
      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-12-31T23:59:59Z');
      mockTx.count.mockResolvedValue(3);

      // When
      const result = await repository.countByAffiliateId(mockAffiliateId, {
        status: CommissionStatus.PENDING,
        currency: mockCurrency,
        startDate,
        endDate,
      });

      // Then
      expect(mockTx.count).toHaveBeenCalledWith({
        where: {
          affiliateId: mockAffiliateId,
          status: CommissionStatus.PENDING,
          currency: mockCurrency,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });
      expect(result).toBe(3);
    });
  });

  describe('findPendingByAffiliateId', () => {
    it('정산 대기 중인 커미션 목록을 조회한다', async () => {
      // Given
      const prismaModels = [createMockPrismaModel()];
      const domainEntities = [createMockDomainEntity()];
      mockTx.findMany.mockResolvedValue(prismaModels as any);
      mockMapper.toDomain.mockReturnValue(domainEntities[0]);

      // When
      const result = await repository.findPendingByAffiliateId(
        mockAffiliateId,
        mockCurrency,
      );

      // Then
      expect(mockTx.findMany).toHaveBeenCalledWith({
        where: {
          affiliateId: mockAffiliateId,
          currency: mockCurrency,
          status: CommissionStatus.PENDING,
        },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual(domainEntities);
    });
  });

  describe('findByGameRoundId', () => {
    it('게임 라운드 ID로 커미션을 조회한다', async () => {
      // Given
      const prismaModel = createMockPrismaModel();
      const domainEntity = createMockDomainEntity();
      mockTx.findFirst.mockResolvedValue(prismaModel as any);
      mockMapper.toDomain.mockReturnValue(domainEntity);

      // When
      const result = await repository.findByGameRoundId(mockGameRoundId);

      // Then
      expect(mockTx.findFirst).toHaveBeenCalledWith({
        where: { gameRoundId: mockGameRoundId },
      });
      expect(mockMapper.toDomain).toHaveBeenCalledWith(prismaModel);
      expect(result).toBe(domainEntity);
    });

    it('커미션이 없으면 null을 반환한다', async () => {
      // Given
      mockTx.findFirst.mockResolvedValue(null);

      // When
      const result = await repository.findByGameRoundId(mockGameRoundId);

      // Then
      expect(mockTx.findFirst).toHaveBeenCalledWith({
        where: { gameRoundId: mockGameRoundId },
      });
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('새 커미션을 생성한다', async () => {
      // Given
      const domainEntity = createMockDomainEntity();
      const prismaData = {
        id: null,
        uid: mockUid,
        affiliateId: mockAffiliateId,
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: new Prisma.Decimal('10000'),
        winAmount: new Prisma.Decimal('5000'),
        commission: new Prisma.Decimal('100'),
        rateApplied: new Prisma.Decimal('0.01'),
        currency: mockCurrency,
        status: CommissionStatus.PENDING,
        gameCategory: "SLOTS",
        settlementDate: null,
        claimedAt: null,
        withdrawnAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      };
      const createdPrismaModel = createMockPrismaModel();
      const createdDomainEntity = createMockDomainEntity();

      mockMapper.toPrisma.mockReturnValue(prismaData);
      mockTx.create.mockResolvedValue(createdPrismaModel as any);
      mockMapper.toDomain.mockReturnValue(createdDomainEntity);

      // When
      const result = await repository.create(domainEntity);

      // Then
      expect(mockMapper.toPrisma).toHaveBeenCalledWith(domainEntity);
      expect(mockTx.create).toHaveBeenCalledWith({
        data: {
          uid: prismaData.uid,
          affiliateId: prismaData.affiliateId,
          subUserId: prismaData.subUserId,
          gameRoundId: prismaData.gameRoundId,
          wagerAmount: prismaData.wagerAmount,
          winAmount: prismaData.winAmount,
          commission: prismaData.commission,
          rateApplied: prismaData.rateApplied,
          currency: prismaData.currency,
          status: prismaData.status,
          gameCategory: prismaData.gameCategory,
          settlementDate: prismaData.settlementDate,
          claimedAt: prismaData.claimedAt,
          withdrawnAt: prismaData.withdrawnAt,
          createdAt: prismaData.createdAt,
          updatedAt: prismaData.updatedAt,
        },
      });
      expect(mockMapper.toDomain).toHaveBeenCalledWith(createdPrismaModel);
      expect(result).toBe(createdDomainEntity);
    });
  });

  describe('updateStatus', () => {
    it('커미션 상태를 업데이트한다', async () => {
      // Given
      const newStatus = CommissionStatus.AVAILABLE;
      const settlementDate = new Date('2024-01-15T00:00:00Z');
      const prismaModel = createMockPrismaModel({
        status: newStatus,
        settlementDate,
      });
      const domainEntity = createMockDomainEntity();

      mockTx.update.mockResolvedValue(prismaModel as any);
      mockMapper.toDomain.mockReturnValue(domainEntity);

      // When
      const result = await repository.updateStatus(
        mockUid,
        newStatus,
        settlementDate,
      );

      // Then
      expect(mockTx.update).toHaveBeenCalledWith({
        where: { uid: mockUid },
        data: {
          status: newStatus,
          settlementDate,
          updatedAt: expect.any(Date),
        },
      });
      expect(result).toBe(domainEntity);
    });

    it('선택적 필드 없이 상태만 업데이트한다', async () => {
      // Given
      const newStatus = CommissionStatus.CLAIMED;
      const prismaModel = createMockPrismaModel({
        status: newStatus,
      });
      const domainEntity = createMockDomainEntity();

      mockTx.update.mockResolvedValue(prismaModel as any);
      mockMapper.toDomain.mockReturnValue(domainEntity);

      // When
      const result = await repository.updateStatus(mockUid, newStatus);

      // Then
      expect(mockTx.update).toHaveBeenCalledWith({
        where: { uid: mockUid },
        data: {
          status: newStatus,
          updatedAt: expect.any(Date),
        },
      });
      expect(result).toBe(domainEntity);
    });

    it('null 값으로 필드를 초기화한다', async () => {
      // Given
      const newStatus = CommissionStatus.PENDING;
      const prismaModel = createMockPrismaModel();
      const domainEntity = createMockDomainEntity();

      mockTx.update.mockResolvedValue(prismaModel as any);
      mockMapper.toDomain.mockReturnValue(domainEntity);

      // When
      const result = await repository.updateStatus(
        mockUid,
        newStatus,
        null,
        null,
        null,
      );

      // Then
      expect(mockTx.update).toHaveBeenCalledWith({
        where: { uid: mockUid },
        data: {
          status: newStatus,
          settlementDate: null,
          claimedAt: null,
          withdrawnAt: null,
          updatedAt: expect.any(Date),
        },
      });
      expect(result).toBe(domainEntity);
    });
  });

  describe('settlePendingCommissions', () => {
    it('정산 대기 중인 커미션을 일괄 정산 처리한다', async () => {
      // Given
      const commissionIds = [BigInt(1), BigInt(2), BigInt(3)];
      const settlementDate = new Date('2024-01-15T00:00:00Z');
      mockTx.updateMany.mockResolvedValue({ count: 3 } as any);

      // When
      const result = await repository.settlePendingCommissions(
        commissionIds,
        settlementDate,
      );

      // Then
      expect(mockTx.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: commissionIds },
          status: CommissionStatus.PENDING,
        },
        data: {
          status: CommissionStatus.AVAILABLE,
          settlementDate,
          updatedAt: expect.any(Date),
        },
      });
      expect(result).toBe(3);
    });

    it('정산할 커미션이 없으면 0을 반환한다', async () => {
      // Given
      const commissionIds: bigint[] = [];
      const settlementDate = new Date('2024-01-15T00:00:00Z');

      // When
      const result = await repository.settlePendingCommissions(
        commissionIds,
        settlementDate,
      );

      // Then
      expect(mockTx.updateMany).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });
  });
});
