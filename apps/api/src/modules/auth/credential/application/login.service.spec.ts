// src/modules/auth/credential/application/login.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { LoginService } from './login.service';
import { RecordLoginAttemptService } from './record-login-attempt.service';
import { LoginAttempt, LoginAttemptResult } from '../domain';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { UserRoleType } from '@prisma/client';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import { CreateSessionService } from '../../session/application/create-session.service';

describe('LoginService', () => {
  let module: TestingModule;
  let service: LoginService;
  let mockRecordService: jest.Mocked<RecordLoginAttemptService>;
  let mockCreateSessionService: jest.Mocked<CreateSessionService>;

  const mockUser: AuthenticatedUser = {
    id: BigInt(123),
    uid: 'user-123',
    email: 'test@example.com',
    role: UserRoleType.USER,
  };

  const mockAdminUser: AuthenticatedUser = {
    id: BigInt(456),
    uid: 'admin-123',
    email: 'admin@example.com',
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
    path: '/auth/login',
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

  const mockClientInfoWithNulls: RequestClientInfo = {
    ...mockClientInfo,
    ip: undefined as any,
    userAgent: undefined as any,
    fingerprint: undefined as any,
    isMobile: undefined as any,
  };

  beforeEach(async () => {
    const mockRecordServiceProvider = {
      provide: RecordLoginAttemptService,
      useValue: {
        execute: jest.fn(),
      },
    };

    const mockCreateSessionServiceProvider = {
      provide: CreateSessionService,
      useValue: {
        execute: jest.fn().mockResolvedValue(undefined),
      },
    };

    module = await Test.createTestingModule({
      imports: [PrismaModule, EnvModule], // @Transactional() 데코레이터를 위해 필요
      providers: [
        LoginService,
        mockRecordServiceProvider,
        mockCreateSessionServiceProvider,
      ],
    })
      .setLogger(new Logger())
      .compile();

    service = module.get<LoginService>(LoginService);
    mockRecordService = module.get(RecordLoginAttemptService);
    mockCreateSessionService = module.get(CreateSessionService);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('execute', () => {
    it('사용자 로그인 시 로그인 시도 기록과 액티비티 로그를 모두 기록해야 함', async () => {
      // Arrange
      const mockLoginAttempt = LoginAttempt.createSuccess({
        uid: 'uid-123',
        userId: mockUser.id,
        ipAddress: mockClientInfo.ip,
        userAgent: mockClientInfo.userAgent,
        deviceFingerprint: mockClientInfo.fingerprint,
        isMobile: mockClientInfo.isMobile,
        email: mockUser.email,
        isAdmin: false,
      });

      mockRecordService.execute.mockResolvedValue(mockLoginAttempt);

      // Act
      await service.execute({
        user: mockUser,
        clientInfo: mockClientInfo,
        sessionId: 'session-123',
        isAdmin: false,
      });

      // Assert
      expect(mockRecordService.execute).toHaveBeenCalledTimes(1);
      expect(mockRecordService.execute).toHaveBeenCalledWith({
        userId: mockUser.id,
        result: LoginAttemptResult.SUCCESS,
        ipAddress: mockClientInfo.ip,
        userAgent: mockClientInfo.userAgent,
        deviceFingerprint: mockClientInfo.fingerprint,
        isMobile: mockClientInfo.isMobile,
        email: mockUser.email,
        isAdmin: false,
      });

    });

    it('관리자 로그인 시 isAdmin=true로 기록하고 ADMIN_LOGIN 액티비티 타입을 사용해야 함', async () => {
      // Arrange
      const mockLoginAttempt = LoginAttempt.createSuccess({
        uid: 'uid-123',
        userId: mockAdminUser.id,
        ipAddress: mockClientInfo.ip,
        userAgent: mockClientInfo.userAgent,
        deviceFingerprint: mockClientInfo.fingerprint,
        isMobile: mockClientInfo.isMobile,
        email: mockAdminUser.email,
        isAdmin: true,
      });

      mockRecordService.execute.mockResolvedValue(mockLoginAttempt);

      // Act
      await service.execute({
        user: mockAdminUser,
        clientInfo: mockClientInfo,
        sessionId: 'session-123',
        isAdmin: true,
      });

      // Assert
      expect(mockRecordService.execute).toHaveBeenCalledWith({
        userId: mockAdminUser.id,
        result: LoginAttemptResult.SUCCESS,
        ipAddress: mockClientInfo.ip,
        userAgent: mockClientInfo.userAgent,
        deviceFingerprint: mockClientInfo.fingerprint,
        isMobile: mockClientInfo.isMobile,
        email: mockAdminUser.email,
        isAdmin: true,
      });

    });

    it('clientInfo 필드가 null이면 null로 변환하여 전달해야 함', async () => {
      // Arrange
      const mockLoginAttempt = LoginAttempt.createSuccess({
        uid: 'uid-123',
        userId: mockUser.id,
        ipAddress: null,
        userAgent: null,
        deviceFingerprint: null,
        isMobile: null,
        email: mockUser.email,
        isAdmin: false,
      });

      mockRecordService.execute.mockResolvedValue(mockLoginAttempt);

      // Act
      await service.execute({
        user: mockUser,
        clientInfo: mockClientInfoWithNulls,
        sessionId: 'session-123',
        isAdmin: false,
      });

      // Assert
      expect(mockRecordService.execute).toHaveBeenCalledWith({
        userId: mockUser.id,
        result: LoginAttemptResult.SUCCESS,
        ipAddress: null,
        userAgent: null,
        deviceFingerprint: null,
        isMobile: null,
        email: mockUser.email,
        isAdmin: false,
      });
    });

    it('isAdmin이 명시되지 않으면 기본값 false를 사용해야 함', async () => {
      // Arrange
      const mockLoginAttempt = LoginAttempt.createSuccess({
        uid: 'uid-123',
        userId: mockUser.id,
        ipAddress: mockClientInfo.ip,
        userAgent: mockClientInfo.userAgent,
        deviceFingerprint: mockClientInfo.fingerprint,
        isMobile: mockClientInfo.isMobile,
        email: mockUser.email,
        isAdmin: false,
      });

      mockRecordService.execute.mockResolvedValue(mockLoginAttempt);

      // Act
      await service.execute({
        user: mockUser,
        clientInfo: mockClientInfo,
        sessionId: 'session-123',
        // isAdmin 생략
      });

      // Assert
      expect(mockRecordService.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          isAdmin: false,
        }),
      );
    });

    it('recordService.execute가 실패하면 예외를 전파해야 함', async () => {
      // Arrange
      const error = new Error('Database error');
      mockRecordService.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        service.execute({
          user: mockUser,
          clientInfo: mockClientInfo,
          sessionId: 'session-123',
          isAdmin: false,
        }),
      ).rejects.toThrow('Database error');

      expect(mockRecordService.execute).toHaveBeenCalledTimes(1);
    });


    it('모바일 기기에서 로그인 시 isMobile=true로 기록해야 함', async () => {
      // Arrange
      const mobileClientInfo: RequestClientInfo = {
        ...mockClientInfo,
        isMobile: true,
      };

      const mockLoginAttempt = LoginAttempt.createSuccess({
        uid: 'uid-123',
        userId: mockUser.id,
        ipAddress: mobileClientInfo.ip,
        userAgent: mobileClientInfo.userAgent,
        deviceFingerprint: mobileClientInfo.fingerprint,
        isMobile: true,
        email: mockUser.email,
        isAdmin: false,
      });

      mockRecordService.execute.mockResolvedValue(mockLoginAttempt);

      // Act
      await service.execute({
        user: mockUser,
        clientInfo: mobileClientInfo,
        sessionId: 'session-123',
        isAdmin: false,
      });

      // Assert
      expect(mockRecordService.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          isMobile: true,
        }),
      );
    });
  });
});
