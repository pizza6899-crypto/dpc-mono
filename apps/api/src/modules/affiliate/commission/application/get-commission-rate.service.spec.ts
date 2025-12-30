// src/modules/affiliate/commission/application/get-commission-rate.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { AffiliateTierLevel, Prisma } from '@repo/database';
import { GetCommissionRateService } from './get-commission-rate.service';
import { AFFILIATE_TIER_REPOSITORY } from '../ports/out/affiliate-tier.repository.token';
import type { AffiliateTierRepositoryPort } from '../ports/out/affiliate-tier.repository.port';
import { AffiliateTier, CommissionPolicy } from '../domain';
import { IdUtil } from 'src/utils/id.util';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';

describe('GetCommissionRateService', () => {
  let service: GetCommissionRateService;
  let mockRepository: jest.Mocked<AffiliateTierRepositoryPort>;
  let mockPolicy: CommissionPolicy;
  let mockDispatchLogService: jest.Mocked<DispatchLogService>;

  const mockAffiliateId = BigInt(123);
  const mockUid = 'tier-1234567890';
  const mockId = BigInt(1);
  const mockBaseRate = new Prisma.Decimal('0.005'); // BRONZE: 0.5%
  const mockCustomRate = new Prisma.Decimal('0.01'); // 1%
  const mockCreatedAt = new Date('2024-01-01T00:00:00Z');
  const mockUpdatedAt = new Date('2024-01-01T00:00:00Z');

  const createMockTier = (overrides?: {
    customRate?: Prisma.Decimal | null;
    isCustomRate?: boolean;
    tier?: AffiliateTierLevel;
    baseRate?: Prisma.Decimal;
  }) => {
    return AffiliateTier.fromPersistence({
      id: mockId,
      uid: mockUid,
      affiliateId: mockAffiliateId,
      tier: overrides?.tier ?? AffiliateTierLevel.BRONZE,
      baseRate: overrides?.baseRate ?? mockBaseRate,
      customRate: overrides?.customRate ?? null,
      isCustomRate: overrides?.isCustomRate ?? false,
      monthlyWagerAmount: new Prisma.Decimal('0'),
      customRateSetBy: null,
      customRateSetAt: null,
      createdAt: mockCreatedAt,
      updatedAt: mockUpdatedAt,
    });
  };

  beforeEach(async () => {
    mockRepository = {
      findByAffiliateId: jest.fn(),
      getByAffiliateId: jest.fn(),
      upsert: jest.fn(),
      updateTier: jest.fn(),
      updateMonthlyWagerAmount: jest.fn(),
      resetMonthlyWagerAmount: jest.fn(),
    };

    mockPolicy = new CommissionPolicy();

    const mockDispatchLogServiceProvider = {
      provide: DispatchLogService,
      useValue: {
        dispatch: jest.fn().mockResolvedValue(undefined),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCommissionRateService,
        {
          provide: AFFILIATE_TIER_REPOSITORY,
          useValue: mockRepository,
        },
        CommissionPolicy,
        mockDispatchLogServiceProvider,
      ],
    }).compile();

    service = module.get<GetCommissionRateService>(GetCommissionRateService);
    mockRepository = module.get(AFFILIATE_TIER_REPOSITORY);
    mockPolicy = module.get(CommissionPolicy);
    mockDispatchLogService = module.get(
      DispatchLogService,
    ) as jest.Mocked<DispatchLogService>;

    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('기존 티어가 있으면 요율 정보를 반환한다', async () => {
      // Given
      const tier = createMockTier();
      mockRepository.findByAffiliateId.mockResolvedValue(tier);

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
      });

      // Then
      expect(result.tier).toBe(tier.tier);
      expect(result.baseRate.toString()).toBe(tier.baseRate.toString());
      expect(result.customRate).toBe(tier.customRate);
      expect(result.isCustomRate).toBe(tier.isCustomRate);
      expect(result.effectiveRate.toString()).toBe(
        tier.getEffectiveRate().toString(),
      );
      expect(mockRepository.findByAffiliateId).toHaveBeenCalledTimes(1);
      expect(mockRepository.findByAffiliateId).toHaveBeenCalledWith(
        mockAffiliateId,
      );
      expect(mockRepository.upsert).not.toHaveBeenCalled();
    });

    it('수동 요율이 설정된 경우 effectiveRate는 customRate를 반환한다', async () => {
      // Given
      const tier = createMockTier({
        customRate: mockCustomRate,
        isCustomRate: true,
      });
      mockRepository.findByAffiliateId.mockResolvedValue(tier);

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
      });

      // Then
      expect(result.isCustomRate).toBe(true);
      expect(result.customRate?.toString()).toBe(mockCustomRate.toString());
      expect(result.effectiveRate.toString()).toBe(mockCustomRate.toString());
      expect(result.effectiveRate.toString()).not.toBe(
        result.baseRate.toString(),
      );
    });

    it('수동 요율이 없는 경우 effectiveRate는 baseRate를 반환한다', async () => {
      // Given
      const tier = createMockTier({
        customRate: null,
        isCustomRate: false,
      });
      mockRepository.findByAffiliateId.mockResolvedValue(tier);

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
      });

      // Then
      expect(result.isCustomRate).toBe(false);
      expect(result.customRate).toBe(null);
      expect(result.effectiveRate.toString()).toBe(result.baseRate.toString());
    });

    it('티어가 없으면 기본 티어(BRONZE)로 생성 후 반환한다', async () => {
      // Given
      mockRepository.findByAffiliateId.mockResolvedValue(null);

      const newTier = createMockTier();
      mockRepository.upsert.mockResolvedValue(newTier);

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
      });

      // Then
      expect(result.tier).toBe(AffiliateTierLevel.BRONZE);
      expect(mockRepository.findByAffiliateId).toHaveBeenCalledTimes(1);
      expect(mockRepository.upsert).toHaveBeenCalledTimes(1);
      expect(mockRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          affiliateId: mockAffiliateId,
          tier: AffiliateTierLevel.BRONZE,
        }),
      );
    });

    it('생성된 기본 티어의 baseRate가 올바르다', async () => {
      // Given
      mockRepository.findByAffiliateId.mockResolvedValue(null);

      const expectedBaseRate = mockPolicy.getBaseRateForTier(
        AffiliateTierLevel.BRONZE,
      );
      const newTier = createMockTier({
        baseRate: expectedBaseRate,
      });
      mockRepository.upsert.mockResolvedValue(newTier);

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
      });

      // Then
      expect(result.baseRate.toString()).toBe(expectedBaseRate.toString());
      expect(result.effectiveRate.toString()).toBe(expectedBaseRate.toString());
    });

    it('다양한 티어 레벨에 대해 정상적으로 처리한다', async () => {
      // Given
      const tierLevels = [
        AffiliateTierLevel.BRONZE,
        AffiliateTierLevel.SILVER,
        AffiliateTierLevel.GOLD,
        AffiliateTierLevel.PLATINUM,
        AffiliateTierLevel.DIAMOND,
      ];

      for (const tierLevel of tierLevels) {
        const baseRate = mockPolicy.getBaseRateForTier(tierLevel);
        const tier = createMockTier({
          tier: tierLevel,
          baseRate,
        });
        mockRepository.findByAffiliateId.mockResolvedValue(tier);

        // When
        const result = await service.execute({
          affiliateId: mockAffiliateId,
        });

        // Then
        expect(result.tier).toBe(tierLevel);
        expect(result.baseRate.toString()).toBe(baseRate.toString());
      }
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
        expect.stringContaining('커미션 요율 조회 실패'),
        repositoryError,
      );

      loggerSpy.mockRestore();
    });

    it('티어 생성 시 upsert 에러 발생 시 Logger에 에러를 기록한다', async () => {
      // Given
      mockRepository.findByAffiliateId.mockResolvedValue(null);
      const upsertError = new Error('Upsert failed');
      mockRepository.upsert.mockRejectedValue(upsertError);

      const loggerSpy = jest.spyOn(service['logger'], 'error');

      // When & Then
      await expect(
        service.execute({
          affiliateId: mockAffiliateId,
        }),
      ).rejects.toThrow(upsertError);

      expect(loggerSpy).toHaveBeenCalledTimes(1);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('커미션 요율 조회 실패'),
        upsertError,
      );

      loggerSpy.mockRestore();
    });

    it('반환된 결과의 모든 필드가 올바르다', async () => {
      // Given
      const tier = createMockTier({
        customRate: mockCustomRate,
        isCustomRate: true,
      });
      mockRepository.findByAffiliateId.mockResolvedValue(tier);

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
      });

      // Then
      expect(result).toHaveProperty('tier');
      expect(result).toHaveProperty('baseRate');
      expect(result).toHaveProperty('customRate');
      expect(result).toHaveProperty('isCustomRate');
      expect(result).toHaveProperty('effectiveRate');
      expect(typeof result.tier).toBe('string');
      expect(result.baseRate).toBeInstanceOf(Prisma.Decimal);
      expect(result.effectiveRate).toBeInstanceOf(Prisma.Decimal);
    });
  });
});
