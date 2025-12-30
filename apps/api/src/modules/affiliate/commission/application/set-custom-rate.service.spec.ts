// src/modules/affiliate/commission/application/set-custom-rate.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { AffiliateTierLevel, Prisma } from '@repo/database';
import { SetCustomRateService } from './set-custom-rate.service';
import { AFFILIATE_TIER_REPOSITORY } from '../ports/out/affiliate-tier.repository.token';
import type { AffiliateTierRepositoryPort } from '../ports/out/affiliate-tier.repository.port';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import { AffiliateTier, CommissionPolicy } from '../domain';
import { InvalidCommissionRateException } from '../domain/commission.exception';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';

describe('SetCustomRateService', () => {
  let module: TestingModule;
  let service: SetCustomRateService;
  let mockRepository: jest.Mocked<AffiliateTierRepositoryPort>;
  let mockDispatchLogService: jest.Mocked<DispatchLogService>;
  let mockPolicy: CommissionPolicy;

  const mockAffiliateId = BigInt(123);
  const mockSetBy = BigInt(456);
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
      affiliateId: BigInt(mockAffiliateId),
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

    const mockDispatchLogServiceProvider = {
      provide: DispatchLogService,
      useValue: {
        dispatch: jest.fn().mockResolvedValue(undefined),
      },
    };

    mockPolicy = new CommissionPolicy();

    module = await Test.createTestingModule({
      imports: [PrismaModule, EnvModule], // TransactionHost를 위해 필요
      providers: [
        SetCustomRateService,
        {
          provide: AFFILIATE_TIER_REPOSITORY,
          useValue: mockRepository,
        },
        CommissionPolicy,
        mockDispatchLogServiceProvider,
      ],
    }).compile();

    service = module.get<SetCustomRateService>(SetCustomRateService);
    mockRepository = module.get(AFFILIATE_TIER_REPOSITORY);
    mockDispatchLogService = module.get(
      DispatchLogService,
    ) as jest.Mocked<DispatchLogService>;
    mockPolicy = module.get(CommissionPolicy);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
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
      expect(mockDispatchLogService.dispatch).not.toHaveBeenCalled();
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
      expect(mockDispatchLogService.dispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatchLogService.dispatch).toHaveBeenCalledWith(
        {
          type: LogType.ACTIVITY,
          data: {
            userId: mockSetBy.toString(), // 관리자 ID (액션을 수행한 사용자)
            category: 'AFFILIATE',
            action: 'COMMISSION_RATE_SET',
            metadata: {
              affiliateId: mockAffiliateId.toString(), // 대상 어필리에이트 유저 ID
              customRate: mockCustomRate.toString(),
              previousCustomRate: null,
              wasCustomRate: false,
              tier: updatedTier.tier,
              baseRate: updatedTier.baseRate.toString(),
            },
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
      expect(mockDispatchLogService.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: LogType.ACTIVITY,
          data: expect.objectContaining({
            metadata: expect.objectContaining({
              previousCustomRate: previousCustomRate.toString(),
              wasCustomRate: true,
            }),
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
      expect(mockDispatchLogService.dispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatchLogService.dispatch).toHaveBeenCalledWith(
        {
          type: LogType.ACTIVITY,
          data: {
            userId: mockSetBy.toString(), // 관리자 ID
            category: 'AFFILIATE',
            action: 'COMMISSION_RATE_SET',
            metadata: {
              affiliateId: mockAffiliateId.toString(),
              customRate: invalidRate.toString(),
              error: expect.stringContaining('Invalid commission rate'),
            },
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
      expect(mockDispatchLogService.dispatch).toHaveBeenCalledTimes(1);
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

      expect(mockDispatchLogService.dispatch).toHaveBeenCalledTimes(1);
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
      expect(mockDispatchLogService.dispatch).not.toHaveBeenCalled();
    });

    it('에러 발생 시 Logger에 에러를 기록한다', async () => {
      // Given
      const invalidRate = new Prisma.Decimal('0');
      // 도메인 예외는 warn 레벨로 로깅되므로 warn 스파이 사용
      const loggerWarnSpy = jest.spyOn(service['logger'], 'warn');

      // When
      await expect(
        service.execute({
          affiliateId: mockAffiliateId,
          customRate: invalidRate,
          setBy: mockSetBy,
        }),
      ).rejects.toThrow();

      // Then
      // 도메인 예외는 warn 레벨로 로깅됨
      expect(loggerWarnSpy).toHaveBeenCalledTimes(1);
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('커미션 수동 요율 설정 실패 (도메인 예외)'),
        expect.any(String),
      );

      loggerWarnSpy.mockRestore();
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

      expect(mockDispatchLogService.dispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatchLogService.dispatch).toHaveBeenCalledWith(
        {
          type: LogType.ACTIVITY,
          data: {
            userId: mockSetBy.toString(), // 관리자 ID
            category: 'AFFILIATE',
            action: 'COMMISSION_RATE_SET',
            metadata: {
              affiliateId: mockAffiliateId.toString(),
              customRate: mockCustomRate.toString(),
              error: repositoryError.message,
            },
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
