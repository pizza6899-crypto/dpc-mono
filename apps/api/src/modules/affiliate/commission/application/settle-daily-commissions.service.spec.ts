// src/modules/affiliate/commission/application/settle-daily-commissions.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import {
  CommissionStatus,
  ExchangeCurrencyCode,
  GameCategory,
  Prisma,
} from '@repo/database';
import { SettleDailyCommissionsService } from './settle-daily-commissions.service';
import { AFFILIATE_COMMISSION_REPOSITORY } from '../ports/out/affiliate-commission.repository.token';
import type { AffiliateCommissionRepositoryPort } from '../ports/out/affiliate-commission.repository.port';
import { AFFILIATE_WALLET_REPOSITORY } from '../ports/out/affiliate-wallet.repository.token';
import type { AffiliateWalletRepositoryPort } from '../ports/out/affiliate-wallet.repository.port';
import { AffiliateCommission, AffiliateWallet } from '../domain';
import { PrismaModule } from 'src/platform/prisma/prisma.module';
import { EnvModule } from 'src/platform/env/env.module';

// currency.util 모킹
jest.mock('src/utils/currency.util', () => ({
  WALLET_CURRENCIES: [], // 빈 배열로 설정하여 모든 통화 사용
  GAMING_CURRENCIES: [
    ExchangeCurrencyCode.USDT,
    ExchangeCurrencyCode.USD,
    ExchangeCurrencyCode.KRW,
    ExchangeCurrencyCode.JPY,
    ExchangeCurrencyCode.PHP,
    ExchangeCurrencyCode.IDR,
    ExchangeCurrencyCode.VND,
  ],
}));

describe('SettleDailyCommissionsService', () => {
  let service: SettleDailyCommissionsService;
  let mockCommissionRepository: jest.Mocked<AffiliateCommissionRepositoryPort>;
  let mockWalletRepository: jest.Mocked<AffiliateWalletRepositoryPort>;

  const mockAffiliateId1 = 'affiliate-123';
  const mockAffiliateId2 = 'affiliate-456';
  const mockAffiliateId3 = 'affiliate-789';
  const mockSubUserId = 'user-456';
  const mockGameRoundId1 = BigInt(789);
  const mockGameRoundId2 = BigInt(790);
  const mockGameRoundId3 = BigInt(791);
  const mockSettlementDate = new Date('2024-01-15T00:00:00Z');
  const mockCreatedAt = new Date('2024-01-01T00:00:00Z');
  const mockUpdatedAt = new Date('2024-01-01T00:00:00Z');

  const createMockCommission = (overrides?: {
    id?: bigint;
    uid?: string;
    affiliateId?: string;
    currency?: ExchangeCurrencyCode;
    commission?: Prisma.Decimal;
    status?: CommissionStatus;
    createdAt?: Date;
  }) => {
    return AffiliateCommission.fromPersistence({
      id: overrides?.id ?? BigInt(1),
      uid: overrides?.uid ?? 'cmt-1234567890',
      affiliateId: overrides?.affiliateId ?? mockAffiliateId1,
      subUserId: mockSubUserId,
      gameRoundId: mockGameRoundId1,
      wagerAmount: new Prisma.Decimal('10000'),
      winAmount: new Prisma.Decimal('5000'),
      commission: overrides?.commission ?? new Prisma.Decimal('100'),
      rateApplied: new Prisma.Decimal('0.01'),
      currency: overrides?.currency ?? ExchangeCurrencyCode.USD,
      status: overrides?.status ?? CommissionStatus.PENDING,
      gameCategory: GameCategory.SLOTS,
      settlementDate: null,
      claimedAt: null,
      withdrawnAt: null,
      createdAt: overrides?.createdAt ?? mockCreatedAt,
      updatedAt: mockUpdatedAt,
    });
  };

  const createMockWallet = (overrides?: {
    affiliateId?: string;
    currency?: ExchangeCurrencyCode;
    availableBalance?: Prisma.Decimal;
    pendingBalance?: Prisma.Decimal;
    totalEarned?: Prisma.Decimal;
  }) => {
    return AffiliateWallet.create({
      affiliateId: overrides?.affiliateId ?? mockAffiliateId1,
      currency: overrides?.currency ?? ExchangeCurrencyCode.USD,
      availableBalance:
        overrides?.availableBalance ?? new Prisma.Decimal('1000'),
      pendingBalance: overrides?.pendingBalance ?? new Prisma.Decimal('500'),
      totalEarned: overrides?.totalEarned ?? new Prisma.Decimal('1500'), // availableBalance + pendingBalance 이상이어야 함
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

    mockWalletRepository = {
      findByAffiliateIdAndCurrency: jest.fn(),
      getByAffiliateIdAndCurrency: jest.fn(),
      findByAffiliateId: jest.fn(),
      upsert: jest.fn(),
      updateBalance: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettleDailyCommissionsService,
        {
          provide: AFFILIATE_COMMISSION_REPOSITORY,
          useValue: mockCommissionRepository,
        },
        {
          provide: AFFILIATE_WALLET_REPOSITORY,
          useValue: mockWalletRepository,
        },
      ],
      imports: [PrismaModule, EnvModule], // @Transactional() 데코레이터를 위해 필요
    }).compile();

    service = module.get<SettleDailyCommissionsService>(
      SettleDailyCommissionsService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('단일 어필리에이트 정산', () => {
    it('PENDING 커미션이 있는 경우 정산을 처리한다', async () => {
      // Given
      const commission1 = createMockCommission({
        id: BigInt(1),
        uid: 'cmt-1',
        commission: new Prisma.Decimal('100'),
      });
      const commission2 = createMockCommission({
        id: BigInt(2),
        uid: 'cmt-2',
        commission: new Prisma.Decimal('200'),
      });
      const wallet = createMockWallet({
        pendingBalance: new Prisma.Decimal('300'),
        totalEarned: new Prisma.Decimal('1500'),
      });

      // 모든 통화에 대해 처리 (USD만 커미션 있음)
      mockCommissionRepository.findPendingByAffiliateId.mockImplementation(
        async (affiliateId, currency, options) => {
          // USD이고 offset이 0인 경우에만 커미션 반환
          if (currency === ExchangeCurrencyCode.USD && options?.offset === 0) {
            return [commission1, commission2];
          }
          // offset이 1000 이상이거나 다른 통화는 빈 배열 (배치 종료)
          return [];
        },
      );

      mockWalletRepository.findByAffiliateIdAndCurrency.mockImplementation(
        async (affiliateId, currency) => {
          // USD에 대해서만 월렛 반환
          if (currency === ExchangeCurrencyCode.USD) {
            return wallet;
          }
          return null;
        },
      );

      mockCommissionRepository.settlePendingCommissions.mockResolvedValue(2);

      // When
      const result = await service.execute({
        settlementDate: mockSettlementDate,
        affiliateId: mockAffiliateId1,
      });

      // Then
      expect(result.settledCount).toBe(2);
      expect(result.totalAmount.toString()).toBe('300');
      expect(
        mockCommissionRepository.settlePendingCommissions,
      ).toHaveBeenCalledWith([BigInt(1), BigInt(2)], mockSettlementDate);
      expect(mockWalletRepository.upsert).toHaveBeenCalled();
    });

    it('PENDING 커미션이 없는 경우 0을 반환한다', async () => {
      // Given
      const allCurrencies = Object.values(ExchangeCurrencyCode);
      // 모든 통화에 대해 빈 배열 반환
      for (const currency of allCurrencies) {
        mockCommissionRepository.findPendingByAffiliateId.mockResolvedValueOnce(
          [],
        );
        mockWalletRepository.findByAffiliateIdAndCurrency.mockResolvedValueOnce(
          null,
        );
      }

      // When
      const result = await service.execute({
        settlementDate: mockSettlementDate,
        affiliateId: mockAffiliateId1,
      });

      // Then
      expect(result.settledCount).toBe(0);
      expect(result.totalAmount.toString()).toBe('0');
      expect(
        mockCommissionRepository.settlePendingCommissions,
      ).not.toHaveBeenCalled();
    });

    it('여러 통화에 대해 정산을 처리한다', async () => {
      // Given
      const allCurrencies = Object.values(ExchangeCurrencyCode);
      const usdCommission = createMockCommission({
        id: BigInt(1),
        currency: ExchangeCurrencyCode.USD,
        commission: new Prisma.Decimal('100'),
      });
      const krwCommission = createMockCommission({
        id: BigInt(2),
        currency: ExchangeCurrencyCode.KRW,
        commission: new Prisma.Decimal('200'),
      });
      const usdWallet = createMockWallet({
        currency: ExchangeCurrencyCode.USD,
        pendingBalance: new Prisma.Decimal('100'),
        totalEarned: new Prisma.Decimal('1500'),
      });
      const krwWallet = createMockWallet({
        currency: ExchangeCurrencyCode.KRW,
        pendingBalance: new Prisma.Decimal('200'),
        totalEarned: new Prisma.Decimal('1500'),
      });

      // 모든 통화에 대해 처리 (USD와 KRW만 커미션 있음)
      mockCommissionRepository.findPendingByAffiliateId.mockImplementation(
        async (affiliateId, currency, options) => {
          // offset이 0인 경우에만 커미션 반환
          if (options?.offset === 0) {
            if (currency === ExchangeCurrencyCode.USD) {
              return [usdCommission];
            } else if (currency === ExchangeCurrencyCode.KRW) {
              return [krwCommission];
            }
          }
          // offset이 1000 이상이거나 다른 통화는 빈 배열 (배치 종료)
          return [];
        },
      );

      mockWalletRepository.findByAffiliateIdAndCurrency.mockImplementation(
        async (affiliateId, currency) => {
          if (currency === ExchangeCurrencyCode.USD) {
            return usdWallet;
          } else if (currency === ExchangeCurrencyCode.KRW) {
            return krwWallet;
          }
          return null;
        },
      );

      mockCommissionRepository.settlePendingCommissions
        .mockResolvedValueOnce(1) // USD
        .mockResolvedValueOnce(1); // KRW

      // When
      const result = await service.execute({
        settlementDate: mockSettlementDate,
        affiliateId: mockAffiliateId1,
      });

      // Then
      expect(result.settledCount).toBe(2);
      expect(result.totalAmount.toString()).toBe('300');
      expect(
        mockCommissionRepository.settlePendingCommissions,
      ).toHaveBeenCalledTimes(2);
    });

    it('커미션이 없을 때 월렛이 없으면 생성한다', async () => {
      // Given
      // 모든 통화에 대해 빈 결과 반환 (커미션 없음)
      mockCommissionRepository.findPendingByAffiliateId.mockImplementation(
        async () => [],
      );

      // 월렛이 없는 경우 null 반환
      mockWalletRepository.findByAffiliateIdAndCurrency.mockImplementation(
        async () => null,
      );

      mockWalletRepository.upsert.mockImplementation((wallet) =>
        Promise.resolve(wallet),
      );

      // When
      const result = await service.execute({
        settlementDate: mockSettlementDate,
        affiliateId: mockAffiliateId1,
      });

      // Then
      // 모든 통화에 대해 월렛 생성이 시도됨 (커미션이 없어도 생성 시도)
      expect(mockWalletRepository.upsert).toHaveBeenCalled();
      expect(result.settledCount).toBe(0);
      expect(result.totalAmount.toString()).toBe('0');
    });

    it('커미션이 있지만 월렛이 없으면 에러가 발생한다', async () => {
      // Given
      const commission = createMockCommission({
        id: BigInt(1),
        commission: new Prisma.Decimal('100'),
      });

      // USD에 대해서만 커미션 반환
      mockCommissionRepository.findPendingByAffiliateId.mockImplementation(
        async (affiliateId, currency, options) => {
          if (currency === ExchangeCurrencyCode.USD && options?.offset === 0) {
            return [commission];
          }
          return [];
        },
      );

      // 월렛이 없는 경우 null 반환
      mockWalletRepository.findByAffiliateIdAndCurrency.mockImplementation(
        async () => null,
      );

      // 월렛 생성 시 pendingBalance가 0인 새 월렛 반환
      mockWalletRepository.upsert.mockImplementation((wallet) =>
        Promise.resolve(wallet),
      );

      // When & Then
      // 월렛이 없으면 생성되지만, pendingBalance가 0이므로 정산할 금액이 있으면 에러 발생
      await expect(
        service.execute({
          settlementDate: mockSettlementDate,
          affiliateId: mockAffiliateId1,
        }),
      ).rejects.toThrow('The settlement amount');
    });

    it('대량 커미션을 배치로 처리한다', async () => {
      // Given
      const batch1 = Array.from({ length: 1000 }, (_, i) =>
        createMockCommission({
          id: BigInt(i + 1),
          uid: `cmt-${i + 1}`,
          commission: new Prisma.Decimal('10'),
        }),
      );
      const batch2 = Array.from({ length: 500 }, (_, i) =>
        createMockCommission({
          id: BigInt(i + 1001),
          uid: `cmt-${i + 1001}`,
          commission: new Prisma.Decimal('10'),
        }),
      );
      const wallet = createMockWallet({
        pendingBalance: new Prisma.Decimal('15000'),
        totalEarned: new Prisma.Decimal('20000'),
      });

      // USD에 대해 배치 처리
      mockCommissionRepository.findPendingByAffiliateId.mockImplementation(
        async (affiliateId, currency, options) => {
          // USD에 대해서만 배치 처리
          if (currency === ExchangeCurrencyCode.USD) {
            if (options?.offset === 0) {
              return batch1; // 첫 번째 배치 (1000개)
            } else if (options?.offset === 1000) {
              return batch2; // 두 번째 배치 (500개)
            }
            return []; // 종료
          }
          return []; // 다른 통화는 빈 배열
        },
      );

      mockWalletRepository.findByAffiliateIdAndCurrency.mockImplementation(
        async (affiliateId, currency) => {
          // USD에 대해서만 월렛 반환
          if (currency === ExchangeCurrencyCode.USD) {
            return wallet;
          }
          return null;
        },
      );

      mockCommissionRepository.settlePendingCommissions
        .mockResolvedValueOnce(1000)
        .mockResolvedValueOnce(500);

      // When
      const result = await service.execute({
        settlementDate: mockSettlementDate,
        affiliateId: mockAffiliateId1,
      });

      // Then
      expect(result.settledCount).toBe(1500);
      expect(result.totalAmount.toString()).toBe('15000');
      expect(
        mockCommissionRepository.settlePendingCommissions,
      ).toHaveBeenCalledTimes(2);
      // 첫 번째 배치: offset 0
      const firstCall =
        mockCommissionRepository.findPendingByAffiliateId.mock.calls.find(
          (call) => call[2]?.offset === 0,
        );
      expect(firstCall).toBeDefined();
      expect(firstCall?.[2]?.limit).toBe(1000);
      // 두 번째 배치: offset 1000
      const secondCall =
        mockCommissionRepository.findPendingByAffiliateId.mock.calls.find(
          (call) => call[2]?.offset === 1000,
        );
      expect(secondCall).toBeDefined();
      expect(secondCall?.[2]?.limit).toBe(1000);
    });

    it('월렛의 pendingBalance가 정산 금액보다 작으면 에러가 발생한다', async () => {
      // Given
      const commission = createMockCommission({
        id: BigInt(1),
        commission: new Prisma.Decimal('1000'),
      });
      const wallet = createMockWallet({
        pendingBalance: new Prisma.Decimal('500'), // 정산 금액보다 작음
        totalEarned: new Prisma.Decimal('1500'),
      });

      // USD에 대해서만 커미션 반환
      mockCommissionRepository.findPendingByAffiliateId.mockImplementation(
        async (affiliateId, currency, options) => {
          if (currency === ExchangeCurrencyCode.USD && options?.offset === 0) {
            return [commission];
          }
          return [];
        },
      );

      mockWalletRepository.findByAffiliateIdAndCurrency.mockImplementation(
        async (affiliateId, currency) => {
          if (currency === ExchangeCurrencyCode.USD) {
            return wallet;
          }
          return null;
        },
      );

      // When & Then
      await expect(
        service.execute({
          settlementDate: mockSettlementDate,
          affiliateId: mockAffiliateId1,
        }),
      ).rejects.toThrow('The settlement amount');
    });
  });

  describe('전체 어필리에이트 배치 정산', () => {
    it('여러 어필리에이트를 배치로 처리한다', async () => {
      // Given
      const commission1 = createMockCommission({
        id: BigInt(1),
        affiliateId: mockAffiliateId1,
        commission: new Prisma.Decimal('100'),
      });
      const commission2 = createMockCommission({
        id: BigInt(2),
        affiliateId: mockAffiliateId2,
        commission: new Prisma.Decimal('200'),
      });
      const wallet1 = createMockWallet({
        affiliateId: mockAffiliateId1,
        pendingBalance: new Prisma.Decimal('100'),
        totalEarned: new Prisma.Decimal('1500'),
      });
      const wallet2 = createMockWallet({
        affiliateId: mockAffiliateId2,
        pendingBalance: new Prisma.Decimal('200'),
        totalEarned: new Prisma.Decimal('1500'),
      });

      // 어필리에이트 ID 목록 조회
      mockCommissionRepository.findAffiliateIdsWithPendingCommissions
        .mockResolvedValueOnce([mockAffiliateId1, mockAffiliateId2])
        .mockResolvedValueOnce([]); // 더 이상 없음

      // 모든 통화에 대해 처리 (USD만 커미션 있음)
      mockCommissionRepository.findPendingByAffiliateId.mockImplementation(
        async (affiliateId, currency, options) => {
          // USD이고 offset이 0인 경우에만 커미션 반환
          if (currency === ExchangeCurrencyCode.USD && options?.offset === 0) {
            if (affiliateId === mockAffiliateId1) {
              return [commission1];
            } else if (affiliateId === mockAffiliateId2) {
              return [commission2];
            }
          }
          return [];
        },
      );

      mockWalletRepository.findByAffiliateIdAndCurrency.mockImplementation(
        async (affiliateId, currency) => {
          // USD에 대해서만 월렛 반환
          if (currency === ExchangeCurrencyCode.USD) {
            if (affiliateId === mockAffiliateId1) {
              return wallet1;
            } else if (affiliateId === mockAffiliateId2) {
              return wallet2;
            }
          }
          return null;
        },
      );

      mockCommissionRepository.settlePendingCommissions
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);

      // When
      const result = await service.execute({
        settlementDate: mockSettlementDate,
      });

      // Then
      expect(result.settledCount).toBe(2);
      expect(result.totalAmount.toString()).toBe('300');
      expect(
        mockCommissionRepository.findAffiliateIdsWithPendingCommissions,
      ).toHaveBeenCalledWith({ limit: 100, offset: 0 });
    });

    it('배치 크기 제한을 적용한다', async () => {
      // Given
      const affiliateIds = Array.from(
        { length: 150 },
        (_, i) => `affiliate-${i + 1}`,
      );

      // 첫 번째 배치 (100개)
      mockCommissionRepository.findAffiliateIdsWithPendingCommissions
        .mockResolvedValueOnce(affiliateIds.slice(0, 100))
        .mockResolvedValueOnce(affiliateIds.slice(100, 150)) // 두 번째 배치 (50개)
        .mockResolvedValueOnce([]); // 종료

      // 각 어필리에이트에 대해 빈 결과 반환 (모든 통화)
      mockCommissionRepository.findPendingByAffiliateId.mockImplementation(
        async () => [],
      );
      mockWalletRepository.findByAffiliateIdAndCurrency.mockImplementation(
        async () => null,
      );
      mockWalletRepository.upsert.mockImplementation((wallet) =>
        Promise.resolve(wallet),
      );

      // When
      const result = await service.execute({
        settlementDate: mockSettlementDate,
      });

      // Then
      // 첫 번째 배치: 100개 반환 -> hasMore = true -> 다음 배치 조회
      // 두 번째 배치: 50개 반환 -> hasMore = false -> 루프 종료
      // 따라서 2번만 호출됨
      expect(
        mockCommissionRepository.findAffiliateIdsWithPendingCommissions,
      ).toHaveBeenCalledTimes(2);
      expect(
        mockCommissionRepository.findAffiliateIdsWithPendingCommissions,
      ).toHaveBeenNthCalledWith(1, { limit: 100, offset: 0 });
      expect(
        mockCommissionRepository.findAffiliateIdsWithPendingCommissions,
      ).toHaveBeenNthCalledWith(2, { limit: 100, offset: 100 });

      // 실제로 150개의 affiliate가 처리되었는지 확인
      // 각 affiliate마다 모든 통화에 대해 findPendingByAffiliateId가 호출됨
      const totalCurrencies = Object.values(ExchangeCurrencyCode).length;
      const expectedCalls = 150 * totalCurrencies;
      expect(
        mockCommissionRepository.findPendingByAffiliateId,
      ).toHaveBeenCalledTimes(expectedCalls);
    });

    it('일부 어필리에이트 실패 시 다른 어필리에이트에 영향이 없다', async () => {
      // Given
      const commission1 = createMockCommission({
        id: BigInt(1),
        affiliateId: mockAffiliateId1,
        commission: new Prisma.Decimal('100'),
      });
      const commission3 = createMockCommission({
        id: BigInt(3),
        affiliateId: mockAffiliateId3,
        commission: new Prisma.Decimal('300'),
      });
      const wallet1 = createMockWallet({
        affiliateId: mockAffiliateId1,
        pendingBalance: new Prisma.Decimal('100'),
        totalEarned: new Prisma.Decimal('1500'),
      });
      const wallet3 = createMockWallet({
        affiliateId: mockAffiliateId3,
        pendingBalance: new Prisma.Decimal('300'),
        totalEarned: new Prisma.Decimal('1500'),
      });

      // 어필리에이트 ID 목록 조회
      mockCommissionRepository.findAffiliateIdsWithPendingCommissions
        .mockResolvedValueOnce([
          mockAffiliateId1,
          mockAffiliateId2,
          mockAffiliateId3,
        ])
        .mockResolvedValueOnce([]);

      // 모든 통화에 대해 처리 (USD만 커미션 있음)
      const callCounts = new Map<string, number>();
      mockCommissionRepository.findPendingByAffiliateId.mockImplementation(
        async (affiliateId, currency, options) => {
          // USD이고 offset이 0인 경우에만 커미션 반환
          if (currency === ExchangeCurrencyCode.USD && options?.offset === 0) {
            if (affiliateId === mockAffiliateId1) {
              return [commission1];
            } else if (affiliateId === mockAffiliateId2) {
              // 두 번째 어필리에이트는 USD 조회 시 실패
              const key = `${affiliateId}_${currency}`;
              const count = callCounts.get(key) || 0;
              callCounts.set(key, count + 1);
              if (count === 0) {
                throw new Error('Database error');
              }
            } else if (affiliateId === mockAffiliateId3) {
              return [commission3];
            }
          }
          return [];
        },
      );

      mockWalletRepository.findByAffiliateIdAndCurrency.mockImplementation(
        async (affiliateId, currency) => {
          // USD에 대해서만 월렛 반환
          if (currency === ExchangeCurrencyCode.USD) {
            if (affiliateId === mockAffiliateId1) {
              return wallet1;
            } else if (affiliateId === mockAffiliateId3) {
              return wallet3;
            }
          }
          return null;
        },
      );

      mockCommissionRepository.settlePendingCommissions
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);

      // When
      const result = await service.execute({
        settlementDate: mockSettlementDate,
      });

      // Then
      expect(result.settledCount).toBe(2); // 첫 번째와 세 번째만 성공
      expect(result.totalAmount.toString()).toBe('400');
      expect(
        mockCommissionRepository.settlePendingCommissions,
      ).toHaveBeenCalledTimes(2);
    });

    it('정산할 PENDING 커미션이 없으면 0을 반환한다', async () => {
      // Given
      mockCommissionRepository.findAffiliateIdsWithPendingCommissions.mockResolvedValue(
        [],
      );

      // When
      const result = await service.execute({
        settlementDate: mockSettlementDate,
      });

      // Then
      expect(result.settledCount).toBe(0);
      expect(result.totalAmount.toString()).toBe('0');
      expect(
        mockCommissionRepository.findPendingByAffiliateId,
      ).not.toHaveBeenCalled();
    });
  });

  describe('데이터 일관성', () => {
    it('조회한 커미션만 정산 처리한다', async () => {
      // Given
      const commission1 = createMockCommission({
        id: BigInt(1),
        uid: 'cmt-1',
        commission: new Prisma.Decimal('100'),
      });
      const commission2 = createMockCommission({
        id: BigInt(2),
        uid: 'cmt-2',
        commission: new Prisma.Decimal('200'),
      });
      const wallet = createMockWallet({
        pendingBalance: new Prisma.Decimal('300'),
        totalEarned: new Prisma.Decimal('1500'),
      });

      // 모든 통화에 대해 처리 (USD만 커미션 있음)
      mockCommissionRepository.findPendingByAffiliateId.mockImplementation(
        async (affiliateId, currency, options) => {
          // USD이고 offset이 0인 경우에만 커미션 반환
          if (currency === ExchangeCurrencyCode.USD && options?.offset === 0) {
            return [commission1, commission2];
          }
          return [];
        },
      );

      mockWalletRepository.findByAffiliateIdAndCurrency.mockImplementation(
        async (affiliateId, currency) => {
          // USD에 대해서만 월렛 반환
          if (currency === ExchangeCurrencyCode.USD) {
            return wallet;
          }
          return null;
        },
      );

      mockCommissionRepository.settlePendingCommissions.mockResolvedValue(2);

      // When
      await service.execute({
        settlementDate: mockSettlementDate,
        affiliateId: mockAffiliateId1,
      });

      // Then
      // 조회한 커미션 ID만 전달되는지 확인
      expect(
        mockCommissionRepository.settlePendingCommissions,
      ).toHaveBeenCalledWith([BigInt(1), BigInt(2)], mockSettlementDate);
    });

    it('월렛의 pendingBalance가 정산 금액만큼 감소하고 availableBalance가 증가한다', async () => {
      // Given
      const commission1 = createMockCommission({
        id: BigInt(1),
        commission: new Prisma.Decimal('100'),
      });
      const commission2 = createMockCommission({
        id: BigInt(2),
        commission: new Prisma.Decimal('200'),
      });
      const wallet = createMockWallet({
        availableBalance: new Prisma.Decimal('500'),
        pendingBalance: new Prisma.Decimal('300'),
        totalEarned: new Prisma.Decimal('1500'),
      });

      // 모든 통화에 대해 처리 (USD만 커미션 있음)
      mockCommissionRepository.findPendingByAffiliateId.mockImplementation(
        async (affiliateId, currency, options) => {
          // USD이고 offset이 0인 경우에만 커미션 반환
          if (currency === ExchangeCurrencyCode.USD && options?.offset === 0) {
            return [commission1, commission2];
          }
          return [];
        },
      );

      mockWalletRepository.findByAffiliateIdAndCurrency.mockImplementation(
        async (affiliateId, currency) => {
          // USD에 대해서만 월렛 반환
          if (currency === ExchangeCurrencyCode.USD) {
            return wallet;
          }
          return null;
        },
      );

      mockCommissionRepository.settlePendingCommissions.mockResolvedValue(2);

      // When
      await service.execute({
        settlementDate: mockSettlementDate,
        affiliateId: mockAffiliateId1,
      });

      // Then
      expect(mockWalletRepository.upsert).toHaveBeenCalled();
      // USD에 대한 upsert 호출 찾기 (모든 통화에 대해 처리하므로 USD를 찾아야 함)
      const usdUpsertCall = mockWalletRepository.upsert.mock.calls.find(
        (call) => call[0].currency === ExchangeCurrencyCode.USD,
      );
      expect(usdUpsertCall).toBeDefined();
      const updatedWallet = usdUpsertCall![0];
      expect(updatedWallet.availableBalance.toString()).toBe('800'); // 500 + 300
      expect(updatedWallet.pendingBalance.toString()).toBe('0'); // 300 - 300
    });

    it('여러 배치에 걸쳐 월렛이 누적 업데이트된다', async () => {
      // Given
      const batch1 = Array.from({ length: 1000 }, (_, i) =>
        createMockCommission({
          id: BigInt(i + 1),
          commission: new Prisma.Decimal('10'),
        }),
      );
      const batch2 = Array.from({ length: 500 }, (_, i) =>
        createMockCommission({
          id: BigInt(i + 1001),
          commission: new Prisma.Decimal('10'),
        }),
      );

      // 통화별로 독립적인 wallet 객체 관리
      const walletsByCurrency = new Map<
        ExchangeCurrencyCode,
        AffiliateWallet
      >();

      // USD 월렛 초기화
      const usdWallet = createMockWallet({
        currency: ExchangeCurrencyCode.USD,
        availableBalance: new Prisma.Decimal('0'),
        pendingBalance: new Prisma.Decimal('15000'),
        totalEarned: new Prisma.Decimal('20000'),
      });
      walletsByCurrency.set(ExchangeCurrencyCode.USD, usdWallet);

      // upsert 호출 시점의 wallet 상태를 저장 (스냅샷)
      const upsertSnapshots: Array<{
        currency: ExchangeCurrencyCode;
        availableBalance: string;
        pendingBalance: string;
      }> = [];

      // USD에 대해 배치 처리
      mockCommissionRepository.findPendingByAffiliateId.mockImplementation(
        async (affiliateId, currency, options) => {
          // USD이고 offset에 따라 배치 반환
          if (currency === ExchangeCurrencyCode.USD) {
            if (options?.offset === 0) {
              return batch1; // 첫 번째 배치 (1000개)
            } else if (options?.offset === 1000) {
              return batch2; // 두 번째 배치 (500개)
            }
            return []; // 종료
          }
          return []; // 다른 통화는 빈 배열
        },
      );

      // 서비스 로직: 통화별로 wallet을 한 번만 조회 (for loop 시작 시)
      // 각 통화마다 독립적인 wallet 객체 반환
      mockWalletRepository.findByAffiliateIdAndCurrency.mockImplementation(
        async (affiliateId, currency) => {
          // 해당 통화의 wallet이 있으면 반환, 없으면 null
          return walletsByCurrency.get(currency) || null;
        },
      );

      // upsert가 호출될 때마다 해당 통화의 wallet 업데이트 및 스냅샷 저장
      mockWalletRepository.upsert.mockImplementation((updatedWallet) => {
        // 호출 시점의 wallet 상태를 스냅샷으로 저장
        upsertSnapshots.push({
          currency: updatedWallet.currency,
          availableBalance: updatedWallet.availableBalance.toString(),
          pendingBalance: updatedWallet.pendingBalance.toString(),
        });
        // 해당 통화의 wallet 상태 업데이트
        walletsByCurrency.set(updatedWallet.currency, updatedWallet);
        return Promise.resolve(updatedWallet);
      });

      mockCommissionRepository.settlePendingCommissions
        .mockResolvedValueOnce(1000)
        .mockResolvedValueOnce(500);

      // When
      await service.execute({
        settlementDate: mockSettlementDate,
        affiliateId: mockAffiliateId1,
      });

      // Then
      // 서비스는 모든 통화에 대해 처리하므로, USD에 대한 upsert 스냅샷만 필터링
      const usdSnapshots = upsertSnapshots.filter(
        (snapshot) => snapshot.currency === ExchangeCurrencyCode.USD,
      );
      expect(usdSnapshots.length).toBe(2); // USD에 대해 2번 호출 (배치마다)

      // 첫 번째 배치 후: availableBalance = 10000, pendingBalance = 5000
      expect(usdSnapshots[0].availableBalance).toBe('10000');
      expect(usdSnapshots[0].pendingBalance).toBe('5000');

      // 두 번째 배치 후: availableBalance = 15000, pendingBalance = 0
      expect(usdSnapshots[1].availableBalance).toBe('15000');
      expect(usdSnapshots[1].pendingBalance).toBe('0');
    });
  });

  describe('에러 처리', () => {
    it('Repository 에러 발생 시 로깅하고 재던지기한다', async () => {
      // Given
      const error = new Error('Database connection failed');
      mockCommissionRepository.findPendingByAffiliateId.mockRejectedValue(
        error,
      );

      // When & Then
      await expect(
        service.execute({
          settlementDate: mockSettlementDate,
          affiliateId: mockAffiliateId1,
        }),
      ).rejects.toThrow('Database connection failed');
    });

    it('월렛 조회 실패 시 에러를 발생시킨다', async () => {
      // Given
      const commission = createMockCommission();
      const error = new Error('Wallet not found');
      mockCommissionRepository.findPendingByAffiliateId.mockResolvedValue([
        commission,
      ]);
      mockWalletRepository.findByAffiliateIdAndCurrency.mockRejectedValue(
        error,
      );

      // When & Then
      await expect(
        service.execute({
          settlementDate: mockSettlementDate,
          affiliateId: mockAffiliateId1,
        }),
      ).rejects.toThrow('Wallet not found');
    });

    it('settlePendingCommissions 실패 시 에러를 발생시킨다', async () => {
      // Given
      const commission = createMockCommission({
        id: BigInt(1),
        commission: new Prisma.Decimal('100'),
      });
      const wallet = createMockWallet({
        pendingBalance: new Prisma.Decimal('100'),
        totalEarned: new Prisma.Decimal('1500'),
      });

      mockCommissionRepository.findPendingByAffiliateId.mockImplementation(
        async (affiliateId, currency, options) => {
          if (currency === ExchangeCurrencyCode.USD && options?.offset === 0) {
            return [commission];
          }
          return [];
        },
      );

      mockWalletRepository.findByAffiliateIdAndCurrency.mockImplementation(
        async (affiliateId, currency) => {
          if (currency === ExchangeCurrencyCode.USD) {
            return wallet;
          }
          return null;
        },
      );

      const error = new Error('Failed to settle commissions');
      mockCommissionRepository.settlePendingCommissions.mockRejectedValue(
        error,
      );

      // When & Then
      await expect(
        service.execute({
          settlementDate: mockSettlementDate,
          affiliateId: mockAffiliateId1,
        }),
      ).rejects.toThrow('Failed to settle commissions');
    });
  });

  describe('통화별 처리', () => {
    it('여러 통화를 순차적으로 처리한다', async () => {
      // Given
      const usdCommission = createMockCommission({
        id: BigInt(1),
        currency: ExchangeCurrencyCode.USD,
        commission: new Prisma.Decimal('100'),
      });
      const krwCommission = createMockCommission({
        id: BigInt(2),
        currency: ExchangeCurrencyCode.KRW,
        commission: new Prisma.Decimal('200'),
      });
      const jpyCommission = createMockCommission({
        id: BigInt(3),
        currency: ExchangeCurrencyCode.JPY,
        commission: new Prisma.Decimal('300'),
      });
      const usdWallet = createMockWallet({
        currency: ExchangeCurrencyCode.USD,
        pendingBalance: new Prisma.Decimal('100'),
        totalEarned: new Prisma.Decimal('1500'),
      });
      const krwWallet = createMockWallet({
        currency: ExchangeCurrencyCode.KRW,
        pendingBalance: new Prisma.Decimal('200'),
        totalEarned: new Prisma.Decimal('1500'),
      });
      const jpyWallet = createMockWallet({
        currency: ExchangeCurrencyCode.JPY,
        pendingBalance: new Prisma.Decimal('300'),
        totalEarned: new Prisma.Decimal('1500'),
      });

      // 모든 통화에 대해 처리 (통화별로 커미션 있음/없음 설정)
      mockCommissionRepository.findPendingByAffiliateId.mockImplementation(
        async (affiliateId, currency, options) => {
          // offset이 0인 경우에만 커미션 반환 (첫 번째 배치)
          if (options?.offset === 0) {
            if (currency === ExchangeCurrencyCode.USD) {
              return [usdCommission];
            } else if (currency === ExchangeCurrencyCode.KRW) {
              return [krwCommission];
            } else if (currency === ExchangeCurrencyCode.JPY) {
              return [jpyCommission];
            }
          }
          // offset이 1000 이상이거나 다른 통화는 빈 배열 반환 (배치 종료)
          return [];
        },
      );

      mockWalletRepository.findByAffiliateIdAndCurrency.mockImplementation(
        async (affiliateId, currency) => {
          if (currency === ExchangeCurrencyCode.USD) {
            return usdWallet;
          } else if (currency === ExchangeCurrencyCode.KRW) {
            return krwWallet;
          } else if (currency === ExchangeCurrencyCode.JPY) {
            return jpyWallet;
          }
          return null;
        },
      );

      mockCommissionRepository.settlePendingCommissions
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);

      // When
      const result = await service.execute({
        settlementDate: mockSettlementDate,
        affiliateId: mockAffiliateId1,
      });

      // Then
      expect(result.settledCount).toBe(3);
      expect(result.totalAmount.toString()).toBe('600');
      expect(
        mockCommissionRepository.settlePendingCommissions,
      ).toHaveBeenCalledTimes(3);
    });

    it('일부 통화에 PENDING 커미션이 없어도 계속 처리한다', async () => {
      // Given
      const usdCommission = createMockCommission({
        id: BigInt(1),
        currency: ExchangeCurrencyCode.USD,
        commission: new Prisma.Decimal('100'),
      });
      const usdWallet = createMockWallet({
        currency: ExchangeCurrencyCode.USD,
        pendingBalance: new Prisma.Decimal('100'),
        totalEarned: new Prisma.Decimal('1500'),
      });
      const krwWallet = createMockWallet({
        currency: ExchangeCurrencyCode.KRW,
        pendingBalance: new Prisma.Decimal('0'),
        totalEarned: new Prisma.Decimal('1500'),
      });

      // 모든 통화에 대해 처리 (USD만 커미션 있음)
      // findPendingByAffiliateId는 각 통화마다 offset 0으로 시작하여 호출됨
      // USD의 경우: offset 0 -> 커미션 반환, offset 1000 -> 빈 배열 (배치 종료)
      // 다른 통화: offset 0 -> 빈 배열 (커미션 없음)
      mockCommissionRepository.findPendingByAffiliateId.mockImplementation(
        async (affiliateId, currency, options) => {
          // offset이 0이고 USD인 경우에만 커미션 반환
          if (currency === ExchangeCurrencyCode.USD && options?.offset === 0) {
            return [usdCommission];
          }
          // offset이 1000 이상이거나 다른 통화는 빈 배열 반환
          return [];
        },
      );

      mockWalletRepository.findByAffiliateIdAndCurrency.mockImplementation(
        async (affiliateId, currency) => {
          if (currency === ExchangeCurrencyCode.USD) {
            return usdWallet;
          } else if (currency === ExchangeCurrencyCode.KRW) {
            return krwWallet;
          }
          return null;
        },
      );

      mockCommissionRepository.settlePendingCommissions.mockResolvedValueOnce(
        1,
      );

      // When
      const result = await service.execute({
        settlementDate: mockSettlementDate,
        affiliateId: mockAffiliateId1,
      });

      // Then
      expect(result.settledCount).toBe(1);
      expect(result.totalAmount.toString()).toBe('100');
      // USD에 대해서만 settlePendingCommissions가 호출되어야 함
      expect(
        mockCommissionRepository.settlePendingCommissions,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockCommissionRepository.settlePendingCommissions,
      ).toHaveBeenCalledWith([BigInt(1)], mockSettlementDate);
    });
  });

  describe('경계값 테스트', () => {
    it('pendingBalance가 0일 때 정산을 처리한다', async () => {
      // Given
      const commission = createMockCommission({
        id: BigInt(1),
        commission: new Prisma.Decimal('0'), // 커미션이 0
      });
      const wallet = createMockWallet({
        pendingBalance: new Prisma.Decimal('0'),
        totalEarned: new Prisma.Decimal('1000'),
      });

      mockCommissionRepository.findPendingByAffiliateId.mockImplementation(
        async (affiliateId, currency, options) => {
          if (currency === ExchangeCurrencyCode.USD && options?.offset === 0) {
            return [commission];
          }
          return [];
        },
      );

      mockWalletRepository.findByAffiliateIdAndCurrency.mockImplementation(
        async (affiliateId, currency) => {
          if (currency === ExchangeCurrencyCode.USD) {
            return wallet;
          }
          return null;
        },
      );

      mockCommissionRepository.settlePendingCommissions.mockResolvedValue(1);

      // When
      const result = await service.execute({
        settlementDate: mockSettlementDate,
        affiliateId: mockAffiliateId1,
      });

      // Then
      // settlePendingCommission은 0 이하 금액에 대해 아무것도 하지 않음
      expect(result.settledCount).toBe(1);
      expect(result.totalAmount.toString()).toBe('0');
    });

    it('커미션 금액이 0인 경우 정산을 처리한다', async () => {
      // Given
      const commission = createMockCommission({
        id: BigInt(1),
        commission: new Prisma.Decimal('0'),
      });
      const wallet = createMockWallet({
        availableBalance: new Prisma.Decimal('900'),
        pendingBalance: new Prisma.Decimal('100'),
        totalEarned: new Prisma.Decimal('1000'),
      });

      mockCommissionRepository.findPendingByAffiliateId.mockImplementation(
        async (affiliateId, currency, options) => {
          if (currency === ExchangeCurrencyCode.USD && options?.offset === 0) {
            return [commission];
          }
          return [];
        },
      );

      mockWalletRepository.findByAffiliateIdAndCurrency.mockImplementation(
        async (affiliateId, currency) => {
          if (currency === ExchangeCurrencyCode.USD) {
            return wallet;
          }
          return null;
        },
      );

      mockCommissionRepository.settlePendingCommissions.mockResolvedValue(1);

      // When
      const result = await service.execute({
        settlementDate: mockSettlementDate,
        affiliateId: mockAffiliateId1,
      });

      // Then
      expect(result.settledCount).toBe(1);
      expect(result.totalAmount.toString()).toBe('0');
      // wallet의 잔액은 변경되지 않음 (0원 정산)
      expect(mockWalletRepository.upsert).toHaveBeenCalled();
    });

    it('settlementDate가 미래 날짜인 경우 정산을 처리한다', async () => {
      // Given
      const futureDate = new Date('2025-12-31T00:00:00Z');
      const commission = createMockCommission({
        id: BigInt(1),
        commission: new Prisma.Decimal('100'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
      });
      const wallet = createMockWallet({
        pendingBalance: new Prisma.Decimal('100'),
        totalEarned: new Prisma.Decimal('1500'),
      });

      mockCommissionRepository.findPendingByAffiliateId.mockImplementation(
        async (affiliateId, currency, options) => {
          if (currency === ExchangeCurrencyCode.USD && options?.offset === 0) {
            return [commission];
          }
          return [];
        },
      );

      mockWalletRepository.findByAffiliateIdAndCurrency.mockImplementation(
        async (affiliateId, currency) => {
          if (currency === ExchangeCurrencyCode.USD) {
            return wallet;
          }
          return null;
        },
      );

      mockCommissionRepository.settlePendingCommissions.mockResolvedValue(1);

      // When
      const result = await service.execute({
        settlementDate: futureDate,
        affiliateId: mockAffiliateId1,
      });

      // Then
      expect(result.settledCount).toBe(1);
      expect(
        mockCommissionRepository.settlePendingCommissions,
      ).toHaveBeenCalledWith([BigInt(1)], futureDate);
    });

    it('매우 큰 커미션 금액을 처리한다', async () => {
      // Given
      const largeAmount = new Prisma.Decimal('999999999999.99');
      const commission = createMockCommission({
        id: BigInt(1),
        commission: largeAmount,
      });
      const wallet = createMockWallet({
        availableBalance: new Prisma.Decimal('0'),
        pendingBalance: largeAmount,
        totalEarned: largeAmount,
      });

      mockCommissionRepository.findPendingByAffiliateId.mockImplementation(
        async (affiliateId, currency, options) => {
          if (currency === ExchangeCurrencyCode.USD && options?.offset === 0) {
            return [commission];
          }
          return [];
        },
      );

      mockWalletRepository.findByAffiliateIdAndCurrency.mockImplementation(
        async (affiliateId, currency) => {
          if (currency === ExchangeCurrencyCode.USD) {
            return wallet;
          }
          return null;
        },
      );

      mockCommissionRepository.settlePendingCommissions.mockResolvedValue(1);

      // When
      const result = await service.execute({
        settlementDate: mockSettlementDate,
        affiliateId: mockAffiliateId1,
      });

      // Then
      expect(result.settledCount).toBe(1);
      expect(result.totalAmount.toString()).toBe('999999999999.99');
    });
  });

  describe('트랜잭션 롤백 테스트', () => {
    it('중간에 에러 발생 시 롤백된다', async () => {
      // Given
      const commission1 = createMockCommission({
        id: BigInt(1),
        commission: new Prisma.Decimal('100'),
      });
      const commission2 = createMockCommission({
        id: BigInt(2),
        commission: new Prisma.Decimal('200'),
      });
      const wallet = createMockWallet({
        pendingBalance: new Prisma.Decimal('300'),
        totalEarned: new Prisma.Decimal('1500'),
      });

      let upsertCallCount = 0;
      mockCommissionRepository.findPendingByAffiliateId.mockImplementation(
        async (affiliateId, currency, options) => {
          if (currency === ExchangeCurrencyCode.USD && options?.offset === 0) {
            return [commission1, commission2];
          }
          return [];
        },
      );

      mockWalletRepository.findByAffiliateIdAndCurrency.mockImplementation(
        async (affiliateId, currency) => {
          if (currency === ExchangeCurrencyCode.USD) {
            return wallet;
          }
          return null;
        },
      );

      // 첫 번째 upsert는 성공, 두 번째 upsert에서 에러 발생
      mockWalletRepository.upsert.mockImplementation((updatedWallet) => {
        upsertCallCount++;
        if (upsertCallCount === 1) {
          return Promise.resolve(updatedWallet);
        }
        return Promise.reject(new Error('Database error'));
      });

      mockCommissionRepository.settlePendingCommissions.mockResolvedValue(2);

      // When & Then
      // @Transactional() 데코레이터로 인해 트랜잭션이 롤백되어야 함
      await expect(
        service.execute({
          settlementDate: mockSettlementDate,
          affiliateId: mockAffiliateId1,
        }),
      ).rejects.toThrow('Database error');

      // upsert가 호출되었지만 에러로 인해 롤백됨
      expect(mockWalletRepository.upsert).toHaveBeenCalled();
    });

    it('settlePendingCommissions 실패 시 롤백된다', async () => {
      // Given
      const commission = createMockCommission({
        id: BigInt(1),
        commission: new Prisma.Decimal('100'),
      });
      const wallet = createMockWallet({
        pendingBalance: new Prisma.Decimal('100'),
        totalEarned: new Prisma.Decimal('1500'),
      });

      mockCommissionRepository.findPendingByAffiliateId.mockImplementation(
        async (affiliateId, currency, options) => {
          if (currency === ExchangeCurrencyCode.USD && options?.offset === 0) {
            return [commission];
          }
          return [];
        },
      );

      mockWalletRepository.findByAffiliateIdAndCurrency.mockImplementation(
        async (affiliateId, currency) => {
          if (currency === ExchangeCurrencyCode.USD) {
            return wallet;
          }
          return null;
        },
      );

      mockWalletRepository.upsert.mockResolvedValue(wallet);
      mockCommissionRepository.settlePendingCommissions.mockRejectedValue(
        new Error('Failed to update commissions'),
      );

      // When & Then
      await expect(
        service.execute({
          settlementDate: mockSettlementDate,
          affiliateId: mockAffiliateId1,
        }),
      ).rejects.toThrow('Failed to update commissions');

      // wallet은 업데이트되었지만 settlePendingCommissions 실패로 롤백됨
      expect(mockWalletRepository.upsert).toHaveBeenCalled();
    });
  });
});
