// src/modules/affiliate/commission/application/set-custom-rate.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AffiliateTierLevel, Prisma } from '@prisma/client';
import { SetCustomRateService } from './set-custom-rate.service';
import { AFFILIATE_TIER_REPOSITORY } from '../ports/out/affiliate-tier.repository.token';
import type { AffiliateTierRepositoryPort } from '../ports/out/affiliate-tier.repository.port';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';
import { ActivityType } from 'src/platform/activity-log/activity-log.types';
import { AffiliateTier, CommissionPolicy } from '../domain';
import { InvalidCommissionRateException } from '../domain/commission.exception';
import { PrismaModule } from 'src/platform/prisma/prisma.module';
import { EnvModule } from 'src/platform/env/env.module';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import { IdUtil } from 'src/utils/id.util';

describe('SetCustomRateService', () => {
  let service: SetCustomRateService;
  let mockRepository: jest.Mocked<AffiliateTierRepositoryPort>;
  let mockActivityLog: jest.Mocked<ActivityLogPort>;
  let mockPolicy: CommissionPolicy;

  const mockAffiliateId = 'affiliate-123';
  const mockSetBy = 'admin-456';
  const mockUid = 'tier-1234567890';
  const mockId = BigInt(1);
  const mockBaseRate = new Prisma.Decimal('0.005'); // BRONZE: 0.5%
  const mockCustomRate = new Prisma.Decimal('0.01'); // 1%
  const mockCreatedAt = new Date('2024-01-01T00:00:00Z');
  const mockUpdatedAt = new Date('2024-01-01T00:00:00Z');

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
    path: '/api/v1/commission/rate',
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

    mockActivityLog = {
      log: jest.fn(),
      logSuccess: jest.fn(),
      logFailure: jest.fn(),
    };

    mockPolicy = new CommissionPolicy();

    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, EnvModule], // TransactionHost를 위해 필요
      providers: [
        SetCustomRateService,
        {
          provide: AFFILIATE_TIER_REPOSITORY,
          useValue: mockRepository,
        },
        CommissionPolicy,
        {
          provide: ACTIVITY_LOG,
          useValue: mockActivityLog,
        },
      ],
    }).compile();

    service = module.get<SetCustomRateService>(SetCustomRateService);
    mockRepository = module.get(AFFILIATE_TIER_REPOSITORY);
    mockActivityLog = module.get(ACTIVITY_LOG);
    mockPolicy = module.get(CommissionPolicy);

    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('정상적으로 수동 요율을 설정한다', async () => {
      // Given
      const tier = createMockTier();
      const updatedTier = createMockTier({
        customRate: mockCustomRate,
        isCustomRate: true,
      });

      mockRepository.findByAffiliateId.mockResolvedValue(tier);
      mockRepository.upsert.mockResolvedValue(updatedTier);

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
        customRate: mockCustomRate,
        setBy: mockSetBy,
      });

      // Then
      expect(result).toBe(updatedTier);
      expect(result.customRate?.toString()).toBe(mockCustomRate.toString());
      expect(result.isCustomRate).toBe(true);
      expect(mockRepository.findByAffiliateId).toHaveBeenCalledWith(
        mockAffiliateId,
      );
      expect(mockRepository.upsert).toHaveBeenCalled();
      expect(mockActivityLog.logSuccess).not.toHaveBeenCalled();
    });

    it('requestInfo가 있을 때 Activity Log에 성공 로그를 기록한다', async () => {
      // Given
      const tier = createMockTier();
      const updatedTier = createMockTier({
        customRate: mockCustomRate,
        isCustomRate: true,
      });

      mockRepository.findByAffiliateId.mockResolvedValue(tier);
      mockRepository.upsert.mockResolvedValue(updatedTier);

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
        customRate: mockCustomRate,
        setBy: mockSetBy,
        requestInfo: mockRequestInfo,
      });

      // Then
      expect(result).toBe(updatedTier);
      expect(mockActivityLog.logSuccess).toHaveBeenCalledTimes(1);
      expect(mockActivityLog.logSuccess).toHaveBeenCalledWith(
        {
          userId: mockSetBy, // 관리자 ID (액션을 수행한 사용자)
          isAdmin: true,
          activityType: ActivityType.COMMISSION_RATE_SET,
          description: `커미션 수동 요율 설정 완료 - 요율: ${mockCustomRate.toString()} (${mockCustomRate.mul(10000).toFixed(0)}), 설정자: ${mockSetBy}`,
          metadata: {
            affiliateId: mockAffiliateId, // 대상 어필리에이트 유저 ID
            customRate: mockCustomRate.toString(),
            previousCustomRate: null,
            wasCustomRate: false,
            tier: updatedTier.tier,
            baseRate: updatedTier.baseRate.toString(),
          },
        },
        mockRequestInfo,
      );
    });

    it('티어가 없을 때 기본 티어로 생성 후 요율을 설정한다', async () => {
      // Given
      const newTier = createMockTier();
      const updatedTier = createMockTier({
        customRate: mockCustomRate,
        isCustomRate: true,
      });

      mockRepository.findByAffiliateId.mockResolvedValue(null);
      mockRepository.upsert
        .mockResolvedValueOnce(newTier) // 첫 번째: 티어 생성
        .mockResolvedValueOnce(updatedTier); // 두 번째: 요율 설정 후 업데이트

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
        customRate: mockCustomRate,
        setBy: mockSetBy,
      });

      // Then
      expect(result).toBe(updatedTier);
      expect(mockRepository.upsert).toHaveBeenCalledTimes(2);
      // 첫 번째 upsert: 기본 티어 생성
      expect(mockRepository.upsert).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          affiliateId: mockAffiliateId,
          tier: AffiliateTierLevel.BRONZE,
        }),
      );
      // 두 번째 upsert: 요율 설정 후 업데이트
      expect(mockRepository.upsert).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          affiliateId: mockAffiliateId,
        }),
      );
    });

    it('이미 수동 요율이 설정된 경우 업데이트한다', async () => {
      // Given
      const previousCustomRate = new Prisma.Decimal('0.015'); // 1.5%
      const tier = createMockTier({
        customRate: previousCustomRate,
        isCustomRate: true,
      });
      const updatedTier = createMockTier({
        customRate: mockCustomRate,
        isCustomRate: true,
      });

      mockRepository.findByAffiliateId.mockResolvedValue(tier);
      mockRepository.upsert.mockResolvedValue(updatedTier);

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
        customRate: mockCustomRate,
        setBy: mockSetBy,
        requestInfo: mockRequestInfo,
      });

      // Then
      expect(result).toBe(updatedTier);
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

    it('요율이 0 이하인 경우 InvalidCommissionRateException을 발생시킨다', async () => {
      // Given
      const invalidRate = new Prisma.Decimal('0');

      // When & Then
      await expect(
        service.execute({
          affiliateId: mockAffiliateId,
          customRate: invalidRate,
          setBy: mockSetBy,
          requestInfo: mockRequestInfo,
        }),
      ).rejects.toThrow(InvalidCommissionRateException);

      expect(mockRepository.findByAffiliateId).not.toHaveBeenCalled();
      expect(mockActivityLog.logFailure).toHaveBeenCalledTimes(1);
      expect(mockActivityLog.logFailure).toHaveBeenCalledWith(
        {
          userId: mockSetBy, // 관리자 ID
          isAdmin: true,
          activityType: ActivityType.COMMISSION_RATE_SET,
          description: `커미션 수동 요율 설정 실패 - 요율: ${invalidRate.toString()}`,
          metadata: {
            affiliateId: mockAffiliateId,
            customRate: invalidRate.toString(),
            error: expect.stringContaining('Invalid commission rate'),
          },
        },
        mockRequestInfo,
      );
    });

    it('요율이 1(100%)보다 큰 경우 InvalidCommissionRateException을 발생시킨다', async () => {
      // Given
      const invalidRate = new Prisma.Decimal('1.01');

      // When & Then
      await expect(
        service.execute({
          affiliateId: mockAffiliateId,
          customRate: invalidRate,
          setBy: mockSetBy,
          requestInfo: mockRequestInfo,
        }),
      ).rejects.toThrow(InvalidCommissionRateException);

      expect(mockRepository.findByAffiliateId).not.toHaveBeenCalled();
      expect(mockActivityLog.logFailure).toHaveBeenCalledTimes(1);
    });

    it('요율이 음수인 경우 InvalidCommissionRateException을 발생시킨다', async () => {
      // Given
      const invalidRate = new Prisma.Decimal('-0.01');

      // When & Then
      await expect(
        service.execute({
          affiliateId: mockAffiliateId,
          customRate: invalidRate,
          setBy: mockSetBy,
          requestInfo: mockRequestInfo,
        }),
      ).rejects.toThrow(InvalidCommissionRateException);

      expect(mockActivityLog.logFailure).toHaveBeenCalledTimes(1);
    });

    it('다양한 요율 값에 대해 정상적으로 처리한다', async () => {
      // Given
      const rates = [
        new Prisma.Decimal('0.001'), // 0.1%
        new Prisma.Decimal('0.01'), // 1%
        new Prisma.Decimal('0.05'), // 5%
        new Prisma.Decimal('0.1'), // 10%
        new Prisma.Decimal('0.5'), // 50%
        new Prisma.Decimal('1'), // 100%
      ];

      for (const rate of rates) {
        const tier = createMockTier();
        const updatedTier = createMockTier({
          customRate: rate,
          isCustomRate: true,
        });

        mockRepository.findByAffiliateId.mockResolvedValue(tier);
        mockRepository.upsert.mockResolvedValue(updatedTier);

        // When
        const result = await service.execute({
          affiliateId: mockAffiliateId,
          customRate: rate,
          setBy: mockSetBy,
        });

        // Then
        expect(result.customRate?.toString()).toBe(rate.toString());
        expect(result.isCustomRate).toBe(true);
      }
    });

    it('requestInfo가 없을 때 Activity Log를 기록하지 않는다', async () => {
      // Given
      const tier = createMockTier();
      const updatedTier = createMockTier({
        customRate: mockCustomRate,
        isCustomRate: true,
      });

      mockRepository.findByAffiliateId.mockResolvedValue(tier);
      mockRepository.upsert.mockResolvedValue(updatedTier);

      // When
      await service.execute({
        affiliateId: mockAffiliateId,
        customRate: mockCustomRate,
        setBy: mockSetBy,
        // requestInfo 없음
      });

      // Then
      expect(mockActivityLog.logSuccess).not.toHaveBeenCalled();
      expect(mockActivityLog.logFailure).not.toHaveBeenCalled();
    });

    it('에러 발생 시 Logger에 에러를 기록한다', async () => {
      // Given
      const invalidRate = new Prisma.Decimal('0');
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      // When
      await expect(
        service.execute({
          affiliateId: mockAffiliateId,
          customRate: invalidRate,
          setBy: mockSetBy,
        }),
      ).rejects.toThrow();

      // Then
      expect(loggerSpy).toHaveBeenCalledTimes(1);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('커미션 수동 요율 설정 실패'),
        expect.any(Error),
      );

      loggerSpy.mockRestore();
    });

    it('Repository 에러 발생 시 실패 로그를 기록한다', async () => {
      // Given
      const tier = createMockTier();
      const repositoryError = new Error('Database connection failed');

      mockRepository.findByAffiliateId.mockResolvedValue(tier);
      mockRepository.upsert.mockRejectedValue(repositoryError);

      // When & Then
      await expect(
        service.execute({
          affiliateId: mockAffiliateId,
          customRate: mockCustomRate,
          setBy: mockSetBy,
          requestInfo: mockRequestInfo,
        }),
      ).rejects.toThrow(repositoryError);

      expect(mockActivityLog.logFailure).toHaveBeenCalledTimes(1);
      expect(mockActivityLog.logFailure).toHaveBeenCalledWith(
        {
          userId: mockSetBy, // 관리자 ID
          isAdmin: true,
          activityType: ActivityType.COMMISSION_RATE_SET,
          description: `커미션 수동 요율 설정 실패 - 요율: ${mockCustomRate.toString()}`,
          metadata: {
            affiliateId: mockAffiliateId,
            customRate: mockCustomRate.toString(),
            error: repositoryError.message,
          },
        },
        mockRequestInfo,
      );
    });

    it('엔티티의 setCustomRate가 호출되어 상태가 변경된다', async () => {
      // Given
      const tier = createMockTier();
      const setCustomRateSpy = jest.spyOn(tier, 'setCustomRate');

      mockRepository.findByAffiliateId.mockResolvedValue(tier);

      const updatedTier = createMockTier({
        customRate: mockCustomRate,
        isCustomRate: true,
      });
      mockRepository.upsert.mockResolvedValue(updatedTier);

      // When
      await service.execute({
        affiliateId: mockAffiliateId,
        customRate: mockCustomRate,
        setBy: mockSetBy,
      });

      // Then
      expect(setCustomRateSpy).toHaveBeenCalledTimes(1);
      expect(setCustomRateSpy).toHaveBeenCalledWith(mockCustomRate, mockSetBy);

      setCustomRateSpy.mockRestore();
    });

    it('티어 생성 시 올바른 기본 요율을 사용한다', async () => {
      // Given
      mockRepository.findByAffiliateId.mockResolvedValue(null);

      const newTier = createMockTier();
      const updatedTier = createMockTier({
        customRate: mockCustomRate,
        isCustomRate: true,
      });

      mockRepository.upsert
        .mockResolvedValueOnce(newTier)
        .mockResolvedValueOnce(updatedTier);

      // When
      await service.execute({
        affiliateId: mockAffiliateId,
        customRate: mockCustomRate,
        setBy: mockSetBy,
      });

      // Then
      const firstUpsertCall = mockRepository.upsert.mock.calls[0][0];
      expect(firstUpsertCall.tier).toBe(AffiliateTierLevel.BRONZE);
      expect(firstUpsertCall.baseRate.toString()).toBe(
        mockPolicy.getBaseRateForTier(AffiliateTierLevel.BRONZE).toString(),
      );
    });
  });
});
