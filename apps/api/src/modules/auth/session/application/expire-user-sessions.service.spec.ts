// src/modules/auth/session/application/expire-user-sessions.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import {
  ExpireUserSessionsService,
  type ExpireUserSessionsParams,
} from './expire-user-sessions.service';
import {
  USER_SESSION_REPOSITORY,
  type UserSessionRepositoryPort,
} from '../ports/out';
import { SessionTrackerService } from '../infrastructure/session-tracker.service';
import {
  UserSession,
  SessionType,
  SessionStatus,
  DeviceInfo,
} from '../domain';
import { PrismaModule } from 'src/platform/prisma/prisma.module';
import { EnvModule } from 'src/platform/env/env.module';

describe('ExpireUserSessionsService', () => {
  let service: ExpireUserSessionsService;
  let repository: jest.Mocked<UserSessionRepositoryPort>;
  let sessionTracker: jest.Mocked<SessionTrackerService>;
  let module: TestingModule;

  const mockUserId = BigInt(123);
  const mockRevokedBy = BigInt(456); // 관리자 ID
  const mockSessionId1 = 'session-123';
  const mockSessionId2 = 'session-456';
  const mockUid1 = 'uid-123';
  const mockUid2 = 'uid-456';
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

    const mockSessionTracker: jest.Mocked<SessionTrackerService> = {
      terminateSession: jest.fn(),
      setWebSocketServer: jest.fn(),
    } as any;

    module = await Test.createTestingModule({
      imports: [PrismaModule, EnvModule], // @Transactional() 데코레이터를 위해 필요
      providers: [
        ExpireUserSessionsService,
        {
          provide: USER_SESSION_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: SessionTrackerService,
          useValue: mockSessionTracker,
        },
      ],
    })
      .setLogger(new Logger())
      .compile();

    service = module.get<ExpireUserSessionsService>(ExpireUserSessionsService);
    repository = module.get(USER_SESSION_REPOSITORY);
    sessionTracker = module.get(SessionTrackerService);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('execute', () => {
    it('활성 세션이 있을 때 모든 세션을 종료해야 함', async () => {
      // Arrange
      const params: ExpireUserSessionsParams = {
        userId: mockUserId,
        revokedBy: mockRevokedBy,
      };

      const activeSession1 = UserSession.create({
        uid: mockUid1,
        userId: mockUserId,
        sessionId: mockSessionId1,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      const activeSession2 = UserSession.create({
        uid: mockUid2,
        userId: mockUserId,
        sessionId: mockSessionId2,
        type: SessionType.WEBSOCKET,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      repository.findActiveByUserId.mockResolvedValue([
        activeSession1,
        activeSession2,
      ]);

      const revokedSession1 = activeSession1.revoke(mockRevokedBy);
      const revokedSession2 = activeSession2.revoke(mockRevokedBy);

      repository.update
        .mockResolvedValueOnce(revokedSession1)
        .mockResolvedValueOnce(revokedSession2);

      sessionTracker.terminateSession.mockResolvedValue(undefined);

      // Act
      const result = await service.execute(params);

      // Assert
      expect(repository.findActiveByUserId).toHaveBeenCalledWith(mockUserId);
      expect(repository.update).toHaveBeenCalledTimes(2);
      // 타임스탬프는 매번 달라지므로 제외하고 비교
      expect(repository.update).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          uid: mockUid1,
          userId: mockUserId,
          sessionId: mockSessionId1,
          type: SessionType.HTTP,
          status: SessionStatus.REVOKED,
          revokedBy: mockRevokedBy,
        }),
      );
      expect(repository.update).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          uid: mockUid2,
          userId: mockUserId,
          sessionId: mockSessionId2,
          type: SessionType.WEBSOCKET,
          status: SessionStatus.REVOKED,
          revokedBy: mockRevokedBy,
        }),
      );
      expect(sessionTracker.terminateSession).toHaveBeenCalledTimes(2);
      expect(sessionTracker.terminateSession).toHaveBeenNthCalledWith(
        1,
        mockSessionId1,
        SessionType.HTTP,
        false,
      );
      expect(sessionTracker.terminateSession).toHaveBeenNthCalledWith(
        2,
        mockSessionId2,
        SessionType.WEBSOCKET,
        false,
      );
      expect(result.revokedCount).toBe(2);
      expect(result.sessions).toHaveLength(2);
      expect(result.sessions[0].status).toBe(SessionStatus.REVOKED);
      expect(result.sessions[0].revokedBy).toBe(mockRevokedBy);
      expect(result.sessions[1].status).toBe(SessionStatus.REVOKED);
      expect(result.sessions[1].revokedBy).toBe(mockRevokedBy);
    });

    it('활성 세션이 없을 때 빈 배열을 반환해야 함', async () => {
      // Arrange
      const params: ExpireUserSessionsParams = {
        userId: mockUserId,
        revokedBy: mockRevokedBy,
      };

      repository.findActiveByUserId.mockResolvedValue([]);

      // Act
      const result = await service.execute(params);

      // Assert
      expect(repository.findActiveByUserId).toHaveBeenCalledWith(mockUserId);
      expect(repository.update).not.toHaveBeenCalled();
      expect(sessionTracker.terminateSession).not.toHaveBeenCalled();
      expect(result.revokedCount).toBe(0);
      expect(result.sessions).toHaveLength(0);
    });

    it('유효하지 않은 userId일 때 빈 배열을 반환해야 함', async () => {
      // Arrange
      const params: ExpireUserSessionsParams = {
        userId: BigInt(0),
        revokedBy: mockRevokedBy,
      };

      // Act
      const result = await service.execute(params);

      // Assert
      expect(repository.findActiveByUserId).not.toHaveBeenCalled();
      expect(repository.update).not.toHaveBeenCalled();
      expect(sessionTracker.terminateSession).not.toHaveBeenCalled();
      expect(result.revokedCount).toBe(0);
      expect(result.sessions).toHaveLength(0);
    });

    it('음수 userId일 때 빈 배열을 반환해야 함', async () => {
      // Arrange
      const params: ExpireUserSessionsParams = {
        userId: BigInt(-1),
        revokedBy: mockRevokedBy,
      };

      // Act
      const result = await service.execute(params);

      // Assert
      expect(repository.findActiveByUserId).not.toHaveBeenCalled();
      expect(repository.update).not.toHaveBeenCalled();
      expect(sessionTracker.terminateSession).not.toHaveBeenCalled();
      expect(result.revokedCount).toBe(0);
      expect(result.sessions).toHaveLength(0);
    });

    it('유효하지 않은 revokedBy일 때 빈 배열을 반환해야 함', async () => {
      // Arrange
      const params: ExpireUserSessionsParams = {
        userId: mockUserId,
        revokedBy: BigInt(0),
      };

      // Act
      const result = await service.execute(params);

      // Assert
      expect(repository.findActiveByUserId).not.toHaveBeenCalled();
      expect(repository.update).not.toHaveBeenCalled();
      expect(sessionTracker.terminateSession).not.toHaveBeenCalled();
      expect(result.revokedCount).toBe(0);
      expect(result.sessions).toHaveLength(0);
    });

    it('음수 revokedBy일 때 빈 배열을 반환해야 함', async () => {
      // Arrange
      const params: ExpireUserSessionsParams = {
        userId: mockUserId,
        revokedBy: BigInt(-1),
      };

      // Act
      const result = await service.execute(params);

      // Assert
      expect(repository.findActiveByUserId).not.toHaveBeenCalled();
      expect(repository.update).not.toHaveBeenCalled();
      expect(sessionTracker.terminateSession).not.toHaveBeenCalled();
      expect(result.revokedCount).toBe(0);
      expect(result.sessions).toHaveLength(0);
    });

    it('이미 종료된 세션은 건너뛰어야 함', async () => {
      // Arrange
      const params: ExpireUserSessionsParams = {
        userId: mockUserId,
        revokedBy: mockRevokedBy,
      };

      const activeSession = UserSession.create({
        uid: mockUid1,
        userId: mockUserId,
        sessionId: mockSessionId1,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      const revokedSession = activeSession.revoke(mockRevokedBy);

      repository.findActiveByUserId.mockResolvedValue([revokedSession]);
      sessionTracker.terminateSession.mockResolvedValue(undefined);

      // Act
      const result = await service.execute(params);

      // Assert
      expect(repository.findActiveByUserId).toHaveBeenCalledWith(mockUserId);
      expect(repository.update).not.toHaveBeenCalled();
      expect(sessionTracker.terminateSession).not.toHaveBeenCalled();
      expect(result.revokedCount).toBe(0);
      expect(result.sessions).toHaveLength(0);
    });

    it('활성 세션과 종료된 세션이 섞여 있을 때 활성 세션만 종료해야 함', async () => {
      // Arrange
      const params: ExpireUserSessionsParams = {
        userId: mockUserId,
        revokedBy: mockRevokedBy,
      };

      const activeSession = UserSession.create({
        uid: mockUid1,
        userId: mockUserId,
        sessionId: mockSessionId1,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      const alreadyRevokedSession = activeSession.revoke(mockRevokedBy);

      repository.findActiveByUserId.mockResolvedValue([
        activeSession,
        alreadyRevokedSession,
      ]);

      const revokedSession = activeSession.revoke(mockRevokedBy);
      repository.update.mockResolvedValue(revokedSession);
      sessionTracker.terminateSession.mockResolvedValue(undefined);

      // Act
      const result = await service.execute(params);

      // Assert
      expect(repository.update).toHaveBeenCalledTimes(1);
      // 타임스탬프는 매번 달라지므로 제외하고 비교
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: mockUid1,
          userId: mockUserId,
          sessionId: mockSessionId1,
          type: SessionType.HTTP,
          status: SessionStatus.REVOKED,
          revokedBy: mockRevokedBy,
        }),
      );
      expect(sessionTracker.terminateSession).toHaveBeenCalledTimes(1);
      expect(sessionTracker.terminateSession).toHaveBeenCalledWith(
        mockSessionId1,
        SessionType.HTTP,
        false,
      );
      expect(result.revokedCount).toBe(1);
      expect(result.sessions).toHaveLength(1);
    });

    it('관리자 세션(isAdmin=true)일 때 올바른 isAdmin 값으로 terminateSession을 호출해야 함', async () => {
      // Arrange
      const params: ExpireUserSessionsParams = {
        userId: mockUserId,
        revokedBy: mockRevokedBy,
      };

      const adminSession = UserSession.create({
        uid: mockUid1,
        userId: mockUserId,
        sessionId: mockSessionId1,
        type: SessionType.HTTP,
        isAdmin: true,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      repository.findActiveByUserId.mockResolvedValue([adminSession]);

      const revokedSession = adminSession.revoke(mockRevokedBy);
      repository.update.mockResolvedValue(revokedSession);
      sessionTracker.terminateSession.mockResolvedValue(undefined);

      // Act
      const result = await service.execute(params);

      // Assert
      expect(sessionTracker.terminateSession).toHaveBeenCalledWith(
        mockSessionId1,
        SessionType.HTTP,
        true, // isAdmin이 true
      );
      expect(result.revokedCount).toBe(1);
      expect(result.sessions[0].isAdmin).toBe(true);
    });

    it('terminateSessionConnection 실패 시에도 DB 업데이트는 유지되어야 함', async () => {
      // Arrange
      const params: ExpireUserSessionsParams = {
        userId: mockUserId,
        revokedBy: mockRevokedBy,
      };

      const activeSession = UserSession.create({
        uid: mockUid1,
        userId: mockUserId,
        sessionId: mockSessionId1,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      repository.findActiveByUserId.mockResolvedValue([activeSession]);

      const revokedSession = activeSession.revoke(mockRevokedBy);
      repository.update.mockResolvedValue(revokedSession);
      sessionTracker.terminateSession.mockRejectedValue(
        new Error('Redis connection failed'),
      );

      // Act
      const result = await service.execute(params);

      // Assert
      // 타임스탬프는 매번 달라지므로 제외하고 비교
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: mockUid1,
          userId: mockUserId,
          sessionId: mockSessionId1,
          type: SessionType.HTTP,
          status: SessionStatus.REVOKED,
          revokedBy: mockRevokedBy,
        }),
      );
      expect(sessionTracker.terminateSession).toHaveBeenCalled();
      // DB 업데이트는 완료되었으므로 세션 종료는 성공 처리
      expect(result.revokedCount).toBe(1);
      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].status).toBe(SessionStatus.REVOKED);
    });

    it('여러 세션 중 일부 terminateSession 실패해도 모든 세션을 처리해야 함', async () => {
      // Arrange
      const params: ExpireUserSessionsParams = {
        userId: mockUserId,
        revokedBy: mockRevokedBy,
      };

      const activeSession1 = UserSession.create({
        uid: mockUid1,
        userId: mockUserId,
        sessionId: mockSessionId1,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      const activeSession2 = UserSession.create({
        uid: mockUid2,
        userId: mockUserId,
        sessionId: mockSessionId2,
        type: SessionType.WEBSOCKET,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      repository.findActiveByUserId.mockResolvedValue([
        activeSession1,
        activeSession2,
      ]);

      const revokedSession1 = activeSession1.revoke(mockRevokedBy);
      const revokedSession2 = activeSession2.revoke(mockRevokedBy);

      repository.update
        .mockResolvedValueOnce(revokedSession1)
        .mockResolvedValueOnce(revokedSession2);

      sessionTracker.terminateSession
        .mockRejectedValueOnce(new Error('Redis connection failed'))
        .mockResolvedValueOnce(undefined);

      // Act
      const result = await service.execute(params);

      // Assert
      expect(repository.update).toHaveBeenCalledTimes(2);
      expect(sessionTracker.terminateSession).toHaveBeenCalledTimes(2);
      // 모든 세션이 처리되어야 함
      expect(result.revokedCount).toBe(2);
      expect(result.sessions).toHaveLength(2);
      expect(result.sessions[0].status).toBe(SessionStatus.REVOKED);
      expect(result.sessions[1].status).toBe(SessionStatus.REVOKED);
    });

    it('HTTP 세션과 WebSocket 세션을 모두 처리해야 함', async () => {
      // Arrange
      const params: ExpireUserSessionsParams = {
        userId: mockUserId,
        revokedBy: mockRevokedBy,
      };

      const httpSession = UserSession.create({
        uid: mockUid1,
        userId: mockUserId,
        sessionId: mockSessionId1,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      const websocketSession = UserSession.create({
        uid: mockUid2,
        userId: mockUserId,
        sessionId: mockSessionId2,
        type: SessionType.WEBSOCKET,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      repository.findActiveByUserId.mockResolvedValue([
        httpSession,
        websocketSession,
      ]);

      const revokedHttpSession = httpSession.revoke(mockRevokedBy);
      const revokedWebsocketSession = websocketSession.revoke(mockRevokedBy);

      repository.update
        .mockResolvedValueOnce(revokedHttpSession)
        .mockResolvedValueOnce(revokedWebsocketSession);

      sessionTracker.terminateSession.mockResolvedValue(undefined);

      // Act
      const result = await service.execute(params);

      // Assert
      expect(sessionTracker.terminateSession).toHaveBeenNthCalledWith(
        1,
        mockSessionId1,
        SessionType.HTTP,
        false,
      );
      expect(sessionTracker.terminateSession).toHaveBeenNthCalledWith(
        2,
        mockSessionId2,
        SessionType.WEBSOCKET,
        false,
      );
      expect(result.revokedCount).toBe(2);
    });

    it('revokedBy가 각 세션의 revokedBy 필드에 올바르게 기록되어야 함', async () => {
      // Arrange
      const params: ExpireUserSessionsParams = {
        userId: mockUserId,
        revokedBy: mockRevokedBy,
      };

      const activeSession = UserSession.create({
        uid: mockUid1,
        userId: mockUserId,
        sessionId: mockSessionId1,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      repository.findActiveByUserId.mockResolvedValue([activeSession]);

      const revokedSession = activeSession.revoke(mockRevokedBy);
      repository.update.mockResolvedValue(revokedSession);
      sessionTracker.terminateSession.mockResolvedValue(undefined);

      // Act
      const result = await service.execute(params);

      // Assert
      expect(result.sessions[0].revokedBy).toBe(mockRevokedBy);
      expect(result.sessions[0].status).toBe(SessionStatus.REVOKED);
      expect(result.sessions[0].revokedAt).not.toBeNull();
    });
  });
});

