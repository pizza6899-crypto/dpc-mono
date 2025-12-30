// src/modules/auth/credential/application/reset-user-password-admin.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Logger, HttpStatus } from '@nestjs/common';
import { ResetUserPasswordAdminService } from './reset-user-password-admin.service';
import { USER_REPOSITORY } from 'src/modules/user/ports/out/user.repository.token';
import type { UserRepositoryPort } from 'src/modules/user/ports/out/user.repository.port';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import { User } from 'src/modules/user/domain';
import { UserStatus, UserRoleType, SocialType } from '@repo/database';
import { hashPassword } from 'src/utils/password.util';
import { ApiException } from 'src/common/http/exception/api.exception';
import { MessageCode } from 'src/common/http/types';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';

describe('ResetUserPasswordAdminService', () => {
  let module: TestingModule;
  let service: ResetUserPasswordAdminService;
  let mockUserRepository: jest.Mocked<UserRepositoryPort>;
  let mockDispatchLogService: jest.Mocked<DispatchLogService>;

  const mockTargetUserId = BigInt(1);
  const mockAdminUserId = BigInt(2);
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
    method: 'PATCH',
    path: '/admin/auth/users/1/password',
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

    const mockDispatchLogServiceProvider = {
      provide: DispatchLogService,
      useValue: {
        dispatch: jest.fn().mockResolvedValue(undefined),
      },
    };

    module = await Test.createTestingModule({
      imports: [PrismaModule, EnvModule], // @Transactional() 데코레이터를 위해 필요
      providers: [
        ResetUserPasswordAdminService,
        mockUserRepositoryProvider,
        mockDispatchLogServiceProvider,
      ],
    })
      .setLogger(new Logger())
      .compile();

    service = module.get<ResetUserPasswordAdminService>(
      ResetUserPasswordAdminService,
    );
    mockUserRepository = module.get(USER_REPOSITORY);
    mockDispatchLogService = module.get(DispatchLogService);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('execute', () => {
    const createMockCredentialUser = () => {
      return User.fromPersistence({
        id: mockTargetUserId,
        uid: 'uid-123',
        email: 'target@example.com',
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
        id: mockTargetUserId,
        uid: 'uid-123',
        email: 'target@example.com',
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

    it('정상적인 비밀번호 초기화가 성공해야 함 (비밀번호 제공)', async () => {
      // Arrange
      const mockUser = createMockCredentialUser();
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.updatePassword.mockResolvedValue(
        User.fromPersistence({
          ...mockUser.toPersistence(),
          passwordHash: mockNewPasswordHash,
        }),
      );
      mockDispatchLogService.dispatch.mockResolvedValue(undefined);

      // Act
      const result = await service.execute({
        targetUserId: mockTargetUserId,
        adminUserId: mockAdminUserId,
        newPassword: mockNewPassword,
        requestInfo: mockClientInfo,
      });

      // Assert
      expect(result.newPassword).toBe(mockNewPassword);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(
        mockTargetUserId,
      );
      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith(
        mockTargetUserId,
        expect.any(String), // 해시된 비밀번호
      );
      expect(mockDispatchLogService.dispatch).toHaveBeenCalledWith(
        {
          type: LogType.AUTH,
          data: {
            userId: mockAdminUserId.toString(),
            action: 'ADMIN_PASSWORD_RESET',
            status: 'SUCCESS',
            ip: mockClientInfo.ip,
            userAgent: mockClientInfo.userAgent,
            metadata: {
              targetUserId: mockTargetUserId.toString(),
              targetUserEmail: mockUser.email,
              isAutoGenerated: false,
            },
          },
        },
        mockClientInfo,
      );
    });

    it('정상적인 비밀번호 초기화가 성공해야 함 (비밀번호 자동 생성)', async () => {
      // Arrange
      const mockUser = createMockCredentialUser();
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.updatePassword.mockResolvedValue(
        User.fromPersistence({
          ...mockUser.toPersistence(),
          passwordHash: mockNewPasswordHash,
        }),
      );
      mockDispatchLogService.dispatch.mockResolvedValue(undefined);

      // Act
      const result = await service.execute({
        targetUserId: mockTargetUserId,
        adminUserId: mockAdminUserId,
        requestInfo: mockClientInfo,
      });

      // Assert
      expect(result.newPassword).toBeDefined();
      expect(result.newPassword.length).toBe(10);
      // 대문자, 소문자, 숫자 포함 확인
      expect(result.newPassword).toMatch(/[A-Z]/);
      expect(result.newPassword).toMatch(/[a-z]/);
      expect(result.newPassword).toMatch(/[0-9]/);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(
        mockTargetUserId,
      );
      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith(
        mockTargetUserId,
        expect.any(String), // 해시된 비밀번호
      );
      expect(mockDispatchLogService.dispatch).toHaveBeenCalledWith(
        {
          type: LogType.AUTH,
          data: {
            userId: mockAdminUserId.toString(),
            action: 'ADMIN_PASSWORD_RESET',
            status: 'SUCCESS',
            ip: mockClientInfo.ip,
            userAgent: mockClientInfo.userAgent,
            metadata: {
              targetUserId: mockTargetUserId.toString(),
              targetUserEmail: mockUser.email,
              isAutoGenerated: true,
            },
          },
        },
        mockClientInfo,
      );
    });

    it('사용자가 존재하지 않으면 USER_NOT_FOUND 예외를 발생시켜야 함', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.execute({
          targetUserId: mockTargetUserId,
          adminUserId: mockAdminUserId,
          newPassword: mockNewPassword,
          requestInfo: mockClientInfo,
        }),
      ).rejects.toThrow(ApiException);

      // 에러 상세 검증
      try {
        await service.execute({
          targetUserId: mockTargetUserId,
          adminUserId: mockAdminUserId,
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

      expect(mockUserRepository.findById).toHaveBeenCalledWith(
        mockTargetUserId,
      );
      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
    });

    it('소셜 로그인 사용자면 AUTH_INVALID_CREDENTIALS 예외를 발생시켜야 함', async () => {
      // Arrange
      const mockSocialUser = createMockSocialUser();
      mockUserRepository.findById.mockResolvedValue(mockSocialUser);

      // Act & Assert
      await expect(
        service.execute({
          targetUserId: mockTargetUserId,
          adminUserId: mockAdminUserId,
          newPassword: mockNewPassword,
          requestInfo: mockClientInfo,
        }),
      ).rejects.toThrow(ApiException);

      // 에러 상세 검증
      try {
        await service.execute({
          targetUserId: mockTargetUserId,
          adminUserId: mockAdminUserId,
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

      expect(mockUserRepository.findById).toHaveBeenCalledWith(
        mockTargetUserId,
      );
      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
    });

    it('비밀번호가 해싱되어 저장되어야 함', async () => {
      // Arrange
      const mockUser = createMockCredentialUser();
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.updatePassword.mockResolvedValue(
        User.fromPersistence({
          ...mockUser.toPersistence(),
          passwordHash: mockNewPasswordHash,
        }),
      );
      mockDispatchLogService.dispatch.mockResolvedValue(undefined);

      // Act
      await service.execute({
        targetUserId: mockTargetUserId,
        adminUserId: mockAdminUserId,
        newPassword: mockNewPassword,
        requestInfo: mockClientInfo,
      });

      // Assert
      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith(
        mockTargetUserId,
        expect.any(String),
      );

      // 해시된 비밀번호가 원본과 다르고, bcrypt 형식인지 확인
      const actualHash = (
        mockUserRepository.updatePassword as jest.Mock
      ).mock.calls[0][1];
      expect(actualHash).not.toBe(mockNewPassword);
      expect(actualHash).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt 해시 형식
    });

    it(
      '자동 생성된 비밀번호가 올바른 형식이어야 함',
      async () => {
        // Arrange
        const mockUser = createMockCredentialUser();
        mockUserRepository.findById.mockResolvedValue(mockUser);
        // 매번 다른 해시를 반환하도록 설정 (실제로는 매번 다른 비밀번호가 생성되므로)
        mockUserRepository.updatePassword.mockImplementation(async (userId, hash) => {
          return User.fromPersistence({
            ...mockUser.toPersistence(),
            passwordHash: hash, // 실제 생성된 해시 사용
          });
        });
        mockDispatchLogService.dispatch.mockResolvedValue(undefined);

        // Act - 여러 번 실행하여 다양한 비밀번호 생성 확인
        const passwords: string[] = [];
        for (let i = 0; i < 10; i++) {
          const result = await service.execute({
            targetUserId: mockTargetUserId,
            adminUserId: mockAdminUserId,
            requestInfo: mockClientInfo,
          });
          passwords.push(result.newPassword);
        }

      // Assert - 각 비밀번호의 형식 검증
      passwords.forEach((password, index) => {
        expect(password.length).toBe(10);
        expect(password).toMatch(/[A-Z]/); // 대문자 포함
        expect(password).toMatch(/[a-z]/); // 소문자 포함
        expect(password).toMatch(/[0-9]/); // 숫자 포함
        expect(password).toMatch(/^[A-Za-z0-9]+$/); // 알파벳과 숫자만 포함
      });

      // 랜덤성 검증 - 모든 비밀번호가 서로 다른지 확인
      const uniquePasswords = new Set(passwords);
      // 10개 중 최소 9개 이상이 서로 달라야 함 (90% 이상의 고유성 보장)
      // 통계적으로 거의 모든 경우에 10개가 모두 달라야 하므로 9개 이상으로 설정
      expect(uniquePasswords.size).toBeGreaterThanOrEqual(9);
      
      // 추가 검증: 비밀번호 배열의 길이 확인
      expect(passwords.length).toBe(10);
      },
      10000, // 타임아웃 10초 (10번 반복 실행으로 인한 지연 고려)
    );

    it('Audit Log가 올바른 정보로 기록되어야 함 (비밀번호 제공)', async () => {
      // Arrange
      const mockUser = createMockCredentialUser();
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.updatePassword.mockResolvedValue(
        User.fromPersistence({
          ...mockUser.toPersistence(),
          passwordHash: mockNewPasswordHash,
        }),
      );
      mockDispatchLogService.dispatch.mockResolvedValue(undefined);

      // Act
      await service.execute({
        targetUserId: mockTargetUserId,
        adminUserId: mockAdminUserId,
        newPassword: mockNewPassword,
        requestInfo: mockClientInfo,
      });

      // Assert
      expect(mockDispatchLogService.dispatch).toHaveBeenCalledWith(
        {
          type: LogType.AUTH,
          data: {
            userId: mockAdminUserId.toString(),
            action: 'ADMIN_PASSWORD_RESET',
            status: 'SUCCESS',
            ip: mockClientInfo.ip,
            userAgent: mockClientInfo.userAgent,
            metadata: {
              targetUserId: mockTargetUserId.toString(),
              targetUserEmail: mockUser.email,
              isAutoGenerated: false,
            },
          },
        },
        mockClientInfo,
      );
    });

    it('Audit Log가 올바른 정보로 기록되어야 함 (비밀번호 자동 생성)', async () => {
      // Arrange
      const mockUser = createMockCredentialUser();
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.updatePassword.mockResolvedValue(
        User.fromPersistence({
          ...mockUser.toPersistence(),
          passwordHash: mockNewPasswordHash,
        }),
      );
      mockDispatchLogService.dispatch.mockResolvedValue(undefined);

      // Act
      await service.execute({
        targetUserId: mockTargetUserId,
        adminUserId: mockAdminUserId,
        requestInfo: mockClientInfo,
      });

      // Assert
      expect(mockDispatchLogService.dispatch).toHaveBeenCalledWith(
        {
          type: LogType.AUTH,
          data: {
            userId: mockAdminUserId.toString(),
            action: 'ADMIN_PASSWORD_RESET',
            status: 'SUCCESS',
            ip: mockClientInfo.ip,
            userAgent: mockClientInfo.userAgent,
            metadata: {
              targetUserId: mockTargetUserId.toString(),
              targetUserEmail: mockUser.email,
              isAutoGenerated: true,
            },
          },
        },
        mockClientInfo,
      );
    });

    it('Audit Log 실패 시에도 비밀번호 초기화는 성공해야 함', async () => {
      // Arrange
      const mockUser = createMockCredentialUser();
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.updatePassword.mockResolvedValue(
        User.fromPersistence({
          ...mockUser.toPersistence(),
          passwordHash: mockNewPasswordHash,
        }),
      );
      mockDispatchLogService.dispatch.mockRejectedValue(
        new Error('Audit log failed'),
      );

      // Act
      const result = await service.execute({
        targetUserId: mockTargetUserId,
        adminUserId: mockAdminUserId,
        newPassword: mockNewPassword,
        requestInfo: mockClientInfo,
      });

      // Assert
      // 예외가 전파되지 않아야 함
      expect(result.newPassword).toBe(mockNewPassword);
      expect(mockUserRepository.updatePassword).toHaveBeenCalled();
      expect(mockDispatchLogService.dispatch).toHaveBeenCalled();
    });

    it('모든 단계가 올바른 순서로 실행되어야 함', async () => {
      // Arrange
      const mockUser = createMockCredentialUser();
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.updatePassword.mockResolvedValue(
        User.fromPersistence({
          ...mockUser.toPersistence(),
          passwordHash: mockNewPasswordHash,
        }),
      );
      mockDispatchLogService.dispatch.mockResolvedValue(undefined);

      // Act
      await service.execute({
        targetUserId: mockTargetUserId,
        adminUserId: mockAdminUserId,
        newPassword: mockNewPassword,
        requestInfo: mockClientInfo,
      });

      // Assert - 호출 순서 확인
      const findByIdOrder = (
        mockUserRepository.findById as jest.Mock
      ).mock.invocationCallOrder[0];
      const updatePasswordOrder = (
        mockUserRepository.updatePassword as jest.Mock
      ).mock.invocationCallOrder[0];
      const dispatchOrder = (
        mockDispatchLogService.dispatch as jest.Mock
      ).mock.invocationCallOrder[0];

      expect(findByIdOrder).toBeLessThan(updatePasswordOrder);
      expect(updatePasswordOrder).toBeLessThan(dispatchOrder);
    });
  });
});

