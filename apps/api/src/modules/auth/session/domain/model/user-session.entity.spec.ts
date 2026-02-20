// src/modules/auth/session/domain/model/user-session.entity.spec.ts
import { UserSession } from './user-session.entity';
import { SessionType } from './session-type.enum';
import { SessionStatus } from './session-status.enum';
import { DeviceInfo } from './device-info.vo';

describe('UserSession Entity', () => {
  const mockUid = 'clx1234567890';
  const mockUserId = BigInt(123);
  const mockSessionId = 'sess_abc123';
  const mockIpAddress = '192.168.1.1';
  const mockUserAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  const mockDeviceFingerprint = 'fingerprint-abc123';
  const mockCreatedAt = new Date('2024-01-01T00:00:00Z');
  // 미래 날짜로 설정하여 만료되지 않은 세션 테스트
  const mockExpiresAt = new Date(Date.now() + 3600000); // 1시간 후
  const mockDeviceInfo = DeviceInfo.create({
    ipAddress: mockIpAddress,
    userAgent: mockUserAgent,
    deviceFingerprint: mockDeviceFingerprint,
    isMobile: false,
    deviceName: 'Chrome on Windows',
    os: 'Windows 11',
    browser: 'Chrome 120',
  });

  describe('create', () => {
    it('모든 파라미터를 포함하여 활성 세션을 생성한다', () => {
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
        metadata: { key: 'value' },
        createdAt: mockCreatedAt,
      });

      expect(session.id).toBeNull();
      expect(session.uid).toBe(mockUid);
      expect(session.userId).toBe(mockUserId);
      expect(session.sessionId).toBe(mockSessionId);
      expect(session.type).toBe(SessionType.HTTP);
      expect(session.status).toBe(SessionStatus.ACTIVE);
      expect(session.isAdmin).toBe(false);
      expect(session.deviceInfo).toEqual(mockDeviceInfo);
      expect(session.createdAt).toEqual(mockCreatedAt);
      expect(session.updatedAt).toEqual(mockCreatedAt);
      expect(session.lastActiveAt).toEqual(mockCreatedAt);
      expect(session.expiresAt).toEqual(mockExpiresAt);
      expect(session.revokedAt).toBeNull();
      expect(session.revokedBy).toBeNull();
      expect(session.metadata).toEqual({ key: 'value' });
    });

    it('선택적 파라미터 없이 활성 세션을 생성한다', () => {
      const before = new Date();
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.WEBSOCKET,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });
      const after = new Date();

      expect(session.id).toBeNull();
      expect(session.uid).toBe(mockUid);
      expect(session.userId).toBe(mockUserId);
      expect(session.sessionId).toBe(mockSessionId);
      expect(session.type).toBe(SessionType.WEBSOCKET);
      expect(session.status).toBe(SessionStatus.ACTIVE);
      expect(session.isAdmin).toBe(false);
      expect(session.deviceInfo).toEqual(mockDeviceInfo);
      expect(session.createdAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(session.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(session.updatedAt).toEqual(session.createdAt);
      expect(session.lastActiveAt).toEqual(session.createdAt);
      expect(session.expiresAt).toEqual(mockExpiresAt);
      expect(session.revokedAt).toBeNull();
      expect(session.revokedBy).toBeNull();
      expect(session.metadata).toEqual({});
    });

    it('관리자 세션을 생성한다', () => {
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        isAdmin: true,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      expect(session.isAdmin).toBe(true);
      expect(session.status).toBe(SessionStatus.ACTIVE);
    });

    it('HTTP 세션을 생성한다', () => {
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      expect(session.type).toBe(SessionType.HTTP);
      expect(session.isHttpSession()).toBe(true);
      expect(session.isWebSocketSession()).toBe(false);
    });

    it('WebSocket 세션을 생성한다', () => {
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.WEBSOCKET,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      expect(session.type).toBe(SessionType.WEBSOCKET);
      expect(session.isHttpSession()).toBe(false);
      expect(session.isWebSocketSession()).toBe(true);
    });
  });

  describe('fromPersistence', () => {
    it('DB 데이터로부터 활성 세션 엔티티를 생성한다', () => {
      const persistenceData = {
        id: BigInt(1),
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: 'HTTP',
        status: 'ACTIVE',
        isAdmin: false,
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
        deviceFingerprint: mockDeviceFingerprint,
        isMobile: false,
        deviceName: 'Chrome on Windows',
        os: 'Windows 11',
        browser: 'Chrome 120',
        createdAt: mockCreatedAt,
        updatedAt: mockCreatedAt,
        lastActiveAt: mockCreatedAt,
        expiresAt: mockExpiresAt,
        revokedAt: null,
        revokedBy: null,
        metadata: { key: 'value' },
      };

      const session = UserSession.fromPersistence(persistenceData);

      expect(session.id).toBe(BigInt(1));
      expect(session.uid).toBe(mockUid);
      expect(session.userId).toBe(mockUserId);
      expect(session.sessionId).toBe(mockSessionId);
      expect(session.type).toBe(SessionType.HTTP);
      expect(session.status).toBe(SessionStatus.ACTIVE);
      expect(session.isAdmin).toBe(false);
      expect(session.createdAt).toEqual(mockCreatedAt);
      expect(session.updatedAt).toEqual(mockCreatedAt);
      expect(session.lastActiveAt).toEqual(mockCreatedAt);
      expect(session.expiresAt).toEqual(mockExpiresAt);
      expect(session.revokedAt).toBeNull();
      expect(session.revokedBy).toBeNull();
      expect(session.metadata).toEqual({ key: 'value' });
    });

    it('DB 데이터로부터 종료된 세션 엔티티를 생성한다', () => {
      const revokedAt = new Date('2024-01-01T12:00:00Z');
      const persistenceData = {
        id: BigInt(2),
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: 'HTTP',
        status: 'REVOKED',
        isAdmin: false,
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
        deviceFingerprint: mockDeviceFingerprint,
        isMobile: false,
        deviceName: null,
        os: null,
        browser: null,
        createdAt: mockCreatedAt,
        updatedAt: revokedAt,
        lastActiveAt: mockCreatedAt,
        expiresAt: mockExpiresAt,
        revokedAt: revokedAt,
        revokedBy: BigInt(456),
        metadata: null,
      };

      const session = UserSession.fromPersistence(persistenceData);

      expect(session.id).toBe(BigInt(2));
      expect(session.status).toBe(SessionStatus.REVOKED);
      expect(session.revokedAt).toEqual(revokedAt);
      expect(session.revokedBy).toBe(BigInt(456));
      expect(session.metadata).toEqual({});
    });

    it('DB 데이터로부터 만료된 세션 엔티티를 생성한다', () => {
      const persistenceData = {
        id: BigInt(3),
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: 'WEBSOCKET',
        status: 'EXPIRED',
        isAdmin: true,
        ipAddress: null,
        userAgent: null,
        deviceFingerprint: null,
        isMobile: null,
        deviceName: null,
        os: null,
        browser: null,
        createdAt: mockCreatedAt,
        updatedAt: mockExpiresAt,
        lastActiveAt: mockCreatedAt,
        expiresAt: mockExpiresAt,
        revokedAt: null,
        revokedBy: null,
        metadata: {},
      };

      const session = UserSession.fromPersistence(persistenceData);

      expect(session.id).toBe(BigInt(3));
      expect(session.type).toBe(SessionType.WEBSOCKET);
      expect(session.status).toBe(SessionStatus.EXPIRED);
      expect(session.isAdmin).toBe(true);
      expect(session.revokedAt).toBeNull();
      expect(session.revokedBy).toBeNull();
    });

    it('잘못된 SessionType에 대해 에러를 발생시킨다', () => {
      expect(() => {
        UserSession.fromPersistence({
          id: BigInt(4),
          uid: mockUid,
          userId: mockUserId,
          sessionId: mockSessionId,
          type: 'INVALID_TYPE',
          status: 'ACTIVE',
          isAdmin: false,
          ipAddress: null,
          userAgent: null,
          deviceFingerprint: null,
          isMobile: null,
          deviceName: null,
          os: null,
          browser: null,
          createdAt: mockCreatedAt,
          updatedAt: mockCreatedAt,
          lastActiveAt: mockCreatedAt,
          expiresAt: mockExpiresAt,
          revokedAt: null,
          revokedBy: null,
          metadata: null,
        });
      }).toThrow('Invalid SessionType');
    });

    it('잘못된 SessionStatus에 대해 에러를 발생시킨다', () => {
      expect(() => {
        UserSession.fromPersistence({
          id: BigInt(5),
          uid: mockUid,
          userId: mockUserId,
          sessionId: mockSessionId,
          type: 'HTTP',
          status: 'INVALID_STATUS',
          isAdmin: false,
          ipAddress: null,
          userAgent: null,
          deviceFingerprint: null,
          isMobile: null,
          deviceName: null,
          os: null,
          browser: null,
          createdAt: mockCreatedAt,
          updatedAt: mockCreatedAt,
          lastActiveAt: mockCreatedAt,
          expiresAt: mockExpiresAt,
          revokedAt: null,
          revokedBy: null,
          metadata: null,
        });
      }).toThrow('Invalid SessionStatus');
    });

    it('null id를 가진 엔티티를 생성한다', () => {
      const session = UserSession.fromPersistence({
        id: null,
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: 'HTTP',
        status: 'ACTIVE',
        isAdmin: false,
        ipAddress: null,
        userAgent: null,
        deviceFingerprint: null,
        isMobile: null,
        deviceName: null,
        os: null,
        browser: null,
        createdAt: mockCreatedAt,
        updatedAt: mockCreatedAt,
        lastActiveAt: mockCreatedAt,
        expiresAt: mockExpiresAt,
        revokedAt: null,
        revokedBy: null,
        metadata: null,
      });

      expect(session.id).toBeNull();
      expect(session.uid).toBe(mockUid);
    });
  });

  describe('isActive', () => {
    it('활성 상태이고 만료되지 않은 세션에 대해 true를 반환한다', () => {
      const futureExpiresAt = new Date(Date.now() + 3600000); // 1시간 후
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        deviceInfo: mockDeviceInfo,
        expiresAt: futureExpiresAt,
      });

      expect(session.isActive()).toBe(true);
    });

    it('활성 상태이지만 만료된 세션에 대해 false를 반환한다', () => {
      const pastExpiresAt = new Date(Date.now() - 3600000); // 1시간 전
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        deviceInfo: mockDeviceInfo,
        expiresAt: pastExpiresAt,
      });

      expect(session.isActive()).toBe(false);
    });

    it('종료된 세션에 대해 false를 반환한다', () => {
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      const revokedSession = session.revoke();

      expect(revokedSession.isActive()).toBe(false);
    });

    it('만료된 세션에 대해 false를 반환한다', () => {
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      const expiredSession = session.expire();

      expect(expiredSession.isActive()).toBe(false);
    });
  });

  describe('isExpired', () => {
    it('만료 시간이 지난 세션에 대해 true를 반환한다', () => {
      const pastExpiresAt = new Date(Date.now() - 3600000);
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        deviceInfo: mockDeviceInfo,
        expiresAt: pastExpiresAt,
      });

      expect(session.isExpired()).toBe(true);
    });

    it('만료 시간이 지나지 않은 세션에 대해 false를 반환한다', () => {
      const futureExpiresAt = new Date(Date.now() + 3600000);
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        deviceInfo: mockDeviceInfo,
        expiresAt: futureExpiresAt,
      });

      expect(session.isExpired()).toBe(false);
    });
  });

  describe('isTerminated', () => {
    it('활성 상태이고 만료되지 않은 세션에 대해 false를 반환한다', () => {
      const futureExpiresAt = new Date(Date.now() + 3600000);
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        deviceInfo: mockDeviceInfo,
        expiresAt: futureExpiresAt,
      });

      expect(session.isTerminated()).toBe(false);
    });

    it('REVOKED 상태 세션에 대해 true를 반환한다', () => {
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      const revokedSession = session.revoke();

      expect(revokedSession.isTerminated()).toBe(true);
    });

    it('EXPIRED 상태 세션에 대해 true를 반환한다', () => {
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      const expiredSession = session.expire();

      expect(expiredSession.isTerminated()).toBe(true);
    });

    it('만료 시간이 지난 세션에 대해 true를 반환한다', () => {
      const pastExpiresAt = new Date(Date.now() - 3600000);
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        deviceInfo: mockDeviceInfo,
        expiresAt: pastExpiresAt,
      });

      expect(session.isTerminated()).toBe(true);
    });
  });

  describe('updateActivity', () => {
    it('활성 세션의 활동 시간을 업데이트한다', () => {
      const futureExpiresAt = new Date(Date.now() + 3600000);
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        deviceInfo: mockDeviceInfo,
        expiresAt: futureExpiresAt,
        createdAt: mockCreatedAt,
      });

      // 시간 차이를 두기 위해 약간 대기
      const before = new Date();
      const updatedSession = session.updateActivity();
      const after = new Date();

      expect(updatedSession.id).toBe(session.id);
      expect(updatedSession.uid).toBe(session.uid);
      expect(updatedSession.createdAt).toEqual(session.createdAt);
      expect(updatedSession.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(updatedSession.updatedAt.getTime()).toBeLessThanOrEqual(
        after.getTime(),
      );
      expect(updatedSession.lastActiveAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(updatedSession.lastActiveAt.getTime()).toBeLessThanOrEqual(
        after.getTime(),
      );
      expect(updatedSession.expiresAt).toEqual(session.expiresAt);
      expect(updatedSession.status).toBe(SessionStatus.ACTIVE);
    });

    it('종료된 세션은 업데이트하지 않는다', () => {
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      const revokedSession = session.revoke();
      const updatedSession = revokedSession.updateActivity();

      expect(updatedSession).toBe(revokedSession);
      expect(updatedSession.updatedAt).toEqual(revokedSession.updatedAt);
      expect(updatedSession.lastActiveAt).toEqual(revokedSession.lastActiveAt);
    });

    it('만료된 세션은 업데이트하지 않는다', () => {
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      const expiredSession = session.expire();
      const updatedSession = expiredSession.updateActivity();

      expect(updatedSession).toBe(expiredSession);
    });
  });

  describe('revoke', () => {
    it('활성 세션을 종료한다', () => {
      const futureExpiresAt = new Date(Date.now() + 3600000);
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        deviceInfo: mockDeviceInfo,
        expiresAt: futureExpiresAt,
        createdAt: mockCreatedAt,
      });

      const before = new Date();
      const revokedSession = session.revoke();
      const after = new Date();

      expect(revokedSession.id).toBe(session.id);
      expect(revokedSession.uid).toBe(session.uid);
      expect(revokedSession.status).toBe(SessionStatus.REVOKED);
      expect(revokedSession.revokedAt?.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(revokedSession.revokedAt?.getTime()).toBeLessThanOrEqual(
        after.getTime(),
      );
      expect(revokedSession.revokedBy).toBeNull();
      expect(revokedSession.createdAt).toEqual(session.createdAt);
      expect(revokedSession.lastActiveAt).toEqual(session.lastActiveAt);
    });

    it('관리자가 세션을 종료할 때 revokedBy를 설정한다', () => {
      const futureExpiresAt = new Date(Date.now() + 3600000);
      const adminId = BigInt(999);
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        deviceInfo: mockDeviceInfo,
        expiresAt: futureExpiresAt,
      });

      const revokedSession = session.revoke(adminId);

      expect(revokedSession.status).toBe(SessionStatus.REVOKED);
      expect(revokedSession.revokedBy).toBe(adminId);
    });

    it('이미 종료된 세션은 변경하지 않는다', () => {
      const futureExpiresAt = new Date(Date.now() + 3600000);
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        deviceInfo: mockDeviceInfo,
        expiresAt: futureExpiresAt,
      });

      const revokedSession = session.revoke();
      const doubleRevokedSession = revokedSession.revoke();

      expect(doubleRevokedSession).toBe(revokedSession);
      expect(doubleRevokedSession.status).toBe(SessionStatus.REVOKED);
    });

    it('이미 만료된 세션은 변경하지 않는다', () => {
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      const expiredSession = session.expire();
      const revokedSession = expiredSession.revoke();

      expect(revokedSession).toBe(expiredSession);
      expect(revokedSession.status).toBe(SessionStatus.EXPIRED);
    });
  });

  describe('expire', () => {
    it('활성 세션을 만료 상태로 변경한다', () => {
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
        createdAt: mockCreatedAt,
      });

      const before = new Date();
      const expiredSession = session.expire();
      const after = new Date();

      expect(expiredSession.id).toBe(session.id);
      expect(expiredSession.uid).toBe(session.uid);
      expect(expiredSession.status).toBe(SessionStatus.EXPIRED);
      expect(expiredSession.revokedAt).toBeNull();
      expect(expiredSession.revokedBy).toBeNull();
      expect(expiredSession.createdAt).toEqual(session.createdAt);
      expect(expiredSession.lastActiveAt).toEqual(session.lastActiveAt);
      expect(expiredSession.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(expiredSession.updatedAt.getTime()).toBeLessThanOrEqual(
        after.getTime(),
      );
    });

    it('이미 종료된 세션은 변경하지 않는다', () => {
      const futureExpiresAt = new Date(Date.now() + 3600000);
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        deviceInfo: mockDeviceInfo,
        expiresAt: futureExpiresAt,
      });

      const revokedSession = session.revoke();
      const expiredSession = revokedSession.expire();

      expect(expiredSession).toBe(revokedSession);
      expect(expiredSession.status).toBe(SessionStatus.REVOKED);
    });

    it('이미 만료된 세션은 변경하지 않는다', () => {
      const futureExpiresAt = new Date(Date.now() + 3600000);
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        deviceInfo: mockDeviceInfo,
        expiresAt: futureExpiresAt,
      });

      const expiredSession = session.expire();
      const doubleExpiredSession = expiredSession.expire();

      expect(doubleExpiredSession).toBe(expiredSession);
      expect(doubleExpiredSession.status).toBe(SessionStatus.EXPIRED);
    });
  });

  describe('updateMetadata', () => {
    it('메타데이터를 업데이트한다', () => {
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
        metadata: { key1: 'value1', key2: 'value2' },
        createdAt: mockCreatedAt,
      });

      const before = new Date();
      const updatedSession = session.updateMetadata({
        key2: 'updated_value2',
        key3: 'value3',
      });
      const after = new Date();

      expect(updatedSession.id).toBe(session.id);
      expect(updatedSession.metadata).toEqual({
        key1: 'value1',
        key2: 'updated_value2',
        key3: 'value3',
      });
      expect(updatedSession.createdAt).toEqual(session.createdAt);
      expect(updatedSession.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(updatedSession.updatedAt.getTime()).toBeLessThanOrEqual(
        after.getTime(),
      );
    });

    it('빈 메타데이터에 새 메타데이터를 추가한다', () => {
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      const updatedSession = session.updateMetadata({ newKey: 'newValue' });

      expect(updatedSession.metadata).toEqual({ newKey: 'newValue' });
    });

    it('기존 메타데이터를 완전히 교체하지 않고 병합한다', () => {
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
        metadata: { key1: 'value1', key2: 'value2' },
      });

      const updatedSession = session.updateMetadata({ key3: 'value3' });

      expect(updatedSession.metadata).toEqual({
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
      });
    });
  });

  describe('isHttpSession', () => {
    it('HTTP 세션에 대해 true를 반환한다', () => {
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      expect(session.isHttpSession()).toBe(true);
    });

    it('WebSocket 세션에 대해 false를 반환한다', () => {
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.WEBSOCKET,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      expect(session.isHttpSession()).toBe(false);
    });
  });

  describe('isWebSocketSession', () => {
    it('WebSocket 세션에 대해 true를 반환한다', () => {
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.WEBSOCKET,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      expect(session.isWebSocketSession()).toBe(true);
    });

    it('HTTP 세션에 대해 false를 반환한다', () => {
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
      });

      expect(session.isWebSocketSession()).toBe(false);
    });
  });

  describe('toPersistence', () => {
    it('활성 세션을 Persistence 형식으로 변환한다', () => {
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
        metadata: { key: 'value' },
        createdAt: mockCreatedAt,
      });

      const persistence = session.toPersistence();

      expect(persistence).toEqual({
        id: null,
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        status: SessionStatus.ACTIVE,
        isAdmin: false,
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
        deviceFingerprint: mockDeviceFingerprint,
        isMobile: false,
        deviceName: 'Chrome on Windows',
        os: 'Windows 11',
        browser: 'Chrome 120',
        createdAt: mockCreatedAt,
        updatedAt: mockCreatedAt,
        lastActiveAt: mockCreatedAt,
        expiresAt: mockExpiresAt,
        revokedAt: null,
        revokedBy: null,
        metadata: { key: 'value' },
      });
    });

    it('종료된 세션을 Persistence 형식으로 변환한다', () => {
      const futureExpiresAt = new Date(Date.now() + 3600000);
      const adminId = BigInt(999);
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.WEBSOCKET,
        isAdmin: true,
        deviceInfo: mockDeviceInfo,
        expiresAt: futureExpiresAt,
        createdAt: mockCreatedAt,
      });

      const revokedSession = session.revoke(adminId);
      const persistence = revokedSession.toPersistence();

      expect(persistence.id).toBeNull();
      expect(persistence.uid).toBe(mockUid);
      expect(persistence.type).toBe(SessionType.WEBSOCKET);
      expect(persistence.status).toBe(SessionStatus.REVOKED);
      expect(persistence.isAdmin).toBe(true);
      expect(persistence.revokedBy).toBe(adminId);
      expect(persistence.revokedAt).not.toBeNull();
    });

    it('fromPersistence로 생성한 세션을 Persistence 형식으로 변환한다', () => {
      const persistenceData = {
        id: BigInt(123),
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: 'HTTP',
        status: 'ACTIVE',
        isAdmin: false,
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
        deviceFingerprint: mockDeviceFingerprint,
        isMobile: false,
        deviceName: 'Chrome on Windows',
        os: 'Windows 11',
        browser: 'Chrome 120',
        createdAt: mockCreatedAt,
        updatedAt: mockCreatedAt,
        lastActiveAt: mockCreatedAt,
        expiresAt: mockExpiresAt,
        revokedAt: null,
        revokedBy: null,
        metadata: { key: 'value' },
      };

      const session = UserSession.fromPersistence(persistenceData);
      const persistence = session.toPersistence();

      expect(persistence.id).toBe(BigInt(123));
      expect(persistence.uid).toBe(mockUid);
      expect(persistence.type).toBe(SessionType.HTTP);
      expect(persistence.status).toBe(SessionStatus.ACTIVE);
      expect(persistence.metadata).toEqual({ key: 'value' });
    });
  });

  describe('Integration', () => {
    it('create → toPersistence → fromPersistence 순환 테스트', () => {
      const original = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        isAdmin: false,
        deviceInfo: mockDeviceInfo,
        expiresAt: mockExpiresAt,
        metadata: { key: 'value' },
        createdAt: mockCreatedAt,
      });

      const persistence = original.toPersistence();
      const recreated = UserSession.fromPersistence({
        id: BigInt(1),
        uid: persistence.uid,
        userId: persistence.userId,
        sessionId: persistence.sessionId,
        type: persistence.type,
        status: persistence.status,
        isAdmin: persistence.isAdmin,
        ipAddress: persistence.ipAddress,
        userAgent: persistence.userAgent,
        deviceFingerprint: persistence.deviceFingerprint,
        isMobile: persistence.isMobile,
        deviceName: persistence.deviceName,
        os: persistence.os,
        browser: persistence.browser,
        createdAt: persistence.createdAt,
        updatedAt: persistence.updatedAt,
        lastActiveAt: persistence.lastActiveAt,
        expiresAt: persistence.expiresAt,
        revokedAt: persistence.revokedAt,
        revokedBy: persistence.revokedBy,
        metadata: persistence.metadata,
      });

      expect(recreated.uid).toBe(original.uid);
      expect(recreated.userId).toBe(original.userId);
      expect(recreated.sessionId).toBe(original.sessionId);
      expect(recreated.type).toBe(original.type);
      expect(recreated.status).toBe(original.status);
      expect(recreated.isAdmin).toBe(original.isAdmin);
      expect(recreated.deviceInfo.ipAddress).toBe(
        original.deviceInfo.ipAddress,
      );
      expect(recreated.deviceInfo.userAgent).toBe(
        original.deviceInfo.userAgent,
      );
      expect(recreated.createdAt).toEqual(original.createdAt);
      expect(recreated.expiresAt).toEqual(original.expiresAt);
      expect(recreated.metadata).toEqual(original.metadata);
    });

    it('fromPersistence → toPersistence → fromPersistence 순환 테스트', () => {
      const persistenceData = {
        id: BigInt(456),
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: 'WEBSOCKET',
        status: 'REVOKED',
        isAdmin: true,
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
        deviceFingerprint: mockDeviceFingerprint,
        isMobile: true,
        deviceName: 'iPhone 14 Pro',
        os: 'iOS 17.0',
        browser: 'Safari 17',
        createdAt: mockCreatedAt,
        updatedAt: mockCreatedAt,
        lastActiveAt: mockCreatedAt,
        expiresAt: mockExpiresAt,
        revokedAt: mockExpiresAt,
        revokedBy: BigInt(999),
        metadata: { admin: true },
      };

      const original = UserSession.fromPersistence(persistenceData);
      const persistence = original.toPersistence();
      const recreated = UserSession.fromPersistence({
        id: persistence.id,
        uid: persistence.uid,
        userId: persistence.userId,
        sessionId: persistence.sessionId,
        type: persistence.type,
        status: persistence.status,
        isAdmin: persistence.isAdmin,
        ipAddress: persistence.ipAddress,
        userAgent: persistence.userAgent,
        deviceFingerprint: persistence.deviceFingerprint,
        isMobile: persistence.isMobile,
        deviceName: persistence.deviceName,
        os: persistence.os,
        browser: persistence.browser,
        createdAt: persistence.createdAt,
        updatedAt: persistence.updatedAt,
        lastActiveAt: persistence.lastActiveAt,
        expiresAt: persistence.expiresAt,
        revokedAt: persistence.revokedAt,
        revokedBy: persistence.revokedBy,
        metadata: persistence.metadata,
      });

      expect(recreated.id).toBe(original.id);
      expect(recreated.uid).toBe(original.uid);
      expect(recreated.userId).toBe(original.userId);
      expect(recreated.type).toBe(original.type);
      expect(recreated.status).toBe(original.status);
      expect(recreated.isAdmin).toBe(original.isAdmin);
      expect(recreated.revokedAt).toEqual(original.revokedAt);
      expect(recreated.revokedBy).toBe(original.revokedBy);
      expect(recreated.metadata).toEqual(original.metadata);
    });

    it('세션 생명주기 테스트: create → updateActivity → revoke', () => {
      const futureExpiresAt = new Date(Date.now() + 3600000);
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.HTTP,
        deviceInfo: mockDeviceInfo,
        expiresAt: futureExpiresAt,
        createdAt: mockCreatedAt,
      });

      expect(session.isActive()).toBe(true);
      expect(session.isTerminated()).toBe(false);

      const updatedSession = session.updateActivity();

      expect(updatedSession.isActive()).toBe(true);
      expect(updatedSession.lastActiveAt.getTime()).toBeGreaterThan(
        session.lastActiveAt.getTime(),
      );

      const revokedSession = updatedSession.revoke();

      expect(revokedSession.isActive()).toBe(false);
      expect(revokedSession.isTerminated()).toBe(true);
      expect(revokedSession.status).toBe(SessionStatus.REVOKED);
    });

    it('세션 생명주기 테스트: create → expire', () => {
      const futureExpiresAt = new Date(Date.now() + 3600000);
      const session = UserSession.create({
        uid: mockUid,
        userId: mockUserId,
        sessionId: mockSessionId,
        type: SessionType.WEBSOCKET,
        deviceInfo: mockDeviceInfo,
        expiresAt: futureExpiresAt,
        createdAt: mockCreatedAt,
      });

      expect(session.isActive()).toBe(true);

      const expiredSession = session.expire();

      expect(expiredSession.isActive()).toBe(false);
      expect(expiredSession.isTerminated()).toBe(true);
      expect(expiredSession.status).toBe(SessionStatus.EXPIRED);
    });
  });
});
