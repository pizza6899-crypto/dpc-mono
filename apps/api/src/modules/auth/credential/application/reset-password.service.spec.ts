// src/modules/auth/credential/application/reset-password.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Logger, HttpStatus } from '@nestjs/common';
import { ResetPasswordService } from './reset-password.service';
import { USER_REPOSITORY } from 'src/modules/user/ports/out/user.repository.token';
import type { UserRepositoryPort } from 'src/modules/user/ports/out/user.repository.port';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from '../ports/out/password-reset-token.repository.token';
import type { PasswordResetTokenRepositoryPort } from '../ports/out/password-reset-token.repository.port';
import { User } from 'src/modules/user/domain';
import { UserStatus, UserRoleType, SocialType } from '@repo/database';
import { hashPassword } from 'src/utils/password.util';
import { ApiException } from 'src/common/http/exception/api.exception';
import { MessageCode } from 'src/common/http/types';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';

describe('ResetPasswordService', () => {
  let module: TestingModule;
  let service: ResetPasswordService;
  let mockUserRepository: jest.Mocked<UserRepositoryPort>;
  let mockTokenRepository: jest.Mocked<PasswordResetTokenRepositoryPort>;
  let mockDispatchLogService: jest.Mocked<DispatchLogService>;

  const mockUserId = BigInt(1);
  const mockToken = 'test-token-12345678901234567890123456789012';
  const mockNewPassword = 'newPassword123!';
  let mockNewPasswordHash: string;

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
    path: '/auth/password/reset',
    timestamp: new Date(),
    isMobile: false,
    browser: 'Chrome',
    os: 'Windows',
    timezone: 'Asia/Seoul',
    isp: 'ISP',
    asn: 'ASN',
    threat: 'low',
    bot: false,
  };

  const mockTokenData = {
    id: 1,
    userId: mockUserId,
    token: mockToken,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1시간 후
    usedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    mockNewPasswordHash = await hashPassword(mockNewPassword);
  });

  beforeEach(async () => {
    const mockUserRepositoryProvider = {
      provide: USER_REPOSITORY,
      useValue: {
        findById: jest.fn(),
        updatePassword: jest.fn(),
      },
    };

    const mockTokenRepositoryProvider = {
      provide: PASSWORD_RESET_TOKEN_REPOSITORY,
      useValue: {
        findByToken: jest.fn(),
        markAsUsed: jest.fn(),
      },
    };

    const mockDispatchLogServiceProvider = {
      provide: DispatchLogService,
      useValue: {
        dispatch: jest.fn().mockResolvedValue(undefined),
      },
    };

    module = await Test.createTestingModule({
      imports: [PrismaModule, EnvModule], // @Transactional() 데코레이터를 위해 필요
      providers: [
        ResetPasswordService,
        mockUserRepositoryProvider,
        mockTokenRepositoryProvider,
        mockDispatchLogServiceProvider,
      ],
    })
      .setLogger(new Logger())
      .compile();

    service = module.get<ResetPasswordService>(ResetPasswordService);
    mockUserRepository = module.get(USER_REPOSITORY);
    mockTokenRepository = module.get(PASSWORD_RESET_TOKEN_REPOSITORY);
    mockDispatchLogService = module.get(DispatchLogService);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('execute', () => {
    const createMockCredentialUser = () => {
      return User.fromPersistence({
        id: mockUserId,
        uid: 'uid-123',
        email: 'user@example.com',
        passwordHash: '$2a$12$oldhashedpassword',
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
        country: 'KR',
        timezone: 'Asia/Seoul',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    };

    const createMockSocialUser = () => {
      return User.fromPersistence({
        id: mockUserId,
        uid: 'uid-123',
        email: 'user@example.com',
        passwordHash: null,
        socialId: 'social-123',
        socialType: SocialType.GOOGLE,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
        country: 'KR',
        timezone: 'Asia/Seoul',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    };

    it('정상적인 비밀번호 재설정이 성공해야 함', async () => {
      // Arrange
      const mockUser = createMockCredentialUser();
      mockTokenRepository.findByToken.mockResolvedValue(mockTokenData);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.updatePassword.mockResolvedValue(
        User.fromPersistence({
          ...mockUser.toPersistence(),
          passwordHash: mockNewPasswordHash,
        }),
      );
      mockTokenRepository.markAsUsed.mockResolvedValue(undefined);

      // Act
      await service.execute({
        token: mockToken,
        newPassword: mockNewPassword,
        requestInfo: mockClientInfo,
      });

      // Assert
      expect(mockTokenRepository.findByToken).toHaveBeenCalledWith(mockToken);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUserId);
      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith(
        mockUserId,
        expect.any(String), // 해시된 비밀번호
      );
      expect(mockTokenRepository.markAsUsed).toHaveBeenCalledWith(
        mockTokenData.id,
      );
    });

    it('토큰이 존재하지 않으면 AUTH_INVALID_CREDENTIALS 예외를 발생시켜야 함', async () => {
      // Arrange
      mockTokenRepository.findByToken.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.execute({
          token: mockToken,
          newPassword: mockNewPassword,
          requestInfo: mockClientInfo,
        }),
      ).rejects.toThrow(ApiException);

      // 에러 상세 검증
      try {
        await service.execute({
          token: mockToken,
          newPassword: mockNewPassword,
          requestInfo: mockClientInfo,
        });
        fail('예외가 발생해야 합니다');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiException);
        expect((error as ApiException).messageCode).toBe(
          MessageCode.AUTH_INVALID_CREDENTIALS,
        );
        expect((error as ApiException).getStatus()).toBe(
          HttpStatus.BAD_REQUEST,
        );
      }

      expect(mockTokenRepository.findByToken).toHaveBeenCalledWith(mockToken);
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
      expect(mockTokenRepository.markAsUsed).not.toHaveBeenCalled();
    });

    it('사용자가 존재하지 않으면 USER_NOT_FOUND 예외를 발생시켜야 함', async () => {
      // Arrange
      mockTokenRepository.findByToken.mockResolvedValue(mockTokenData);
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.execute({
          token: mockToken,
          newPassword: mockNewPassword,
          requestInfo: mockClientInfo,
        }),
      ).rejects.toThrow(ApiException);

      // 에러 상세 검증
      try {
        await service.execute({
          token: mockToken,
          newPassword: mockNewPassword,
          requestInfo: mockClientInfo,
        });
        fail('예외가 발생해야 합니다');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiException);
        expect((error as ApiException).messageCode).toBe(
          MessageCode.USER_NOT_FOUND,
        );
        expect((error as ApiException).getStatus()).toBe(HttpStatus.NOT_FOUND);
      }

      expect(mockTokenRepository.findByToken).toHaveBeenCalledWith(mockToken);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUserId);
      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
      expect(mockTokenRepository.markAsUsed).not.toHaveBeenCalled();
    });

    it('소셜 로그인 사용자면 AUTH_INVALID_CREDENTIALS 예외를 발생시켜야 함', async () => {
      // Arrange
      const mockSocialUser = createMockSocialUser();
      mockTokenRepository.findByToken.mockResolvedValue(mockTokenData);
      mockUserRepository.findById.mockResolvedValue(mockSocialUser);

      // Act & Assert
      await expect(
        service.execute({
          token: mockToken,
          newPassword: mockNewPassword,
          requestInfo: mockClientInfo,
        }),
      ).rejects.toThrow(ApiException);

      // 에러 상세 검증
      try {
        await service.execute({
          token: mockToken,
          newPassword: mockNewPassword,
          requestInfo: mockClientInfo,
        });
        fail('예외가 발생해야 합니다');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiException);
        expect((error as ApiException).messageCode).toBe(
          MessageCode.AUTH_INVALID_CREDENTIALS,
        );
        expect((error as ApiException).getStatus()).toBe(
          HttpStatus.BAD_REQUEST,
        );
      }

      expect(mockTokenRepository.findByToken).toHaveBeenCalledWith(mockToken);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUserId);
      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
      expect(mockTokenRepository.markAsUsed).not.toHaveBeenCalled();
    });

    it('비밀번호가 해싱되어 저장되어야 함', async () => {
      // Arrange
      const mockUser = createMockCredentialUser();
      mockTokenRepository.findByToken.mockResolvedValue(mockTokenData);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.updatePassword.mockResolvedValue(
        User.fromPersistence({
          ...mockUser.toPersistence(),
          passwordHash: mockNewPasswordHash,
        }),
      );
      mockTokenRepository.markAsUsed.mockResolvedValue(undefined);

      // Act
      await service.execute({
        token: mockToken,
        newPassword: mockNewPassword,
        requestInfo: mockClientInfo,
      });

      // Assert
      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith(
        mockUserId,
        expect.any(String),
      );

      // 해시된 비밀번호가 원본과 다르고, bcrypt 형식인지 확인
      const actualHash = (
        mockUserRepository.updatePassword as jest.Mock
      ).mock.calls[0][1];
      expect(actualHash).not.toBe(mockNewPassword);
      expect(actualHash).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt 해시 형식
    });

    it('토큰 사용 처리가 완료되어야 함', async () => {
      // Arrange
      const mockUser = createMockCredentialUser();
      mockTokenRepository.findByToken.mockResolvedValue(mockTokenData);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.updatePassword.mockResolvedValue(
        User.fromPersistence({
          ...mockUser.toPersistence(),
          passwordHash: mockNewPasswordHash,
        }),
      );
      mockTokenRepository.markAsUsed.mockResolvedValue(undefined);

      // Act
      await service.execute({
        token: mockToken,
        newPassword: mockNewPassword,
        requestInfo: mockClientInfo,
      });

      // Assert
      expect(mockTokenRepository.markAsUsed).toHaveBeenCalledWith(
        mockTokenData.id,
      );
      // updatePassword 후에 markAsUsed가 호출되었는지 확인
      const updatePasswordCallOrder = (
        mockUserRepository.updatePassword as jest.Mock
      ).mock.invocationCallOrder[0];
      const markAsUsedCallOrder = (
        mockTokenRepository.markAsUsed as jest.Mock
      ).mock.invocationCallOrder[0];
      expect(updatePasswordCallOrder).toBeLessThan(markAsUsedCallOrder);
    });

    it('Activity Log가 기록되어야 함', async () => {
      // Arrange
      const mockUser = createMockCredentialUser();
      mockTokenRepository.findByToken.mockResolvedValue(mockTokenData);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.updatePassword.mockResolvedValue(
        User.fromPersistence({
          ...mockUser.toPersistence(),
          passwordHash: mockNewPasswordHash,
        }),
      );
      mockTokenRepository.markAsUsed.mockResolvedValue(undefined);

      // Act
      await service.execute({
        token: mockToken,
        newPassword: mockNewPassword,
        requestInfo: mockClientInfo,
      });

      // Assert
      expect(mockDispatchLogService.dispatch).toHaveBeenCalledWith(
        {
          type: LogType.AUTH,
          data: {
            userId: mockUserId.toString(),
            action: 'PASSWORD_RESET',
            status: 'SUCCESS',
            ip: mockClientInfo.ip,
            userAgent: mockClientInfo.userAgent,
            metadata: {
              email: mockUser.email,
              tokenId: mockTokenData.id,
            },
          },
        },
        mockClientInfo,
      );
    });

    it('Activity Log 실패 시에도 비밀번호 재설정은 성공해야 함', async () => {
      // Arrange
      const mockUser = createMockCredentialUser();
      mockTokenRepository.findByToken.mockResolvedValue(mockTokenData);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.updatePassword.mockResolvedValue(
        User.fromPersistence({
          ...mockUser.toPersistence(),
          passwordHash: mockNewPasswordHash,
        }),
      );
      mockTokenRepository.markAsUsed.mockResolvedValue(undefined);
      mockDispatchLogService.dispatch.mockRejectedValue(
        new Error('Activity log failed'),
      );

      // Act
      await service.execute({
        token: mockToken,
        newPassword: mockNewPassword,
        requestInfo: mockClientInfo,
      });

      // Assert
      // 예외가 전파되지 않아야 함
      expect(mockUserRepository.updatePassword).toHaveBeenCalled();
      expect(mockTokenRepository.markAsUsed).toHaveBeenCalled();
      expect(mockDispatchLogService.dispatch).toHaveBeenCalled();
    });

    it('모든 단계가 올바른 순서로 실행되어야 함', async () => {
      // Arrange
      const mockUser = createMockCredentialUser();
      mockTokenRepository.findByToken.mockResolvedValue(mockTokenData);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.updatePassword.mockResolvedValue(
        User.fromPersistence({
          ...mockUser.toPersistence(),
          passwordHash: mockNewPasswordHash,
        }),
      );
      mockTokenRepository.markAsUsed.mockResolvedValue(undefined);
      mockDispatchLogService.dispatch.mockResolvedValue(undefined);

      // Act
      await service.execute({
        token: mockToken,
        newPassword: mockNewPassword,
        requestInfo: mockClientInfo,
      });

      // Assert - 호출 순서 확인
      const findByTokenOrder = (
        mockTokenRepository.findByToken as jest.Mock
      ).mock.invocationCallOrder[0];
      const findByIdOrder = (
        mockUserRepository.findById as jest.Mock
      ).mock.invocationCallOrder[0];
      const updatePasswordOrder = (
        mockUserRepository.updatePassword as jest.Mock
      ).mock.invocationCallOrder[0];
      const markAsUsedOrder = (
        mockTokenRepository.markAsUsed as jest.Mock
      ).mock.invocationCallOrder[0];
      const logSuccessOrder = (
        mockDispatchLogService.dispatch as jest.Mock
      ).mock.invocationCallOrder[0];

      expect(findByTokenOrder).toBeLessThan(findByIdOrder);
      expect(findByIdOrder).toBeLessThan(updatePasswordOrder);
      expect(updatePasswordOrder).toBeLessThan(markAsUsedOrder);
      expect(markAsUsedOrder).toBeLessThan(logSuccessOrder);
    });
  });
});

