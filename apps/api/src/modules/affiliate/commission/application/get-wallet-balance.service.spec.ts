// src/modules/affiliate/commission/application/get-wallet-balance.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ExchangeCurrencyCode, Prisma } from '@prisma/client';
import { GetWalletBalanceService } from './get-wallet-balance.service';
import { AFFILIATE_WALLET_REPOSITORY } from '../ports/out/affiliate-wallet.repository.token';
import type { AffiliateWalletRepositoryPort } from '../ports/out/affiliate-wallet.repository.port';
import { AffiliateWallet } from '../domain';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/infrastructure/env/env.module';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';

describe('GetWalletBalanceService', () => {
  let module: TestingModule;
  let service: GetWalletBalanceService;
  let mockRepository: jest.Mocked<AffiliateWalletRepositoryPort>;
  let mockDispatchLogService: jest.Mocked<DispatchLogService>;

  const mockAffiliateId = BigInt(123);
  const mockCurrency = ExchangeCurrencyCode.USD;
  const mockCurrency2 = ExchangeCurrencyCode.KRW;
  const mockAvailableBalance = new Prisma.Decimal('1000');
  const mockPendingBalance = new Prisma.Decimal('500');
  const mockTotalEarned = new Prisma.Decimal('1500');
  const mockUpdatedAt = new Date('2024-01-01T00:00:00Z');

  const createMockWallet = (
    currency: ExchangeCurrencyCode,
    availableBalance: Prisma.Decimal = mockAvailableBalance,
    pendingBalance: Prisma.Decimal = mockPendingBalance,
    totalEarned: Prisma.Decimal = mockTotalEarned,
  ) => {
    // totalEarned는 availableBalance + pendingBalance보다 크거나 같아야 함
    const minTotalEarned = availableBalance.add(pendingBalance);
    const finalTotalEarned = totalEarned.gte(minTotalEarned)
      ? totalEarned
      : minTotalEarned;

    return AffiliateWallet.create({
      affiliateId: mockAffiliateId,
      currency,
      availableBalance,
      pendingBalance,
      totalEarned: finalTotalEarned,
    });
  };

  beforeEach(async () => {
    mockRepository = {
      findByAffiliateIdAndCurrency: jest.fn(),
      getByAffiliateIdAndCurrency: jest.fn(),
      findByAffiliateId: jest.fn(),
      upsert: jest.fn(),
      updateBalance: jest.fn(),
    };

    const mockDispatchLogServiceProvider = {
      provide: DispatchLogService,
      useValue: {
        dispatch: jest.fn().mockResolvedValue(undefined),
      },
    };

    module = await Test.createTestingModule({
      imports: [PrismaModule, EnvModule], // TransactionHost를 위해 필요
      providers: [
        GetWalletBalanceService,
        {
          provide: AFFILIATE_WALLET_REPOSITORY,
          useValue: mockRepository,
        },
        mockDispatchLogServiceProvider,
      ],
    }).compile();

    service = module.get<GetWalletBalanceService>(GetWalletBalanceService);
    mockRepository = module.get(AFFILIATE_WALLET_REPOSITORY);
    mockDispatchLogService = module.get(DispatchLogService);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('execute', () => {
    it('특정 통화의 월렛을 조회한다', async () => {
      // Given
      const wallet = createMockWallet(mockCurrency);
      mockRepository.findByAffiliateIdAndCurrency.mockResolvedValue(wallet);

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
      });

      // Then
      expect(result).toBe(wallet);
      expect(mockRepository.findByAffiliateIdAndCurrency).toHaveBeenCalledTimes(
        1,
      );
      expect(mockRepository.findByAffiliateIdAndCurrency).toHaveBeenCalledWith(
        mockAffiliateId,
        mockCurrency,
      );
      expect(mockRepository.upsert).not.toHaveBeenCalled();
      expect(mockRepository.findByAffiliateId).not.toHaveBeenCalled();
    });

    it('월렛이 없으면 0 잔액으로 새로 생성한다', async () => {
      // Given
      mockRepository.findByAffiliateIdAndCurrency.mockResolvedValue(null);

      const newWallet = AffiliateWallet.create({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        // 기본값: 모두 0
      });
      mockRepository.upsert.mockResolvedValue(newWallet);

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
      });

      // Then
      expect(result).toBe(newWallet);
      expect((result as AffiliateWallet).availableBalance.toString()).toBe('0');
      expect((result as AffiliateWallet).pendingBalance.toString()).toBe('0');
      expect((result as AffiliateWallet).totalEarned.toString()).toBe('0');
      expect(mockRepository.findByAffiliateIdAndCurrency).toHaveBeenCalledTimes(
        1,
      );
      expect(mockRepository.upsert).toHaveBeenCalledTimes(1);
      expect(mockRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          affiliateId: mockAffiliateId,
          currency: mockCurrency,
        }),
      );
    });

    it('currency가 없으면 모든 통화의 월렛을 반환한다', async () => {
      // Given
      const wallets = [
        createMockWallet(mockCurrency),
        createMockWallet(mockCurrency2, new Prisma.Decimal('2000')),
      ];
      mockRepository.findByAffiliateId.mockResolvedValue(wallets);

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
      });

      // Then
      expect(result).toBe(wallets);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(mockRepository.findByAffiliateId).toHaveBeenCalledTimes(1);
      expect(mockRepository.findByAffiliateId).toHaveBeenCalledWith(
        mockAffiliateId,
      );
      expect(
        mockRepository.findByAffiliateIdAndCurrency,
      ).not.toHaveBeenCalled();
      expect(mockRepository.upsert).not.toHaveBeenCalled();
    });

    it('모든 통화 조회 시 빈 배열을 반환한다', async () => {
      // Given
      mockRepository.findByAffiliateId.mockResolvedValue([]);

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
      });

      // Then
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('Repository 에러 발생 시 Logger에 에러를 기록한다', async () => {
      // Given
      const repositoryError = new Error('Database connection failed');
      mockRepository.findByAffiliateIdAndCurrency.mockRejectedValue(
        repositoryError,
      );

      const loggerSpy = jest.spyOn(service['logger'], 'error');

      // When & Then
      await expect(
        service.execute({
          affiliateId: mockAffiliateId,
          currency: mockCurrency,
        }),
      ).rejects.toThrow(repositoryError);

      expect(loggerSpy).toHaveBeenCalledTimes(1);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('월렛 잔액 조회 실패'),
        repositoryError,
      );

      loggerSpy.mockRestore();
    });

    it('모든 통화 조회 시 Repository 에러 발생 시 Logger에 에러를 기록한다', async () => {
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
        expect.stringContaining('월렛 잔액 조회 실패'),
        repositoryError,
      );

      loggerSpy.mockRestore();
    });

    it('월렛 생성 시 upsert 에러 발생 시 Logger에 에러를 기록한다', async () => {
      // Given
      mockRepository.findByAffiliateIdAndCurrency.mockResolvedValue(null);
      const upsertError = new Error('Upsert failed');
      mockRepository.upsert.mockRejectedValue(upsertError);

      const loggerSpy = jest.spyOn(service['logger'], 'error');

      // When & Then
      await expect(
        service.execute({
          affiliateId: mockAffiliateId,
          currency: mockCurrency,
        }),
      ).rejects.toThrow(upsertError);

      expect(loggerSpy).toHaveBeenCalledTimes(1);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('월렛 잔액 조회 실패'),
        upsertError,
      );

      loggerSpy.mockRestore();
    });

    it('USD 통화에 대해 정상적으로 처리한다', async () => {
      // Given
      const wallet = createMockWallet(ExchangeCurrencyCode.USD);
      mockRepository.findByAffiliateIdAndCurrency.mockResolvedValue(wallet);

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
        currency: ExchangeCurrencyCode.USD,
      });

      // Then
      expect(result).toBe(wallet);
      expect((result as AffiliateWallet).currency).toBe(
        ExchangeCurrencyCode.USD,
      );
    });

    it('KRW 통화에 대해 정상적으로 처리한다', async () => {
      // Given
      const wallet = createMockWallet(ExchangeCurrencyCode.KRW);
      mockRepository.findByAffiliateIdAndCurrency.mockResolvedValue(wallet);

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
        currency: ExchangeCurrencyCode.KRW,
      });

      // Then
      expect(result).toBe(wallet);
      expect((result as AffiliateWallet).currency).toBe(
        ExchangeCurrencyCode.KRW,
      );
    });

    it('생성된 월렛의 기본값이 올바르다', async () => {
      // Given
      mockRepository.findByAffiliateIdAndCurrency.mockResolvedValue(null);

      const newWallet = AffiliateWallet.create({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        // 기본값: 모두 0
      });
      mockRepository.upsert.mockResolvedValue(newWallet);

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
      });

      // Then
      expect((result as AffiliateWallet).availableBalance.toString()).toBe('0');
      expect((result as AffiliateWallet).pendingBalance.toString()).toBe('0');
      expect((result as AffiliateWallet).totalEarned.toString()).toBe('0');
      expect((result as AffiliateWallet).affiliateId).toBe(mockAffiliateId);
      expect((result as AffiliateWallet).currency).toBe(mockCurrency);
    });
  });
});
