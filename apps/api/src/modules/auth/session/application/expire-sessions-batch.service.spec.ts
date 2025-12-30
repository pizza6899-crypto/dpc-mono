// src/modules/auth/session/application/expire-sessions-batch.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ExpireSessionsBatchService } from './expire-sessions-batch.service';
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

describe('ExpireSessionsBatchService', () => {
  let service: ExpireSessionsBatchService;
  let repository: jest.Mocked<UserSessionRepositoryPort>;
  let sessionTracker: jest.Mocked<SessionTrackerService>;
  let module: TestingModule;

  const mockUserId = BigInt(123);
  const mockExpiresAt = new Date(Date.now() - 3600000); // 1시간 전 (만료됨)

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
        ExpireSessionsBatchService,
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

    service = module.get<ExpireSessionsBatchService>(
      ExpireSessionsBatchService,
    );
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
    it('만료된 세션이 없을 때 0을 반환해야 함', async () => {
      // Arrange
      repository.findExpiredSessions.mockResolvedValue([]);

      // Act
      const result = await service.execute();

      // Assert
      expect(repository.findExpiredSessions).toHaveBeenCalledWith(100); // 기본 배치 크기
      expect(repository.update).not.toHaveBeenCalled();
      expect(sessionTracker.terminateSession).not.toHaveBeenCalled();
      expect(result).toEqual({ expiredCount: 0 });
    });

    it('만료된 세션이 있을 때 정상적으로 만료 처리해야 함', async () => {
      // Arrange
      const expiredSession = UserSession.create({
        uid: 'uid-123',
        userId: mockUserId,
        sessionId: 'session-123',
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      repository.findExpiredSessions.mockResolvedValue([expiredSession]);

      const expiredSessionEntity = expiredSession.expire();
      repository.update.mockResolvedValue(expiredSessionEntity);
      sessionTracker.terminateSession.mockResolvedValue(undefined);

      // Act
      const result = await service.execute();

      // Assert
      expect(repository.findExpiredSessions).toHaveBeenCalledWith(100);
      // 타임스탬프는 매번 달라지므로 제외하고 비교
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: expiredSession.uid,
          userId: mockUserId,
          sessionId: expiredSession.sessionId,
          type: SessionType.HTTP,
          status: SessionStatus.EXPIRED,
        }),
      );
      expect(sessionTracker.terminateSession).toHaveBeenCalledWith(
        expiredSession.sessionId,
        expiredSession.type,
        expiredSession.isAdmin,
      );
      expect(result).toEqual({ expiredCount: 1 });
    });

    it('배치 크기 파라미터를 전달하면 해당 크기로 조회해야 함', async () => {
      // Arrange
      const customBatchSize = 50;
      repository.findExpiredSessions.mockResolvedValue([]);

      // Act
      await service.execute({ batchSize: customBatchSize });

      // Assert
      expect(repository.findExpiredSessions).toHaveBeenCalledWith(
        customBatchSize,
      );
    });

    it('배치 크기가 지정되지 않으면 기본값 100을 사용해야 함', async () => {
      // Arrange
      repository.findExpiredSessions.mockResolvedValue([]);

      // Act
      await service.execute();

      // Assert
      expect(repository.findExpiredSessions).toHaveBeenCalledWith(100);
    });

    it('이미 종료된 세션은 건너뛰어야 함', async () => {
      // Arrange
      // expiresAt을 미래로 설정하여 revoke()가 정상적으로 작동하도록 함
      const futureExpiresAt = new Date(Date.now() + 3600000);
      const alreadyRevokedSession = UserSession.create({
        uid: 'uid-123',
        userId: mockUserId,
        sessionId: 'session-123',
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: futureExpiresAt,
      }).revoke(null); // 이미 종료된 세션

      repository.findExpiredSessions.mockResolvedValue([
        alreadyRevokedSession,
      ]);

      // Act
      const result = await service.execute();

      // Assert
      expect(repository.findExpiredSessions).toHaveBeenCalledWith(100);
      expect(repository.update).not.toHaveBeenCalled();
      expect(sessionTracker.terminateSession).not.toHaveBeenCalled();
      expect(result).toEqual({ expiredCount: 0 });
    });

    it('이미 만료된 세션은 건너뛰어야 함', async () => {
      // Arrange
      // expiresAt을 미래로 설정하여 expire() 전에 ACTIVE 상태를 유지하도록 함
      const futureExpiresAt = new Date(Date.now() + 3600000);
      const alreadyExpiredSession = UserSession.create({
        uid: 'uid-123',
        userId: mockUserId,
        sessionId: 'session-123',
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: futureExpiresAt,
      }).expire(); // 이미 만료된 세션

      repository.findExpiredSessions.mockResolvedValue([
        alreadyExpiredSession,
      ]);

      // Act
      const result = await service.execute();

      // Assert
      expect(repository.findExpiredSessions).toHaveBeenCalledWith(100);
      expect(repository.update).not.toHaveBeenCalled();
      expect(sessionTracker.terminateSession).not.toHaveBeenCalled();
      expect(result).toEqual({ expiredCount: 0 });
    });

    it('세션 연결 종료 실패 시에도 DB 업데이트는 완료되어야 함', async () => {
      // Arrange
      const expiredSession = UserSession.create({
        uid: 'uid-123',
        userId: mockUserId,
        sessionId: 'session-123',
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      repository.findExpiredSessions.mockResolvedValue([expiredSession]);

      const expiredSessionEntity = expiredSession.expire();
      repository.update.mockResolvedValue(expiredSessionEntity);
      const terminateError = new Error('세션 연결 종료 실패');
      sessionTracker.terminateSession.mockRejectedValue(terminateError);

      // Act
      const result = await service.execute();

      // Assert
      // 타임스탬프는 매번 달라지므로 제외하고 비교
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: expiredSession.uid,
          userId: mockUserId,
          sessionId: expiredSession.sessionId,
          type: SessionType.HTTP,
          status: SessionStatus.EXPIRED,
        }),
      );
      expect(sessionTracker.terminateSession).toHaveBeenCalledWith(
        expiredSession.sessionId,
        expiredSession.type,
        expiredSession.isAdmin,
      );
      // 에러가 발생해도 expiredCount는 증가해야 함
      expect(result).toEqual({ expiredCount: 1 });
    });

    it('여러 만료된 세션을 일괄 처리해야 함', async () => {
      // Arrange
      const expiredSession1 = UserSession.create({
        uid: 'uid-123',
        userId: mockUserId,
        sessionId: 'session-123',
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      const expiredSession2 = UserSession.create({
        uid: 'uid-456',
        userId: mockUserId,
        sessionId: 'session-456',
        type: SessionType.WEBSOCKET,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      repository.findExpiredSessions.mockResolvedValue([
        expiredSession1,
        expiredSession2,
      ]);

      const expiredSessionEntity1 = expiredSession1.expire();
      const expiredSessionEntity2 = expiredSession2.expire();
      repository.update
        .mockResolvedValueOnce(expiredSessionEntity1)
        .mockResolvedValueOnce(expiredSessionEntity2);
      sessionTracker.terminateSession.mockResolvedValue(undefined);

      // Act
      const result = await service.execute();

      // Assert
      expect(repository.update).toHaveBeenCalledTimes(2);
      expect(sessionTracker.terminateSession).toHaveBeenCalledTimes(2);
      expect(sessionTracker.terminateSession).toHaveBeenNthCalledWith(
        1,
        expiredSession1.sessionId,
        expiredSession1.type,
        expiredSession1.isAdmin,
      );
      expect(sessionTracker.terminateSession).toHaveBeenNthCalledWith(
        2,
        expiredSession2.sessionId,
        expiredSession2.type,
        expiredSession2.isAdmin,
      );
      expect(result).toEqual({ expiredCount: 2 });
    });

    it('HTTP 세션과 WebSocket 세션을 모두 처리해야 함', async () => {
      // Arrange
      const httpSession = UserSession.create({
        uid: 'uid-http',
        userId: mockUserId,
        sessionId: 'session-http',
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      const websocketSession = UserSession.create({
        uid: 'uid-websocket',
        userId: mockUserId,
        sessionId: 'session-websocket',
        type: SessionType.WEBSOCKET,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      repository.findExpiredSessions.mockResolvedValue([
        httpSession,
        websocketSession,
      ]);

      const expiredHttpSession = httpSession.expire();
      const expiredWebsocketSession = websocketSession.expire();
      repository.update
        .mockResolvedValueOnce(expiredHttpSession)
        .mockResolvedValueOnce(expiredWebsocketSession);
      sessionTracker.terminateSession.mockResolvedValue(undefined);

      // Act
      const result = await service.execute();

      // Assert
      expect(repository.update).toHaveBeenCalledTimes(2);
      expect(sessionTracker.terminateSession).toHaveBeenCalledTimes(2);
      expect(sessionTracker.terminateSession).toHaveBeenNthCalledWith(
        1,
        httpSession.sessionId,
        SessionType.HTTP,
        false,
      );
      expect(sessionTracker.terminateSession).toHaveBeenNthCalledWith(
        2,
        websocketSession.sessionId,
        SessionType.WEBSOCKET,
        false,
      );
      expect(result).toEqual({ expiredCount: 2 });
    });

    it('관리자 세션도 정상적으로 처리해야 함', async () => {
      // Arrange
      const adminSession = UserSession.create({
        uid: 'uid-admin',
        userId: mockUserId,
        sessionId: 'session-admin',
        type: SessionType.HTTP,
        isAdmin: true,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      repository.findExpiredSessions.mockResolvedValue([adminSession]);

      const expiredAdminSession = adminSession.expire();
      repository.update.mockResolvedValue(expiredAdminSession);
      sessionTracker.terminateSession.mockResolvedValue(undefined);

      // Act
      const result = await service.execute();

      // Assert
      // 타임스탬프는 매번 달라지므로 제외하고 비교
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: adminSession.uid,
          userId: mockUserId,
          sessionId: adminSession.sessionId,
          type: SessionType.HTTP,
          status: SessionStatus.EXPIRED,
          isAdmin: true,
        }),
      );
      expect(sessionTracker.terminateSession).toHaveBeenCalledWith(
        adminSession.sessionId,
        adminSession.type,
        true, // isAdmin이 true
      );
      expect(result).toEqual({ expiredCount: 1 });
    });

    it('일부 세션이 이미 종료된 경우 활성 세션만 처리해야 함', async () => {
      // Arrange
      const activeExpiredSession = UserSession.create({
        uid: 'uid-active',
        userId: mockUserId,
        sessionId: 'session-active',
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      // expiresAt을 미래로 설정하여 revoke()가 정상적으로 작동하도록 함
      const futureExpiresAt = new Date(Date.now() + 3600000);
      const alreadyRevokedSession = UserSession.create({
        uid: 'uid-revoked',
        userId: mockUserId,
        sessionId: 'session-revoked',
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: futureExpiresAt,
      }).revoke(null);

      repository.findExpiredSessions.mockResolvedValue([
        activeExpiredSession,
        alreadyRevokedSession,
      ]);

      const expiredSessionEntity = activeExpiredSession.expire();
      repository.update.mockResolvedValue(expiredSessionEntity);
      sessionTracker.terminateSession.mockResolvedValue(undefined);

      // Act
      const result = await service.execute();

      // Assert
      expect(repository.update).toHaveBeenCalledTimes(1);
      // 타임스탬프는 매번 달라지므로 제외하고 비교
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: activeExpiredSession.uid,
          userId: mockUserId,
          sessionId: activeExpiredSession.sessionId,
          type: SessionType.HTTP,
          status: SessionStatus.EXPIRED,
        }),
      );
      expect(sessionTracker.terminateSession).toHaveBeenCalledTimes(1);
      expect(sessionTracker.terminateSession).toHaveBeenCalledWith(
        activeExpiredSession.sessionId,
        activeExpiredSession.type,
        activeExpiredSession.isAdmin,
      );
      expect(result).toEqual({ expiredCount: 1 });
    });

    it('배치 크기만큼만 처리해야 함', async () => {
      // Arrange
      const batchSize = 2;
      const sessions = Array.from({ length: 5 }, (_, i) =>
        UserSession.create({
          uid: `uid-${i}`,
          userId: mockUserId,
          sessionId: `session-${i}`,
          type: SessionType.HTTP,
          isAdmin: false,
          deviceInfo: mockDeviceInfo,
          expiresAt: mockExpiresAt,
        }),
      );

      repository.findExpiredSessions.mockResolvedValue(sessions.slice(0, batchSize));

      sessions.slice(0, batchSize).forEach((session) => {
        const expiredSession = session.expire();
        repository.update.mockResolvedValueOnce(expiredSession);
      });
      sessionTracker.terminateSession.mockResolvedValue(undefined);

      // Act
      const result = await service.execute({ batchSize });

      // Assert
      expect(repository.findExpiredSessions).toHaveBeenCalledWith(batchSize);
      expect(repository.update).toHaveBeenCalledTimes(batchSize);
      expect(sessionTracker.terminateSession).toHaveBeenCalledTimes(batchSize);
      expect(result).toEqual({ expiredCount: batchSize });
    });
  });
});

