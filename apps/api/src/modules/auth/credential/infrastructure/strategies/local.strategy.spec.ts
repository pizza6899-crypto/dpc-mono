// src/modules/auth/credential/infrastructure/strategies/local.strategy.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { CredentialLocalStrategy } from './local.strategy';
import { VerifyCredentialService } from '../../application/verify-credential.service';
import { FindLoginAttemptsService } from '../../application/find-login-attempts.service';
import { RecordLoginAttemptService } from '../../application/record-login-attempt.service';
import { CredentialPolicy } from '../../domain/policy';
import {
  CREDENTIAL_USER_REPOSITORY,
  type CredentialUserRepositoryPort,
} from '../../ports/out';
import { CredentialUser } from '../../domain/model/credential-user.entity';
import { LoginAttempt, LoginAttemptResult, LoginFailureReason } from '../../domain';
import { AuthenticatedUser } from 'src/platform/auth/types/auth.types';
import { ApiException } from 'src/platform/http/exception/api.exception';
import { MessageCode } from 'src/platform/http/types';
import { UserStatus, UserRoleType } from '@repo/database';
import type { Request } from 'express';

describe('CredentialLocalStrategy', () => {
  let strategy: CredentialLocalStrategy;
  let verifyService: jest.Mocked<VerifyCredentialService>;
  let findAttemptsService: jest.Mocked<FindLoginAttemptsService>;
  let recordService: jest.Mocked<RecordLoginAttemptService>;
  let policy: jest.Mocked<CredentialPolicy>;
  let userRepository: jest.Mocked<CredentialUserRepositoryPort>;

  const mockEmail = 'user@example.com';
  const mockPassword = 'password123';
  const mockUserId = 'user-123';
  const mockRequest = {
    headers: {
      'user-agent': 'Mozilla/5.0',
      'cf-connecting-ip': '192.168.1.1',
    },
    ip: '192.168.1.1',
    protocol: 'https',
    method: 'POST',
    path: '/auth/login',
    connection: { remoteAddress: '192.168.1.1' },
  } as unknown as Request;

  const mockAuthenticatedUser: AuthenticatedUser = {
    id: mockUserId,
    email: mockEmail,
    role: UserRoleType.USER,
  };

  beforeEach(async () => {
    const mockVerifyService = {
      execute: jest.fn(),
    };

    const mockFindAttemptsService = {
      execute: jest.fn(),
    };

    const mockRecordService = {
      execute: jest.fn(),
    };

    const mockPolicy = {
      isAccountLocked: jest.fn(),
    };

    const mockUserRepository = {
      findByEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CredentialLocalStrategy,
        {
          provide: VerifyCredentialService,
          useValue: mockVerifyService,
        },
        {
          provide: FindLoginAttemptsService,
          useValue: mockFindAttemptsService,
        },
        {
          provide: RecordLoginAttemptService,
          useValue: mockRecordService,
        },
        {
          provide: CredentialPolicy,
          useValue: mockPolicy,
        },
        {
          provide: CREDENTIAL_USER_REPOSITORY,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    strategy = module.get<CredentialLocalStrategy>(CredentialLocalStrategy);
    verifyService = module.get(VerifyCredentialService);
    findAttemptsService = module.get(FindLoginAttemptsService);
    recordService = module.get(RecordLoginAttemptService);
    policy = module.get(CredentialPolicy);
    userRepository = module.get(CREDENTIAL_USER_REPOSITORY);

    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('유효한 자격 증명으로 사용자를 반환한다', async () => {
      // Arrange
      policy.isAccountLocked.mockReturnValue(false);
      verifyService.execute.mockResolvedValue(mockAuthenticatedUser);

      // Act
      const result = await strategy.validate(mockRequest, mockEmail, mockPassword);

      // Assert
      expect(result).toEqual(mockAuthenticatedUser);
      expect(findAttemptsService.execute).toHaveBeenCalledWith({
        email: mockEmail,
        limit: 5,
      });
      expect(verifyService.execute).toHaveBeenCalledWith({
        email: mockEmail,
        password: mockPassword,
      });
      expect(recordService.execute).not.toHaveBeenCalled();
    });

    it('계정이 잠겨있으면 THROTTLE_TOO_MANY_REQUESTS 예외를 발생시킨다', async () => {
      // Arrange
      const lockedAttempts = Array(5).fill(
        LoginAttempt.createFailure({
          uid: 'uid-123',
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
        }),
      );

      policy.isAccountLocked.mockReturnValue(true);
      findAttemptsService.execute.mockResolvedValue(lockedAttempts);

      // Act & Assert
      await expect(
        strategy.validate(mockRequest, mockEmail, mockPassword),
      ).rejects.toThrow(ApiException);

      try {
        await strategy.validate(mockRequest, mockEmail, mockPassword);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiException);
        expect((error as ApiException).messageCode).toBe(
          MessageCode.THROTTLE_TOO_MANY_REQUESTS,
        );
        expect((error as ApiException).getStatus()).toBe(
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      expect(recordService.execute).toHaveBeenCalledWith({
        email: mockEmail,
        result: LoginAttemptResult.FAILED,
        failureReason: LoginFailureReason.THROTTLE_LIMIT_EXCEEDED,
        ipAddress: expect.any(String),
        userAgent: expect.any(String),
        deviceFingerprint: expect.any(String),
        isMobile: expect.any(Boolean),
        isAdmin: false,
      });
    });

    it('자격 증명이 틀리면 AUTH_INVALID_CREDENTIALS 예외를 발생시킨다', async () => {
      // Arrange
      const user = CredentialUser.fromPersistence({
        id: mockUserId,
        email: mockEmail,
        passwordHash: 'hash',
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      policy.isAccountLocked.mockReturnValue(false);
      verifyService.execute.mockResolvedValue(null);
      userRepository.findByEmail.mockResolvedValue(user);

      // Act & Assert
      await expect(
        strategy.validate(mockRequest, mockEmail, mockPassword),
      ).rejects.toThrow(ApiException);

      try {
        await strategy.validate(mockRequest, mockEmail, mockPassword);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiException);
        expect((error as ApiException).messageCode).toBe(
          MessageCode.AUTH_INVALID_CREDENTIALS,
        );
        expect((error as ApiException).getStatus()).toBe(
          HttpStatus.UNAUTHORIZED,
        );
      }

      expect(recordService.execute).toHaveBeenCalledWith({
        userId: mockUserId,
        email: mockEmail,
        result: LoginAttemptResult.FAILED,
        failureReason: LoginFailureReason.INVALID_CREDENTIALS,
        ipAddress: expect.any(String),
        userAgent: expect.any(String),
        deviceFingerprint: expect.any(String),
        isMobile: expect.any(Boolean),
        isAdmin: false,
      });
    });

    it('사용자가 없으면 USER_NOT_FOUND 실패 이유로 기록한다', async () => {
      // Arrange
      policy.isAccountLocked.mockReturnValue(false);
      verifyService.execute.mockResolvedValue(null);
      userRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(
        strategy.validate(mockRequest, mockEmail, mockPassword),
      ).rejects.toThrow(ApiException);

      expect(recordService.execute).toHaveBeenCalledWith({
        userId: null,
        email: mockEmail,
        result: LoginAttemptResult.FAILED,
        failureReason: LoginFailureReason.USER_NOT_FOUND,
        ipAddress: expect.any(String),
        userAgent: expect.any(String),
        deviceFingerprint: expect.any(String),
        isMobile: expect.any(Boolean),
        isAdmin: false,
      });
    });

    it('계정이 잠기지 않았으면 검증을 진행한다', async () => {
      // Arrange
      const recentAttempts = [
        LoginAttempt.createFailure({
          uid: 'uid-1',
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
        }),
        LoginAttempt.createFailure({
          uid: 'uid-2',
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
        }),
      ];

      policy.isAccountLocked.mockReturnValue(false);
      findAttemptsService.execute.mockResolvedValue(recentAttempts);
      verifyService.execute.mockResolvedValue(mockAuthenticatedUser);

      // Act
      const result = await strategy.validate(mockRequest, mockEmail, mockPassword);

      // Assert
      expect(result).toEqual(mockAuthenticatedUser);
      expect(verifyService.execute).toHaveBeenCalled();
    });
  });
});

