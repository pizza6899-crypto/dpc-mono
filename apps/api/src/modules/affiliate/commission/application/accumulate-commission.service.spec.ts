// src/modules/affiliate/commission/application/accumulate-commission.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import {
  CommissionStatus,
  ExchangeCurrencyCode,
  GameCategory,
  Prisma,
} from '@repo/database';
import { AccumulateCommissionService } from './accumulate-commission.service';
import { CalculateCommissionService } from './calculate-commission.service';
import { AffiliateCommission } from '../domain';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';

describe('AccumulateCommissionService', () => {
  let module: TestingModule;
  let service: AccumulateCommissionService;
  let mockCalculateCommissionService: jest.Mocked<CalculateCommissionService>;

  const mockId = BigInt(1);
  const mockUid = 'cmt-1234567890';
  const mockAffiliateId = 'affiliate-123';
  const mockSubUserId = 'user-456';
  const mockGameRoundId1 = BigInt(789);
  const mockGameRoundId2 = BigInt(790);
  const mockGameRoundId3 = BigInt(791);
  const mockWagerAmount = new Prisma.Decimal('10000');
  const mockWinAmount = new Prisma.Decimal('5000');
  const mockCommission = new Prisma.Decimal('100');
  const mockRateApplied = new Prisma.Decimal('0.01');
  const mockCurrency = ExchangeCurrencyCode.USD;
  const mockGameCategory = GameCategory.SLOTS;
  const mockCreatedAt = new Date('2024-01-01T00:00:00Z');
  const mockUpdatedAt = new Date('2024-01-01T00:00:00Z');

  const createMockCommission = (gameRoundId: bigint) => {
    return AffiliateCommission.fromPersistence({
      id: mockId,
      uid: mockUid,
      affiliateId: mockAffiliateId,
      subUserId: mockSubUserId,
      gameRoundId,
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
    mockCalculateCommissionService = {
      execute: jest.fn(),
    } as any;

    module = await Test.createTestingModule({
      imports: [PrismaModule, EnvModule], // TransactionHost를 위해 필요
      providers: [
        AccumulateCommissionService,
        {
          provide: CalculateCommissionService,
          useValue: mockCalculateCommissionService,
        },
      ],
    }).compile();

    service = module.get<AccumulateCommissionService>(
      AccumulateCommissionService,
    );
    mockCalculateCommissionService = module.get(CalculateCommissionService);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('execute', () => {
    it('여러 라운드에 대한 커미션을 일괄 계산한다', async () => {
      // Given
      const commission1 = createMockCommission(mockGameRoundId1);
      const commission2 = createMockCommission(mockGameRoundId2);
      const commission3 = createMockCommission(mockGameRoundId3);

      const rounds = [
        {
          subUserId: mockSubUserId,
          gameRoundId: mockGameRoundId1,
          wagerAmount: mockWagerAmount,
          winAmount: mockWinAmount,
          currency: mockCurrency,
          gameCategory: mockGameCategory,
        },
        {
          subUserId: mockSubUserId,
          gameRoundId: mockGameRoundId2,
          wagerAmount: mockWagerAmount,
          winAmount: mockWinAmount,
          currency: mockCurrency,
          gameCategory: mockGameCategory,
        },
        {
          subUserId: mockSubUserId,
          gameRoundId: mockGameRoundId3,
          wagerAmount: mockWagerAmount,
          winAmount: mockWinAmount,
          currency: mockCurrency,
          gameCategory: mockGameCategory,
        },
      ];

      mockCalculateCommissionService.execute
        .mockResolvedValueOnce(commission1)
        .mockResolvedValueOnce(commission2)
        .mockResolvedValueOnce(commission3);

      // When
      const result = await service.execute({ rounds });

      // Then
      expect(result.commissions).toHaveLength(3);
      expect(result.commissions).toEqual([
        commission1,
        commission2,
        commission3,
      ]);
      expect(result.statistics).toEqual({
        total: 3,
        processed: 3,
        skipped: 0,
      });
      expect(mockCalculateCommissionService.execute).toHaveBeenCalledTimes(3);
      expect(mockCalculateCommissionService.execute).toHaveBeenNthCalledWith(
        1,
        {
          subUserId: mockSubUserId,
          gameRoundId: mockGameRoundId1,
          wagerAmount: mockWagerAmount,
          winAmount: mockWinAmount,
          currency: mockCurrency,
          gameCategory: mockGameCategory,
        },
      );
      expect(mockCalculateCommissionService.execute).toHaveBeenNthCalledWith(
        2,
        {
          subUserId: mockSubUserId,
          gameRoundId: mockGameRoundId2,
          wagerAmount: mockWagerAmount,
          winAmount: mockWinAmount,
          currency: mockCurrency,
          gameCategory: mockGameCategory,
        },
      );
      expect(mockCalculateCommissionService.execute).toHaveBeenNthCalledWith(
        3,
        {
          subUserId: mockSubUserId,
          gameRoundId: mockGameRoundId3,
          wagerAmount: mockWagerAmount,
          winAmount: mockWinAmount,
          currency: mockCurrency,
          gameCategory: mockGameCategory,
        },
      );
    });

    it('일부 라운드가 null을 반환하는 경우 null이 아닌 커미션만 반환한다', async () => {
      // Given
      const commission1 = createMockCommission(mockGameRoundId1);
      const commission3 = createMockCommission(mockGameRoundId3);

      const rounds = [
        {
          subUserId: mockSubUserId,
          gameRoundId: mockGameRoundId1,
          wagerAmount: mockWagerAmount,
          winAmount: mockWinAmount,
          currency: mockCurrency,
          gameCategory: mockGameCategory,
        },
        {
          subUserId: 'user-without-referral',
          gameRoundId: mockGameRoundId2,
          wagerAmount: mockWagerAmount,
          winAmount: mockWinAmount,
          currency: mockCurrency,
          gameCategory: mockGameCategory,
        },
        {
          subUserId: mockSubUserId,
          gameRoundId: mockGameRoundId3,
          wagerAmount: mockWagerAmount,
          winAmount: mockWinAmount,
          currency: mockCurrency,
          gameCategory: mockGameCategory,
        },
      ];

      mockCalculateCommissionService.execute
        .mockResolvedValueOnce(commission1)
        .mockResolvedValueOnce(null) // 레퍼럴 관계 없음 또는 중복
        .mockResolvedValueOnce(commission3);

      // When
      const result = await service.execute({ rounds });

      // Then
      expect(result.commissions).toHaveLength(2);
      expect(result.commissions).toEqual([commission1, commission3]);
      expect(result.statistics).toEqual({
        total: 3,
        processed: 2,
        skipped: 1,
      });
      expect(mockCalculateCommissionService.execute).toHaveBeenCalledTimes(3);
    });

    it('빈 배열을 처리한다', async () => {
      // Given
      const rounds: any[] = [];

      // When
      const result = await service.execute({ rounds });

      // Then
      expect(result.commissions).toHaveLength(0);
      expect(result.commissions).toEqual([]);
      expect(result.statistics).toEqual({
        total: 0,
        processed: 0,
        skipped: 0,
      });
      expect(mockCalculateCommissionService.execute).not.toHaveBeenCalled();
    });

    it('모든 라운드가 null을 반환하는 경우 빈 배열을 반환한다', async () => {
      // Given
      const rounds = [
        {
          subUserId: 'user-without-referral-1',
          gameRoundId: mockGameRoundId1,
          wagerAmount: mockWagerAmount,
          winAmount: mockWinAmount,
          currency: mockCurrency,
          gameCategory: mockGameCategory,
        },
        {
          subUserId: 'user-without-referral-2',
          gameRoundId: mockGameRoundId2,
          wagerAmount: mockWagerAmount,
          winAmount: mockWinAmount,
          currency: mockCurrency,
          gameCategory: mockGameCategory,
        },
      ];

      mockCalculateCommissionService.execute
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      // When
      const result = await service.execute({ rounds });

      // Then
      expect(result.commissions).toHaveLength(0);
      expect(result.commissions).toEqual([]);
      expect(result.statistics).toEqual({
        total: 2,
        processed: 0,
        skipped: 2,
      });
      expect(mockCalculateCommissionService.execute).toHaveBeenCalledTimes(2);
    });

    it('winAmount가 null인 라운드를 처리한다', async () => {
      // Given
      const commission = createMockCommission(mockGameRoundId1);

      const rounds = [
        {
          subUserId: mockSubUserId,
          gameRoundId: mockGameRoundId1,
          wagerAmount: mockWagerAmount,
          winAmount: null,
          currency: mockCurrency,
          gameCategory: mockGameCategory,
        },
      ];

      mockCalculateCommissionService.execute.mockResolvedValueOnce(commission);

      // When
      const result = await service.execute({ rounds });

      // Then
      expect(result.commissions).toHaveLength(1);
      expect(result.commissions).toEqual([commission]);
      expect(result.statistics).toEqual({
        total: 1,
        processed: 1,
        skipped: 0,
      });
      expect(mockCalculateCommissionService.execute).toHaveBeenCalledWith({
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId1,
        wagerAmount: mockWagerAmount,
        winAmount: null,
        currency: mockCurrency,
        gameCategory: mockGameCategory,
      });
    });

    it('gameCategory가 null인 라운드를 처리한다', async () => {
      // Given
      const commission = createMockCommission(mockGameRoundId1);

      const rounds = [
        {
          subUserId: mockSubUserId,
          gameRoundId: mockGameRoundId1,
          wagerAmount: mockWagerAmount,
          winAmount: mockWinAmount,
          currency: mockCurrency,
          gameCategory: null,
        },
      ];

      mockCalculateCommissionService.execute.mockResolvedValueOnce(commission);

      // When
      const result = await service.execute({ rounds });

      // Then
      expect(result.commissions).toHaveLength(1);
      expect(result.commissions).toEqual([commission]);
      expect(result.statistics).toEqual({
        total: 1,
        processed: 1,
        skipped: 0,
      });
      expect(mockCalculateCommissionService.execute).toHaveBeenCalledWith({
        subUserId: mockSubUserId,
        gameRoundId: mockGameRoundId1,
        wagerAmount: mockWagerAmount,
        winAmount: mockWinAmount,
        currency: mockCurrency,
        gameCategory: null,
      });
    });

    it('다양한 통화를 처리한다', async () => {
      // Given
      const commission1 = createMockCommission(mockGameRoundId1);
      const commission2 = createMockCommission(mockGameRoundId2);

      const rounds = [
        {
          subUserId: mockSubUserId,
          gameRoundId: mockGameRoundId1,
          wagerAmount: mockWagerAmount,
          winAmount: mockWinAmount,
          currency: ExchangeCurrencyCode.USD,
          gameCategory: mockGameCategory,
        },
        {
          subUserId: mockSubUserId,
          gameRoundId: mockGameRoundId2,
          wagerAmount: mockWagerAmount,
          winAmount: mockWinAmount,
          currency: ExchangeCurrencyCode.KRW,
          gameCategory: mockGameCategory,
        },
      ];

      mockCalculateCommissionService.execute
        .mockResolvedValueOnce(commission1)
        .mockResolvedValueOnce(commission2);

      // When
      const result = await service.execute({ rounds });

      // Then
      expect(result.commissions).toHaveLength(2);
      expect(result.statistics).toEqual({
        total: 2,
        processed: 2,
        skipped: 0,
      });
      expect(mockCalculateCommissionService.execute).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          currency: ExchangeCurrencyCode.USD,
        }),
      );
      expect(mockCalculateCommissionService.execute).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          currency: ExchangeCurrencyCode.KRW,
        }),
      );
    });

    it('라운드가 순차적으로 처리된다', async () => {
      // Given
      const commission1 = createMockCommission(mockGameRoundId1);
      const commission2 = createMockCommission(mockGameRoundId2);

      const rounds = [
        {
          subUserId: mockSubUserId,
          gameRoundId: mockGameRoundId1,
          wagerAmount: mockWagerAmount,
          winAmount: mockWinAmount,
          currency: mockCurrency,
          gameCategory: mockGameCategory,
        },
        {
          subUserId: mockSubUserId,
          gameRoundId: mockGameRoundId2,
          wagerAmount: mockWagerAmount,
          winAmount: mockWinAmount,
          currency: mockCurrency,
          gameCategory: mockGameCategory,
        },
      ];

      // execute 호출 순서를 확인하기 위해 Promise를 지연시킴
      let callCount = 0;
      mockCalculateCommissionService.execute.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return commission1;
        }
        return commission2;
      });

      // When
      const result = await service.execute({ rounds });

      // Then
      expect(result.commissions).toHaveLength(2);
      expect(result.commissions[0]).toBe(commission1);
      expect(result.commissions[1]).toBe(commission2);
      expect(result.statistics).toEqual({
        total: 2,
        processed: 2,
        skipped: 0,
      });
      expect(mockCalculateCommissionService.execute).toHaveBeenCalledTimes(2);
    });
  });
});
