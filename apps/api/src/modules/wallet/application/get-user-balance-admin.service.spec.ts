// src/modules/wallet/application/get-user-balance-admin.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ExchangeCurrencyCode, Prisma } from '@repo/database';
import { GetUserBalanceAdminService } from './get-user-balance-admin.service';
import { USER_WALLET_REPOSITORY } from '../ports/out/user-wallet.repository.token';
import type { UserWalletRepositoryPort } from '../ports/out/user-wallet.repository.port';
import { USER_REPOSITORY } from 'src/modules/user/ports/out/user.repository.token';
import type { UserRepositoryPort } from 'src/modules/user/ports/out/user.repository.port';
import { UserWallet } from '../domain';
import { User } from 'src/modules/user/domain';
import { UserNotFoundException } from 'src/modules/user/domain/user.exception';
import { UserRoleType, UserStatus } from '@repo/database';
import { PrismaModule } from 'src/platform/prisma/prisma.module';
import { EnvModule } from 'src/platform/env/env.module';
import * as currencyUtil from 'src/utils/currency.util';

// WALLET_CURRENCIES 모킹
jest.mock('src/utils/currency.util', () => ({
  WALLET_CURRENCIES: [
    ExchangeCurrencyCode.USDT,
    ExchangeCurrencyCode.USD,
    ExchangeCurrencyCode.KRW,
  ],
}));

describe('GetUserBalanceAdminService', () => {
  let module: TestingModule;
  let service: GetUserBalanceAdminService;
  let mockWalletRepository: jest.Mocked<UserWalletRepositoryPort>;
  let mockUserRepository: jest.Mocked<UserRepositoryPort>;

  const mockUserId = BigInt(123);
  const mockUid = 'user-1234567890';
  const mockEmail = 'test@example.com';
  const mockCurrency = ExchangeCurrencyCode.USD;
  const mockCurrency2 = ExchangeCurrencyCode.KRW;
  const mockCurrency3 = ExchangeCurrencyCode.USDT;
  const mockMainBalance = new Prisma.Decimal('1000');
  const mockBonusBalance = new Prisma.Decimal('500');
  const mockUpdatedAt = new Date('2024-01-01T00:00:00Z');

  const createMockUser = () => {
    return User.fromPersistence({
      id: mockUserId,
      uid: mockUid,
      email: mockEmail,
      passwordHash: '$2b$10$hashedpassword123',
      socialId: null,
      socialType: null,
      status: UserStatus.ACTIVE,
      role: UserRoleType.USER,
      country: 'KR',
      timezone: 'Asia/Seoul',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-02T00:00:00Z'),
    });
  };

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
    mockWalletRepository = {
      findByUserIdAndCurrency: jest.fn(),
      findByUserId: jest.fn(),
      upsert: jest.fn(),
    };

    mockUserRepository = {
      findByEmail: jest.fn(),
      findBySocialId: jest.fn(),
      findById: jest.fn(),
      findByUid: jest.fn(),
      create: jest.fn(),
    };

    module = await Test.createTestingModule({
      imports: [PrismaModule, EnvModule], // TransactionHost를 위해 필요
      providers: [
        GetUserBalanceAdminService,
        {
          provide: USER_WALLET_REPOSITORY,
          useValue: mockWalletRepository,
        },
        {
          provide: USER_REPOSITORY,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<GetUserBalanceAdminService>(
      GetUserBalanceAdminService,
    );
    mockWalletRepository = module.get(USER_WALLET_REPOSITORY);
    mockUserRepository = module.get(USER_REPOSITORY);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('execute', () => {
    describe('유저 존재 여부 검증', () => {
      it('유저가 존재하지 않으면 UserNotFoundException을 발생시켜야 함', async () => {
        // Given
        mockUserRepository.findById.mockResolvedValue(null);

        // When & Then
        await expect(
          service.execute({
            userId: mockUserId,
            currency: mockCurrency,
          }),
        ).rejects.toThrow(UserNotFoundException);
        await expect(
          service.execute({
            userId: mockUserId,
            currency: mockCurrency,
          }),
        ).rejects.toThrow(`User not found: ${mockUserId}`);

        expect(mockUserRepository.findById).toHaveBeenCalledTimes(2);
        expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUserId);
        expect(mockWalletRepository.findByUserIdAndCurrency).not.toHaveBeenCalled();
      });

      it('유저가 존재하면 잔액 조회를 진행해야 함', async () => {
        // Given
        const user = createMockUser();
        const wallet = createMockWallet(mockCurrency);
        mockUserRepository.findById.mockResolvedValue(user);
        mockWalletRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);

        // When
        const result = await service.execute({
          userId: mockUserId,
          currency: mockCurrency,
        });

        // Then
        expect(result.wallet).toBe(wallet);
        expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
        expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUserId);
        expect(mockWalletRepository.findByUserIdAndCurrency).toHaveBeenCalledTimes(1);
      });
    });

    describe('특정 통화 조회', () => {
      beforeEach(() => {
        // 모든 테스트에서 유저는 존재한다고 가정
        const user = createMockUser();
        mockUserRepository.findById.mockResolvedValue(user);
      });

      it('월렛이 존재하는 경우 해당 월렛을 반환해야 함', async () => {
        // Given
        const wallet = createMockWallet(mockCurrency);
        mockWalletRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);

        // When
        const result = await service.execute({
          userId: mockUserId,
          currency: mockCurrency,
        });

        // Then
        expect(result.wallet).toBe(wallet);
        expect(Array.isArray(result.wallet)).toBe(false);
        expect(mockWalletRepository.findByUserIdAndCurrency).toHaveBeenCalledTimes(1);
        expect(mockWalletRepository.findByUserIdAndCurrency).toHaveBeenCalledWith(
          mockUserId,
          mockCurrency,
        );
        expect(mockWalletRepository.upsert).not.toHaveBeenCalled();
      });

      it('월렛이 없으면 0 잔액으로 새로 생성해야 함', async () => {
        // Given
        mockWalletRepository.findByUserIdAndCurrency.mockResolvedValue(null);

        const newWallet = UserWallet.create({
          userId: mockUserId,
          currency: mockCurrency,
        });
        mockWalletRepository.upsert.mockResolvedValue(newWallet);

        // When
        const result = await service.execute({
          userId: mockUserId,
          currency: mockCurrency,
        });

        // Then
        expect(result.wallet).toBe(newWallet);
        expect((result.wallet as UserWallet).mainBalance.toString()).toBe('0');
        expect((result.wallet as UserWallet).bonusBalance.toString()).toBe('0');
        expect(mockWalletRepository.findByUserIdAndCurrency).toHaveBeenCalledTimes(1);
        expect(mockWalletRepository.upsert).toHaveBeenCalledTimes(1);
        expect(mockWalletRepository.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: mockUserId,
            currency: mockCurrency,
          }),
        );
      });

      it('USD 통화에 대해 정상적으로 처리해야 함', async () => {
        // Given
        const wallet = createMockWallet(ExchangeCurrencyCode.USD);
        mockWalletRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);

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
        mockWalletRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);

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
      beforeEach(() => {
        // 모든 테스트에서 유저는 존재한다고 가정
        const user = createMockUser();
        mockUserRepository.findById.mockResolvedValue(user);
      });

      it('모든 통화의 월렛이 존재하는 경우 모두 반환해야 함', async () => {
        // Given
        const wallets = [
          createMockWallet(mockCurrency),
          createMockWallet(mockCurrency2),
          createMockWallet(mockCurrency3),
        ];
        mockWalletRepository.findByUserId.mockResolvedValue(wallets);

        // When
        const result = await service.execute({
          userId: mockUserId,
        });

        // Then
        expect(Array.isArray(result.wallet)).toBe(true);
        expect(result.wallet).toHaveLength(3);
        expect(result.wallet).toEqual(wallets);
        expect(mockWalletRepository.findByUserId).toHaveBeenCalledTimes(1);
        expect(mockWalletRepository.findByUserId).toHaveBeenCalledWith(mockUserId);
        expect(mockWalletRepository.upsert).not.toHaveBeenCalled();
      });

      it('일부 통화가 누락된 경우 누락된 통화를 생성해야 함', async () => {
        // Given
        const existingWallets = [
          createMockWallet(mockCurrency),
          createMockWallet(mockCurrency2),
        ];
        mockWalletRepository.findByUserId.mockResolvedValue(existingWallets);

        const newWallet = UserWallet.create({
          userId: mockUserId,
          currency: mockCurrency3, // USDT가 누락됨
        });
        mockWalletRepository.upsert.mockResolvedValue(newWallet);

        // When
        const result = await service.execute({
          userId: mockUserId,
        });

        // Then
        expect(Array.isArray(result.wallet)).toBe(true);
        expect(result.wallet).toHaveLength(3);
        expect(mockWalletRepository.findByUserId).toHaveBeenCalledTimes(1);
        expect(mockWalletRepository.upsert).toHaveBeenCalledTimes(1);
        expect(mockWalletRepository.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: mockUserId,
            currency: mockCurrency3,
          }),
        );
      });

      it('모든 통화가 누락된 경우 모든 통화를 생성해야 함', async () => {
        // Given
        mockWalletRepository.findByUserId.mockResolvedValue([]);

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

        mockWalletRepository.upsert
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
        expect(mockWalletRepository.findByUserId).toHaveBeenCalledTimes(1);
        expect(mockWalletRepository.upsert).toHaveBeenCalledTimes(3);
      });
    });

    describe('에러 처리', () => {
      it('UserRepository의 findById가 실패하면 예외를 전파해야 함', async () => {
        // Given
        const repositoryError = new Error('Database query error');
        mockUserRepository.findById.mockRejectedValue(repositoryError);

        const loggerSpy = jest.spyOn(service['logger'], 'error');

        // When & Then
        await expect(
          service.execute({
            userId: mockUserId,
            currency: mockCurrency,
          }),
        ).rejects.toThrow('Database query error');

        expect(loggerSpy).toHaveBeenCalledTimes(1);
        expect(loggerSpy).toHaveBeenCalledWith(
          expect.stringContaining('관리자 사용자 잔액 조회 실패'),
          repositoryError,
        );

        loggerSpy.mockRestore();
      });

      it('WalletRepository의 findByUserIdAndCurrency가 실패하면 예외를 전파해야 함', async () => {
        // Given
        const user = createMockUser();
        mockUserRepository.findById.mockResolvedValue(user);
        const repositoryError = new Error('Database connection error');
        mockWalletRepository.findByUserIdAndCurrency.mockRejectedValue(
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
          expect.stringContaining('관리자 사용자 잔액 조회 실패'),
          repositoryError,
        );

        loggerSpy.mockRestore();
      });

      it('WalletRepository의 findByUserId가 실패하면 예외를 전파해야 함', async () => {
        // Given
        const user = createMockUser();
        mockUserRepository.findById.mockResolvedValue(user);
        const repositoryError = new Error('Database query error');
        mockWalletRepository.findByUserId.mockRejectedValue(repositoryError);

        const loggerSpy = jest.spyOn(service['logger'], 'error');

        // When & Then
        await expect(
          service.execute({
            userId: mockUserId,
          }),
        ).rejects.toThrow('Database query error');

        expect(loggerSpy).toHaveBeenCalledTimes(1);
        expect(loggerSpy).toHaveBeenCalledWith(
          expect.stringContaining('관리자 사용자 잔액 조회 실패'),
          repositoryError,
        );

        loggerSpy.mockRestore();
      });

      it('월렛 생성 시 upsert가 실패하면 예외를 전파해야 함', async () => {
        // Given
        const user = createMockUser();
        mockUserRepository.findById.mockResolvedValue(user);
        mockWalletRepository.findByUserIdAndCurrency.mockResolvedValue(null);
        const upsertError = new Error('Upsert failed');
        mockWalletRepository.upsert.mockRejectedValue(upsertError);

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
          expect.stringContaining('관리자 사용자 잔액 조회 실패'),
          upsertError,
        );

        loggerSpy.mockRestore();
      });

      it('UserNotFoundException은 로깅하지 않고 그대로 재던지기', async () => {
        // Given
        mockUserRepository.findById.mockResolvedValue(null);

        const loggerSpy = jest.spyOn(service['logger'], 'error');

        // When & Then
        await expect(
          service.execute({
            userId: mockUserId,
            currency: mockCurrency,
          }),
        ).rejects.toThrow(UserNotFoundException);

        // UserNotFoundException은 로깅하지 않음
        expect(loggerSpy).not.toHaveBeenCalled();

        loggerSpy.mockRestore();
      });
    });

    describe('생성된 월렛 검증', () => {
      beforeEach(() => {
        const user = createMockUser();
        mockUserRepository.findById.mockResolvedValue(user);
      });

      it('생성된 월렛의 기본값이 올바르야 함', async () => {
        // Given
        mockWalletRepository.findByUserIdAndCurrency.mockResolvedValue(null);

        const newWallet = UserWallet.create({
          userId: mockUserId,
          currency: mockCurrency,
        });
        mockWalletRepository.upsert.mockResolvedValue(newWallet);

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

