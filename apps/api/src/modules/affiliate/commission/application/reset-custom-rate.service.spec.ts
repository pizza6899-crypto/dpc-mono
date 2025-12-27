// src/modules/affiliate/commission/application/reset-custom-rate.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AffiliateTierLevel, Prisma } from '@prisma/client';
import { ResetCustomRateService } from './reset-custom-rate.service';
import { AFFILIATE_TIER_REPOSITORY } from '../ports/out/affiliate-tier.repository.token';
import type { AffiliateTierRepositoryPort } from '../ports/out/affiliate-tier.repository.port';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';
import { ActivityType } from 'src/platform/activity-log/activity-log.types';
import { AffiliateTier } from '../domain';
import { TierNotFoundException } from '../domain/commission.exception';
import { PrismaModule } from 'src/platform/prisma/prisma.module';
import { EnvModule } from 'src/platform/env/env.module';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';

describe('ResetCustomRateService', () => {
  let service: ResetCustomRateService;
  let mockRepository: jest.Mocked<AffiliateTierRepositoryPort>;
  let mockActivityLog: jest.Mocked<ActivityLogPort>;

  const mockAffiliateId = 'affiliate-123';
  const mockResetBy = 'admin-456';
  const mockUid = 'tier-1234567890';
  const mockId = BigInt(1);
  const mockBaseRate = new Prisma.Decimal('0.005'); // BRONZE: 0.5%
  const mockCustomRate = new Prisma.Decimal('0.01'); // 1%
  const mockCreatedAt = new Date('2024-01-01T00:00:00Z');
  const mockUpdatedAt = new Date('2024-01-01T00:00:00Z');
  const mockCustomRateSetBy = 'admin-789';
  const mockCustomRateSetAt = new Date('2024-01-02T00:00:00Z');

  const mockRequestInfo: RequestClientInfo = {
    ip: '127.0.0.1',
    userAgent: 'test-agent',
    browser: 'Chrome',
    os: 'Windows',
    isMobile: false,
    threat: 'low',
    bot: false,
    country: 'KR',
    city: 'Seoul',
    referer: 'https://example.com',
    acceptLanguage: 'en-US,en;q=0.9',
    fingerprint: 'test-fingerprint',
    protocol: 'https',
    method: 'GET',
    path: '/api/v1/commission/rate/reset',
    timestamp: new Date(),
    timezone: 'Asia/Seoul',
    isp: 'ISP',
    asn: 'AS123',
  };

  const createMockTier = (overrides?: {
    customRate?: Prisma.Decimal | null;
    isCustomRate?: boolean;
    tier?: AffiliateTierLevel;
    baseRate?: Prisma.Decimal;
    customRateSetBy?: string | null;
    customRateSetAt?: Date | null;
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
      customRateSetBy: overrides?.customRateSetBy ?? null,
      customRateSetAt: overrides?.customRateSetAt ?? null,
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

    mockActivityLog = {
      log: jest.fn(),
      logSuccess: jest.fn(),
      logFailure: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, EnvModule], // TransactionHost를 위해 필요
      providers: [
        ResetCustomRateService,
        {
          provide: AFFILIATE_TIER_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: ACTIVITY_LOG,
          useValue: mockActivityLog,
        },
      ],
    }).compile();

    service = module.get<ResetCustomRateService>(ResetCustomRateService);
    mockRepository = module.get(AFFILIATE_TIER_REPOSITORY);
    mockActivityLog = module.get(ACTIVITY_LOG);

    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('정상적으로 수동 요율을 해제한다', async () => {
      // Given
      const tier = createMockTier({
        customRate: mockCustomRate,
        isCustomRate: true,
        customRateSetBy: mockCustomRateSetBy,
        customRateSetAt: mockCustomRateSetAt,
      });
      const updatedTier = createMockTier({
        customRate: null,
        isCustomRate: false,
        customRateSetBy: null,
        customRateSetAt: null,
      });

      mockRepository.getByAffiliateId.mockResolvedValue(tier);
      mockRepository.upsert.mockResolvedValue(updatedTier);

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
        resetBy: mockResetBy,
      });

      // Then
      expect(result).toBe(updatedTier);
      expect(result.customRate).toBeNull();
      expect(result.isCustomRate).toBe(false);
      expect(result.customRateSetBy).toBeNull();
      expect(result.customRateSetAt).toBeNull();
      expect(mockRepository.getByAffiliateId).toHaveBeenCalledWith(
        mockAffiliateId,
      );
      expect(mockRepository.upsert).toHaveBeenCalled();
      expect(mockActivityLog.logSuccess).not.toHaveBeenCalled();
    });

    it('requestInfo가 있을 때 Activity Log에 성공 로그를 기록한다', async () => {
      // Given
      const tier = createMockTier({
        customRate: mockCustomRate,
        isCustomRate: true,
        customRateSetBy: mockCustomRateSetBy,
        customRateSetAt: mockCustomRateSetAt,
      });
      const updatedTier = createMockTier({
        customRate: null,
        isCustomRate: false,
        customRateSetBy: null,
        customRateSetAt: null,
      });

      mockRepository.getByAffiliateId.mockResolvedValue(tier);
      mockRepository.upsert.mockResolvedValue(updatedTier);

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
        resetBy: mockResetBy,
        requestInfo: mockRequestInfo,
      });

      // Then
      expect(result).toBe(updatedTier);
      expect(mockActivityLog.logSuccess).toHaveBeenCalledTimes(1);
      expect(mockActivityLog.logSuccess).toHaveBeenCalledWith(
        {
          userId: mockResetBy, // 관리자 ID (액션을 수행한 사용자)
          isAdmin: true,
          activityType: ActivityType.COMMISSION_RATE_RESET,
          description: `커미션 수동 요율 해제 완료 - 기본 요율로 복귀 (티어: ${updatedTier.tier}, 기본 요율: ${updatedTier.baseRate.toString()}), 해제자: ${mockResetBy}`,
          metadata: {
            affiliateId: mockAffiliateId, // 대상 어필리에이트 유저 ID
            tier: updatedTier.tier,
            baseRate: updatedTier.baseRate.toString(),
            previousCustomRate: mockCustomRate.toString(),
            wasCustomRate: true,
          },
        },
        mockRequestInfo,
      );
    });

    it('이미 수동 요율이 해제된 경우에도 정상 처리한다', async () => {
      // Given
      const tier = createMockTier({
        customRate: null,
        isCustomRate: false,
      });
      const updatedTier = createMockTier({
        customRate: null,
        isCustomRate: false,
      });

      mockRepository.getByAffiliateId.mockResolvedValue(tier);
      mockRepository.upsert.mockResolvedValue(updatedTier);

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
        resetBy: mockResetBy,
        requestInfo: mockRequestInfo,
      });

      // Then
      expect(result).toBe(updatedTier);
      expect(result.customRate).toBeNull();
      expect(result.isCustomRate).toBe(false);
      expect(mockActivityLog.logSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            previousCustomRate: null,
            wasCustomRate: false,
          }),
        }),
        mockRequestInfo,
      );
    });

    it('티어가 없을 때 TierNotFoundException을 발생시킨다', async () => {
      // Given
      mockRepository.getByAffiliateId.mockRejectedValue(
        new TierNotFoundException(mockAffiliateId),
      );

      // When & Then
      await expect(
        service.execute({
          affiliateId: mockAffiliateId,
          resetBy: mockResetBy,
          requestInfo: mockRequestInfo,
        }),
      ).rejects.toThrow(TierNotFoundException);

      expect(mockActivityLog.logFailure).toHaveBeenCalledTimes(1);
      expect(mockActivityLog.logFailure).toHaveBeenCalledWith(
        {
          userId: mockResetBy, // 관리자 ID
          isAdmin: true,
          activityType: ActivityType.COMMISSION_RATE_RESET,
          description: `커미션 수동 요율 해제 실패`,
          metadata: {
            affiliateId: mockAffiliateId,
            error: expect.stringContaining('Tier not found'),
          },
        },
        mockRequestInfo,
      );
    });

    it('requestInfo가 없을 때 Activity Log를 기록하지 않는다', async () => {
      // Given
      const tier = createMockTier({
        customRate: mockCustomRate,
        isCustomRate: true,
      });
      const updatedTier = createMockTier({
        customRate: null,
        isCustomRate: false,
      });

      mockRepository.getByAffiliateId.mockResolvedValue(tier);
      mockRepository.upsert.mockResolvedValue(updatedTier);

      // When
      await service.execute({
        affiliateId: mockAffiliateId,
        resetBy: mockResetBy,
        // requestInfo 없음
      });

      // Then
      expect(mockActivityLog.logSuccess).not.toHaveBeenCalled();
      expect(mockActivityLog.logFailure).not.toHaveBeenCalled();
    });

    it('에러 발생 시 Logger에 에러를 기록한다', async () => {
      // Given
      const repositoryError = new Error('Database connection failed');
      mockRepository.getByAffiliateId.mockRejectedValue(repositoryError);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      // When
      await expect(
        service.execute({
          affiliateId: mockAffiliateId,
          resetBy: mockResetBy,
        }),
      ).rejects.toThrow(repositoryError);

      // Then
      expect(loggerSpy).toHaveBeenCalledTimes(1);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('커미션 수동 요율 해제 실패'),
        repositoryError,
      );

      loggerSpy.mockRestore();
    });

    it('Repository 에러 발생 시 실패 로그를 기록한다', async () => {
      // Given
      const tier = createMockTier({
        customRate: mockCustomRate,
        isCustomRate: true,
      });
      const repositoryError = new Error('Database connection failed');

      mockRepository.getByAffiliateId.mockResolvedValue(tier);
      mockRepository.upsert.mockRejectedValue(repositoryError);

      // When & Then
      await expect(
        service.execute({
          affiliateId: mockAffiliateId,
          resetBy: mockResetBy,
          requestInfo: mockRequestInfo,
        }),
      ).rejects.toThrow(repositoryError);

      expect(mockActivityLog.logFailure).toHaveBeenCalledTimes(1);
      expect(mockActivityLog.logFailure).toHaveBeenCalledWith(
        {
          userId: mockResetBy, // 관리자 ID
          isAdmin: true,
          activityType: ActivityType.COMMISSION_RATE_RESET,
          description: `커미션 수동 요율 해제 실패`,
          metadata: {
            affiliateId: mockAffiliateId,
            error: repositoryError.message,
          },
        },
        mockRequestInfo,
      );
    });

    it('엔티티의 resetCustomRate가 호출되어 상태가 변경된다', async () => {
      // Given
      const tier = createMockTier({
        customRate: mockCustomRate,
        isCustomRate: true,
        customRateSetBy: mockCustomRateSetBy,
        customRateSetAt: mockCustomRateSetAt,
      });
      const resetCustomRateSpy = jest.spyOn(tier, 'resetCustomRate');

      mockRepository.getByAffiliateId.mockResolvedValue(tier);

      const updatedTier = createMockTier({
        customRate: null,
        isCustomRate: false,
        customRateSetBy: null,
        customRateSetAt: null,
      });
      mockRepository.upsert.mockResolvedValue(updatedTier);

      // When
      await service.execute({
        affiliateId: mockAffiliateId,
        resetBy: mockResetBy,
      });

      // Then
      expect(resetCustomRateSpy).toHaveBeenCalledTimes(1);
      expect(resetCustomRateSpy).toHaveBeenCalledWith();

      resetCustomRateSpy.mockRestore();
    });

    it('다양한 티어에 대해 정상적으로 처리한다', async () => {
      // Given
      const tiers = [
        AffiliateTierLevel.BRONZE,
        AffiliateTierLevel.SILVER,
        AffiliateTierLevel.GOLD,
        AffiliateTierLevel.PLATINUM,
        AffiliateTierLevel.DIAMOND,
      ];

      for (const tierLevel of tiers) {
        const tier = createMockTier({
          tier: tierLevel,
          customRate: mockCustomRate,
          isCustomRate: true,
        });
        const updatedTier = createMockTier({
          tier: tierLevel,
          customRate: null,
          isCustomRate: false,
        });

        mockRepository.getByAffiliateId.mockResolvedValue(tier);
        mockRepository.upsert.mockResolvedValue(updatedTier);

        // When
        const result = await service.execute({
          affiliateId: mockAffiliateId,
          resetBy: mockResetBy,
        });

        // Then
        expect(result.tier).toBe(tierLevel);
        expect(result.customRate).toBeNull();
        expect(result.isCustomRate).toBe(false);
      }
    });

    it('변경 전 상태가 Activity Log에 올바르게 기록된다', async () => {
      // Given
      const previousCustomRate = new Prisma.Decimal('0.015'); // 1.5%
      const tier = createMockTier({
        customRate: previousCustomRate,
        isCustomRate: true,
        customRateSetBy: mockCustomRateSetBy,
        customRateSetAt: mockCustomRateSetAt,
      });
      const updatedTier = createMockTier({
        customRate: null,
        isCustomRate: false,
      });

      mockRepository.getByAffiliateId.mockResolvedValue(tier);
      mockRepository.upsert.mockResolvedValue(updatedTier);

      // When
      await service.execute({
        affiliateId: mockAffiliateId,
        resetBy: mockResetBy,
        requestInfo: mockRequestInfo,
      });

      // Then
      expect(mockActivityLog.logSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            previousCustomRate: previousCustomRate.toString(),
            wasCustomRate: true,
          }),
        }),
        mockRequestInfo,
      );
    });

    it('에러 발생 시 requestInfo가 없어도 에러를 재던지기한다', async () => {
      // Given
      const repositoryError = new Error('Database connection failed');
      mockRepository.getByAffiliateId.mockRejectedValue(repositoryError);

      // When & Then
      await expect(
        service.execute({
          affiliateId: mockAffiliateId,
          resetBy: mockResetBy,
          // requestInfo 없음
        }),
      ).rejects.toThrow(repositoryError);

      expect(mockActivityLog.logFailure).not.toHaveBeenCalled();
    });
  });
});
