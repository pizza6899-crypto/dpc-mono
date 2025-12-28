// src/modules/affiliate/commission/application/find-commissions.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import {
  CommissionStatus,
  ExchangeCurrencyCode,
  GameCategory,
  Prisma,
} from '@repo/database';
import { FindCommissionsService } from './find-commissions.service';
import { AFFILIATE_COMMISSION_REPOSITORY } from '../ports/out/affiliate-commission.repository.token';
import type { AffiliateCommissionRepositoryPort } from '../ports/out/affiliate-commission.repository.port';
import { AffiliateCommission } from '../domain';

describe('FindCommissionsService', () => {
  let service: FindCommissionsService;
  let mockRepository: jest.Mocked<AffiliateCommissionRepositoryPort>;

  const mockAffiliateId = 'affiliate-123';
  const mockUid1 = 'cmt-1234567890';
  const mockUid2 = 'cmt-0987654321';
  const mockId1 = BigInt(1);
  const mockId2 = BigInt(2);
  const mockSubUserId = 'user-456';
  const mockGameRoundId = BigInt(789);
  const mockCurrency = ExchangeCurrencyCode.USD;
  const mockCurrency2 = ExchangeCurrencyCode.KRW;
  const mockCreatedAt = new Date('2024-01-01T00:00:00Z');
  const mockUpdatedAt = new Date('2024-01-01T00:00:00Z');

  const createMockCommission = (overrides?: {
    uid?: string;
    id?: bigint;
    status?: CommissionStatus;
    currency?: ExchangeCurrencyCode;
    createdAt?: Date;
  }) => {
    return AffiliateCommission.fromPersistence({
      id: overrides?.id ?? mockId1,
      uid: overrides?.uid ?? mockUid1,
      affiliateId: mockAffiliateId,
      subUserId: mockSubUserId,
      gameRoundId: mockGameRoundId,
      wagerAmount: new Prisma.Decimal('10000'),
      winAmount: new Prisma.Decimal('5000'),
      commission: new Prisma.Decimal('100'),
      rateApplied: new Prisma.Decimal('0.01'),
      currency: overrides?.currency ?? mockCurrency,
      status: overrides?.status ?? CommissionStatus.PENDING,
      gameCategory: GameCategory.SLOTS,
      settlementDate: null,
      claimedAt: null,
      withdrawnAt: null,
      createdAt: overrides?.createdAt ?? mockCreatedAt,
      updatedAt: mockUpdatedAt,
    });
  };

  beforeEach(async () => {
    mockRepository = {
      findByUid: jest.fn(),
      getByUid: jest.fn(),
      findById: jest.fn(),
      getById: jest.fn(),
      findByAffiliateId: jest.fn(),
      countByAffiliateId: jest.fn(),
      findPendingByAffiliateId: jest.fn(),
      findByGameRoundId: jest.fn(),
      create: jest.fn(),
      updateStatus: jest.fn(),
      settlePendingCommissions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindCommissionsService,
        {
          provide: AFFILIATE_COMMISSION_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<FindCommissionsService>(FindCommissionsService);
    mockRepository = module.get(AFFILIATE_COMMISSION_REPOSITORY);

    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('affiliateId로 커미션 목록을 조회한다', async () => {
      // Given
      const commissions = [
        createMockCommission(),
        createMockCommission({
          uid: mockUid2,
          id: mockId2,
        }),
      ];
      mockRepository.findByAffiliateId.mockResolvedValue(commissions);

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
      });

      // Then
      expect(result).toBe(commissions);
      expect(result).toHaveLength(2);
      expect(mockRepository.findByAffiliateId).toHaveBeenCalledTimes(1);
      expect(mockRepository.findByAffiliateId).toHaveBeenCalledWith(
        mockAffiliateId,
        undefined,
      );
    });

    it('status 필터로 커미션을 조회한다', async () => {
      // Given
      const commissions = [
        createMockCommission({ status: CommissionStatus.AVAILABLE }),
      ];
      mockRepository.findByAffiliateId.mockResolvedValue(commissions);

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
        options: {
          status: CommissionStatus.AVAILABLE,
        },
      });

      // Then
      expect(result).toBe(commissions);
      expect(mockRepository.findByAffiliateId).toHaveBeenCalledWith(
        mockAffiliateId,
        {
          status: CommissionStatus.AVAILABLE,
        },
      );
    });

    it('currency 필터로 커미션을 조회한다', async () => {
      // Given
      const commissions = [createMockCommission({ currency: mockCurrency2 })];
      mockRepository.findByAffiliateId.mockResolvedValue(commissions);

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
        options: {
          currency: mockCurrency2,
        },
      });

      // Then
      expect(result).toBe(commissions);
      expect(mockRepository.findByAffiliateId).toHaveBeenCalledWith(
        mockAffiliateId,
        {
          currency: mockCurrency2,
        },
      );
    });

    it('날짜 범위 필터로 커미션을 조회한다', async () => {
      // Given
      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-31T23:59:59Z');
      const commissions = [createMockCommission()];
      mockRepository.findByAffiliateId.mockResolvedValue(commissions);

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
        options: {
          startDate,
          endDate,
        },
      });

      // Then
      expect(result).toBe(commissions);
      expect(mockRepository.findByAffiliateId).toHaveBeenCalledWith(
        mockAffiliateId,
        {
          startDate,
          endDate,
        },
      );
    });

    it('페이지네이션 옵션으로 커미션을 조회한다', async () => {
      // Given
      const commissions = [createMockCommission()];
      mockRepository.findByAffiliateId.mockResolvedValue(commissions);

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
        options: {
          limit: 10,
          offset: 20,
        },
      });

      // Then
      expect(result).toBe(commissions);
      expect(mockRepository.findByAffiliateId).toHaveBeenCalledWith(
        mockAffiliateId,
        {
          limit: 10,
          offset: 20,
        },
      );
    });

    it('모든 필터 옵션을 조합하여 커미션을 조회한다', async () => {
      // Given
      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-31T23:59:59Z');
      const commissions = [
        createMockCommission({
          status: CommissionStatus.AVAILABLE,
          currency: mockCurrency,
        }),
      ];
      mockRepository.findByAffiliateId.mockResolvedValue(commissions);

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
        options: {
          status: CommissionStatus.AVAILABLE,
          currency: mockCurrency,
          startDate,
          endDate,
          limit: 50,
          offset: 0,
        },
      });

      // Then
      expect(result).toBe(commissions);
      expect(mockRepository.findByAffiliateId).toHaveBeenCalledWith(
        mockAffiliateId,
        {
          status: CommissionStatus.AVAILABLE,
          currency: mockCurrency,
          startDate,
          endDate,
          limit: 50,
          offset: 0,
        },
      );
    });

    it('커미션이 없으면 빈 배열을 반환한다', async () => {
      // Given
      mockRepository.findByAffiliateId.mockResolvedValue([]);

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
      });

      // Then
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('다양한 상태의 커미션을 조회한다', async () => {
      // Given
      const statuses = [
        CommissionStatus.PENDING,
        CommissionStatus.AVAILABLE,
        CommissionStatus.CLAIMED,
      ];

      for (const status of statuses) {
        const commissions = [createMockCommission({ status })];
        mockRepository.findByAffiliateId.mockResolvedValue(commissions);

        // When
        const result = await service.execute({
          affiliateId: mockAffiliateId,
          options: { status },
        });

        // Then
        expect(result).toBe(commissions);
        expect(result[0].status).toBe(status);
      }
    });

    it('USD 통화의 커미션을 조회한다', async () => {
      // Given
      const commissions = [
        createMockCommission({ currency: ExchangeCurrencyCode.USD }),
      ];
      mockRepository.findByAffiliateId.mockResolvedValue(commissions);

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
        options: { currency: ExchangeCurrencyCode.USD },
      });

      // Then
      expect(result).toBe(commissions);
      expect(result[0].currency).toBe(ExchangeCurrencyCode.USD);
    });

    it('KRW 통화의 커미션을 조회한다', async () => {
      // Given
      const commissions = [
        createMockCommission({ currency: ExchangeCurrencyCode.KRW }),
      ];
      mockRepository.findByAffiliateId.mockResolvedValue(commissions);

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
        options: { currency: ExchangeCurrencyCode.KRW },
      });

      // Then
      expect(result).toBe(commissions);
      expect(result[0].currency).toBe(ExchangeCurrencyCode.KRW);
    });

    it('Repository 에러 발생 시 Logger에 에러를 기록한다', async () => {
      // Given
      const repositoryError = new Error('Database connection failed');
      mockRepository.findByAffiliateId.mockRejectedValue(repositoryError);

      const loggerSpy = jest.spyOn(service['logger'], 'error');

      // When & Then
      await expect(
        service.execute({
          affiliateId: mockAffiliateId,
        }),
      ).rejects.toThrow(repositoryError);

      expect(loggerSpy).toHaveBeenCalledTimes(1);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('커미션 목록 조회 실패'),
        repositoryError,
      );

      loggerSpy.mockRestore();
    });

    it('옵션이 포함된 에러 발생 시 Logger에 옵션 정보를 기록한다', async () => {
      // Given
      const repositoryError = new Error('Database connection failed');
      const options = {
        status: CommissionStatus.AVAILABLE,
        currency: mockCurrency,
      };
      mockRepository.findByAffiliateId.mockRejectedValue(repositoryError);

      const loggerSpy = jest.spyOn(service['logger'], 'error');

      // When & Then
      await expect(
        service.execute({
          affiliateId: mockAffiliateId,
          options,
        }),
      ).rejects.toThrow(repositoryError);

      expect(loggerSpy).toHaveBeenCalledTimes(1);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('커미션 목록 조회 실패'),
        repositoryError,
      );
      // 옵션 정보가 로그에 포함되는지 확인
      const logCall = loggerSpy.mock.calls[0][0];
      expect(logCall).toContain(mockAffiliateId);

      loggerSpy.mockRestore();
    });
  });
});
