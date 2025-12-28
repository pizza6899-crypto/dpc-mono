// src/modules/affiliate/commission/controllers/user/commission.controller.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { AffiliateCommissionController } from './commission.controller';
import { FindCommissionsService } from '../../application/find-commissions.service';
import { FindCommissionByIdService } from '../../application/find-commission-by-id.service';
import { GetWalletBalanceService } from '../../application/get-wallet-balance.service';
import { GetCommissionRateService } from '../../application/get-commission-rate.service';
import { WithdrawCommissionService } from '../../application/withdraw-commission.service';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import {
  CommissionStatus,
  ExchangeCurrencyCode,
  GameCategory,
  AffiliateTierLevel,
  Prisma,
} from '@repo/database';
import { AffiliateCommission, AffiliateWallet } from '../../domain';
import { IdUtil } from 'src/utils/id.util';

describe('AffiliateCommissionController', () => {
  let controller: AffiliateCommissionController;
  let findCommissionsService: jest.Mocked<FindCommissionsService>;
  let findCommissionByIdService: jest.Mocked<FindCommissionByIdService>;
  let getWalletBalanceService: jest.Mocked<GetWalletBalanceService>;
  let getCommissionRateService: jest.Mocked<GetCommissionRateService>;
  let withdrawCommissionService: jest.Mocked<WithdrawCommissionService>;

  const mockUser = {
    id: 'affiliate-123',
    email: 'affiliate@test.com',
    role: 'USER',
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
    path: '/commissions/withdraw',
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
      affiliateId: overrides?.affiliateId ?? mockUser.id,
      subUserId: 'sub-user-456',
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

  const createMockWallet = (overrides?: {
    currency?: ExchangeCurrencyCode;
    availableBalance?: Prisma.Decimal;
    pendingBalance?: Prisma.Decimal;
    totalEarned?: Prisma.Decimal;
  }) => {
    return AffiliateWallet.create({
      affiliateId: mockUser.id,
      currency: overrides?.currency || ExchangeCurrencyCode.USD,
      availableBalance:
        overrides?.availableBalance || new Prisma.Decimal('1000.00'),
      pendingBalance: overrides?.pendingBalance || new Prisma.Decimal('500.00'),
      totalEarned: overrides?.totalEarned || new Prisma.Decimal('1500.00'),
    });
  };

  beforeEach(async () => {
    const mockFindCommissionsService = {
      execute: jest.fn(),
    };

    const mockFindCommissionByIdService = {
      execute: jest.fn(),
    };

    const mockGetWalletBalanceService = {
      execute: jest.fn(),
    };

    const mockGetCommissionRateService = {
      execute: jest.fn(),
    };

    const mockWithdrawCommissionService = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AffiliateCommissionController],
      providers: [
        {
          provide: FindCommissionsService,
          useValue: mockFindCommissionsService,
        },
        {
          provide: FindCommissionByIdService,
          useValue: mockFindCommissionByIdService,
        },
        {
          provide: GetWalletBalanceService,
          useValue: mockGetWalletBalanceService,
        },
        {
          provide: GetCommissionRateService,
          useValue: mockGetCommissionRateService,
        },
        {
          provide: WithdrawCommissionService,
          useValue: mockWithdrawCommissionService,
        },
      ],
    }).compile();

    controller = module.get<AffiliateCommissionController>(
      AffiliateCommissionController,
    );
    findCommissionsService = module.get(FindCommissionsService);
    findCommissionByIdService = module.get(FindCommissionByIdService);
    getWalletBalanceService = module.get(GetWalletBalanceService);
    getCommissionRateService = module.get(GetCommissionRateService);
    withdrawCommissionService = module.get(WithdrawCommissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCommissions', () => {
    it('커미션 목록을 반환한다', async () => {
      // Given
      const query = {
        page: 1,
        limit: 20,
      };

      const mockCommission1 = createMockCommission();
      const mockCommission2 = AffiliateCommission.fromPersistence({
        id: BigInt(2),
        uid: IdUtil.generateUid(),
        affiliateId: mockUser.id,
        subUserId: 'sub-user-456',
        gameRoundId: BigInt(789),
        wagerAmount: new Prisma.Decimal('20000.00'),
        winAmount: new Prisma.Decimal('10000.00'),
        commission: new Prisma.Decimal('200.00'),
        rateApplied: new Prisma.Decimal('0.01'),
        currency: ExchangeCurrencyCode.USD,
        status: CommissionStatus.PENDING,
        gameCategory: GameCategory.SLOTS,
        settlementDate: null,
        claimedAt: null,
        withdrawnAt: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      findCommissionsService.execute.mockResolvedValue([
        mockCommission1,
        mockCommission2,
      ]);

      // When
      const result = await controller.getCommissions(mockUser, query);

      // Then
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        uid: mockCommission1.uid,
        affiliateId: mockCommission1.affiliateId,
      });
      expect(result[0].commission).toBe('100');
      expect(result[1]).toMatchObject({
        uid: mockCommission2.uid,
      });
      expect(result[1].commission).toBe('200');
      expect(findCommissionsService.execute).toHaveBeenCalledWith({
        affiliateId: mockUser.id,
        options: {
          status: undefined,
          currency: undefined,
          startDate: undefined,
          endDate: undefined,
          limit: 20,
          offset: 0,
        },
      });
    });

    it('필터를 올바르게 적용한다', async () => {
      // Given
      const query = {
        page: 2,
        limit: 10,
        status: CommissionStatus.PENDING,
        currency: ExchangeCurrencyCode.USD,
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
      };

      findCommissionsService.execute.mockResolvedValue([]);

      // When
      await controller.getCommissions(mockUser, query);

      // Then
      expect(findCommissionsService.execute).toHaveBeenCalledWith({
        affiliateId: mockUser.id,
        options: {
          status: CommissionStatus.PENDING,
          currency: ExchangeCurrencyCode.USD,
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-01-31T23:59:59Z'),
          limit: 10,
          offset: 10,
        },
      });
    });

    it('빈 결과를 처리한다', async () => {
      // Given
      const query = {
        page: 1,
        limit: 20,
      };

      findCommissionsService.execute.mockResolvedValue([]);

      // When
      const result = await controller.getCommissions(mockUser, query);

      // Then
      expect(result).toHaveLength(0);
    });

    it('쿼리 파라미터가 없을 때 기본값을 사용한다', async () => {
      // Given
      const query = {};

      findCommissionsService.execute.mockResolvedValue([]);

      // When
      await controller.getCommissions(mockUser, query);

      // Then
      expect(findCommissionsService.execute).toHaveBeenCalledWith({
        affiliateId: mockUser.id,
        options: {
          status: undefined,
          currency: undefined,
          startDate: undefined,
          endDate: undefined,
          limit: 20,
          offset: 0,
        },
      });
    });
  });

  describe('getCommissionByUid', () => {
    it('UID로 커미션을 반환한다', async () => {
      // Given
      const uid = 'cmt-1234567890';
      const mockCommission = createMockCommission({ uid });

      findCommissionByIdService.execute.mockResolvedValue(mockCommission);

      // When
      const result = await controller.getCommissionByUid(mockUser, uid);

      // Then
      expect(result).toMatchObject({
        uid: mockCommission.uid,
        affiliateId: mockCommission.affiliateId,
      });
      expect(result.commission).toBe('100');
      expect(findCommissionByIdService.execute).toHaveBeenCalledWith({
        uid,
      });
    });

    it('커미션이 없으면 에러를 던진다', async () => {
      // Given
      const uid = 'non-existent-uid';

      findCommissionByIdService.execute.mockResolvedValue(null);

      // When & Then
      await expect(
        controller.getCommissionByUid(mockUser, uid),
      ).rejects.toThrow('Commission not found');

      expect(findCommissionByIdService.execute).toHaveBeenCalledWith({
        uid,
      });
    });

    it('다른 어필리에이트의 커미션이면 에러를 던진다', async () => {
      // Given
      const uid = 'cmt-1234567890';
      const mockCommission = createMockCommission({
        uid,
        affiliateId: 'different-affiliate',
      });

      findCommissionByIdService.execute.mockResolvedValue(mockCommission);

      // When & Then
      await expect(
        controller.getCommissionByUid(mockUser, uid),
      ).rejects.toThrow('Unauthorized');

      expect(findCommissionByIdService.execute).toHaveBeenCalledWith({
        uid,
      });
    });
  });

  describe('getWalletBalance', () => {
    it('특정 통화의 월렛 잔액을 반환한다', async () => {
      // Given
      const currency = ExchangeCurrencyCode.USD;
      const mockWallet = createMockWallet({ currency });

      getWalletBalanceService.execute.mockResolvedValue(mockWallet);

      // When
      const result = await controller.getWalletBalance(mockUser, currency);

      // Then
      expect(result.wallets).toHaveLength(1);
      expect(result.wallets[0]).toMatchObject({
        currency: ExchangeCurrencyCode.USD,
        availableBalance: expect.any(String),
        pendingBalance: expect.any(String),
        totalEarned: expect.any(String),
      });
      expect(result.wallets[0].availableBalance).toBe('1000');
      expect(result.wallets[0].pendingBalance).toBe('500');
      expect(result.wallets[0].totalEarned).toBe('1500');
      expect(getWalletBalanceService.execute).toHaveBeenCalledWith({
        affiliateId: mockUser.id,
        currency: ExchangeCurrencyCode.USD,
      });
    });

    it('통화가 지정되지 않으면 모든 월렛을 반환한다', async () => {
      // Given
      const mockWallet1 = createMockWallet({
        currency: ExchangeCurrencyCode.USD,
      });
      const mockWallet2 = createMockWallet({
        currency: ExchangeCurrencyCode.KRW,
        availableBalance: new Prisma.Decimal('2000.00'),
        pendingBalance: new Prisma.Decimal('1000.00'),
        totalEarned: new Prisma.Decimal('3000.00'),
      });

      getWalletBalanceService.execute.mockResolvedValue([
        mockWallet1,
        mockWallet2,
      ]);

      // When
      const result = await controller.getWalletBalance(mockUser, undefined);

      // Then
      expect(result.wallets).toHaveLength(2);
      expect(result.wallets[0]).toMatchObject({
        currency: ExchangeCurrencyCode.USD,
      });
      expect(result.wallets[0].availableBalance).toBe('1000');
      expect(result.wallets[1]).toMatchObject({
        currency: ExchangeCurrencyCode.KRW,
      });
      expect(result.wallets[1].availableBalance).toBe('2000');
      expect(getWalletBalanceService.execute).toHaveBeenCalledWith({
        affiliateId: mockUser.id,
        currency: undefined,
      });
    });

    it('단일 월렛을 배열로 변환한다', async () => {
      // Given
      const mockWallet = createMockWallet();

      getWalletBalanceService.execute.mockResolvedValue(mockWallet);

      // When
      const result = await controller.getWalletBalance(mockUser, undefined);

      // Then
      expect(result.wallets).toHaveLength(1);
      expect(result.wallets[0]).toMatchObject({
        currency: ExchangeCurrencyCode.USD,
      });
      expect(result.wallets[0].availableBalance).toBe('1000');
    });
  });

  describe('getCommissionRate', () => {
    it('커미션 요율을 반환한다', async () => {
      // Given
      const mockRate = {
        tier: AffiliateTierLevel.BRONZE,
        baseRate: new Prisma.Decimal('0.005'),
        customRate: null,
        isCustomRate: false,
        effectiveRate: new Prisma.Decimal('0.005'),
      };

      getCommissionRateService.execute.mockResolvedValue(mockRate);

      // When
      const result = await controller.getCommissionRate(mockUser);

      // Then
      expect(result).toEqual({
        tier: AffiliateTierLevel.BRONZE,
        baseRate: '0.005',
        customRate: null,
        isCustomRate: false,
        effectiveRate: '0.005',
      });
      expect(getCommissionRateService.execute).toHaveBeenCalledWith({
        affiliateId: mockUser.id,
      });
    });

    it('수동 요율이 설정된 경우 커미션 요율을 반환한다', async () => {
      // Given
      const mockRate = {
        tier: AffiliateTierLevel.SILVER,
        baseRate: new Prisma.Decimal('0.01'),
        customRate: new Prisma.Decimal('0.015'),
        isCustomRate: true,
        effectiveRate: new Prisma.Decimal('0.015'),
      };

      getCommissionRateService.execute.mockResolvedValue(mockRate);

      // When
      const result = await controller.getCommissionRate(mockUser);

      // Then
      expect(result).toEqual({
        tier: AffiliateTierLevel.SILVER,
        baseRate: '0.01',
        customRate: '0.015',
        isCustomRate: true,
        effectiveRate: '0.015',
      });
    });
  });

  describe('withdrawCommission', () => {
    it('커미션 출금을 성공적으로 처리한다', async () => {
      // Given
      const dto = {
        currency: ExchangeCurrencyCode.USD,
        amount: '100.00',
      };

      const mockWallet = createMockWallet({
        availableBalance: new Prisma.Decimal('900.00'),
        pendingBalance: new Prisma.Decimal('500.00'),
        totalEarned: new Prisma.Decimal('1500.00'),
      });

      withdrawCommissionService.execute.mockResolvedValue(mockWallet);

      // When
      const result = await controller.withdrawCommission(
        mockUser,
        dto,
        mockRequestInfo,
      );

      // Then
      expect(result).toMatchObject({
        currency: ExchangeCurrencyCode.USD,
        availableBalance: expect.any(String),
        pendingBalance: expect.any(String),
        totalEarned: expect.any(String),
      });
      expect(result.availableBalance).toBe('900');
      expect(result.pendingBalance).toBe('500');
      expect(result.totalEarned).toBe('1500');
      expect(withdrawCommissionService.execute).toHaveBeenCalledWith({
        affiliateId: mockUser.id,
        currency: ExchangeCurrencyCode.USD,
        amount: new Prisma.Decimal('100.00'),
        requestInfo: mockRequestInfo,
      });
    });

    it('다른 통화로 출금을 처리한다', async () => {
      // Given
      const dto = {
        currency: ExchangeCurrencyCode.KRW,
        amount: '100000.00',
      };

      const mockWallet = createMockWallet({
        currency: ExchangeCurrencyCode.KRW,
        availableBalance: new Prisma.Decimal('900000.00'),
        pendingBalance: new Prisma.Decimal('500000.00'),
        totalEarned: new Prisma.Decimal('1500000.00'),
      });

      withdrawCommissionService.execute.mockResolvedValue(mockWallet);

      // When
      const result = await controller.withdrawCommission(
        mockUser,
        dto,
        mockRequestInfo,
      );

      // Then
      expect(result.currency).toBe(ExchangeCurrencyCode.KRW);
      expect(withdrawCommissionService.execute).toHaveBeenCalledWith({
        affiliateId: mockUser.id,
        currency: ExchangeCurrencyCode.KRW,
        amount: new Prisma.Decimal('100000.00'),
        requestInfo: mockRequestInfo,
      });
    });
  });

  describe('toCommissionResponse', () => {
    it('커미션 엔티티를 Response DTO로 올바르게 변환한다', async () => {
      // Given
      const settlementDate = new Date('2024-01-15T00:00:00Z');
      const claimedAt = new Date('2024-01-20T00:00:00Z');
      const withdrawnAt = new Date('2024-01-21T00:00:00Z');

      const mockCommission = createMockCommission({
        gameRoundId: BigInt(123),
        winAmount: null,
        gameCategory: null,
        settlementDate,
        claimedAt,
        withdrawnAt,
      });

      findCommissionByIdService.execute.mockResolvedValue(mockCommission);

      // When
      const result = await controller.getCommissionByUid(
        mockUser,
        mockCommission.uid,
      );

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

    it('gameRoundId가 null일 때 빈 문자열로 변환한다', async () => {
      // Given
      const mockCommission = createMockCommission({
        gameRoundId: null,
      });

      findCommissionByIdService.execute.mockResolvedValue(mockCommission);

      // When
      const result = await controller.getCommissionByUid(
        mockUser,
        mockCommission.uid,
      );

      // Then
      expect(result.gameRoundId).toBe('');
    });

    it('날짜 필드가 null일 때 올바르게 처리한다', async () => {
      // Given
      const mockCommission = createMockCommission({
        settlementDate: null,
        claimedAt: null,
        withdrawnAt: null,
      });

      findCommissionByIdService.execute.mockResolvedValue(mockCommission);

      // When
      const result = await controller.getCommissionByUid(
        mockUser,
        mockCommission.uid,
      );

      // Then
      expect(result.settlementDate).toBeNull();
      expect(result.claimedAt).toBeNull();
      expect(result.withdrawnAt).toBeNull();
    });
  });
});
