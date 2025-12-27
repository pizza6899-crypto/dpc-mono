// src/modules/affiliate/commission/controllers/admin/commission.controller.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { AdminCommissionController } from './commission.controller';
import { FindCommissionByIdService } from '../../application/find-commission-by-id.service';
import { SetCustomRateService } from '../../application/set-custom-rate.service';
import { ResetCustomRateService } from '../../application/reset-custom-rate.service';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import {
  CommissionStatus,
  ExchangeCurrencyCode,
  GameCategory,
  AffiliateTierLevel,
  Prisma,
} from '@prisma/client';
import { AffiliateCommission, AffiliateTier } from '../../domain';
import { IdUtil } from 'src/utils/id.util';

describe('AdminCommissionController', () => {
  let controller: AdminCommissionController;
  let findCommissionByIdService: jest.Mocked<FindCommissionByIdService>;
  let setCustomRateService: jest.Mocked<SetCustomRateService>;
  let resetCustomRateService: jest.Mocked<ResetCustomRateService>;

  const mockAdmin = {
    id: 'admin-123',
    email: 'admin@test.com',
    role: 'ADMIN',
    session: {
      id: 'session-id',
    },
  } as any;

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
    method: 'POST',
    path: '/admin/commissions/rate/set',
    timestamp: new Date(),
    timezone: 'Asia/Seoul',
    isp: 'ISP',
    asn: 'AS12345',
  };

  const mockCreatedAt = new Date('2024-01-01T00:00:00Z');
  const mockUpdatedAt = new Date('2024-01-01T00:00:00Z');

  const createMockCommission = (overrides?: {
    uid?: string;
    id?: bigint;
    affiliateId?: string;
    status?: CommissionStatus;
    gameRoundId?: bigint | null;
    winAmount?: Prisma.Decimal | null;
    gameCategory?: GameCategory | null;
    settlementDate?: Date | null;
    claimedAt?: Date | null;
    withdrawnAt?: Date | null;
  }) => {
    const gameRoundId =
      overrides?.gameRoundId !== undefined
        ? overrides.gameRoundId
        : BigInt(789);
    return AffiliateCommission.fromPersistence({
      id: overrides?.id ?? BigInt(1),
      uid: overrides?.uid ?? IdUtil.generateUid(),
      affiliateId: overrides?.affiliateId ?? 'affiliate-456',
      subUserId: 'sub-user-789',
      gameRoundId,
      wagerAmount: new Prisma.Decimal('10000.00'),
      winAmount:
        overrides?.winAmount !== undefined
          ? overrides.winAmount
          : new Prisma.Decimal('5000.00'),
      commission: new Prisma.Decimal('100.00'),
      rateApplied: new Prisma.Decimal('0.01'),
      currency: ExchangeCurrencyCode.USD,
      status: overrides?.status ?? CommissionStatus.PENDING,
      gameCategory:
        overrides?.gameCategory !== undefined
          ? overrides.gameCategory
          : GameCategory.SLOTS,
      settlementDate:
        overrides?.settlementDate !== undefined
          ? overrides.settlementDate
          : null,
      claimedAt:
        overrides?.claimedAt !== undefined ? overrides.claimedAt : null,
      withdrawnAt:
        overrides?.withdrawnAt !== undefined ? overrides.withdrawnAt : null,
      createdAt: mockCreatedAt,
      updatedAt: mockUpdatedAt,
    });
  };

  const createMockTier = (overrides?: {
    uid?: string;
    id?: bigint;
    affiliateId?: string;
    tier?: AffiliateTierLevel;
    baseRate?: Prisma.Decimal;
    customRate?: Prisma.Decimal | null;
    isCustomRate?: boolean;
    monthlyWagerAmount?: Prisma.Decimal;
    customRateSetBy?: string | null;
    customRateSetAt?: Date | null;
  }) => {
    return AffiliateTier.fromPersistence({
      id: overrides?.id ?? BigInt(1),
      uid: overrides?.uid ?? IdUtil.generateUid(),
      affiliateId: overrides?.affiliateId ?? 'affiliate-456',
      tier: overrides?.tier ?? AffiliateTierLevel.BRONZE,
      baseRate: overrides?.baseRate ?? new Prisma.Decimal('0.005'),
      customRate: overrides?.customRate ?? null,
      isCustomRate: overrides?.isCustomRate ?? false,
      monthlyWagerAmount:
        overrides?.monthlyWagerAmount ?? new Prisma.Decimal('0'),
      customRateSetBy: overrides?.customRateSetBy ?? null,
      customRateSetAt: overrides?.customRateSetAt ?? null,
      createdAt: mockCreatedAt,
      updatedAt: mockUpdatedAt,
    });
  };

  beforeEach(async () => {
    const mockFindCommissionByIdService = {
      execute: jest.fn(),
    };

    const mockSetCustomRateService = {
      execute: jest.fn(),
    };

    const mockResetCustomRateService = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminCommissionController],
      providers: [
        {
          provide: FindCommissionByIdService,
          useValue: mockFindCommissionByIdService,
        },
        {
          provide: SetCustomRateService,
          useValue: mockSetCustomRateService,
        },
        {
          provide: ResetCustomRateService,
          useValue: mockResetCustomRateService,
        },
      ],
    }).compile();

    controller = module.get<AdminCommissionController>(
      AdminCommissionController,
    );
    findCommissionByIdService = module.get(FindCommissionByIdService);
    setCustomRateService = module.get(SetCustomRateService);
    resetCustomRateService = module.get(ResetCustomRateService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCommissionById', () => {
    it('ID로 커미션을 반환한다', async () => {
      // Given
      const id = '1';
      const mockCommission = createMockCommission({
        id: BigInt(1),
      });

      findCommissionByIdService.execute.mockResolvedValue(mockCommission);

      // When
      const result = await controller.getCommissionById(id);

      // Then
      expect(result).toMatchObject({
        uid: mockCommission.uid,
        affiliateId: mockCommission.affiliateId,
        subUserId: mockCommission.subUserId,
      });
      expect(result.commission).toBe('100');
      expect(result.wagerAmount).toBe('10000');
      expect(findCommissionByIdService.execute).toHaveBeenCalledWith({
        id: BigInt(1),
      });
    });

    it('커미션이 없으면 에러를 던진다', async () => {
      // Given
      const id = '999';

      findCommissionByIdService.execute.mockResolvedValue(null);

      // When & Then
      await expect(controller.getCommissionById(id)).rejects.toThrow(
        'Commission not found',
      );

      expect(findCommissionByIdService.execute).toHaveBeenCalledWith({
        id: BigInt(999),
      });
    });

    it('gameRoundId가 null일 때 빈 문자열로 변환한다', async () => {
      // Given
      const id = '1';
      const mockCommission = createMockCommission({
        id: BigInt(1),
        gameRoundId: null,
      });

      findCommissionByIdService.execute.mockResolvedValue(mockCommission);

      // When
      const result = await controller.getCommissionById(id);

      // Then
      expect(result.gameRoundId).toBe('');
    });
  });

  describe('setCustomRate', () => {
    it('수동 요율을 설정한다', async () => {
      // Given
      const dto = {
        affiliateId: 'affiliate-456',
        customRate: '0.015',
      };

      const mockTier = createMockTier({
        affiliateId: dto.affiliateId,
        customRate: new Prisma.Decimal('0.015'),
        isCustomRate: true,
        customRateSetBy: mockAdmin.id,
        customRateSetAt: new Date(),
      });

      setCustomRateService.execute.mockResolvedValue(mockTier);

      // When
      const result = await controller.setCustomRate(
        mockAdmin,
        dto,
        mockRequestInfo,
      );

      // Then
      expect(result).toMatchObject({
        uid: mockTier.uid,
        affiliateId: mockTier.affiliateId,
        tier: mockTier.tier,
        isCustomRate: true,
      });
      expect(result.baseRate).toBe('0.005');
      expect(result.customRate).toBe('0.015');
      expect(result.monthlyWagerAmount).toBe('0');
      expect(setCustomRateService.execute).toHaveBeenCalledWith({
        affiliateId: dto.affiliateId,
        customRate: new Prisma.Decimal('0.015'),
        setBy: mockAdmin.id,
        requestInfo: mockRequestInfo,
      });
    });

    it('다른 티어의 어필리에이트에 요율을 설정한다', async () => {
      // Given
      const dto = {
        affiliateId: 'affiliate-789',
        customRate: '0.02',
      };

      const mockTier = createMockTier({
        affiliateId: dto.affiliateId,
        tier: AffiliateTierLevel.SILVER,
        baseRate: new Prisma.Decimal('0.01'),
        customRate: new Prisma.Decimal('0.02'),
        isCustomRate: true,
        customRateSetBy: mockAdmin.id,
        customRateSetAt: new Date(),
      });

      setCustomRateService.execute.mockResolvedValue(mockTier);

      // When
      const result = await controller.setCustomRate(
        mockAdmin,
        dto,
        mockRequestInfo,
      );

      // Then
      expect(result.tier).toBe(AffiliateTierLevel.SILVER);
      expect(result.baseRate).toBe('0.01');
      expect(result.customRate).toBe('0.02');
      expect(setCustomRateService.execute).toHaveBeenCalledWith({
        affiliateId: dto.affiliateId,
        customRate: new Prisma.Decimal('0.02'),
        setBy: mockAdmin.id,
        requestInfo: mockRequestInfo,
      });
    });
  });

  describe('resetCustomRate', () => {
    it('수동 요율을 해제한다', async () => {
      // Given
      const dto = {
        affiliateId: 'affiliate-456',
      };

      const mockTier = createMockTier({
        affiliateId: dto.affiliateId,
        customRate: null,
        isCustomRate: false,
        customRateSetBy: null,
        customRateSetAt: null,
      });

      resetCustomRateService.execute.mockResolvedValue(mockTier);

      // When
      const result = await controller.resetCustomRate(
        mockAdmin,
        dto,
        mockRequestInfo,
      );

      // Then
      expect(result).toMatchObject({
        uid: mockTier.uid,
        affiliateId: mockTier.affiliateId,
        tier: mockTier.tier,
        isCustomRate: false,
      });
      expect(result.customRate).toBeNull();
      expect(result.customRateSetBy).toBeNull();
      expect(result.customRateSetAt).toBeNull();
      expect(resetCustomRateService.execute).toHaveBeenCalledWith({
        affiliateId: dto.affiliateId,
        resetBy: mockAdmin.id,
        requestInfo: mockRequestInfo,
      });
    });

    it('수동 요율이 설정된 티어의 요율을 해제한다', async () => {
      // Given
      const dto = {
        affiliateId: 'affiliate-789',
      };

      const previousSetAt = new Date('2024-01-10T00:00:00Z');
      const mockTier = createMockTier({
        affiliateId: dto.affiliateId,
        tier: AffiliateTierLevel.GOLD,
        baseRate: new Prisma.Decimal('0.02'),
        customRate: null,
        isCustomRate: false,
        customRateSetBy: null,
        customRateSetAt: null,
      });

      resetCustomRateService.execute.mockResolvedValue(mockTier);

      // When
      const result = await controller.resetCustomRate(
        mockAdmin,
        dto,
        mockRequestInfo,
      );

      // Then
      expect(result.tier).toBe(AffiliateTierLevel.GOLD);
      expect(result.baseRate).toBe('0.02');
      expect(result.customRate).toBeNull();
      expect(result.isCustomRate).toBe(false);
      expect(resetCustomRateService.execute).toHaveBeenCalledWith({
        affiliateId: dto.affiliateId,
        resetBy: mockAdmin.id,
        requestInfo: mockRequestInfo,
      });
    });
  });

  describe('toCommissionResponse', () => {
    it('커미션 엔티티를 Response DTO로 올바르게 변환한다', async () => {
      // Given
      const id = '1';
      const settlementDate = new Date('2024-01-15T00:00:00Z');
      const claimedAt = new Date('2024-01-20T00:00:00Z');
      const withdrawnAt = new Date('2024-01-21T00:00:00Z');

      const mockCommission = createMockCommission({
        id: BigInt(1),
        gameRoundId: BigInt(123),
        winAmount: null,
        gameCategory: null,
        settlementDate,
        claimedAt,
        withdrawnAt,
      });

      findCommissionByIdService.execute.mockResolvedValue(mockCommission);

      // When
      const result = await controller.getCommissionById(id);

      // Then
      expect(result.uid).toBe(mockCommission.uid);
      expect(result.affiliateId).toBe(mockCommission.affiliateId);
      expect(result.subUserId).toBe(mockCommission.subUserId);
      expect(result.gameRoundId).toBe('123');
      expect(result.wagerAmount).toBe('10000');
      expect(result.winAmount).toBeNull();
      expect(result.commission).toBe('100');
      expect(result.rateApplied).toBe('0.01');
      expect(result.currency).toBe(ExchangeCurrencyCode.USD);
      expect(result.status).toBe(CommissionStatus.PENDING);
      expect(result.gameCategory).toBeNull();
      expect(result.settlementDate).toEqual(settlementDate);
      expect(result.claimedAt).toEqual(claimedAt);
      expect(result.withdrawnAt).toEqual(withdrawnAt);
    });

    it('날짜 필드가 null일 때 올바르게 처리한다', async () => {
      // Given
      const id = '1';
      const mockCommission = createMockCommission({
        id: BigInt(1),
        settlementDate: null,
        claimedAt: null,
        withdrawnAt: null,
      });

      findCommissionByIdService.execute.mockResolvedValue(mockCommission);

      // When
      const result = await controller.getCommissionById(id);

      // Then
      expect(result.settlementDate).toBeNull();
      expect(result.claimedAt).toBeNull();
      expect(result.withdrawnAt).toBeNull();
    });
  });

  describe('toTierResponse', () => {
    it('티어 엔티티를 Response DTO로 올바르게 변환한다', async () => {
      // Given
      const dto = {
        affiliateId: 'affiliate-456',
        customRate: '0.015',
      };

      const customRateSetAt = new Date('2024-01-10T00:00:00Z');
      const mockTier = createMockTier({
        affiliateId: dto.affiliateId,
        tier: AffiliateTierLevel.SILVER,
        baseRate: new Prisma.Decimal('0.01'),
        customRate: new Prisma.Decimal('0.015'),
        isCustomRate: true,
        monthlyWagerAmount: new Prisma.Decimal('50000.00'),
        customRateSetBy: mockAdmin.id,
        customRateSetAt,
      });

      setCustomRateService.execute.mockResolvedValue(mockTier);

      // When
      const result = await controller.setCustomRate(
        mockAdmin,
        dto,
        mockRequestInfo,
      );

      // Then
      expect(result.uid).toBe(mockTier.uid);
      expect(result.affiliateId).toBe(mockTier.affiliateId);
      expect(result.tier).toBe(AffiliateTierLevel.SILVER);
      expect(result.baseRate).toBe('0.01');
      expect(result.customRate).toBe('0.015');
      expect(result.isCustomRate).toBe(true);
      expect(result.monthlyWagerAmount).toBe('50000');
      expect(result.customRateSetBy).toBe(mockAdmin.id);
      expect(result.customRateSetAt).toEqual(customRateSetAt);
      expect(result.createdAt).toEqual(mockCreatedAt);
      expect(result.updatedAt).toEqual(mockUpdatedAt);
    });

    it('수동 요율이 없는 티어를 올바르게 변환한다', async () => {
      // Given
      const dto = {
        affiliateId: 'affiliate-456',
      };

      const mockTier = createMockTier({
        affiliateId: dto.affiliateId,
        customRate: null,
        isCustomRate: false,
        customRateSetBy: null,
        customRateSetAt: null,
      });

      resetCustomRateService.execute.mockResolvedValue(mockTier);

      // When
      const result = await controller.resetCustomRate(
        mockAdmin,
        dto,
        mockRequestInfo,
      );

      // Then
      expect(result.customRate).toBeNull();
      expect(result.isCustomRate).toBe(false);
      expect(result.customRateSetBy).toBeNull();
      expect(result.customRateSetAt).toBeNull();
    });
  });
});
