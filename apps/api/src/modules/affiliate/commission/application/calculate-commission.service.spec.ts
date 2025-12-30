// src/modules/affiliate/commission/application/calculate-commission.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import {
  AffiliateTierLevel,
  CommissionStatus,
  ExchangeCurrencyCode,
  GameCategory,
  Prisma,
} from '@repo/database';
import { CalculateCommissionService } from './calculate-commission.service';
import { AFFILIATE_COMMISSION_REPOSITORY } from '../ports/out/affiliate-commission.repository.token';
import type { AffiliateCommissionRepositoryPort } from '../ports/out/affiliate-commission.repository.port';
import { AFFILIATE_TIER_REPOSITORY } from '../ports/out/affiliate-tier.repository.token';
import type { AffiliateTierRepositoryPort } from '../ports/out/affiliate-tier.repository.port';
import { AFFILIATE_WALLET_REPOSITORY } from '../ports/out/affiliate-wallet.repository.token';
import type { AffiliateWalletRepositoryPort } from '../ports/out/affiliate-wallet.repository.port';
import { FindReferralBySubUserIdService } from '../../referral/application/find-referral-by-sub-user-id.service';
import {
  AffiliateCommission,
  AffiliateTier,
  AffiliateWallet,
  CommissionPolicy,
} from '../domain';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import { Referral } from '../../referral/domain/model/referral.entity';

describe('CalculateCommissionService', () => {
  let module: TestingModule;
  let service: CalculateCommissionService;
  let mockCommissionRepository: jest.Mocked<AffiliateCommissionRepositoryPort>;
  let mockTierRepository: jest.Mocked<AffiliateTierRepositoryPort>;
  let mockWalletRepository: jest.Mocked<AffiliateWalletRepositoryPort>;
  let mockFindReferralService: jest.Mocked<FindReferralBySubUserIdService>;
  let policy: CommissionPolicy;

  const mockId = BigInt(1);
  const mockUid = 'cmt-1234567890';
  const mockAffiliateId = BigInt(123);
  const mockSubUserId = BigInt(456);
  const mockGameRoundId = BigInt(789);
  const mockWagerAmount = new Prisma.Decimal('10000');
  const mockWinAmount = new Prisma.Decimal('5000');
  const mockCommission = new Prisma.Decimal('100');
  const mockRateApplied = new Prisma.Decimal('0.01');
  const mockCurrency = ExchangeCurrencyCode.USD;
  const mockGameCategory = GameCategory.SLOTS;
  const mockCreatedAt = new Date('2024-01-01T00:00:00Z');
  const mockUpdatedAt = new Date('2024-01-01T00:00:00Z');

  const createMockReferral = () => {
    return Referral.fromPersistence({
      id: 'referral-123',
      affiliateId: mockAffiliateId,
      codeId: 'code-789',
      subUserId: mockSubUserId,
      ipAddress: '192.168.1.1',
      deviceFingerprint: 'fingerprint-123',
      userAgent: 'Mozilla/5.0',
      createdAt: mockCreatedAt,
      updatedAt: mockUpdatedAt,
    });
  };

  const createMockTier = (overrides?: {
    tier?: AffiliateTierLevel;
    baseRate?: Prisma.Decimal;
    customRate?: Prisma.Decimal | null;
    monthlyWagerAmount?: Prisma.Decimal;
  }) => {
    return AffiliateTier.create({
      uid: 'tier-123',
      affiliateId: mockAffiliateId,
      tier: overrides?.tier ?? AffiliateTierLevel.BRONZE,
      baseRate: overrides?.baseRate ?? new Prisma.Decimal('0.01'),
      customRate: overrides?.customRate ?? null,
      monthlyWagerAmount:
        overrides?.monthlyWagerAmount ?? new Prisma.Decimal('0'),
    });
  };

  const createMockWallet = () => {
    return AffiliateWallet.create({
      affiliateId: mockAffiliateId,
      currency: mockCurrency,
      availableBalance: new Prisma.Decimal('1000'),
      pendingBalance: new Prisma.Decimal('500'),
      totalEarned: new Prisma.Decimal('1500'),
    });
  };

  const createMockCommission = () => {
    return AffiliateCommission.fromPersistence({
      id: mockId,
      uid: mockUid,
      affiliateId: mockAffiliateId,
      subUserId: mockSubUserId,
      gameRoundId: mockGameRoundId,
      wagerAmount: mockWagerAmount,
      winAmount: mockWinAmount,
      commission: mockCommission,
      rateApplied: mockRateApplied,
      currency: mockCurrency,
      status: CommissionStatus.PENDING,
      gameCategory: mockGameCategory,
      settlementDate: null,
      claimedAt: null,
      withdrawnAt: null,
      createdAt: mockCreatedAt,
      updatedAt: mockUpdatedAt,
    });
  };

  beforeEach(async () => {
    mockCommissionRepository = {
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

    mockTierRepository = {
      findByAffiliateId: jest.fn(),
      getByAffiliateId: jest.fn(),
      upsert: jest.fn(),
      updateTier: jest.fn(),
      updateMonthlyWagerAmount: jest.fn(),
      resetMonthlyWagerAmount: jest.fn(),
    };

    mockWalletRepository = {
      findByAffiliateIdAndCurrency: jest.fn(),
      getByAffiliateIdAndCurrency: jest.fn(),
      findByAffiliateId: jest.fn(),
      upsert: jest.fn(),
      updateBalance: jest.fn(),
    };

    mockFindReferralService = {
      execute: jest.fn(),
    } as any;

    policy = new CommissionPolicy();

    module = await Test.createTestingModule({
      imports: [PrismaModule, EnvModule], // TransactionHost를 위해 필요
      providers: [
        CalculateCommissionService,
        {
          provide: AFFILIATE_COMMISSION_REPOSITORY,
          useValue: mockCommissionRepository,
        },
        {
          provide: AFFILIATE_TIER_REPOSITORY,
          useValue: mockTierRepository,
        },
        {
          provide: AFFILIATE_WALLET_REPOSITORY,
          useValue: mockWalletRepository,
        },
        {
          provide: FindReferralBySubUserIdService,
          useValue: mockFindReferralService,
        },
        CommissionPolicy,
      ],
    }).compile();

    service = module.get<CalculateCommissionService>(
      CalculateCommissionService,
    );
    mockCommissionRepository = module.get(AFFILIATE_COMMISSION_REPOSITORY);
    mockTierRepository = module.get(AFFILIATE_TIER_REPOSITORY);
    mockWalletRepository = module.get(AFFILIATE_WALLET_REPOSITORY);
    mockFindReferralService = module.get(FindReferralBySubUserIdService);
    policy = module.get(CommissionPolicy);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('execute', () => {
    it('정상적으로 커미션을 계산하고 생성한다', async () => {
      // Given
      const referral = createMockReferral();
      const tier = createMockTier();
      const wallet = createMockWallet();
      const commission = createMockCommission();

      mockFindReferralService.execute.mockResolvedValue(referral);
      mockCommissionRepository.findByGameRoundId.mockResolvedValue(null);
      mockTierRepository.findByAffiliateId.mockResolvedValue(tier);
      mockCommissionRepository.create.mockResolvedValue(commission);
      mockWalletRepository.findByAffiliateIdAndCurrency.mockResolvedValue(
        wallet,
      );
      mockWalletRepository.upsert.mockResolvedValue(wallet);
      mockTierRepository.upsert.mockResolvedValue(tier);

      // When
      const result = await service.execute({
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: mockWinAmount,
        currency: mockCurrency,
        gameCategory: mockGameCategory,
      });

      // Then
      expect(result).toBe(commission);
      expect(mockFindReferralService.execute).toHaveBeenCalledWith({
        subUserId: mockSubUserId,
      });
      expect(mockCommissionRepository.findByGameRoundId).toHaveBeenCalledWith(
        mockGameRoundId,
      );
      expect(mockTierRepository.findByAffiliateId).toHaveBeenCalledWith(
        mockAffiliateId,
      );
      expect(mockCommissionRepository.create).toHaveBeenCalledTimes(1);
      expect(
        mockWalletRepository.findByAffiliateIdAndCurrency,
      ).toHaveBeenCalledWith(mockAffiliateId, mockCurrency);
      expect(mockWalletRepository.upsert).toHaveBeenCalledTimes(1);
      expect(mockTierRepository.upsert).toHaveBeenCalledTimes(1);
    });

    it('레퍼럴 관계가 없으면 null을 반환한다', async () => {
      // Given
      mockFindReferralService.execute.mockResolvedValue(null);

      // When
      const result = await service.execute({
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: mockWinAmount,
        currency: mockCurrency,
        gameCategory: mockGameCategory,
      });

      // Then
      expect(result).toBeNull();
      expect(mockFindReferralService.execute).toHaveBeenCalledWith({
        subUserId: mockSubUserId,
      });
      expect(mockCommissionRepository.findByGameRoundId).not.toHaveBeenCalled();
      expect(mockCommissionRepository.create).not.toHaveBeenCalled();
    });

    it('중복된 gameRoundId가 있으면 null을 반환한다', async () => {
      // Given
      const referral = createMockReferral();
      const existingCommission = createMockCommission();

      mockFindReferralService.execute.mockResolvedValue(referral);
      mockCommissionRepository.findByGameRoundId.mockResolvedValue(
        existingCommission,
      );

      // When
      const result = await service.execute({
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: mockWinAmount,
        currency: mockCurrency,
        gameCategory: mockGameCategory,
      });

      // Then
      expect(result).toBeNull();
      expect(mockCommissionRepository.findByGameRoundId).toHaveBeenCalledWith(
        mockGameRoundId,
      );
      expect(mockCommissionRepository.create).not.toHaveBeenCalled();
    });

    it('티어가 없으면 기본 티어를 생성한다', async () => {
      // Given
      const referral = createMockReferral();
      const newTier = createMockTier();
      const wallet = createMockWallet();
      const commission = createMockCommission();

      mockFindReferralService.execute.mockResolvedValue(referral);
      mockCommissionRepository.findByGameRoundId.mockResolvedValue(null);
      mockTierRepository.findByAffiliateId.mockResolvedValue(null);
      mockTierRepository.upsert.mockResolvedValueOnce(newTier);
      mockCommissionRepository.create.mockResolvedValue(commission);
      mockWalletRepository.findByAffiliateIdAndCurrency.mockResolvedValue(
        wallet,
      );
      mockWalletRepository.upsert.mockResolvedValue(wallet);
      mockTierRepository.upsert.mockResolvedValueOnce(newTier);

      // When
      const result = await service.execute({
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: mockWinAmount,
        currency: mockCurrency,
        gameCategory: mockGameCategory,
      });

      // Then
      expect(result).toBe(commission);
      expect(mockTierRepository.findByAffiliateId).toHaveBeenCalledWith(
        mockAffiliateId,
      );
      expect(mockTierRepository.upsert).toHaveBeenCalledTimes(2); // 생성 시 1회, 업데이트 시 1회
      const firstUpsertCall = mockTierRepository.upsert.mock.calls[0][0];
      expect(firstUpsertCall.tier).toBe(AffiliateTierLevel.BRONZE);
    });

    it('월렛이 없으면 새로 생성한다', async () => {
      // Given
      const referral = createMockReferral();
      const tier = createMockTier();
      const newWallet = AffiliateWallet.create({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
      });
      const updatedWallet = createMockWallet();
      const commission = createMockCommission();

      mockFindReferralService.execute.mockResolvedValue(referral);
      mockCommissionRepository.findByGameRoundId.mockResolvedValue(null);
      mockTierRepository.findByAffiliateId.mockResolvedValue(tier);
      mockCommissionRepository.create.mockResolvedValue(commission);
      mockWalletRepository.findByAffiliateIdAndCurrency.mockResolvedValue(null);
      mockWalletRepository.upsert
        .mockResolvedValueOnce(newWallet) // 생성
        .mockResolvedValueOnce(updatedWallet); // 업데이트
      mockTierRepository.upsert.mockResolvedValue(tier);

      // When
      const result = await service.execute({
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: mockWinAmount,
        currency: mockCurrency,
        gameCategory: mockGameCategory,
      });

      // Then
      expect(result).toBe(commission);
      expect(
        mockWalletRepository.findByAffiliateIdAndCurrency,
      ).toHaveBeenCalledWith(mockAffiliateId, mockCurrency);
      expect(mockWalletRepository.upsert).toHaveBeenCalledTimes(2); // 생성 시 1회, 업데이트 시 1회
    });

    it('winAmount가 null인 경우를 처리한다', async () => {
      // Given
      const referral = createMockReferral();
      const tier = createMockTier();
      const wallet = createMockWallet();
      const commission = createMockCommission();

      mockFindReferralService.execute.mockResolvedValue(referral);
      mockCommissionRepository.findByGameRoundId.mockResolvedValue(null);
      mockTierRepository.findByAffiliateId.mockResolvedValue(tier);
      mockCommissionRepository.create.mockResolvedValue(commission);
      mockWalletRepository.findByAffiliateIdAndCurrency.mockResolvedValue(
        wallet,
      );
      mockWalletRepository.upsert.mockResolvedValue(wallet);
      mockTierRepository.upsert.mockResolvedValue(tier);

      // When
      const result = await service.execute({
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        currency: mockCurrency,
        gameCategory: mockGameCategory,
      });

      // Then
      expect(result).toBe(commission);
      const createCall = mockCommissionRepository.create.mock.calls[0][0];
      expect(createCall.winAmount).toBeNull();
    });

    it('gameCategory가 null인 경우를 처리한다', async () => {
      // Given
      const referral = createMockReferral();
      const tier = createMockTier();
      const wallet = createMockWallet();
      const commission = createMockCommission();

      mockFindReferralService.execute.mockResolvedValue(referral);
      mockCommissionRepository.findByGameRoundId.mockResolvedValue(null);
      mockTierRepository.findByAffiliateId.mockResolvedValue(tier);
      mockCommissionRepository.create.mockResolvedValue(commission);
      mockWalletRepository.findByAffiliateIdAndCurrency.mockResolvedValue(
        wallet,
      );
      mockWalletRepository.upsert.mockResolvedValue(wallet);
      mockTierRepository.upsert.mockResolvedValue(tier);

      // When
      const result = await service.execute({
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: mockWinAmount,
        currency: mockCurrency,
        gameCategory: null,
      });

      // Then
      expect(result).toBe(commission);
      const createCall = mockCommissionRepository.create.mock.calls[0][0];
      expect(createCall.gameCategory).toBeNull();
    });

    it('커스텀 요율이 있는 티어를 처리한다', async () => {
      // Given
      const referral = createMockReferral();
      const customRate = new Prisma.Decimal('0.02');
      const tier = AffiliateTier.create({
        uid: 'tier-123',
        affiliateId: mockAffiliateId,
        tier: AffiliateTierLevel.BRONZE,
        baseRate: new Prisma.Decimal('0.01'),
        customRate,
        isCustomRate: true, // 커스텀 요율이 활성화되어 있음
      });
      const wallet = createMockWallet();
      const commission = createMockCommission();

      mockFindReferralService.execute.mockResolvedValue(referral);
      mockCommissionRepository.findByGameRoundId.mockResolvedValue(null);
      mockTierRepository.findByAffiliateId.mockResolvedValue(tier);
      mockCommissionRepository.create.mockResolvedValue(commission);
      mockWalletRepository.findByAffiliateIdAndCurrency.mockResolvedValue(
        wallet,
      );
      mockWalletRepository.upsert.mockResolvedValue(wallet);
      mockTierRepository.upsert.mockResolvedValue(tier);

      // When
      const result = await service.execute({
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: mockWinAmount,
        currency: mockCurrency,
        gameCategory: mockGameCategory,
      });

      // Then
      expect(result).toBe(commission);
      const createCall = mockCommissionRepository.create.mock.calls[0][0];
      // 커스텀 요율이 적용되어야 함
      expect(createCall.rateApplied.toString()).toBe(customRate.toString());
    });

    it('월렛의 pendingBalance가 올바르게 업데이트된다', async () => {
      // Given
      const referral = createMockReferral();
      const tier = createMockTier();
      const wallet = createMockWallet();
      const initialPendingBalance = wallet.pendingBalance;
      const commission = createMockCommission();

      mockFindReferralService.execute.mockResolvedValue(referral);
      mockCommissionRepository.findByGameRoundId.mockResolvedValue(null);
      mockTierRepository.findByAffiliateId.mockResolvedValue(tier);
      mockCommissionRepository.create.mockResolvedValue(commission);
      mockWalletRepository.findByAffiliateIdAndCurrency.mockResolvedValue(
        wallet,
      );
      mockWalletRepository.upsert.mockResolvedValue(wallet);
      mockTierRepository.upsert.mockResolvedValue(tier);

      // When
      await service.execute({
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: mockWinAmount,
        currency: mockCurrency,
        gameCategory: mockGameCategory,
      });

      // Then
      expect(mockWalletRepository.upsert).toHaveBeenCalledTimes(1);
      const upsertCall = mockWalletRepository.upsert.mock.calls[0][0];
      expect(upsertCall.pendingBalance.toString()).toBe(
        initialPendingBalance.add(commission.commission).toString(),
      );
    });

    it('티어의 월간 베팅 금액이 올바르게 업데이트된다', async () => {
      // Given
      const referral = createMockReferral();
      const initialMonthlyWagerAmount = new Prisma.Decimal('5000');
      const tier = createMockTier({
        monthlyWagerAmount: initialMonthlyWagerAmount,
      });
      const wallet = createMockWallet();
      const commission = createMockCommission();

      mockFindReferralService.execute.mockResolvedValue(referral);
      mockCommissionRepository.findByGameRoundId.mockResolvedValue(null);
      mockTierRepository.findByAffiliateId.mockResolvedValue(tier);
      mockCommissionRepository.create.mockResolvedValue(commission);
      mockWalletRepository.findByAffiliateIdAndCurrency.mockResolvedValue(
        wallet,
      );
      mockWalletRepository.upsert.mockResolvedValue(wallet);
      mockTierRepository.upsert.mockResolvedValue(tier);

      // When
      await service.execute({
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: mockWinAmount,
        currency: mockCurrency,
        gameCategory: mockGameCategory,
      });

      // Then
      expect(mockTierRepository.upsert).toHaveBeenCalledTimes(1);
      const upsertCall = mockTierRepository.upsert.mock.calls[0][0];
      // 서비스에서 tier.updateMonthlyWagerAmount(wagerAmount)를 호출한 후 upsert하므로
      // 업데이트된 값은 initialMonthlyWagerAmount + mockWagerAmount
      const expectedAmount = initialMonthlyWagerAmount.add(mockWagerAmount);
      expect(upsertCall.monthlyWagerAmount.toString()).toBe(
        expectedAmount.toString(),
      );
    });

    it('다양한 통화를 처리한다', async () => {
      // Given
      const referral = createMockReferral();
      const tier = createMockTier();
      const wallet = createMockWallet();
      const commission = createMockCommission();

      mockFindReferralService.execute.mockResolvedValue(referral);
      mockCommissionRepository.findByGameRoundId.mockResolvedValue(null);
      mockTierRepository.findByAffiliateId.mockResolvedValue(tier);
      mockCommissionRepository.create.mockResolvedValue(commission);
      mockWalletRepository.findByAffiliateIdAndCurrency.mockResolvedValue(
        wallet,
      );
      mockWalletRepository.upsert.mockResolvedValue(wallet);
      mockTierRepository.upsert.mockResolvedValue(tier);

      // When
      await service.execute({
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId,
        wagerAmount: mockWagerAmount,
        winAmount: mockWinAmount,
        currency: ExchangeCurrencyCode.KRW,
        gameCategory: mockGameCategory,
      });

      // Then
      expect(
        mockWalletRepository.findByAffiliateIdAndCurrency,
      ).toHaveBeenCalledWith(mockAffiliateId, ExchangeCurrencyCode.KRW);
      const createCall = mockCommissionRepository.create.mock.calls[0][0];
      expect(createCall.currency).toBe(ExchangeCurrencyCode.KRW);
    });

    it('에러 발생 시 Logger에 에러를 기록한다', async () => {
      // Given
      const referral = createMockReferral();
      const repositoryError = new Error('Database connection failed');
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      mockFindReferralService.execute.mockResolvedValue(referral);
      mockCommissionRepository.findByGameRoundId.mockRejectedValue(
        repositoryError,
      );

      // When & Then
      await expect(
        service.execute({
          subUserId: mockSubUserId,
          gameRoundId: mockGameRoundId,
          wagerAmount: mockWagerAmount,
          winAmount: mockWinAmount,
          currency: mockCurrency,
          gameCategory: mockGameCategory,
        }),
      ).rejects.toThrow(repositoryError);

      expect(loggerSpy).toHaveBeenCalledTimes(1);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('커미션 계산 실패'),
        repositoryError,
      );

      loggerSpy.mockRestore();
    });

    it('다양한 티어 레벨을 처리한다', async () => {
      // Given
      const referral = createMockReferral();
      const tierLevels = [
        AffiliateTierLevel.BRONZE,
        AffiliateTierLevel.SILVER,
        AffiliateTierLevel.GOLD,
        AffiliateTierLevel.PLATINUM,
      ];

      for (const tierLevel of tierLevels) {
        const baseRate = policy.getBaseRateForTier(tierLevel);
        const tier = createMockTier({
          tier: tierLevel,
          baseRate,
        });
        const wallet = createMockWallet();
        const commission = createMockCommission();

        mockFindReferralService.execute.mockResolvedValueOnce(referral);
        mockCommissionRepository.findByGameRoundId.mockResolvedValueOnce(null);
        mockTierRepository.findByAffiliateId.mockResolvedValueOnce(tier);
        mockCommissionRepository.create.mockResolvedValueOnce(commission);
        mockWalletRepository.findByAffiliateIdAndCurrency.mockResolvedValueOnce(
          wallet,
        );
        mockWalletRepository.upsert.mockResolvedValueOnce(wallet);
        mockTierRepository.upsert.mockResolvedValueOnce(tier);

        // When
        const result = await service.execute({
          subUserId: mockSubUserId,
          gameRoundId: mockGameRoundId,
          wagerAmount: mockWagerAmount,
          winAmount: mockWinAmount,
          currency: mockCurrency,
          gameCategory: mockGameCategory,
        });

        // Then
        expect(result).toBe(commission);
        const createCall =
          mockCommissionRepository.create.mock.calls[
            mockCommissionRepository.create.mock.calls.length - 1
          ][0];
        expect(createCall.rateApplied.toString()).toBe(baseRate.toString());
      }
    });
  });
});
