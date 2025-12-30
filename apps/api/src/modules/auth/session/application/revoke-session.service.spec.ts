// src/modules/auth/session/application/revoke-session.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { RevokeSessionService, type RevokeSessionParams } from './revoke-session.service';
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
import { SessionNotFoundException } from '../domain/exception';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';

describe('RevokeSessionService', () => {
  let service: RevokeSessionService;
  let repository: jest.Mocked<UserSessionRepositoryPort>;
  let sessionTracker: jest.Mocked<SessionTrackerService>;
  let module: TestingModule;

  const mockUserId = BigInt(123);
  const mockAdminId = BigInt(999);
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

    const mockDispatchLogServiceProvider = {
      provide: DispatchLogService,
      useValue: {
        dispatch: jest.fn().mockResolvedValue(undefined),
      },
    };

    module = await Test.createTestingModule({
      imports: [PrismaModule, EnvModule], // @Transactional() 데코레이터를 위해 필요
      providers: [
        RevokeSessionService,
        {
          provide: USER_SESSION_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: SessionTrackerService,
          useValue: mockSessionTracker,
        },
        mockDispatchLogServiceProvider,
      ],
    })
      .setLogger(new Logger())
      .compile();

    service = module.get<RevokeSessionService>(RevokeSessionService);
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
    it('HTTP 세션을 정상적으로 종료해야 함', async () => {
      // Arrange
      const params: RevokeSessionParams = {
        sessionId: mockSessionId,
        revokedBy: mockAdminId,
      };

      const activeSession = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      repository.findBySessionId.mockResolvedValue(activeSession);
      const revokedSession = activeSession.revoke(mockAdminId);
      repository.update.mockResolvedValue(revokedSession);
      sessionTracker.terminateSession.mockResolvedValue(undefined);

      // Act
      const result = await service.execute(params);

      // Assert
      expect(repository.findBySessionId).toHaveBeenCalledWith(mockSessionId);
      // 타임스탬프는 매번 달라지므로 제외하고 비교
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: mockUid,
          userId: mockUserId,
          sessionId: mockSessionId,
          type: SessionType.HTTP,
          status: SessionStatus.REVOKED,
          revokedBy: mockAdminId,
        }),
      );
      expect(sessionTracker.terminateSession).toHaveBeenCalledWith(
        mockSessionId,
        SessionType.HTTP,
        false, // isAdmin
      );
      expect(result.status).toBe(SessionStatus.REVOKED);
      expect(result.revokedBy).toBe(mockAdminId);
      expect(result.revokedAt).not.toBeNull();
    });

    it('WebSocket 세션을 정상적으로 종료해야 함', async () => {
      // Arrange
      const params: RevokeSessionParams = {
        sessionId: mockSessionId,
        revokedBy: mockAdminId,
      };

      const activeSession = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.WEBSOCKET,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      repository.findBySessionId.mockResolvedValue(activeSession);
      const revokedSession = activeSession.revoke(mockAdminId);
      repository.update.mockResolvedValue(revokedSession);
      sessionTracker.terminateSession.mockResolvedValue(undefined);

      // Act
      const result = await service.execute(params);

      // Assert
      expect(repository.findBySessionId).toHaveBeenCalledWith(mockSessionId);
      // 타임스탬프는 매번 달라지므로 제외하고 비교
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: mockUid,
          userId: mockUserId,
          sessionId: mockSessionId,
          type: SessionType.WEBSOCKET,
          status: SessionStatus.REVOKED,
          revokedBy: mockAdminId,
        }),
      );
      expect(sessionTracker.terminateSession).toHaveBeenCalledWith(
        mockSessionId,
        SessionType.WEBSOCKET,
        false, // isAdmin
      );
      expect(result.status).toBe(SessionStatus.REVOKED);
      expect(result.type).toBe(SessionType.WEBSOCKET);
    });

    it('관리자 세션(isAdmin=true)을 종료할 때 올바른 isAdmin 값을 전달해야 함', async () => {
      // Arrange
      const params: RevokeSessionParams = {
        sessionId: mockSessionId,
        revokedBy: mockAdminId,
      };

      const activeSession = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        isAdmin: true, // 관리자 세션
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      repository.findBySessionId.mockResolvedValue(activeSession);
      const revokedSession = activeSession.revoke(mockAdminId);
      repository.update.mockResolvedValue(revokedSession);
      sessionTracker.terminateSession.mockResolvedValue(undefined);

      // Act
      await service.execute(params);

      // Assert
      expect(sessionTracker.terminateSession).toHaveBeenCalledWith(
        mockSessionId,
        SessionType.HTTP,
        true, // isAdmin이 true
      );
    });

    it('이미 종료된 세션은 그대로 반환해야 함', async () => {
      // Arrange
      const params: RevokeSessionParams = {
        sessionId: mockSessionId,
        revokedBy: mockAdminId,
      };

      const activeSession = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      // 이미 종료된 세션
      const revokedSession = activeSession.revoke(BigInt(888));
      repository.findBySessionId.mockResolvedValue(revokedSession);

      // Act
      const result = await service.execute(params);

      // Assert
      expect(repository.findBySessionId).toHaveBeenCalledWith(mockSessionId);
      expect(repository.update).not.toHaveBeenCalled();
      expect(sessionTracker.terminateSession).not.toHaveBeenCalled();
      expect(result).toEqual(revokedSession);
      expect(result.status).toBe(SessionStatus.REVOKED);
    });

    it('세션이 없을 때 SessionNotFoundException을 던져야 함', async () => {
      // Arrange
      const params: RevokeSessionParams = {
        sessionId: mockSessionId,
        revokedBy: mockAdminId,
      };

      repository.findBySessionId.mockResolvedValue(null);

      // Act & Assert
      await expect(service.execute(params)).rejects.toThrow(
        SessionNotFoundException,
      );
      expect(repository.findBySessionId).toHaveBeenCalledWith(mockSessionId);
      expect(repository.update).not.toHaveBeenCalled();
      expect(sessionTracker.terminateSession).not.toHaveBeenCalled();
    });

    it('sessionId가 빈 문자열일 때 SessionNotFoundException을 던져야 함', async () => {
      // Arrange
      const params: RevokeSessionParams = {
        sessionId: '',
        revokedBy: mockAdminId,
      };

      // Act & Assert
      await expect(service.execute(params)).rejects.toThrow(
        SessionNotFoundException,
      );
      expect(repository.findBySessionId).not.toHaveBeenCalled();
    });

    it('sessionId가 공백만 있을 때 SessionNotFoundException을 던져야 함', async () => {
      // Arrange
      const params: RevokeSessionParams = {
        sessionId: '   ',
        revokedBy: mockAdminId,
      };

      // Act & Assert
      await expect(service.execute(params)).rejects.toThrow(
        SessionNotFoundException,
      );
      expect(repository.findBySessionId).not.toHaveBeenCalled();
    });

    it('revokedBy가 0일 때 Error를 던져야 함', async () => {
      // Arrange
      const params: RevokeSessionParams = {
        sessionId: mockSessionId,
        revokedBy: BigInt(0),
      };

      // Act & Assert
      await expect(service.execute(params)).rejects.toThrow('Invalid revokedBy');
      expect(repository.findBySessionId).not.toHaveBeenCalled();
    });

    it('revokedBy가 음수일 때 Error를 던져야 함', async () => {
      // Arrange
      const params: RevokeSessionParams = {
        sessionId: mockSessionId,
        revokedBy: BigInt(-1),
      };

      // Act & Assert
      await expect(service.execute(params)).rejects.toThrow('Invalid revokedBy');
      expect(repository.findBySessionId).not.toHaveBeenCalled();
    });

    it('terminateSessionConnection 실패 시에도 DB 업데이트는 유지되어야 함', async () => {
      // Arrange
      const params: RevokeSessionParams = {
        sessionId: mockSessionId,
        revokedBy: mockAdminId,
      };

      const activeSession = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      repository.findBySessionId.mockResolvedValue(activeSession);
      const revokedSession = activeSession.revoke(mockAdminId);
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
          uid: mockUid,
          userId: mockUserId,
          sessionId: mockSessionId,
          type: SessionType.HTTP,
          status: SessionStatus.REVOKED,
          revokedBy: mockAdminId,
        }),
      );
      expect(sessionTracker.terminateSession).toHaveBeenCalled();
      // DB 업데이트는 완료되었으므로 세션은 REVOKED 상태
      expect(result.status).toBe(SessionStatus.REVOKED);
      expect(result.revokedBy).toBe(mockAdminId);
    });

    it('이미 만료된(EXPIRED) 세션도 그대로 반환해야 함', async () => {
      // Arrange
      const params: RevokeSessionParams = {
        sessionId: mockSessionId,
        revokedBy: mockAdminId,
      };

      const activeSession = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      // 만료된 세션
      const expiredSession = activeSession.expire();
      repository.findBySessionId.mockResolvedValue(expiredSession);

      // Act
      const result = await service.execute(params);

      // Assert
      expect(repository.update).not.toHaveBeenCalled();
      expect(sessionTracker.terminateSession).not.toHaveBeenCalled();
      expect(result).toEqual(expiredSession);
      expect(result.status).toBe(SessionStatus.EXPIRED);
    });

    it('revokedBy가 올바르게 세션에 기록되어야 함', async () => {
      // Arrange
      const params: RevokeSessionParams = {
        sessionId: mockSessionId,
        revokedBy: mockAdminId,
      };

      const activeSession = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      repository.findBySessionId.mockResolvedValue(activeSession);
      const revokedSession = activeSession.revoke(mockAdminId);
      repository.update.mockResolvedValue(revokedSession);
      sessionTracker.terminateSession.mockResolvedValue(undefined);

      // Act
      const result = await service.execute(params);

      // Assert
      expect(result.revokedBy).toBe(mockAdminId);
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          revokedBy: mockAdminId,
        }),
      );
    });
  });
});

