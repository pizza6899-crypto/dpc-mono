// src/modules/wallet/application/get-user-balance.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ExchangeCurrencyCode, Prisma } from '@repo/database';
import { GetUserBalanceService } from './get-user-balance.service';
import { USER_WALLET_REPOSITORY } from '../ports/out/user-wallet.repository.token';
import type { UserWalletRepositoryPort } from '../ports/out/user-wallet.repository.port';
import { UserWallet } from '../domain';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import * as currencyUtil from 'src/utils/currency.util';

// WALLET_CURRENCIES 모킹
jest.mock('src/utils/currency.util', () => ({
  WALLET_CURRENCIES: [
    ExchangeCurrencyCode.USDT,
    ExchangeCurrencyCode.USD,
    ExchangeCurrencyCode.KRW,
  ],
}));

describe('GetUserBalanceService', () => {
  let module: TestingModule;
  let service: GetUserBalanceService;
  let mockRepository: jest.Mocked<UserWalletRepositoryPort>;

  const mockUserId = BigInt(123);
  const mockCurrency = ExchangeCurrencyCode.USD;
  const mockCurrency2 = ExchangeCurrencyCode.KRW;
  const mockCurrency3 = ExchangeCurrencyCode.USDT;
  const mockMainBalance = new Prisma.Decimal('1000');
  const mockBonusBalance = new Prisma.Decimal('500');
  const mockUpdatedAt = new Date('2024-01-01T00:00:00Z');

  const createMockWallet = (
    currency: ExchangeCurrencyCode,
    mainBalance: Prisma.Decimal = mockMainBalance,
    bonusBalance: Prisma.Decimal = mockBonusBalance,
  ) => {
    return UserWallet.create({
      userId: mockUserId,
      currency,
      mainBalance,
      bonusBalance,
    });
  };

  beforeEach(async () => {
    mockRepository = {
      findByUserIdAndCurrency: jest.fn(),
      findByUserId: jest.fn(),
      upsert: jest.fn(),
    };

    module = await Test.createTestingModule({
      imports: [PrismaModule, EnvModule], // TransactionHost를 위해 필요
      providers: [
        GetUserBalanceService,
        {
          provide: USER_WALLET_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<GetUserBalanceService>(GetUserBalanceService);
    mockRepository = module.get(USER_WALLET_REPOSITORY);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('execute', () => {
    describe('특정 통화 조회', () => {
      it('월렛이 존재하는 경우 해당 월렛을 반환해야 함', async () => {
        // Given
        const wallet = createMockWallet(mockCurrency);
        mockRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);

        // When
        const result = await service.execute({
          userId: mockUserId,
          currency: mockCurrency,
        });

        // Then
        expect(result.wallet).toBe(wallet);
        expect(Array.isArray(result.wallet)).toBe(false);
        expect(mockRepository.findByUserIdAndCurrency).toHaveBeenCalledTimes(1);
        expect(mockRepository.findByUserIdAndCurrency).toHaveBeenCalledWith(
          mockUserId,
          mockCurrency,
        );
        expect(mockRepository.upsert).not.toHaveBeenCalled();
      });

      it('월렛이 없으면 0 잔액으로 새로 생성해야 함', async () => {
        // Given
        mockRepository.findByUserIdAndCurrency.mockResolvedValue(null);

        const newWallet = UserWallet.create({
          userId: mockUserId,
          currency: mockCurrency,
        });
        mockRepository.upsert.mockResolvedValue(newWallet);

        // When
        const result = await service.execute({
          userId: mockUserId,
          currency: mockCurrency,
        });

        // Then
        expect(result.wallet).toBe(newWallet);
        expect((result.wallet as UserWallet).mainBalance.toString()).toBe('0');
        expect((result.wallet as UserWallet).bonusBalance.toString()).toBe('0');
        expect(mockRepository.findByUserIdAndCurrency).toHaveBeenCalledTimes(1);
        expect(mockRepository.upsert).toHaveBeenCalledTimes(1);
        expect(mockRepository.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: mockUserId,
            currency: mockCurrency,
          }),
        );
      });

      it('USD 통화에 대해 정상적으로 처리해야 함', async () => {
        // Given
        const wallet = createMockWallet(ExchangeCurrencyCode.USD);
        mockRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);

        // When
        const result = await service.execute({
          userId: mockUserId,
          currency: ExchangeCurrencyCode.USD,
        });

        // Then
        expect(result.wallet).toBe(wallet);
        expect((result.wallet as UserWallet).currency).toBe(
          ExchangeCurrencyCode.USD,
        );
      });

      it('KRW 통화에 대해 정상적으로 처리해야 함', async () => {
        // Given
        const wallet = createMockWallet(ExchangeCurrencyCode.KRW);
        mockRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);

        // When
        const result = await service.execute({
          userId: mockUserId,
          currency: ExchangeCurrencyCode.KRW,
        });

        // Then
        expect(result.wallet).toBe(wallet);
        expect((result.wallet as UserWallet).currency).toBe(
          ExchangeCurrencyCode.KRW,
        );
      });
    });

    describe('모든 통화 조회', () => {
      it('모든 통화의 월렛이 존재하는 경우 모두 반환해야 함', async () => {
        // Given
        const wallets = [
          createMockWallet(mockCurrency),
          createMockWallet(mockCurrency2),
          createMockWallet(mockCurrency3),
        ];
        mockRepository.findByUserId.mockResolvedValue(wallets);

        // When
        const result = await service.execute({
          userId: mockUserId,
        });

        // Then
        expect(Array.isArray(result.wallet)).toBe(true);
        expect(result.wallet).toHaveLength(3);
        expect(result.wallet).toEqual(wallets);
        expect(mockRepository.findByUserId).toHaveBeenCalledTimes(1);
        expect(mockRepository.findByUserId).toHaveBeenCalledWith(mockUserId);
        expect(mockRepository.upsert).not.toHaveBeenCalled();
      });

      it('일부 통화가 누락된 경우 누락된 통화를 생성해야 함', async () => {
        // Given
        const existingWallets = [
          createMockWallet(mockCurrency),
          createMockWallet(mockCurrency2),
        ];
        mockRepository.findByUserId.mockResolvedValue(existingWallets);

        const newWallet = UserWallet.create({
          userId: mockUserId,
          currency: mockCurrency3, // USDT가 누락됨
        });
        mockRepository.upsert.mockResolvedValue(newWallet);

        // When
        const result = await service.execute({
          userId: mockUserId,
        });

        // Then
        expect(Array.isArray(result.wallet)).toBe(true);
        expect(result.wallet).toHaveLength(3);
        expect(mockRepository.findByUserId).toHaveBeenCalledTimes(1);
        expect(mockRepository.upsert).toHaveBeenCalledTimes(1);
        expect(mockRepository.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: mockUserId,
            currency: mockCurrency3,
          }),
        );
      });

      it('모든 통화가 누락된 경우 모든 통화를 생성해야 함', async () => {
        // Given
        mockRepository.findByUserId.mockResolvedValue([]);

        const newWallets = [
          UserWallet.create({
            userId: mockUserId,
            currency: mockCurrency,
          }),
          UserWallet.create({
            userId: mockUserId,
            currency: mockCurrency2,
          }),
          UserWallet.create({
            userId: mockUserId,
            currency: mockCurrency3,
          }),
        ];

        mockRepository.upsert
          .mockResolvedValueOnce(newWallets[0])
          .mockResolvedValueOnce(newWallets[1])
          .mockResolvedValueOnce(newWallets[2]);

        // When
        const result = await service.execute({
          userId: mockUserId,
        });

        // Then
        expect(Array.isArray(result.wallet)).toBe(true);
        expect(result.wallet).toHaveLength(3);
        expect(mockRepository.findByUserId).toHaveBeenCalledTimes(1);
        expect(mockRepository.upsert).toHaveBeenCalledTimes(3);
      });

      it('월렛이 하나도 없는 경우 빈 배열을 반환하고 모든 통화를 생성해야 함', async () => {
        // Given
        mockRepository.findByUserId.mockResolvedValue([]);

        const newWallets = [
          UserWallet.create({
            userId: mockUserId,
            currency: mockCurrency,
          }),
          UserWallet.create({
            userId: mockUserId,
            currency: mockCurrency2,
          }),
          UserWallet.create({
            userId: mockUserId,
            currency: mockCurrency3,
          }),
        ];

        mockRepository.upsert
          .mockResolvedValueOnce(newWallets[0])
          .mockResolvedValueOnce(newWallets[1])
          .mockResolvedValueOnce(newWallets[2]);

        // When
        const result = await service.execute({
          userId: mockUserId,
        });

        // Then
        expect(Array.isArray(result.wallet)).toBe(true);
        expect(result.wallet).toHaveLength(3);
        expect(mockRepository.upsert).toHaveBeenCalledTimes(3);
      });
    });

    describe('에러 처리', () => {
      it('Repository의 findByUserIdAndCurrency가 실패하면 예외를 전파해야 함', async () => {
        // Given
        const repositoryError = new Error('Database connection error');
        mockRepository.findByUserIdAndCurrency.mockRejectedValue(
          repositoryError,
        );

        const loggerSpy = jest.spyOn(service['logger'], 'error');

        // When & Then
        await expect(
          service.execute({
            userId: mockUserId,
            currency: mockCurrency,
          }),
        ).rejects.toThrow('Database connection error');

        expect(loggerSpy).toHaveBeenCalledTimes(1);
        expect(loggerSpy).toHaveBeenCalledWith(
          expect.stringContaining('사용자 잔액 조회 실패'),
          repositoryError,
        );

        loggerSpy.mockRestore();
      });

      it('Repository의 findByUserId가 실패하면 예외를 전파해야 함', async () => {
        // Given
        const repositoryError = new Error('Database query error');
        mockRepository.findByUserId.mockRejectedValue(repositoryError);

        const loggerSpy = jest.spyOn(service['logger'], 'error');

        // When & Then
        await expect(
          service.execute({
            userId: mockUserId,
          }),
        ).rejects.toThrow('Database query error');

        expect(loggerSpy).toHaveBeenCalledTimes(1);
        expect(loggerSpy).toHaveBeenCalledWith(
          expect.stringContaining('사용자 잔액 조회 실패'),
          repositoryError,
        );

        loggerSpy.mockRestore();
      });

      it('월렛 생성 시 upsert가 실패하면 예외를 전파해야 함', async () => {
        // Given
        mockRepository.findByUserIdAndCurrency.mockResolvedValue(null);
        const upsertError = new Error('Upsert failed');
        mockRepository.upsert.mockRejectedValue(upsertError);

        const loggerSpy = jest.spyOn(service['logger'], 'error');

        // When & Then
        await expect(
          service.execute({
            userId: mockUserId,
            currency: mockCurrency,
          }),
        ).rejects.toThrow('Upsert failed');

        expect(loggerSpy).toHaveBeenCalledTimes(1);
        expect(loggerSpy).toHaveBeenCalledWith(
          expect.stringContaining('사용자 잔액 조회 실패'),
          upsertError,
        );

        loggerSpy.mockRestore();
      });

      it('모든 통화 조회 시 upsert가 실패하면 예외를 전파해야 함', async () => {
        // Given
        mockRepository.findByUserId.mockResolvedValue([]);
        const upsertError = new Error('Upsert failed');
        mockRepository.upsert.mockRejectedValue(upsertError);

        const loggerSpy = jest.spyOn(service['logger'], 'error');

        // When & Then
        await expect(
          service.execute({
            userId: mockUserId,
          }),
        ).rejects.toThrow('Upsert failed');

        expect(loggerSpy).toHaveBeenCalledTimes(1);
        expect(loggerSpy).toHaveBeenCalledWith(
          expect.stringContaining('사용자 잔액 조회 실패'),
          upsertError,
        );

        loggerSpy.mockRestore();
      });
    });

    describe('생성된 월렛 검증', () => {
      it('생성된 월렛의 기본값이 올바르야 함', async () => {
        // Given
        mockRepository.findByUserIdAndCurrency.mockResolvedValue(null);

        const newWallet = UserWallet.create({
          userId: mockUserId,
          currency: mockCurrency,
        });
        mockRepository.upsert.mockResolvedValue(newWallet);

        // When
        const result = await service.execute({
          userId: mockUserId,
          currency: mockCurrency,
        });

        // Then
        expect((result.wallet as UserWallet).mainBalance.toString()).toBe('0');
        expect((result.wallet as UserWallet).bonusBalance.toString()).toBe('0');
        expect((result.wallet as UserWallet).userId).toBe(mockUserId);
        expect((result.wallet as UserWallet).currency).toBe(mockCurrency);
      });
    });
  });
});

