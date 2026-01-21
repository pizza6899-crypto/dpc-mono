// src/modules/auth/credential/application/change-password.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Logger, HttpStatus } from '@nestjs/common';
import { ChangePasswordService } from './change-password.service';
import { VerifyCredentialService } from './verify-credential.service';
import { USER_REPOSITORY } from 'src/modules/user/ports/out/user.repository.token';
import type { UserRepositoryPort } from 'src/modules/user/ports/out/user.repository.port';
import { User } from 'src/modules/user/domain';
import { UserStatus, UserRoleType, SocialType } from '@prisma/client';
import { hashPassword } from 'src/utils/password.util';
import { PasswordMismatchException, LoginFailedException } from '../domain/exception';
import { UserNotFoundException } from 'src/modules/user/domain/user.exception';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';

describe('ChangePasswordService', () => {
  let module: TestingModule;
  let service: ChangePasswordService;
  let mockVerifyService: jest.Mocked<VerifyCredentialService>;
  let mockUserRepository: jest.Mocked<UserRepositoryPort>;

  const mockUserId = BigInt(1);
  const mockEmail = 'user@example.com';
  const mockCurrentPassword = 'currentPassword123!';
  const mockNewPassword = 'newPassword123!';
  let mockCurrentPasswordHash: string;
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
    method: 'PATCH',
    path: '/auth/password',
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

  beforeAll(async () => {
    mockCurrentPasswordHash = await hashPassword(mockCurrentPassword);
    mockNewPasswordHash = await hashPassword(mockNewPassword);
  });

  beforeEach(async () => {
    const mockVerifyServiceProvider = {
      provide: VerifyCredentialService,
      useValue: {
        execute: jest.fn(),
      },
    };

    const mockUserRepositoryProvider = {
      provide: USER_REPOSITORY,
      useValue: {
        findById: jest.fn(),
        updatePassword: jest.fn(),
      },
    };

    module = await Test.createTestingModule({
      imports: [PrismaModule, EnvModule], // @Transactional() 데코레이터를 위해 필요
      providers: [
        ChangePasswordService,
        mockVerifyServiceProvider,
        mockUserRepositoryProvider,
      ],
    })
      .setLogger(new Logger())
      .compile();

    service = module.get<ChangePasswordService>(ChangePasswordService);
    mockVerifyService = module.get(VerifyCredentialService);
    mockUserRepository = module.get(USER_REPOSITORY);

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
        email: mockEmail,
        passwordHash: mockCurrentPasswordHash,
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

    it('정상적인 비밀번호 변경이 성공해야 함', async () => {
      // Arrange
      const mockUser = createMockCredentialUser();
      const mockAuthenticatedUser = {
        id: mockUserId,
        uid: 'uid-123',
        email: mockEmail,
        role: UserRoleType.USER,
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockVerifyService.execute.mockResolvedValue(mockAuthenticatedUser);
      mockUserRepository.updatePassword.mockResolvedValue(
        User.fromPersistence({
          ...mockUser.toPersistence(),
          passwordHash: mockNewPasswordHash,
        }),
      );

      // Act
      await service.execute({
        userId: mockUserId,
        currentPassword: mockCurrentPassword,
        newPassword: mockNewPassword,
        requestInfo: mockClientInfo,
        isAdmin: false,
      });

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUserId);
      expect(mockVerifyService.execute).toHaveBeenCalledWith({
        email: mockEmail,
        password: mockCurrentPassword,
        isAdmin: false,
      });
      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith(
        mockUserId,
        expect.any(String), // 해시된 비밀번호
      );
    });

    it('사용자가 존재하지 않으면 UserNotFoundException 예외를 발생시켜야 함', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.execute({
          userId: mockUserId,
          currentPassword: mockCurrentPassword,
          newPassword: mockNewPassword,
          requestInfo: mockClientInfo,
          isAdmin: false,
        }),
      ).rejects.toThrow(UserNotFoundException);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUserId);
      expect(mockVerifyService.execute).not.toHaveBeenCalled();
      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
    });

    it('일반 회원가입 사용자가 아니면 LoginFailedException 예외를 발생시켜야 함', async () => {
      // Arrange
      const mockSocialUser = User.fromPersistence({
        id: mockUserId,
        uid: 'uid-123',
        email: mockEmail,
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

      mockUserRepository.findById.mockResolvedValue(mockSocialUser);

      // Act & Assert
      await expect(
        service.execute({
          userId: mockUserId,
          currentPassword: mockCurrentPassword,
          newPassword: mockNewPassword,
          requestInfo: mockClientInfo,
          isAdmin: false,
        }),
      ).rejects.toThrow(LoginFailedException);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUserId);
      expect(mockVerifyService.execute).not.toHaveBeenCalled();
      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
    });

    it('passwordHash가 null이면 LoginFailedException 예외를 발생시켜야 함', async () => {
      // Arrange
      const mockUserWithoutPassword = User.fromPersistence({
        id: mockUserId,
        uid: 'uid-123',
        email: mockEmail,
        passwordHash: null,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
        country: 'KR',
        timezone: 'Asia/Seoul',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepository.findById.mockResolvedValue(mockUserWithoutPassword);

      // Act & Assert
      await expect(
        service.execute({
          userId: mockUserId,
          currentPassword: mockCurrentPassword,
          newPassword: mockNewPassword,
          requestInfo: mockClientInfo,
          isAdmin: false,
        }),
      ).rejects.toThrow(LoginFailedException);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUserId);
      expect(mockVerifyService.execute).not.toHaveBeenCalled();
      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
    });

    it('현재 비밀번호가 틀리면 PasswordMismatchException 예외를 발생시켜야 함', async () => {
      // Arrange
      const mockUser = createMockCredentialUser();

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockVerifyService.execute.mockResolvedValue(null); // 비밀번호 검증 실패

      // Act & Assert
      await expect(
        service.execute({
          userId: mockUserId,
          currentPassword: 'wrongPassword',
          newPassword: mockNewPassword,
          requestInfo: mockClientInfo,
          isAdmin: false,
        }),
      ).rejects.toThrow(PasswordMismatchException);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUserId);
      expect(mockVerifyService.execute).toHaveBeenCalledWith({
        email: mockEmail,
        password: 'wrongPassword',
        isAdmin: false,
      });
      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
    });

    it('관리자 비밀번호 변경 시 isAdmin=true로 전달해야 함', async () => {
      // Arrange
      const mockAdminUser = User.fromPersistence({
        id: mockUserId,
        uid: 'uid-123',
        email: mockEmail,
        passwordHash: mockCurrentPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.ADMIN,
        country: 'KR',
        timezone: 'Asia/Seoul',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockAuthenticatedUser = {
        id: mockUserId,
        uid: 'uid-123',
        email: mockEmail,
        role: UserRoleType.ADMIN,
      };

      mockUserRepository.findById.mockResolvedValue(mockAdminUser);
      mockVerifyService.execute.mockResolvedValue(mockAuthenticatedUser);
      mockUserRepository.updatePassword.mockResolvedValue(
        User.fromPersistence({
          ...mockAdminUser.toPersistence(),
          passwordHash: mockNewPasswordHash,
        }),
      );

      // Act
      await service.execute({
        userId: mockUserId,
        currentPassword: mockCurrentPassword,
        newPassword: mockNewPassword,
        requestInfo: mockClientInfo,
        isAdmin: true,
      });

      // Assert
      expect(mockVerifyService.execute).toHaveBeenCalledWith({
        email: mockEmail,
        password: mockCurrentPassword,
        isAdmin: true,
      });
    });

    it('비밀번호 변경이 정상적으로 완료되어야 함', async () => {
      // Arrange
      const mockUser = createMockCredentialUser();
      const mockAuthenticatedUser = {
        id: mockUserId,
        uid: 'uid-123',
        email: mockEmail,
        role: UserRoleType.USER,
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockVerifyService.execute.mockResolvedValue(mockAuthenticatedUser);
      mockUserRepository.updatePassword.mockResolvedValue(
        User.fromPersistence({
          ...mockUser.toPersistence(),
          passwordHash: mockNewPasswordHash,
        }),
      );

      // Act
      await service.execute({
        userId: mockUserId,
        currentPassword: mockCurrentPassword,
        newPassword: mockNewPassword,
        requestInfo: mockClientInfo,
        isAdmin: false,
      });

      // Assert
      expect(mockUserRepository.updatePassword).toHaveBeenCalledTimes(1);
    });

    it('isAdmin이 명시되지 않으면 기본값 false를 사용해야 함', async () => {
      // Arrange
      const mockUser = createMockCredentialUser();
      const mockAuthenticatedUser = {
        id: mockUserId,
        uid: 'uid-123',
        email: mockEmail,
        role: UserRoleType.USER,
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockVerifyService.execute.mockResolvedValue(mockAuthenticatedUser);
      mockUserRepository.updatePassword.mockResolvedValue(
        User.fromPersistence({
          ...mockUser.toPersistence(),
          passwordHash: mockNewPasswordHash,
        }),
      );

      // Act
      await service.execute({
        userId: mockUserId,
        currentPassword: mockCurrentPassword,
        newPassword: mockNewPassword,
        requestInfo: mockClientInfo,
        // isAdmin 생략
      });

      // Assert
      expect(mockVerifyService.execute).toHaveBeenCalledWith({
        email: mockEmail,
        password: mockCurrentPassword,
        isAdmin: false,
      });
    });

    it('새 비밀번호가 해싱되어 저장되어야 함', async () => {
      // Arrange
      const mockUser = createMockCredentialUser();
      const mockAuthenticatedUser = {
        id: mockUserId,
        uid: 'uid-123',
        email: mockEmail,
        role: UserRoleType.USER,
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockVerifyService.execute.mockResolvedValue(mockAuthenticatedUser);
      mockUserRepository.updatePassword.mockResolvedValue(
        User.fromPersistence({
          ...mockUser.toPersistence(),
          passwordHash: mockNewPasswordHash,
        }),
      );

      // Act
      await service.execute({
        userId: mockUserId,
        currentPassword: mockCurrentPassword,
        newPassword: mockNewPassword,
        requestInfo: mockClientInfo,
        isAdmin: false,
      });

      // Assert
      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith(
        mockUserId,
        expect.any(String),
      );

      // 해시된 비밀번호는 원본과 다르고, bcrypt 형식이어야 함
      const calledPasswordHash = mockUserRepository.updatePassword.mock.calls[0][1];
      expect(calledPasswordHash).not.toBe(mockNewPassword);
      expect(calledPasswordHash).toMatch(/^\$2[aby]\$/); // bcrypt 해시 형식
    });
  });
});

