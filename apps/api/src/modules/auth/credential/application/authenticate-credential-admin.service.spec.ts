// src/modules/auth/credential/application/authenticate-credential-admin.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Logger, HttpStatus } from '@nestjs/common';
import { AuthenticateCredentialAdminService } from './authenticate-credential-admin.service';
import { VerifyCredentialService } from './verify-credential.service';
import { FindLoginAttemptsService } from './find-login-attempts.service';
import { RecordLoginAttemptService } from './record-login-attempt.service';
import { CredentialPolicy } from '../domain/policy';
import {
  CREDENTIAL_USER_REPOSITORY,
  type CredentialUserRepositoryPort,
} from '../ports/out';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { AccountLockedException, LoginFailedException } from '../domain/exception';
import {
  LoginAttempt,
  LoginAttemptResult,
  LoginFailureReason,
} from '../domain/model/login-attempt.entity';
import { UserRoleType } from '@prisma/client';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';

describe('AuthenticateCredentialAdminService', () => {
  let module: TestingModule;
  let service: AuthenticateCredentialAdminService;
  let mockVerifyService: jest.Mocked<VerifyCredentialService>;
  let mockFindAttemptsService: jest.Mocked<FindLoginAttemptsService>;
  let mockRecordService: jest.Mocked<RecordLoginAttemptService>;
  let mockPolicy: jest.Mocked<CredentialPolicy>;
  let mockUserRepository: jest.Mocked<CredentialUserRepositoryPort>;

  const mockEmail = 'admin@example.com';
  const mockPassword = 'password123';
  const mockUserId = BigInt(1);
  const mockAuthenticatedUser: AuthenticatedUser = {
    id: mockUserId,
    uid: 'uid-123',
    email: mockEmail,
    role: UserRoleType.ADMIN,
  };

  const mockClientInfo: RequestClientInfo = {
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    country: 'KR',
    city: 'Seoul',
    referer: 'https://example.com',
    acceptLanguage: 'ko-KR,ko;q=0.9',
    fingerprint: 'fingerprint-123',
    protocol: 'https',
    method: 'POST',
    path: '/auth/admin/login',
    timestamp: new Date(),
    isMobile: false,
    browser: 'Chrome',
    os: 'Windows',
    timezone: 'Asia/Seoul',
    isp: 'ISP',
    asn: 'ASN',
    threat: 'low',
    bot: false,
    sessionId: 'session-123',
  };

  beforeEach(async () => {
    const mockVerifyServiceProvider = {
      provide: VerifyCredentialService,
      useValue: {
        execute: jest.fn(),
      },
    };

    const mockFindAttemptsServiceProvider = {
      provide: FindLoginAttemptsService,
      useValue: {
        execute: jest.fn(),
      },
    };

    const mockRecordServiceProvider = {
      provide: RecordLoginAttemptService,
      useValue: {
        execute: jest.fn(),
      },
    };

    const mockPolicyProvider = {
      provide: CredentialPolicy,
      useValue: {
        isAccountLocked: jest.fn(),
      },
    };

    const mockUserRepositoryProvider = {
      provide: CREDENTIAL_USER_REPOSITORY,
      useValue: {
        findByEmail: jest.fn(),
      },
    };

    module = await Test.createTestingModule({
      imports: [PrismaModule, EnvModule], // @Transactional() 데코레이터를 위해 필요
      providers: [
        AuthenticateCredentialAdminService,
        mockVerifyServiceProvider,
        mockFindAttemptsServiceProvider,
        mockRecordServiceProvider,
        mockPolicyProvider,
        mockUserRepositoryProvider,
      ],
    })
      .setLogger(new Logger())
      .compile();

    service = module.get<AuthenticateCredentialAdminService>(
      AuthenticateCredentialAdminService,
    );
    mockVerifyService = module.get(VerifyCredentialService);
    mockFindAttemptsService = module.get(FindLoginAttemptsService);
    mockRecordService = module.get(RecordLoginAttemptService);
    mockPolicy = module.get(CredentialPolicy);
    mockUserRepository = module.get(CREDENTIAL_USER_REPOSITORY);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('execute', () => {
    it('정상적인 관리자 로그인이 성공해야 함', async () => {
      // Arrange
      mockFindAttemptsService.execute.mockResolvedValue([]);
      mockPolicy.isAccountLocked.mockReturnValue(false);
      mockVerifyService.execute.mockResolvedValue(mockAuthenticatedUser);

      // Act
      const result = await service.execute({
        email: mockEmail,
        password: mockPassword,
        clientInfo: mockClientInfo,
      });

      // Assert
      expect(result).toEqual(mockAuthenticatedUser);
      expect(mockFindAttemptsService.execute).toHaveBeenCalledWith({
        email: mockEmail,
        limit: 5,
      });
      expect(mockPolicy.isAccountLocked).toHaveBeenCalledWith([]);
      expect(mockVerifyService.execute).toHaveBeenCalledWith({
        email: mockEmail,
        password: mockPassword,
        isAdmin: true,
      });
      expect(mockRecordService.execute).not.toHaveBeenCalled();
    });

    it('계정이 잠겼있으면 AccountLockedException 예외를 발생시켜야 함', async () => {
      // Arrange
      const recentAttempts = [
        LoginAttempt.createFailure({
          uid: 'uid-1',
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          isAdmin: true,
        }),
        LoginAttempt.createFailure({
          uid: 'uid-2',
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          isAdmin: true,
        }),
        LoginAttempt.createFailure({
          uid: 'uid-3',
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          isAdmin: true,
        }),
        LoginAttempt.createFailure({
          uid: 'uid-4',
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          isAdmin: true,
        }),
        LoginAttempt.createFailure({
          uid: 'uid-5',
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          isAdmin: true,
        }),
      ];

      const mockUser = {
        id: mockUserId,
        email: mockEmail,
      };

      mockFindAttemptsService.execute.mockResolvedValue(recentAttempts);
      mockPolicy.isAccountLocked.mockReturnValue(true);
      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);

      // Act & Assert
      await expect(
        service.execute({
          email: mockEmail,
          password: mockPassword,
          clientInfo: mockClientInfo,
        }),
      ).rejects.toThrow(AccountLockedException);

      expect(mockVerifyService.execute).not.toHaveBeenCalled();
    });

    it('계정 잠금 시 사용자가 없어도 AccountLockedException를 발생시켜야 함', async () => {
      // Arrange
      const recentAttempts = [
        LoginAttempt.createFailure({
          uid: 'uid-1',
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: mockEmail,
          isAdmin: true,
        }),
      ];

      mockFindAttemptsService.execute.mockResolvedValue(recentAttempts);
      mockPolicy.isAccountLocked.mockReturnValue(true);
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.execute({
          email: mockEmail,
          password: mockPassword,
          clientInfo: mockClientInfo,
        }),
      ).rejects.toThrow(AccountLockedException);
    });


    it('사용자가 없으면 LoginFailedException 예외를 발생시켜야 함', async () => {
      // Arrange
      mockFindAttemptsService.execute.mockResolvedValue([]);
      mockPolicy.isAccountLocked.mockReturnValue(false);
      mockVerifyService.execute.mockResolvedValue(null);
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.execute({
          email: mockEmail,
          password: mockPassword,
          clientInfo: mockClientInfo,
        }),
      ).rejects.toThrow(LoginFailedException);

      // Assert
      expect(mockRecordService.execute).toHaveBeenCalledWith({
        userId: null,
        email: mockEmail,
        result: LoginAttemptResult.FAILED,
        failureReason: LoginFailureReason.USER_NOT_FOUND,
        ipAddress: mockClientInfo.ip,
        userAgent: mockClientInfo.userAgent,
        deviceFingerprint: mockClientInfo.fingerprint,
        isMobile: mockClientInfo.isMobile,
        isAdmin: true,
      });
    });

    it('비밀번호가 틀리면 LoginFailedException 예외를 발생시켜야 함', async () => {
      // Arrange
      const mockUser = {
        id: mockUserId,
        email: mockEmail,
      };

      mockFindAttemptsService.execute.mockResolvedValue([]);
      mockPolicy.isAccountLocked.mockReturnValue(false);
      mockVerifyService.execute.mockResolvedValue(null);
      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);

      // Act & Assert
      await expect(
        service.execute({
          email: mockEmail,
          password: 'wrongPassword',
          clientInfo: mockClientInfo,
        }),
      ).rejects.toThrow(LoginFailedException);

      // Assert
      expect(mockRecordService.execute).toHaveBeenCalledWith({
        userId: mockUserId,
        email: mockEmail,
        result: LoginAttemptResult.FAILED,
        failureReason: LoginFailureReason.INVALID_CREDENTIALS,
        ipAddress: mockClientInfo.ip,
        userAgent: mockClientInfo.userAgent,
        deviceFingerprint: mockClientInfo.fingerprint,
        isMobile: mockClientInfo.isMobile,
        isAdmin: true,
      });
    });


    it('관리자 로그인 시 isAdmin=true로 verifyService를 호출해야 함', async () => {
      // Arrange
      mockFindAttemptsService.execute.mockResolvedValue([]);
      mockPolicy.isAccountLocked.mockReturnValue(false);
      mockVerifyService.execute.mockResolvedValue(mockAuthenticatedUser);

      // Act
      await service.execute({
        email: mockEmail,
        password: mockPassword,
        clientInfo: mockClientInfo,
      });

      // Assert
      expect(mockVerifyService.execute).toHaveBeenCalledWith({
        email: mockEmail,
        password: mockPassword,
        isAdmin: true,
      });
    });

    it('성공 시 recordService와 dispatchLogService를 호출하지 않아야 함', async () => {
      // Arrange
      mockFindAttemptsService.execute.mockResolvedValue([]);
      mockPolicy.isAccountLocked.mockReturnValue(false);
      mockVerifyService.execute.mockResolvedValue(mockAuthenticatedUser);

      // Act
      await service.execute({
        email: mockEmail,
        password: mockPassword,
        clientInfo: mockClientInfo,
      });

      // Assert
      expect(mockRecordService.execute).not.toHaveBeenCalled();
    });
  });
});

