// src/modules/affiliate/commission/application/find-commission-by-id.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import {
  CommissionStatus,
  ExchangeCurrencyCode,
  Prisma,
} from '@prisma/client';
import { FindCommissionByIdService } from './find-commission-by-id.service';
import { AFFILIATE_COMMISSION_REPOSITORY } from '../ports/out/affiliate-commission.repository.token';
import type { AffiliateCommissionRepositoryPort } from '../ports/out/affiliate-commission.repository.port';
import { AffiliateCommission, InvalidParameterException } from '../domain';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';

describe('FindCommissionByIdService', () => {
  let service: FindCommissionByIdService;
  let mockRepository: jest.Mocked<AffiliateCommissionRepositoryPort>;
  let mockDispatchLogService: jest.Mocked<DispatchLogService>;

  const mockUid = 'cmt-1234567890';
  const mockId = BigInt(1);
  const mockAffiliateId = BigInt(123);
  const mockSubUserId = BigInt(456);
  const mockGameRoundId = BigInt(789);
  const mockCurrency = ExchangeCurrencyCode.USD;
  const mockCreatedAt = new Date('2024-01-01T00:00:00Z');
  const mockUpdatedAt = new Date('2024-01-01T00:00:00Z');

  const createMockCommission = (overrides?: {
    uid?: string;
    id?: bigint;
    status?: CommissionStatus;
  }) => {
    return AffiliateCommission.fromPersistence({
      id: overrides?.id ?? mockId,
      uid: overrides?.uid ?? mockUid,
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
      settlementDate: null,
      claimedAt: null,
      withdrawnAt: null,
      createdAt: mockCreatedAt,
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
      findAffiliateIdsWithPendingCommissions: jest.fn(),
    };

    mockDispatchLogService = {
      dispatch: jest.fn().mockResolvedValue(undefined),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindCommissionByIdService,
        {
          provide: AFFILIATE_COMMISSION_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: DispatchLogService,
          useValue: mockDispatchLogService,
        },
      ],
    }).compile();

    service = module.get<FindCommissionByIdService>(FindCommissionByIdService);
    mockRepository = module.get(AFFILIATE_COMMISSION_REPOSITORY);
    mockDispatchLogService = module.get(DispatchLogService);

    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('uid로 커미션을 조회한다', async () => {
      // Given
      const commission = createMockCommission();
      mockRepository.findByUid.mockResolvedValue(commission);

      // When
      const result = await service.execute({
        uid: mockUid,
      });

      // Then
      expect(result).toBe(commission);
      expect(result?.uid).toBe(mockUid);
      expect(mockRepository.findByUid).toHaveBeenCalledTimes(1);
      expect(mockRepository.findByUid).toHaveBeenCalledWith(mockUid);
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('id로 커미션을 조회한다', async () => {
      // Given
      const commission = createMockCommission();
      mockRepository.findById.mockResolvedValue(commission);

      // When
      const result = await service.execute({
        id: mockId,
      });

      // Then
      expect(result).toBe(commission);
      expect(result?.id).toBe(mockId);
      expect(mockRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockRepository.findById).toHaveBeenCalledWith(mockId);
      expect(mockRepository.findByUid).not.toHaveBeenCalled();
    });

    it('uid와 id가 모두 제공되면 uid를 우선 사용한다', async () => {
      // Given
      const commission = createMockCommission();
      mockRepository.findByUid.mockResolvedValue(commission);

      // When
      const result = await service.execute({
        uid: mockUid,
        id: mockId,
      });

      // Then
      expect(result).toBe(commission);
      expect(mockRepository.findByUid).toHaveBeenCalledTimes(1);
      expect(mockRepository.findByUid).toHaveBeenCalledWith(mockUid);
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('uid로 조회했을 때 커미션이 없으면 null을 반환한다', async () => {
      // Given
      mockRepository.findByUid.mockResolvedValue(null);

      // When
      const result = await service.execute({
        uid: mockUid,
      });

      // Then
      expect(result).toBeNull();
      expect(mockRepository.findByUid).toHaveBeenCalledTimes(1);
    });

    it('id로 조회했을 때 커미션이 없으면 null을 반환한다', async () => {
      // Given
      mockRepository.findById.mockResolvedValue(null);

      // When
      const result = await service.execute({
        id: mockId,
      });

      // Then
      expect(result).toBeNull();
      expect(mockRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('uid와 id가 모두 없으면 InvalidParameterException을 발생시킨다', async () => {
      // When & Then
      await expect(
        service.execute({
          uid: undefined,
          id: undefined,
        }),
      ).rejects.toThrow(InvalidParameterException);

      await expect(
        service.execute({
          uid: undefined,
          id: undefined,
        }),
      ).rejects.toThrow('Either uid or id must be provided');

      expect(mockRepository.findByUid).not.toHaveBeenCalled();
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('Repository findByUid 에러 발생 시 Logger에 에러를 기록한다', async () => {
      // Given
      const repositoryError = new Error('Database connection failed');
      mockRepository.findByUid.mockRejectedValue(repositoryError);

      const loggerSpy = jest.spyOn(service['logger'], 'error');

      // When & Then
      await expect(
        service.execute({
          uid: mockUid,
        }),
      ).rejects.toThrow(repositoryError);

      expect(loggerSpy).toHaveBeenCalledTimes(1);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('커미션 조회 실패'),
        repositoryError,
      );

      loggerSpy.mockRestore();
    });

    it('Repository findById 에러 발생 시 Logger에 에러를 기록한다', async () => {
      // Given
      const repositoryError = new Error('Database connection failed');
      mockRepository.findById.mockRejectedValue(repositoryError);

      const loggerSpy = jest.spyOn(service['logger'], 'error');

      // When & Then
      await expect(
        service.execute({
          id: mockId,
        }),
      ).rejects.toThrow(repositoryError);

      expect(loggerSpy).toHaveBeenCalledTimes(1);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('커미션 조회 실패'),
        repositoryError,
      );

      loggerSpy.mockRestore();
    });

    it('파라미터 검증 에러는 Logger에 기록하지 않는다', async () => {
      // Given
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      // When & Then
      await expect(
        service.execute({
          uid: undefined,
          id: undefined,
        }),
      ).rejects.toThrow(InvalidParameterException);

      expect(loggerSpy).not.toHaveBeenCalled();

      loggerSpy.mockRestore();
    });

    it('다양한 상태의 커미션을 조회한다', async () => {
      // Given
      const statuses = [
        CommissionStatus.PENDING,
        CommissionStatus.AVAILABLE,
        CommissionStatus.CLAIMED,
      ];

      for (const status of statuses) {
        const commission = createMockCommission({ status });
        mockRepository.findByUid.mockResolvedValue(commission);

        // When
        const result = await service.execute({
          uid: mockUid,
        });

        // Then
        expect(result?.status).toBe(status);
      }
    });

    it('BigInt id로 커미션을 조회한다', async () => {
      // Given
      const largeId = BigInt('9223372036854775807'); // 최대 BigInt 값
      const commission = createMockCommission({ id: largeId });
      mockRepository.findById.mockResolvedValue(commission);

      // When
      const result = await service.execute({
        id: largeId,
      });

      // Then
      expect(result).toBe(commission);
      expect(result?.id).toBe(largeId);
      expect(mockRepository.findById).toHaveBeenCalledWith(largeId);
    });
  });
});
