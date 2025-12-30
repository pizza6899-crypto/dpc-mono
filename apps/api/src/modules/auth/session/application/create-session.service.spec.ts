// src/modules/auth/session/application/create-session.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { CreateSessionService, type CreateSessionParams } from './create-session.service';
import {
  USER_SESSION_REPOSITORY,
  type UserSessionRepositoryPort,
} from '../ports/out';
import { SessionPolicy } from '../domain/policy';
import { SessionTrackerService } from '../infrastructure/session-tracker.service';
import {
  UserSession,
  SessionType,
  SessionStatus,
  DeviceInfo,
} from '../domain';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';

describe('CreateSessionService', () => {
  let service: CreateSessionService;
  let repository: jest.Mocked<UserSessionRepositoryPort>;
  let policy: jest.Mocked<SessionPolicy>;
  let sessionTracker: jest.Mocked<SessionTrackerService>;
  let module: TestingModule;

  const mockUserId = BigInt(123);
  const mockSessionId = 'session-123';
  const mockUid = 'uid-123';
  const mockExpiresAt = new Date(Date.now() + 3600000); // 1시간 후

  const mockDeviceInfo: DeviceInfo = DeviceInfo.create({
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    deviceFingerprint: 'fingerprint-123',
    isMobile: false,
    deviceName: 'Chrome on Windows',
    os: 'Windows 11',
    browser: 'Chrome 120',
  });

  const mockMobileDeviceInfo: DeviceInfo = DeviceInfo.create({
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    deviceFingerprint: 'fingerprint-456',
    isMobile: true,
    deviceName: 'iPhone 14 Pro',
    os: 'iOS 17.0',
    browser: 'Safari 17',
  });

  beforeEach(async () => {
    const mockRepository: jest.Mocked<UserSessionRepositoryPort> = {
      findActiveByUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findBySessionId: jest.fn(),
      findByUserId: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      findExpiredSessions: jest.fn(),
      deleteExpiredSessions: jest.fn(),
    };

    const mockPolicy: jest.Mocked<SessionPolicy> = {
      getSessionsToRevokeForNewLogin: jest.fn(),
      isMultipleLoginAllowed: jest.fn(),
      getMaxConcurrentSessions: jest.fn(),
      canCreateNewSession: jest.fn(),
      getMaxSessionsByDeviceType: jest.fn(),
    } as any;

    const mockSessionTracker: jest.Mocked<SessionTrackerService> = {
      terminateSession: jest.fn(),
      setWebSocketServer: jest.fn(),
    } as any;

    module = await Test.createTestingModule({
      imports: [PrismaModule, EnvModule], // @Transactional() 데코레이터를 위해 필요
      providers: [
        CreateSessionService,
        {
          provide: USER_SESSION_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: SessionPolicy,
          useValue: mockPolicy,
        },
        {
          provide: SessionTrackerService,
          useValue: mockSessionTracker,
        },
      ],
    })
      .setLogger(new Logger())
      .compile();

    service = module.get<CreateSessionService>(CreateSessionService);
    repository = module.get(USER_SESSION_REPOSITORY);
    policy = module.get(SessionPolicy);
    sessionTracker = module.get(SessionTrackerService);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('execute', () => {
    it('기존 활성 세션이 없을 때 새 세션을 생성해야 함', async () => {
      // Arrange
      const params: CreateSessionParams = {
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      };

      repository.findActiveByUserId.mockResolvedValue([]);
      policy.getSessionsToRevokeForNewLogin.mockReturnValue([]);

      const mockSavedSession = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      repository.create.mockResolvedValue(mockSavedSession);

      // Act
      const result = await service.execute(params);

      // Assert
      expect(repository.findActiveByUserId).toHaveBeenCalledWith(mockUserId);
      expect(policy.getSessionsToRevokeForNewLogin).toHaveBeenCalledWith(
        [],
        false,
      );
      expect(repository.update).not.toHaveBeenCalled();
      expect(sessionTracker.terminateSession).not.toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSavedSession);
    });

    it('기존 활성 세션이 있을 때 정책에 따라 종료 후 새 세션을 생성해야 함', async () => {
      // Arrange
      const params: CreateSessionParams = {
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      };

      const existingSession = UserSession.create({
        uid: 'existing-uid',
        userId: mockUserId,
        sessionId: 'existing-session-id',
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: new Date(Date.now() + 7200000),
      });

      repository.findActiveByUserId.mockResolvedValue([existingSession]);
      policy.getSessionsToRevokeForNewLogin.mockReturnValue([existingSession]);

      const revokedSession = existingSession.revoke(null);
      repository.update.mockResolvedValue(revokedSession);
      sessionTracker.terminateSession.mockResolvedValue(undefined);

      const mockSavedSession = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      repository.create.mockResolvedValue(mockSavedSession);

      // Act
      const result = await service.execute(params);

      // Assert
      expect(repository.findActiveByUserId).toHaveBeenCalledWith(mockUserId);
      expect(policy.getSessionsToRevokeForNewLogin).toHaveBeenCalledWith(
        [existingSession],
        false,
      );
      // 타임스탬프는 매번 달라지므로 제외하고 비교
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: existingSession.uid,
          userId: mockUserId,
          sessionId: existingSession.sessionId,
          type: SessionType.HTTP,
          status: SessionStatus.REVOKED,
          revokedBy: null,
        }),
      );
      expect(sessionTracker.terminateSession).toHaveBeenCalledWith(
        existingSession.sessionId,
        existingSession.type,
        existingSession.isAdmin,
      );
      expect(repository.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSavedSession);
    });

    it('여러 기존 세션이 있을 때 정책에 따라 일부만 종료해야 함', async () => {
      // Arrange
      const params: CreateSessionParams = {
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      };

      const existingSession1 = UserSession.create({
        uid: 'existing-uid-1',
        userId: mockUserId,
        sessionId: 'existing-session-id-1',
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: new Date(Date.now() + 7200000),
      });

      const existingSession2 = UserSession.create({
        uid: 'existing-uid-2',
        userId: mockUserId,
        sessionId: 'existing-session-id-2',
        type: SessionType.WEBSOCKET,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: new Date(Date.now() + 7200000),
      });

      repository.findActiveByUserId.mockResolvedValue([
        existingSession1,
        existingSession2,
      ]);
      // 정책에 따라 첫 번째 세션만 종료
      policy.getSessionsToRevokeForNewLogin.mockReturnValue([
        existingSession1,
      ]);

      const revokedSession1 = existingSession1.revoke(null);
      repository.update.mockResolvedValue(revokedSession1);
      sessionTracker.terminateSession.mockResolvedValue(undefined);

      const mockSavedSession = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      repository.create.mockResolvedValue(mockSavedSession);

      // Act
      const result = await service.execute(params);

      // Assert
      expect(repository.update).toHaveBeenCalledTimes(1);
      expect(sessionTracker.terminateSession).toHaveBeenCalledTimes(1);
      expect(sessionTracker.terminateSession).toHaveBeenCalledWith(
        existingSession1.sessionId,
        existingSession1.type,
        existingSession1.isAdmin,
      );
      expect(repository.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSavedSession);
    });

    it('isAdmin이 명시되지 않으면 기본값 false를 사용해야 함', async () => {
      // Arrange
      const params: CreateSessionParams = {
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        // isAdmin 생략
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      };

      repository.findActiveByUserId.mockResolvedValue([]);
      policy.getSessionsToRevokeForNewLogin.mockReturnValue([]);

      const mockSavedSession = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        isAdmin: false, // 기본값
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      repository.create.mockResolvedValue(mockSavedSession);

      // Act
      const result = await service.execute(params);

      // Assert
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isAdmin: false,
        }),
      );
      expect(result.isAdmin).toBe(false);
    });

    it('isAdmin이 true일 때 관리자 세션을 생성해야 함', async () => {
      // Arrange
      const params: CreateSessionParams = {
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        isAdmin: true,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      };

      repository.findActiveByUserId.mockResolvedValue([]);
      policy.getSessionsToRevokeForNewLogin.mockReturnValue([]);

      const mockSavedSession = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        isAdmin: true,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      repository.create.mockResolvedValue(mockSavedSession);

      // Act
      const result = await service.execute(params);

      // Assert
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isAdmin: true,
        }),
      );
      expect(result.isAdmin).toBe(true);
    });

    it('metadata가 있을 때 세션에 포함해야 함', async () => {
      // Arrange
      const metadata = { customField: 'customValue', version: 1 };
      const params: CreateSessionParams = {
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
        metadata,
      };

      repository.findActiveByUserId.mockResolvedValue([]);
      policy.getSessionsToRevokeForNewLogin.mockReturnValue([]);

      const mockSavedSession = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
        metadata,
      });

      repository.create.mockResolvedValue(mockSavedSession);

      // Act
      const result = await service.execute(params);

      // Assert
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata,
        }),
      );
      expect(result.metadata).toEqual(metadata);
    });

    it('metadata가 없을 때 빈 객체를 사용해야 함', async () => {
      // Arrange
      const params: CreateSessionParams = {
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
        // metadata 생략
      };

      repository.findActiveByUserId.mockResolvedValue([]);
      policy.getSessionsToRevokeForNewLogin.mockReturnValue([]);

      const mockSavedSession = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      repository.create.mockResolvedValue(mockSavedSession);

      // Act
      const result = await service.execute(params);

      // Assert
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {},
        }),
      );
      expect(result.metadata).toEqual({});
    });

    it('모바일 디바이스 정보를 정책에 전달해야 함', async () => {
      // Arrange
      const params: CreateSessionParams = {
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockMobileDeviceInfo,
        expiresAt: mockExpiresAt,
      };

      repository.findActiveByUserId.mockResolvedValue([]);
      policy.getSessionsToRevokeForNewLogin.mockReturnValue([]);

      const mockSavedSession = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockMobileDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      repository.create.mockResolvedValue(mockSavedSession);

      // Act
      await service.execute(params);

      // Assert
      expect(policy.getSessionsToRevokeForNewLogin).toHaveBeenCalledWith(
        [],
        true, // isMobile이 true
      );
    });

    it('deviceInfo.isMobile이 null일 때 false로 처리해야 함', async () => {
      // Arrange
      const deviceInfoWithNull = DeviceInfo.create({
        ipAddress: '192.168.1.1',
        isMobile: null,
      });

      const params: CreateSessionParams = {
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: deviceInfoWithNull,
        expiresAt: mockExpiresAt,
      };

      repository.findActiveByUserId.mockResolvedValue([]);
      policy.getSessionsToRevokeForNewLogin.mockReturnValue([]);

      const mockSavedSession = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: deviceInfoWithNull,
        expiresAt: mockExpiresAt,
      });

      repository.create.mockResolvedValue(mockSavedSession);

      // Act
      await service.execute(params);

      // Assert
      expect(policy.getSessionsToRevokeForNewLogin).toHaveBeenCalledWith(
        [],
        false, // null이면 false로 처리
      );
    });

    it('WebSocket 세션 타입도 정상적으로 생성해야 함', async () => {
      // Arrange
      const params: CreateSessionParams = {
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.WEBSOCKET,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      };

      repository.findActiveByUserId.mockResolvedValue([]);
      policy.getSessionsToRevokeForNewLogin.mockReturnValue([]);

      const mockSavedSession = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.WEBSOCKET,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      repository.create.mockResolvedValue(mockSavedSession);

      // Act
      const result = await service.execute(params);

      // Assert
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: SessionType.WEBSOCKET,
        }),
      );
      expect(result.type).toBe(SessionType.WEBSOCKET);
    });

    it('기존 세션 종료 시 revokedBy가 null로 설정되어야 함', async () => {
      // Arrange
      const params: CreateSessionParams = {
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      };

      const existingSession = UserSession.create({
        uid: 'existing-uid',
        userId: mockUserId,
        sessionId: 'existing-session-id',
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: new Date(Date.now() + 7200000),
      });

      repository.findActiveByUserId.mockResolvedValue([existingSession]);
      policy.getSessionsToRevokeForNewLogin.mockReturnValue([existingSession]);

      const revokedSession = existingSession.revoke(null);
      repository.update.mockResolvedValue(revokedSession);
      sessionTracker.terminateSession.mockResolvedValue(undefined);

      const mockSavedSession = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      repository.create.mockResolvedValue(mockSavedSession);

      // Act
      await service.execute(params);

      // Assert
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          revokedBy: null,
          status: SessionStatus.REVOKED,
        }),
      );
    });

    it('여러 기존 세션을 종료할 때 모든 세션에 대해 terminateSession을 호출해야 함', async () => {
      // Arrange
      const params: CreateSessionParams = {
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      };

      const existingSession1 = UserSession.create({
        uid: 'existing-uid-1',
        userId: mockUserId,
        sessionId: 'existing-session-id-1',
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: new Date(Date.now() + 7200000),
      });

      const existingSession2 = UserSession.create({
        uid: 'existing-uid-2',
        userId: mockUserId,
        sessionId: 'existing-session-id-2',
        type: SessionType.WEBSOCKET,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: new Date(Date.now() + 7200000),
      });

      repository.findActiveByUserId.mockResolvedValue([
        existingSession1,
        existingSession2,
      ]);
      policy.getSessionsToRevokeForNewLogin.mockReturnValue([
        existingSession1,
        existingSession2,
      ]);

      const revokedSession1 = existingSession1.revoke(null);
      const revokedSession2 = existingSession2.revoke(null);
      repository.update
        .mockResolvedValueOnce(revokedSession1)
        .mockResolvedValueOnce(revokedSession2);
      sessionTracker.terminateSession.mockResolvedValue(undefined);

      const mockSavedSession = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      repository.create.mockResolvedValue(mockSavedSession);

      // Act
      await service.execute(params);

      // Assert
      expect(repository.update).toHaveBeenCalledTimes(2);
      expect(sessionTracker.terminateSession).toHaveBeenCalledTimes(2);
      expect(sessionTracker.terminateSession).toHaveBeenNthCalledWith(
        1,
        existingSession1.sessionId,
        existingSession1.type,
        existingSession1.isAdmin,
      );
      expect(sessionTracker.terminateSession).toHaveBeenNthCalledWith(
        2,
        existingSession2.sessionId,
        existingSession2.type,
        existingSession2.isAdmin,
      );
    });
  });
});

