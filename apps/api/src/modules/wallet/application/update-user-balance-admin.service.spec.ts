// src/modules/wallet/application/update-user-balance-admin.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ExchangeCurrencyCode, Prisma } from '@repo/database';
import { UpdateUserBalanceAdminService } from './update-user-balance-admin.service';
import {
  BalanceType,
  UpdateOperation,
} from './update-user-balance.service';
import { USER_WALLET_REPOSITORY } from '../ports/out/user-wallet.repository.token';
import type { UserWalletRepositoryPort } from '../ports/out/user-wallet.repository.port';
import { USER_REPOSITORY } from 'src/modules/user/ports/out/user.repository.token';
import type { UserRepositoryPort } from 'src/modules/user/ports/out/user.repository.port';
import {
  UserWallet,
  InsufficientBalanceException,
  InvalidWalletBalanceException,
} from '../domain';
import { UserNotFoundException } from 'src/modules/user/domain/user.exception';
import { User } from 'src/modules/user/domain';
import { UserRoleType, UserStatus } from '@repo/database';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';

describe('UpdateUserBalanceAdminService', () => {
  let module: TestingModule;
  let service: UpdateUserBalanceAdminService;
  let mockWalletRepository: jest.Mocked<UserWalletRepositoryPort>;
  let mockUserRepository: jest.Mocked<UserRepositoryPort>;

  const mockUserId = BigInt(123);
  const mockUid = 'user-1234567890';
  const mockEmail = 'test@example.com';
  const mockCurrency = ExchangeCurrencyCode.USD;
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
      findMany: jest.fn(),
      updatePassword: jest.fn(),
    };

    module = await Test.createTestingModule({
      imports: [PrismaModule, EnvModule], // TransactionHost를 위해 필요
      providers: [
        UpdateUserBalanceAdminService,
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

    service = module.get<UpdateUserBalanceAdminService>(
      UpdateUserBalanceAdminService,
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
            balanceType: BalanceType.MAIN,
            operation: UpdateOperation.ADD,
            amount: new Prisma.Decimal('100'),
          }),
        ).rejects.toThrow(UserNotFoundException);
        await expect(
          service.execute({
            userId: mockUserId,
            currency: mockCurrency,
            balanceType: BalanceType.MAIN,
            operation: UpdateOperation.ADD,
            amount: new Prisma.Decimal('100'),
          }),
        ).rejects.toThrow(`User not found: ${mockUserId}`);

        expect(mockUserRepository.findById).toHaveBeenCalledTimes(2);
        expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUserId);
        expect(mockWalletRepository.findByUserIdAndCurrency).not.toHaveBeenCalled();
      });

      it('유저가 존재하면 잔액 업데이트를 진행해야 함', async () => {
        // Given
        const user = createMockUser();
        const wallet = createMockWallet(mockCurrency);
        const updatedWallet = createMockWallet(
          mockCurrency,
          mockMainBalance.add(100),
          mockBonusBalance,
        );

        mockUserRepository.findById.mockResolvedValue(user);
        mockWalletRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);
        mockWalletRepository.upsert.mockResolvedValue(updatedWallet);

        // When
        const result = await service.execute({
          userId: mockUserId,
          currency: mockCurrency,
          balanceType: BalanceType.MAIN,
          operation: UpdateOperation.ADD,
          amount: new Prisma.Decimal('100'),
        });

        // Then
        expect(result.wallet).toBe(updatedWallet);
        expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
        expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUserId);
        expect(mockWalletRepository.findByUserIdAndCurrency).toHaveBeenCalledTimes(1);
      });
    });

    describe('월렛 자동 생성', () => {
      beforeEach(() => {
        const user = createMockUser();
        mockUserRepository.findById.mockResolvedValue(user);
      });

      it('월렛이 없으면 0 잔액으로 새로 생성한 후 업데이트해야 함', async () => {
        // Given
        mockWalletRepository.findByUserIdAndCurrency.mockResolvedValue(null);

        const newWallet = UserWallet.create({
          userId: mockUserId,
          currency: mockCurrency,
        });
        const updatedWallet = createMockWallet(
          mockCurrency,
          new Prisma.Decimal('100'),
          new Prisma.Decimal('0'),
        );

        mockWalletRepository.upsert
          .mockResolvedValueOnce(newWallet) // 첫 번째: 생성
          .mockResolvedValueOnce(updatedWallet); // 두 번째: 업데이트

        // When
        const result = await service.execute({
          userId: mockUserId,
          currency: mockCurrency,
          balanceType: BalanceType.MAIN,
          operation: UpdateOperation.ADD,
          amount: new Prisma.Decimal('100'),
        });

        // Then
        expect(result.wallet).toBe(updatedWallet);
        expect(result.afterMainBalance.toString()).toBe('100');
        expect(mockWalletRepository.findByUserIdAndCurrency).toHaveBeenCalledTimes(1);
        expect(mockWalletRepository.upsert).toHaveBeenCalledTimes(2);
      });
    });

    describe('메인 잔액 업데이트', () => {
      beforeEach(() => {
        const user = createMockUser();
        mockUserRepository.findById.mockResolvedValue(user);
      });

      it('메인 잔액 추가가 정상적으로 동작해야 함', async () => {
        // Given
        const wallet = createMockWallet(mockCurrency);
        const addAmount = new Prisma.Decimal('200');
        const updatedWallet = createMockWallet(
          mockCurrency,
          mockMainBalance.add(addAmount),
          mockBonusBalance,
        );

        mockWalletRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);
        mockWalletRepository.upsert.mockResolvedValue(updatedWallet);

        // When
        const result = await service.execute({
          userId: mockUserId,
          currency: mockCurrency,
          balanceType: BalanceType.MAIN,
          operation: UpdateOperation.ADD,
          amount: addAmount,
        });

        // Then
        expect(result.beforeMainBalance.toString()).toBe('1000');
        expect(result.afterMainBalance.toString()).toBe('1200');
        expect(result.beforeBonusBalance.toString()).toBe('500');
        expect(result.afterBonusBalance.toString()).toBe('500');
        expect(result.mainBalanceChange.toString()).toBe('200');
        expect(result.bonusBalanceChange.toString()).toBe('0');
      });

      it('메인 잔액 차감이 정상적으로 동작해야 함', async () => {
        // Given
        const wallet = createMockWallet(mockCurrency);
        const subtractAmount = new Prisma.Decimal('300');
        const updatedWallet = createMockWallet(
          mockCurrency,
          mockMainBalance.sub(subtractAmount),
          mockBonusBalance,
        );

        mockWalletRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);
        mockWalletRepository.upsert.mockResolvedValue(updatedWallet);

        // When
        const result = await service.execute({
          userId: mockUserId,
          currency: mockCurrency,
          balanceType: BalanceType.MAIN,
          operation: UpdateOperation.SUBTRACT,
          amount: subtractAmount,
        });

        // Then
        expect(result.beforeMainBalance.toString()).toBe('1000');
        expect(result.afterMainBalance.toString()).toBe('700');
        expect(result.mainBalanceChange.toString()).toBe('-300');
      });

      it('메인 잔액이 부족하면 InsufficientBalanceException을 발생시켜야 함', async () => {
        // Given
        const wallet = createMockWallet(mockCurrency);
        const subtractAmount = new Prisma.Decimal('2000'); // 잔액보다 큼

        mockWalletRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);

        // When & Then
        await expect(
          service.execute({
            userId: mockUserId,
            currency: mockCurrency,
            balanceType: BalanceType.MAIN,
            operation: UpdateOperation.SUBTRACT,
            amount: subtractAmount,
          }),
        ).rejects.toThrow(InsufficientBalanceException);

        expect(mockWalletRepository.upsert).not.toHaveBeenCalled();
      });
    });

    describe('보너스 잔액 업데이트', () => {
      beforeEach(() => {
        const user = createMockUser();
        mockUserRepository.findById.mockResolvedValue(user);
      });

      it('보너스 잔액 추가가 정상적으로 동작해야 함', async () => {
        // Given
        const wallet = createMockWallet(mockCurrency);
        const addAmount = new Prisma.Decimal('150');
        const updatedWallet = createMockWallet(
          mockCurrency,
          mockMainBalance,
          mockBonusBalance.add(addAmount),
        );

        mockWalletRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);
        mockWalletRepository.upsert.mockResolvedValue(updatedWallet);

        // When
        const result = await service.execute({
          userId: mockUserId,
          currency: mockCurrency,
          balanceType: BalanceType.BONUS,
          operation: UpdateOperation.ADD,
          amount: addAmount,
        });

        // Then
        expect(result.beforeMainBalance.toString()).toBe('1000');
        expect(result.afterMainBalance.toString()).toBe('1000');
        expect(result.beforeBonusBalance.toString()).toBe('500');
        expect(result.afterBonusBalance.toString()).toBe('650');
        expect(result.mainBalanceChange.toString()).toBe('0');
        expect(result.bonusBalanceChange.toString()).toBe('150');
      });

      it('보너스 잔액 차감이 정상적으로 동작해야 함', async () => {
        // Given
        const wallet = createMockWallet(mockCurrency);
        const subtractAmount = new Prisma.Decimal('200');
        const updatedWallet = createMockWallet(
          mockCurrency,
          mockMainBalance,
          mockBonusBalance.sub(subtractAmount),
        );

        mockWalletRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);
        mockWalletRepository.upsert.mockResolvedValue(updatedWallet);

        // When
        const result = await service.execute({
          userId: mockUserId,
          currency: mockCurrency,
          balanceType: BalanceType.BONUS,
          operation: UpdateOperation.SUBTRACT,
          amount: subtractAmount,
        });

        // Then
        expect(result.beforeBonusBalance.toString()).toBe('500');
        expect(result.afterBonusBalance.toString()).toBe('300');
        expect(result.bonusBalanceChange.toString()).toBe('-200');
      });

      it('보너스 잔액이 부족하면 InsufficientBalanceException을 발생시켜야 함', async () => {
        // Given
        const wallet = createMockWallet(mockCurrency);
        const subtractAmount = new Prisma.Decimal('1000'); // 잔액보다 큼

        mockWalletRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);

        // When & Then
        await expect(
          service.execute({
            userId: mockUserId,
            currency: mockCurrency,
            balanceType: BalanceType.BONUS,
            operation: UpdateOperation.SUBTRACT,
            amount: subtractAmount,
          }),
        ).rejects.toThrow(InsufficientBalanceException);
      });
    });

    describe('총 잔액 업데이트', () => {
      beforeEach(() => {
        const user = createMockUser();
        mockUserRepository.findById.mockResolvedValue(user);
      });

      it('총 잔액 추가 시 메인 잔액에 추가되어야 함', async () => {
        // Given
        const wallet = createMockWallet(mockCurrency);
        const addAmount = new Prisma.Decimal('250');
        const updatedWallet = createMockWallet(
          mockCurrency,
          mockMainBalance.add(addAmount),
          mockBonusBalance,
        );

        mockWalletRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);
        mockWalletRepository.upsert.mockResolvedValue(updatedWallet);

        // When
        const result = await service.execute({
          userId: mockUserId,
          currency: mockCurrency,
          balanceType: BalanceType.TOTAL,
          operation: UpdateOperation.ADD,
          amount: addAmount,
        });

        // Then
        expect(result.afterMainBalance.toString()).toBe('1250');
        expect(result.afterBonusBalance.toString()).toBe('500');
        expect(result.mainBalanceChange.toString()).toBe('250');
        expect(result.bonusBalanceChange.toString()).toBe('0');
      });

      it('총 잔액 차감 시 메인 잔액이 충분하면 메인에서만 차감해야 함', async () => {
        // Given
        const wallet = createMockWallet(mockCurrency);
        const subtractAmount = new Prisma.Decimal('500');
        const updatedWallet = createMockWallet(
          mockCurrency,
          mockMainBalance.sub(subtractAmount),
          mockBonusBalance,
        );

        mockWalletRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);
        mockWalletRepository.upsert.mockResolvedValue(updatedWallet);

        // When
        const result = await service.execute({
          userId: mockUserId,
          currency: mockCurrency,
          balanceType: BalanceType.TOTAL,
          operation: UpdateOperation.SUBTRACT,
          amount: subtractAmount,
        });

        // Then
        expect(result.afterMainBalance.toString()).toBe('500');
        expect(result.afterBonusBalance.toString()).toBe('500');
        expect(result.mainBalanceChange.toString()).toBe('-500');
        expect(result.bonusBalanceChange.toString()).toBe('0');
      });

      it('총 잔액 차감 시 메인 잔액이 부족하면 보너스에서도 차감해야 함', async () => {
        // Given
        const wallet = createMockWallet(mockCurrency);
        const subtractAmount = new Prisma.Decimal('1200'); // 메인(1000) + 보너스(200) 필요
        const updatedWallet = createMockWallet(
          mockCurrency,
          new Prisma.Decimal('0'), // 메인 잔액 모두 소진
          mockBonusBalance.sub(new Prisma.Decimal('200')), // 보너스에서 200 차감
        );

        mockWalletRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);
        mockWalletRepository.upsert.mockResolvedValue(updatedWallet);

        // When
        const result = await service.execute({
          userId: mockUserId,
          currency: mockCurrency,
          balanceType: BalanceType.TOTAL,
          operation: UpdateOperation.SUBTRACT,
          amount: subtractAmount,
        });

        // Then
        expect(result.afterMainBalance.toString()).toBe('0');
        expect(result.afterBonusBalance.toString()).toBe('300');
        expect(result.mainBalanceChange.toString()).toBe('-1000');
        expect(result.bonusBalanceChange.toString()).toBe('-200');
      });

      it('총 잔액이 부족하면 InsufficientBalanceException을 발생시켜야 함', async () => {
        // Given
        const wallet = createMockWallet(mockCurrency);
        const subtractAmount = new Prisma.Decimal('2000'); // 총 잔액(1500)보다 큼

        mockWalletRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);

        // When & Then
        await expect(
          service.execute({
            userId: mockUserId,
            currency: mockCurrency,
            balanceType: BalanceType.TOTAL,
            operation: UpdateOperation.SUBTRACT,
            amount: subtractAmount,
          }),
        ).rejects.toThrow(InsufficientBalanceException);
      });
    });

    describe('잘못된 입력값 검증', () => {
      beforeEach(() => {
        const user = createMockUser();
        mockUserRepository.findById.mockResolvedValue(user);
      });

      it('0 이하의 금액 추가 시 InvalidWalletBalanceException을 발생시켜야 함', async () => {
        // Given
        const wallet = createMockWallet(mockCurrency);
        mockWalletRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);

        // When & Then
        await expect(
          service.execute({
            userId: mockUserId,
            currency: mockCurrency,
            balanceType: BalanceType.MAIN,
            operation: UpdateOperation.ADD,
            amount: new Prisma.Decimal('0'),
          }),
        ).rejects.toThrow(InvalidWalletBalanceException);

        await expect(
          service.execute({
            userId: mockUserId,
            currency: mockCurrency,
            balanceType: BalanceType.MAIN,
            operation: UpdateOperation.ADD,
            amount: new Prisma.Decimal('-100'),
          }),
        ).rejects.toThrow(InvalidWalletBalanceException);
      });

      it('0 이하의 금액 차감 시 InvalidWalletBalanceException을 발생시켜야 함', async () => {
        // Given
        const wallet = createMockWallet(mockCurrency);
        mockWalletRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);

        // When & Then
        await expect(
          service.execute({
            userId: mockUserId,
            currency: mockCurrency,
            balanceType: BalanceType.MAIN,
            operation: UpdateOperation.SUBTRACT,
            amount: new Prisma.Decimal('0'),
          }),
        ).rejects.toThrow(InvalidWalletBalanceException);

        await expect(
          service.execute({
            userId: mockUserId,
            currency: mockCurrency,
            balanceType: BalanceType.MAIN,
            operation: UpdateOperation.SUBTRACT,
            amount: new Prisma.Decimal('-50'),
          }),
        ).rejects.toThrow(InvalidWalletBalanceException);
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
            balanceType: BalanceType.MAIN,
            operation: UpdateOperation.ADD,
            amount: new Prisma.Decimal('100'),
          }),
        ).rejects.toThrow('Database query error');

        expect(loggerSpy).toHaveBeenCalledTimes(1);
        expect(loggerSpy).toHaveBeenCalledWith(
          expect.stringContaining('관리자 사용자 잔액 업데이트 실패'),
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
            balanceType: BalanceType.MAIN,
            operation: UpdateOperation.ADD,
            amount: new Prisma.Decimal('100'),
          }),
        ).rejects.toThrow('Database connection error');

        expect(loggerSpy).toHaveBeenCalledTimes(1);
        expect(loggerSpy).toHaveBeenCalledWith(
          expect.stringContaining('관리자 사용자 잔액 업데이트 실패'),
          repositoryError,
        );

        loggerSpy.mockRestore();
      });

      it('WalletRepository의 upsert가 실패하면 예외를 전파해야 함', async () => {
        // Given
        const user = createMockUser();
        const wallet = createMockWallet(mockCurrency);
        mockUserRepository.findById.mockResolvedValue(user);
        mockWalletRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);
        const upsertError = new Error('Upsert failed');
        mockWalletRepository.upsert.mockRejectedValue(upsertError);

        const loggerSpy = jest.spyOn(service['logger'], 'error');

        // When & Then
        await expect(
          service.execute({
            userId: mockUserId,
            currency: mockCurrency,
            balanceType: BalanceType.MAIN,
            operation: UpdateOperation.ADD,
            amount: new Prisma.Decimal('100'),
          }),
        ).rejects.toThrow('Upsert failed');

        expect(loggerSpy).toHaveBeenCalledTimes(1);
        expect(loggerSpy).toHaveBeenCalledWith(
          expect.stringContaining('관리자 사용자 잔액 업데이트 실패'),
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
            balanceType: BalanceType.MAIN,
            operation: UpdateOperation.ADD,
            amount: new Prisma.Decimal('100'),
          }),
        ).rejects.toThrow(UserNotFoundException);

        // UserNotFoundException은 로깅하지 않음
        expect(loggerSpy).not.toHaveBeenCalled();

        loggerSpy.mockRestore();
      });

      it('InsufficientBalanceException은 로깅하지 않고 그대로 재던지기', async () => {
        // Given
        const user = createMockUser();
        const wallet = createMockWallet(mockCurrency);
        mockUserRepository.findById.mockResolvedValue(user);
        mockWalletRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);

        const loggerSpy = jest.spyOn(service['logger'], 'error');

        // When & Then
        await expect(
          service.execute({
            userId: mockUserId,
            currency: mockCurrency,
            balanceType: BalanceType.MAIN,
            operation: UpdateOperation.SUBTRACT,
            amount: new Prisma.Decimal('2000'), // 잔액보다 큼
          }),
        ).rejects.toThrow(InsufficientBalanceException);

        // InsufficientBalanceException은 로깅하지 않음
        expect(loggerSpy).not.toHaveBeenCalled();

        loggerSpy.mockRestore();
      });

      it('InvalidWalletBalanceException은 로깅하지 않고 그대로 재던지기', async () => {
        // Given
        const user = createMockUser();
        const wallet = createMockWallet(mockCurrency);
        mockUserRepository.findById.mockResolvedValue(user);
        mockWalletRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);

        const loggerSpy = jest.spyOn(service['logger'], 'error');

        // When & Then
        await expect(
          service.execute({
            userId: mockUserId,
            currency: mockCurrency,
            balanceType: BalanceType.MAIN,
            operation: UpdateOperation.ADD,
            amount: new Prisma.Decimal('0'), // 잘못된 금액
          }),
        ).rejects.toThrow(InvalidWalletBalanceException);

        // InvalidWalletBalanceException은 로깅하지 않음
        expect(loggerSpy).not.toHaveBeenCalled();

        loggerSpy.mockRestore();
      });
    });

    describe('변경량 계산 검증', () => {
      beforeEach(() => {
        const user = createMockUser();
        mockUserRepository.findById.mockResolvedValue(user);
      });

      it('변경량이 정확하게 계산되어야 함', async () => {
        // Given
        const wallet = createMockWallet(mockCurrency);
        const addAmount = new Prisma.Decimal('300');
        const updatedWallet = createMockWallet(
          mockCurrency,
          mockMainBalance.add(addAmount),
          mockBonusBalance,
        );

        mockWalletRepository.findByUserIdAndCurrency.mockResolvedValue(wallet);
        mockWalletRepository.upsert.mockResolvedValue(updatedWallet);

        // When
        const result = await service.execute({
          userId: mockUserId,
          currency: mockCurrency,
          balanceType: BalanceType.MAIN,
          operation: UpdateOperation.ADD,
          amount: addAmount,
        });

        // Then
        const expectedMainChange = result.afterMainBalance.sub(
          result.beforeMainBalance,
        );
        const expectedBonusChange = result.afterBonusBalance.sub(
          result.beforeBonusBalance,
        );

        expect(result.mainBalanceChange.toString()).toBe(
          expectedMainChange.toString(),
        );
        expect(result.bonusBalanceChange.toString()).toBe(
          expectedBonusChange.toString(),
        );
      });
    });
  });
});

