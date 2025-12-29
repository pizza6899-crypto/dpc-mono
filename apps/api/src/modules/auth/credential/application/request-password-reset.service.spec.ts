// src/modules/auth/credential/application/request-password-reset.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { RequestPasswordResetService } from './request-password-reset.service';
import { USER_REPOSITORY } from 'src/modules/user/ports/out/user.repository.token';
import type { UserRepositoryPort } from 'src/modules/user/ports/out/user.repository.port';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from '../ports/out/password-reset-token.repository.token';
import type { PasswordResetTokenRepositoryPort } from '../ports/out/password-reset-token.repository.port';
import { MailService } from 'src/platform/mail/mail.service';
import { User } from 'src/modules/user/domain';
import { UserStatus, UserRoleType, SocialType } from '@repo/database';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import { PrismaModule } from 'src/platform/prisma/prisma.module';
import { EnvModule } from 'src/platform/env/env.module';

describe('RequestPasswordResetService', () => {
  let module: TestingModule;
  let service: RequestPasswordResetService;
  let mockUserRepository: jest.Mocked<UserRepositoryPort>;
  let mockTokenRepository: jest.Mocked<PasswordResetTokenRepositoryPort>;
  let mockMailService: jest.Mocked<MailService>;

  const mockUserId = BigInt(1);
  const mockEmail = 'user@example.com';

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
    path: '/auth/password/reset-request',
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

  beforeEach(async () => {
    const mockUserRepositoryProvider = {
      provide: USER_REPOSITORY,
      useValue: {
        findByEmail: jest.fn(),
      },
    };

    const mockTokenRepositoryProvider = {
      provide: PASSWORD_RESET_TOKEN_REPOSITORY,
      useValue: {
        create: jest.fn(),
        findByToken: jest.fn(),
        markAsUsed: jest.fn(),
        deleteUnusedByUserId: jest.fn(),
      },
    };

    const mockMailServiceProvider = {
      provide: MailService,
      useValue: {
        sendMail: jest.fn(),
      },
    };

    module = await Test.createTestingModule({
      imports: [PrismaModule, EnvModule], // @Transactional() 데코레이터를 위해 필요
      providers: [
        RequestPasswordResetService,
        mockUserRepositoryProvider,
        mockTokenRepositoryProvider,
        mockMailServiceProvider,
      ],
    })
      .setLogger(new Logger())
      .compile();

    service = module.get<RequestPasswordResetService>(
      RequestPasswordResetService,
    );
    mockUserRepository = module.get(USER_REPOSITORY);
    mockTokenRepository = module.get(PASSWORD_RESET_TOKEN_REPOSITORY);
    mockMailService = module.get(MailService);

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
        passwordHash: '$2a$12$hashedpassword',
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
    };

    it('정상적인 비밀번호 재설정 요청이 성공해야 함', async () => {
      // Arrange
      const mockUser = createMockCredentialUser();
      const mockToken = 'test-token-12345678901234567890123456789012';
      const mockExpiresAt = new Date();
      mockExpiresAt.setHours(mockExpiresAt.getHours() + 1);

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockTokenRepository.deleteUnusedByUserId.mockResolvedValue(undefined);
      mockTokenRepository.create.mockResolvedValue({
        id: 1,
        userId: mockUserId,
        token: mockToken,
        expiresAt: mockExpiresAt,
        usedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockMailService.sendMail.mockResolvedValue(undefined);

      // Act
      await service.execute({
        email: mockEmail,
        requestInfo: mockClientInfo,
      });

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(mockEmail);
      expect(mockTokenRepository.deleteUnusedByUserId).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockTokenRepository.create).toHaveBeenCalledWith({
        userId: mockUserId,
        token: expect.any(String), // nanoid로 생성된 토큰
        expiresAt: expect.any(Date),
      });
      expect(mockMailService.sendMail).toHaveBeenCalledWith({
        to: mockEmail,
        subject: '비밀번호 재설정 요청',
        html: expect.stringContaining('비밀번호 재설정'),
        text: expect.stringContaining('비밀번호 재설정'),
        userId: mockUserId,
        emailType: expect.any(String),
        metadata: expect.objectContaining({
          expiresAt: expect.any(String),
        }),
      });
    });

    it('사용자가 존재하지 않으면 성공 응답을 반환해야 함 (타이밍 공격 방지)', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act
      await service.execute({
        email: mockEmail,
        requestInfo: mockClientInfo,
      });

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(mockEmail);
      expect(mockTokenRepository.deleteUnusedByUserId).not.toHaveBeenCalled();
      expect(mockTokenRepository.create).not.toHaveBeenCalled();
      expect(mockMailService.sendMail).not.toHaveBeenCalled();
    });

    it('소셜 로그인 사용자인 경우 성공 응답을 반환해야 함 (비밀번호 재설정 불가)', async () => {
      // Arrange
      const mockSocialUser = createMockSocialUser();
      mockUserRepository.findByEmail.mockResolvedValue(mockSocialUser);

      // Act
      await service.execute({
        email: mockEmail,
        requestInfo: mockClientInfo,
      });

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(mockEmail);
      expect(mockTokenRepository.deleteUnusedByUserId).not.toHaveBeenCalled();
      expect(mockTokenRepository.create).not.toHaveBeenCalled();
      expect(mockMailService.sendMail).not.toHaveBeenCalled();
    });

    it('이메일 발송 실패 시에도 성공 응답을 반환해야 함 (보안)', async () => {
      // Arrange
      const mockUser = createMockCredentialUser();
      const mockToken = 'test-token-12345678901234567890123456789012';
      const mockExpiresAt = new Date();
      mockExpiresAt.setHours(mockExpiresAt.getHours() + 1);

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockTokenRepository.deleteUnusedByUserId.mockResolvedValue(undefined);
      mockTokenRepository.create.mockResolvedValue({
        id: 1,
        userId: mockUserId,
        token: mockToken,
        expiresAt: mockExpiresAt,
        usedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockMailService.sendMail.mockRejectedValue(
        new Error('SMTP connection failed'),
      );

      // Act
      await service.execute({
        email: mockEmail,
        requestInfo: mockClientInfo,
      });

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(mockEmail);
      expect(mockTokenRepository.deleteUnusedByUserId).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockTokenRepository.create).toHaveBeenCalled();
      expect(mockMailService.sendMail).toHaveBeenCalled();
      // 예외가 전파되지 않아야 함
    });

    it('기존 미사용 토큰을 삭제해야 함', async () => {
      // Arrange
      const mockUser = createMockCredentialUser();
      const mockToken = 'test-token-12345678901234567890123456789012';
      const mockExpiresAt = new Date();
      mockExpiresAt.setHours(mockExpiresAt.getHours() + 1);

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockTokenRepository.deleteUnusedByUserId.mockResolvedValue(undefined);
      mockTokenRepository.create.mockResolvedValue({
        id: 1,
        userId: mockUserId,
        token: mockToken,
        expiresAt: mockExpiresAt,
        usedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockMailService.sendMail.mockResolvedValue(undefined);

      // Act
      await service.execute({
        email: mockEmail,
        requestInfo: mockClientInfo,
      });

      // Assert
      expect(mockTokenRepository.deleteUnusedByUserId).toHaveBeenCalledWith(
        mockUserId,
      );
      // deleteUnusedByUserId가 create보다 먼저 호출되었는지 확인
      const deleteCallOrder = (
        mockTokenRepository.deleteUnusedByUserId as jest.Mock
      ).mock.invocationCallOrder[0];
      const createCallOrder = (
        mockTokenRepository.create as jest.Mock
      ).mock.invocationCallOrder[0];
      expect(deleteCallOrder).toBeLessThan(createCallOrder);
    });

    it('토큰 만료 시간이 1시간 후로 설정되어야 함', async () => {
      // Arrange
      const mockUser = createMockCredentialUser();
      const mockToken = 'test-token-12345678901234567890123456789012';
      const now = new Date();
      const expectedExpiresAt = new Date(now);
      expectedExpiresAt.setHours(expectedExpiresAt.getHours() + 1);

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockTokenRepository.deleteUnusedByUserId.mockResolvedValue(undefined);
      mockTokenRepository.create.mockResolvedValue({
        id: 1,
        userId: mockUserId,
        token: mockToken,
        expiresAt: expectedExpiresAt,
        usedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockMailService.sendMail.mockResolvedValue(undefined);

      // Act
      await service.execute({
        email: mockEmail,
        requestInfo: mockClientInfo,
      });

      // Assert
      expect(mockTokenRepository.create).toHaveBeenCalledWith({
        userId: mockUserId,
        token: expect.any(String),
        expiresAt: expect.any(Date),
      });

      // 만료 시간 검증 (약 1시간 후, 1분 오차 허용)
      const actualExpiresAt = (
        mockTokenRepository.create as jest.Mock
      ).mock.calls[0][0].expiresAt;
      const timeDiff = actualExpiresAt.getTime() - now.getTime();
      const oneHourInMs = 60 * 60 * 1000;
      expect(timeDiff).toBeGreaterThanOrEqual(oneHourInMs - 60000); // 1분 오차 허용
      expect(timeDiff).toBeLessThanOrEqual(oneHourInMs + 60000);
    });

    it('이메일 템플릿에 토큰이 포함되어야 함', async () => {
      // Arrange
      const mockUser = createMockCredentialUser();
      const mockExpiresAt = new Date();
      mockExpiresAt.setHours(mockExpiresAt.getHours() + 1);

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockTokenRepository.deleteUnusedByUserId.mockResolvedValue(undefined);
      // create 호출 시 실제로 생성된 토큰을 저장하기 위한 mock
      let actualToken: string;
      mockTokenRepository.create.mockImplementation(async (params) => {
        actualToken = params.token;
        return {
          id: 1,
          userId: mockUserId,
          token: params.token,
          expiresAt: params.expiresAt,
          usedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });
      mockMailService.sendMail.mockResolvedValue(undefined);

      // Act
      await service.execute({
        email: mockEmail,
        requestInfo: mockClientInfo,
      });

      // Assert
      const sendMailCall = mockMailService.sendMail.mock.calls[0][0];
      expect(sendMailCall.html).toContain(actualToken!);
      expect(sendMailCall.text).toContain(actualToken!);
      expect(sendMailCall.html).toContain('비밀번호 재설정');
      expect(sendMailCall.html).toContain('1시간 동안만 유효');
    });

    it('환경변수 FRONTEND_URL이 설정되어 있으면 해당 URL을 사용해야 함', async () => {
      // Arrange
      const originalEnv = process.env.FRONTEND_URL;
      process.env.FRONTEND_URL = 'https://custom-frontend.com';

      const mockUser = createMockCredentialUser();
      const mockExpiresAt = new Date();
      mockExpiresAt.setHours(mockExpiresAt.getHours() + 1);

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockTokenRepository.deleteUnusedByUserId.mockResolvedValue(undefined);
      mockTokenRepository.create.mockImplementation(async (params) => ({
        id: 1,
        userId: mockUserId,
        token: params.token,
        expiresAt: params.expiresAt,
        usedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      mockMailService.sendMail.mockResolvedValue(undefined);

      // Act
      await service.execute({
        email: mockEmail,
        requestInfo: mockClientInfo,
      });

      // Assert
      const sendMailCall = mockMailService.sendMail.mock.calls[0][0];
      expect(sendMailCall.html).toContain('https://custom-frontend.com');
      expect(sendMailCall.text).toContain('https://custom-frontend.com');

      // Cleanup
      if (originalEnv) {
        process.env.FRONTEND_URL = originalEnv;
      } else {
        delete process.env.FRONTEND_URL;
      }
    });

    it('환경변수 FRONTEND_URL이 없으면 기본값을 사용해야 함', async () => {
      // Arrange
      const originalEnv = process.env.FRONTEND_URL;
      delete process.env.FRONTEND_URL;

      const mockUser = createMockCredentialUser();
      const mockExpiresAt = new Date();
      mockExpiresAt.setHours(mockExpiresAt.getHours() + 1);

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockTokenRepository.deleteUnusedByUserId.mockResolvedValue(undefined);
      mockTokenRepository.create.mockImplementation(async (params) => ({
        id: 1,
        userId: mockUserId,
        token: params.token,
        expiresAt: params.expiresAt,
        usedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      mockMailService.sendMail.mockResolvedValue(undefined);

      // Act
      await service.execute({
        email: mockEmail,
        requestInfo: mockClientInfo,
      });

      // Assert
      const sendMailCall = mockMailService.sendMail.mock.calls[0][0];
      expect(sendMailCall.html).toContain('https://example.com');
      expect(sendMailCall.text).toContain('https://example.com');

      // Cleanup
      if (originalEnv) {
        process.env.FRONTEND_URL = originalEnv;
      }
    });
  });
});

