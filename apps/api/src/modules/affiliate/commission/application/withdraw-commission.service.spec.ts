// src/modules/affiliate/commission/application/withdraw-commission.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ExchangeCurrencyCode, Prisma } from '@prisma/client';
import { WithdrawCommissionService } from './withdraw-commission.service';
import { AFFILIATE_WALLET_REPOSITORY } from '../ports/out/affiliate-wallet.repository.token';
import type { AffiliateWalletRepositoryPort } from '../ports/out/affiliate-wallet.repository.port';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import { AffiliateWallet } from '../domain';
import {
  InsufficientBalanceException,
  WalletNotFoundException,
} from '../domain/commission.exception';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';

describe('WithdrawCommissionService', () => {
  let module: TestingModule;
  let service: WithdrawCommissionService;
  let mockWalletRepository: jest.Mocked<AffiliateWalletRepositoryPort>;
  let mockDispatchLogService: jest.Mocked<DispatchLogService>;

  const mockAffiliateId = BigInt(123);
  const mockCurrency = ExchangeCurrencyCode.USD;
  const mockAvailableBalance = new Prisma.Decimal('1000');
  const mockPendingBalance = new Prisma.Decimal('500');
  const mockTotalEarned = new Prisma.Decimal('1500');
  const mockWithdrawAmount = new Prisma.Decimal('300');
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
    path: '/api/v1/withdraw',
    timestamp: new Date(),
    timezone: 'Asia/Seoul',
    isp: 'ISP',
    asn: 'AS123',
  };

  const createMockWallet = (availableBalance: Prisma.Decimal) => {
    return AffiliateWallet.create({
      affiliateId: mockAffiliateId,
      currency: mockCurrency,
      availableBalance,
      pendingBalance: mockPendingBalance,
      totalEarned: mockTotalEarned,
    });
  };

  beforeEach(async () => {
    mockWalletRepository = {
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
        WithdrawCommissionService,
        {
          provide: AFFILIATE_WALLET_REPOSITORY,
          useValue: mockWalletRepository,
        },
        mockDispatchLogServiceProvider,
      ],
    }).compile();

    service = module.get<WithdrawCommissionService>(WithdrawCommissionService);
    mockWalletRepository = module.get(AFFILIATE_WALLET_REPOSITORY);
    mockDispatchLogService = module.get(
      DispatchLogService,
    ) as jest.Mocked<DispatchLogService>;

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('execute', () => {
    it('정상적으로 출금을 처리한다', async () => {
      // Given
      const wallet = createMockWallet(mockAvailableBalance);
      const beforeBalance = wallet.availableBalance;

      mockWalletRepository.getByAffiliateIdAndCurrency.mockResolvedValue(
        wallet,
      );

      // withdraw 후 잔액이 차감된 월렛
      const updatedWallet = createMockWallet(
        mockAvailableBalance.sub(mockWithdrawAmount),
      );
      mockWalletRepository.upsert.mockResolvedValue(updatedWallet);

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        amount: mockWithdrawAmount,
      });

      // Then
      expect(result).toBe(updatedWallet);
      expect(
        mockWalletRepository.getByAffiliateIdAndCurrency,
      ).toHaveBeenCalledWith(mockAffiliateId, mockCurrency);
      expect(mockWalletRepository.upsert).toHaveBeenCalled();
      expect(mockDispatchLogService.dispatch).not.toHaveBeenCalled();
    });

    it('requestInfo가 있을 때 Activity Log에 성공 로그를 기록한다', async () => {
      // Given
      const wallet = createMockWallet(mockAvailableBalance);
      const beforeBalance = wallet.availableBalance;

      mockWalletRepository.getByAffiliateIdAndCurrency.mockResolvedValue(
        wallet,
      );

      const updatedWallet = createMockWallet(
        mockAvailableBalance.sub(mockWithdrawAmount),
      );
      mockWalletRepository.upsert.mockResolvedValue(updatedWallet);

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        amount: mockWithdrawAmount,
        requestInfo: mockRequestInfo,
      });

      // Then
      expect(result).toBe(updatedWallet);
      expect(mockDispatchLogService.dispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatchLogService.dispatch).toHaveBeenCalledWith(
        {
          type: LogType.ACTIVITY,
          data: {
            userId: mockAffiliateId.toString(),
            category: 'AFFILIATE',
            action: 'COMMISSION_WITHDRAW',
            metadata: {
              affiliateId: mockAffiliateId.toString(),
              currency: mockCurrency,
              amount: mockWithdrawAmount.toString(),
              beforeBalance: beforeBalance.toString(),
              afterBalance: updatedWallet.availableBalance.toString(),
              pendingBalance: updatedWallet.pendingBalance.toString(),
              totalEarned: updatedWallet.totalEarned.toString(),
            },
          },
        },
        mockRequestInfo,
      );
    });

    it('출금 전후 잔액이 올바르게 차감된다', async () => {
      // Given
      const wallet = createMockWallet(mockAvailableBalance);
      const beforeBalance = wallet.availableBalance;

      mockWalletRepository.getByAffiliateIdAndCurrency.mockResolvedValue(
        wallet,
      );

      const updatedWallet = createMockWallet(
        mockAvailableBalance.sub(mockWithdrawAmount),
      );
      mockWalletRepository.upsert.mockResolvedValue(updatedWallet);

      // When
      await service.execute({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        amount: mockWithdrawAmount,
        requestInfo: mockRequestInfo,
      });

      // Then
      const upsertCall = mockWalletRepository.upsert.mock.calls[0][0];
      expect(upsertCall.availableBalance.toString()).toBe(
        beforeBalance.sub(mockWithdrawAmount).toString(),
      );
      expect(updatedWallet.availableBalance.toString()).toBe(
        beforeBalance.sub(mockWithdrawAmount).toString(),
      );
    });

    it('월렛이 없는 경우 WalletNotFoundException을 발생시킨다', async () => {
      // Given
      const error = new WalletNotFoundException(mockAffiliateId, mockCurrency);
      mockWalletRepository.getByAffiliateIdAndCurrency.mockRejectedValue(error);

      // When & Then
      await expect(
        service.execute({
          affiliateId: mockAffiliateId,
          currency: mockCurrency,
          amount: mockWithdrawAmount,
          requestInfo: mockRequestInfo,
        }),
      ).rejects.toThrow(WalletNotFoundException);

      expect(mockDispatchLogService.dispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatchLogService.dispatch).toHaveBeenCalledWith(
        {
          type: LogType.ACTIVITY,
          data: {
            userId: mockAffiliateId.toString(),
            category: 'AFFILIATE',
            action: 'COMMISSION_WITHDRAW',
            metadata: {
              affiliateId: mockAffiliateId.toString(),
              currency: mockCurrency,
              amount: mockWithdrawAmount.toString(),
              error: expect.stringContaining('Wallet not found'),
            },
          },
        },
        mockRequestInfo,
      );
    });

    it('잔액이 부족한 경우 InsufficientBalanceException을 발생시킨다', async () => {
      // Given
      const wallet = createMockWallet(mockAvailableBalance);
      const largeAmount = mockAvailableBalance.add(new Prisma.Decimal('100'));

      mockWalletRepository.getByAffiliateIdAndCurrency.mockResolvedValue(
        wallet,
      );

      // When & Then
      await expect(
        service.execute({
          affiliateId: mockAffiliateId,
          currency: mockCurrency,
          amount: largeAmount,
          requestInfo: mockRequestInfo,
        }),
      ).rejects.toThrow(InsufficientBalanceException);

      expect(mockWalletRepository.upsert).not.toHaveBeenCalled();
      expect(mockDispatchLogService.dispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatchLogService.dispatch).toHaveBeenCalledWith(
        {
          type: LogType.ACTIVITY,
          data: {
            userId: mockAffiliateId.toString(),
            category: 'AFFILIATE',
            action: 'COMMISSION_WITHDRAW',
            metadata: {
              affiliateId: mockAffiliateId.toString(),
              currency: mockCurrency,
              amount: largeAmount.toString(),
              error: expect.stringContaining('Insufficient balance'),
            },
          },
        },
        mockRequestInfo,
      );
    });

    it('출금 금액이 0인 경우 InsufficientBalanceException을 발생시킨다', async () => {
      // Given
      const wallet = createMockWallet(mockAvailableBalance);
      const zeroAmount = new Prisma.Decimal('0');

      mockWalletRepository.getByAffiliateIdAndCurrency.mockResolvedValue(
        wallet,
      );

      // When & Then
      await expect(
        service.execute({
          affiliateId: mockAffiliateId,
          currency: mockCurrency,
          amount: zeroAmount,
          requestInfo: mockRequestInfo,
        }),
      ).rejects.toThrow(InsufficientBalanceException);

      expect(mockWalletRepository.upsert).not.toHaveBeenCalled();
      expect(mockDispatchLogService.dispatch).toHaveBeenCalledTimes(1);
    });

    it('전체 잔액을 출금하는 경우 성공한다', async () => {
      // Given
      const wallet = createMockWallet(mockAvailableBalance);
      const fullAmount = mockAvailableBalance; // 전체 잔액

      mockWalletRepository.getByAffiliateIdAndCurrency.mockResolvedValue(
        wallet,
      );

      const updatedWallet = createMockWallet(new Prisma.Decimal('0'));
      mockWalletRepository.upsert.mockResolvedValue(updatedWallet);

      // When
      const result = await service.execute({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        amount: fullAmount,
        requestInfo: mockRequestInfo,
      });

      // Then
      expect(result).toBe(updatedWallet);
      expect(result.availableBalance.toString()).toBe('0');
      expect(mockDispatchLogService.dispatch).toHaveBeenCalledTimes(1);
    });

    it('requestInfo가 없을 때 Activity Log를 기록하지 않는다', async () => {
      // Given
      const wallet = createMockWallet(mockAvailableBalance);

      mockWalletRepository.getByAffiliateIdAndCurrency.mockResolvedValue(
        wallet,
      );

      const updatedWallet = createMockWallet(
        mockAvailableBalance.sub(mockWithdrawAmount),
      );
      mockWalletRepository.upsert.mockResolvedValue(updatedWallet);

      // When
      await service.execute({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        amount: mockWithdrawAmount,
        // requestInfo 없음
      });

      // Then
      expect(mockDispatchLogService.dispatch).not.toHaveBeenCalled();
    });

    it('다양한 통화에 대해 출금을 처리한다', async () => {
      // Given
      const currencies = [
        ExchangeCurrencyCode.USD,
        ExchangeCurrencyCode.KRW,
        ExchangeCurrencyCode.JPY,
      ];

      for (const currency of currencies) {
        const wallet = AffiliateWallet.create({
          affiliateId: mockAffiliateId,
          currency,
          availableBalance: mockAvailableBalance,
        });

        mockWalletRepository.getByAffiliateIdAndCurrency.mockResolvedValue(
          wallet,
        );

        const updatedWallet = AffiliateWallet.create({
          affiliateId: mockAffiliateId,
          currency,
          availableBalance: mockAvailableBalance.sub(mockWithdrawAmount),
        });
        mockWalletRepository.upsert.mockResolvedValue(updatedWallet);

        // When
        const result = await service.execute({
          affiliateId: mockAffiliateId,
          currency,
          amount: mockWithdrawAmount,
        });

        // Then
        expect(result.currency).toBe(currency);
        expect(
          mockWalletRepository.getByAffiliateIdAndCurrency,
        ).toHaveBeenCalledWith(mockAffiliateId, currency);
      }
    });

    it('에러 발생 시 Logger에 에러를 기록한다', async () => {
      // Given
      const wallet = createMockWallet(mockAvailableBalance);
      const largeAmount = mockAvailableBalance.add(new Prisma.Decimal('100'));

      mockWalletRepository.getByAffiliateIdAndCurrency.mockResolvedValue(
        wallet,
      );

      // 도메인 예외는 warn 레벨로 로깅되므로 warn 스파이 사용
      const loggerWarnSpy = jest.spyOn(service['logger'], 'warn');

      // When
      await expect(
        service.execute({
          affiliateId: mockAffiliateId,
          currency: mockCurrency,
          amount: largeAmount,
        }),
      ).rejects.toThrow();

      // Then
      // 도메인 예외는 warn 레벨로 로깅됨
      expect(loggerWarnSpy).toHaveBeenCalledTimes(1);
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('커미션 출금 실패 (도메인 예외)'),
        expect.any(String),
      );

      loggerWarnSpy.mockRestore();
    });

    it('성공 시 Logger에 로그를 기록한다', async () => {
      // Given
      const wallet = createMockWallet(mockAvailableBalance);

      mockWalletRepository.getByAffiliateIdAndCurrency.mockResolvedValue(
        wallet,
      );

      const updatedWallet = createMockWallet(
        mockAvailableBalance.sub(mockWithdrawAmount),
      );
      mockWalletRepository.upsert.mockResolvedValue(updatedWallet);

      const loggerSpy = jest.spyOn(service['logger'], 'log');

      // When
      await service.execute({
        affiliateId: mockAffiliateId,
        currency: mockCurrency,
        amount: mockWithdrawAmount,
      });

      // Then
      expect(loggerSpy).toHaveBeenCalledTimes(1);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('커미션 출금 완료'),
      );

      loggerSpy.mockRestore();
    });
  });
});
