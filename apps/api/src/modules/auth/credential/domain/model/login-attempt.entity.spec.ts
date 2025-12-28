// src/modules/auth/credential/domain/model/login-attempt.entity.spec.ts
import {
  LoginAttempt,
  LoginAttemptResult,
  LoginFailureReason,
} from './login-attempt.entity';

describe('LoginAttempt Entity', () => {
  const mockUid = 'clx1234567890';
  const mockUserId = 'user-123';
  const mockEmail = 'user@example.com';
  const mockIpAddress = '192.168.1.1';
  const mockUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
  const mockDeviceFingerprint = 'fingerprint-abc123';
  const mockAttemptedAt = new Date('2024-01-01T00:00:00Z');

  describe('createSuccess', () => {
    it('성공한 로그인 시도를 생성한다', () => {
      const attempt = LoginAttempt.createSuccess({
        uid: mockUid,
        userId: mockUserId,
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
        deviceFingerprint: mockDeviceFingerprint,
        isMobile: false,
        email: mockEmail,
        isAdmin: false,
        attemptedAt: mockAttemptedAt,
      });

      expect(attempt.id).toBeNull();
      expect(attempt.uid).toBe(mockUid);
      expect(attempt.userId).toBe(mockUserId);
      expect(attempt.result).toBe(LoginAttemptResult.SUCCESS);
      expect(attempt.failureReason).toBeNull();
      expect(attempt.ipAddress).toBe(mockIpAddress);
      expect(attempt.userAgent).toBe(mockUserAgent);
      expect(attempt.deviceFingerprint).toBe(mockDeviceFingerprint);
      expect(attempt.isMobile).toBe(false);
      expect(attempt.email).toBe(mockEmail);
      expect(attempt.isAdmin).toBe(false);
      expect(attempt.attemptedAt).toEqual(mockAttemptedAt);
    });

    it('선택적 파라미터 없이 성공한 로그인 시도를 생성한다', () => {
      const attempt = LoginAttempt.createSuccess({
        uid: mockUid,
        userId: mockUserId,
      });

      expect(attempt.id).toBeNull();
      expect(attempt.uid).toBe(mockUid);
      expect(attempt.userId).toBe(mockUserId);
      expect(attempt.result).toBe(LoginAttemptResult.SUCCESS);
      expect(attempt.failureReason).toBeNull();
      expect(attempt.ipAddress).toBeNull();
      expect(attempt.userAgent).toBeNull();
      expect(attempt.deviceFingerprint).toBeNull();
      expect(attempt.isMobile).toBeNull();
      expect(attempt.email).toBeNull();
      expect(attempt.isAdmin).toBe(false);
      expect(attempt.attemptedAt).toBeInstanceOf(Date);
    });

    it('관리자 로그인 시도를 생성한다', () => {
      const attempt = LoginAttempt.createSuccess({
        uid: mockUid,
        userId: mockUserId,
        isAdmin: true,
      });

      expect(attempt.isAdmin).toBe(true);
      expect(attempt.result).toBe(LoginAttemptResult.SUCCESS);
    });

    it('모바일 디바이스에서의 로그인 시도를 생성한다', () => {
      const attempt = LoginAttempt.createSuccess({
        uid: mockUid,
        userId: mockUserId,
        isMobile: true,
      });

      expect(attempt.isMobile).toBe(true);
    });

    it('attemptedAt을 지정하지 않으면 현재 시간을 사용한다', () => {
      const before = new Date();
      const attempt = LoginAttempt.createSuccess({
        uid: mockUid,
        userId: mockUserId,
      });
      const after = new Date();

      expect(attempt.attemptedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(attempt.attemptedAt.getTime()).toBeLessThanOrEqual(
        after.getTime(),
      );
    });
  });

  describe('createFailure', () => {
    it('실패한 로그인 시도를 생성한다', () => {
      const attempt = LoginAttempt.createFailure({
        uid: mockUid,
        failureReason: LoginFailureReason.INVALID_CREDENTIALS,
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
        email: mockEmail,
        attemptedAt: mockAttemptedAt,
      });

      expect(attempt.id).toBeNull();
      expect(attempt.uid).toBe(mockUid);
      expect(attempt.userId).toBeNull();
      expect(attempt.result).toBe(LoginAttemptResult.FAILED);
      expect(attempt.failureReason).toBe(
        LoginFailureReason.INVALID_CREDENTIALS,
      );
      expect(attempt.ipAddress).toBe(mockIpAddress);
      expect(attempt.userAgent).toBe(mockUserAgent);
      expect(attempt.email).toBe(mockEmail);
      expect(attempt.attemptedAt).toEqual(mockAttemptedAt);
    });

    it('사용자 ID가 포함된 실패한 로그인 시도를 생성한다', () => {
      const attempt = LoginAttempt.createFailure({
        uid: mockUid,
        userId: mockUserId,
        failureReason: LoginFailureReason.INVALID_CREDENTIALS,
      });

      expect(attempt.userId).toBe(mockUserId);
      expect(attempt.result).toBe(LoginAttemptResult.FAILED);
    });

    it('다양한 실패 이유로 실패한 로그인 시도를 생성한다', () => {
      const reasons = [
        LoginFailureReason.INVALID_CREDENTIALS,
        LoginFailureReason.USER_NOT_FOUND,
        LoginFailureReason.ACCOUNT_SUSPENDED,
        LoginFailureReason.ACCOUNT_CLOSED,
        LoginFailureReason.THROTTLE_LIMIT_EXCEEDED,
        LoginFailureReason.UNKNOWN,
      ];

      reasons.forEach((reason) => {
        const attempt = LoginAttempt.createFailure({
          uid: mockUid,
          failureReason: reason,
        });

        expect(attempt.result).toBe(LoginAttemptResult.FAILED);
        expect(attempt.failureReason).toBe(reason);
      });
    });

    it('선택적 파라미터 없이 실패한 로그인 시도를 생성한다', () => {
      const attempt = LoginAttempt.createFailure({
        uid: mockUid,
        failureReason: LoginFailureReason.INVALID_CREDENTIALS,
      });

      expect(attempt.id).toBeNull();
      expect(attempt.uid).toBe(mockUid);
      expect(attempt.userId).toBeNull();
      expect(attempt.result).toBe(LoginAttemptResult.FAILED);
      expect(attempt.failureReason).toBe(
        LoginFailureReason.INVALID_CREDENTIALS,
      );
      expect(attempt.ipAddress).toBeNull();
      expect(attempt.userAgent).toBeNull();
      expect(attempt.email).toBeNull();
      expect(attempt.isAdmin).toBe(false);
    });

    it('관리자 로그인 실패 시도를 생성한다', () => {
      const attempt = LoginAttempt.createFailure({
        uid: mockUid,
        failureReason: LoginFailureReason.INVALID_CREDENTIALS,
        isAdmin: true,
      });

      expect(attempt.isAdmin).toBe(true);
      expect(attempt.result).toBe(LoginAttemptResult.FAILED);
    });

    it('attemptedAt을 지정하지 않으면 현재 시간을 사용한다', () => {
      const before = new Date();
      const attempt = LoginAttempt.createFailure({
        uid: mockUid,
        failureReason: LoginFailureReason.INVALID_CREDENTIALS,
      });
      const after = new Date();

      expect(attempt.attemptedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(attempt.attemptedAt.getTime()).toBeLessThanOrEqual(
        after.getTime(),
      );
    });
  });

  describe('fromPersistence', () => {
    it('DB 데이터로부터 성공한 로그인 시도 엔티티를 생성한다', () => {
      const attempt = LoginAttempt.fromPersistence({
        id: BigInt(1),
        uid: mockUid,
        userId: mockUserId,
        result: 'SUCCESS',
        failureReason: null,
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
        deviceFingerprint: mockDeviceFingerprint,
        isMobile: false,
        attemptedAt: mockAttemptedAt,
        email: mockEmail,
        isAdmin: false,
      });

      expect(attempt.id).toBe(BigInt(1));
      expect(attempt.uid).toBe(mockUid);
      expect(attempt.userId).toBe(mockUserId);
      expect(attempt.result).toBe(LoginAttemptResult.SUCCESS);
      expect(attempt.failureReason).toBeNull();
      expect(attempt.ipAddress).toBe(mockIpAddress);
      expect(attempt.userAgent).toBe(mockUserAgent);
      expect(attempt.deviceFingerprint).toBe(mockDeviceFingerprint);
      expect(attempt.isMobile).toBe(false);
      expect(attempt.email).toBe(mockEmail);
      expect(attempt.isAdmin).toBe(false);
      expect(attempt.attemptedAt).toEqual(mockAttemptedAt);
    });

    it('DB 데이터로부터 실패한 로그인 시도 엔티티를 생성한다', () => {
      const attempt = LoginAttempt.fromPersistence({
        id: BigInt(2),
        uid: mockUid,
        userId: mockUserId,
        result: 'FAILED',
        failureReason: 'INVALID_CREDENTIALS',
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
        deviceFingerprint: null,
        isMobile: null,
        attemptedAt: mockAttemptedAt,
        email: mockEmail,
        isAdmin: false,
      });

      expect(attempt.id).toBe(BigInt(2));
      expect(attempt.uid).toBe(mockUid);
      expect(attempt.userId).toBe(mockUserId);
      expect(attempt.result).toBe(LoginAttemptResult.FAILED);
      expect(attempt.failureReason).toBe(
        LoginFailureReason.INVALID_CREDENTIALS,
      );
    });

    it('null id를 가진 엔티티를 생성한다', () => {
      const attempt = LoginAttempt.fromPersistence({
        id: null,
        uid: mockUid,
        userId: mockUserId,
        result: 'SUCCESS',
        failureReason: null,
        ipAddress: null,
        userAgent: null,
        deviceFingerprint: null,
        isMobile: null,
        attemptedAt: mockAttemptedAt,
        email: null,
        isAdmin: false,
      });

      expect(attempt.id).toBeNull();
      expect(attempt.uid).toBe(mockUid);
    });

    it('관리자 로그인 시도 엔티티를 생성한다', () => {
      const attempt = LoginAttempt.fromPersistence({
        id: BigInt(3),
        uid: mockUid,
        userId: mockUserId,
        result: 'SUCCESS',
        failureReason: null,
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
        deviceFingerprint: mockDeviceFingerprint,
        isMobile: false,
        attemptedAt: mockAttemptedAt,
        email: mockEmail,
        isAdmin: true,
      });

      expect(attempt.isAdmin).toBe(true);
      expect(attempt.result).toBe(LoginAttemptResult.SUCCESS);
    });

    it('모든 선택적 필드가 null인 엔티티를 생성한다', () => {
      const attempt = LoginAttempt.fromPersistence({
        id: BigInt(4),
        uid: mockUid,
        userId: null,
        result: 'FAILED',
        failureReason: 'UNKNOWN',
        ipAddress: null,
        userAgent: null,
        deviceFingerprint: null,
        isMobile: null,
        attemptedAt: mockAttemptedAt,
        email: null,
        isAdmin: false,
      });

      expect(attempt.ipAddress).toBeNull();
      expect(attempt.userAgent).toBeNull();
      expect(attempt.deviceFingerprint).toBeNull();
      expect(attempt.isMobile).toBeNull();
      expect(attempt.email).toBeNull();
      expect(attempt.userId).toBeNull();
    });

    it('잘못된 result 값에 대해 에러를 발생시킨다', () => {
      expect(() => {
        LoginAttempt.fromPersistence({
          id: BigInt(5),
          uid: mockUid,
          userId: mockUserId,
          result: 'INVALID_RESULT',
          failureReason: null,
          ipAddress: null,
          userAgent: null,
          deviceFingerprint: null,
          isMobile: null,
          attemptedAt: mockAttemptedAt,
          email: null,
          isAdmin: false,
        });
      }).toThrow('Invalid LoginAttemptResult');
    });

    it('잘못된 failureReason 값에 대해 에러를 발생시킨다', () => {
      expect(() => {
        LoginAttempt.fromPersistence({
          id: BigInt(6),
          uid: mockUid,
          userId: mockUserId,
          result: 'FAILED',
          failureReason: 'INVALID_REASON',
          ipAddress: null,
          userAgent: null,
          deviceFingerprint: null,
          isMobile: null,
          attemptedAt: mockAttemptedAt,
          email: null,
          isAdmin: false,
        });
      }).toThrow('Invalid LoginFailureReason');
    });

    it('성공한 로그인 시도에 failureReason이 있으면 에러를 발생시킨다', () => {
      expect(() => {
        LoginAttempt.fromPersistence({
          id: BigInt(7),
          uid: mockUid,
          userId: mockUserId,
          result: 'SUCCESS',
          failureReason: 'INVALID_CREDENTIALS',
          ipAddress: null,
          userAgent: null,
          deviceFingerprint: null,
          isMobile: null,
          attemptedAt: mockAttemptedAt,
          email: null,
          isAdmin: false,
        });
      }).toThrow('LoginAttemptResult.SUCCESS cannot have a failureReason');
    });

    it('실패한 로그인 시도에 failureReason이 없으면 에러를 발생시킨다', () => {
      expect(() => {
        LoginAttempt.fromPersistence({
          id: BigInt(8),
          uid: mockUid,
          userId: mockUserId,
          result: 'FAILED',
          failureReason: null,
          ipAddress: null,
          userAgent: null,
          deviceFingerprint: null,
          isMobile: null,
          attemptedAt: mockAttemptedAt,
          email: null,
          isAdmin: false,
        });
      }).toThrow('LoginAttemptResult.FAILED must have a failureReason');
    });
  });

  describe('isSuccess', () => {
    it('성공한 로그인 시도에 대해 true를 반환한다', () => {
      const attempt = LoginAttempt.createSuccess({
        uid: mockUid,
        userId: mockUserId,
      });

      expect(attempt.isSuccess()).toBe(true);
    });

    it('실패한 로그인 시도에 대해 false를 반환한다', () => {
      const attempt = LoginAttempt.createFailure({
        uid: mockUid,
        failureReason: LoginFailureReason.INVALID_CREDENTIALS,
      });

      expect(attempt.isSuccess()).toBe(false);
    });
  });

  describe('isFailure', () => {
    it('실패한 로그인 시도에 대해 true를 반환한다', () => {
      const attempt = LoginAttempt.createFailure({
        uid: mockUid,
        failureReason: LoginFailureReason.INVALID_CREDENTIALS,
      });

      expect(attempt.isFailure()).toBe(true);
    });

    it('성공한 로그인 시도에 대해 false를 반환한다', () => {
      const attempt = LoginAttempt.createSuccess({
        uid: mockUid,
        userId: mockUserId,
      });

      expect(attempt.isFailure()).toBe(false);
    });
  });

  describe('hasFailureReason', () => {
    it('특정 실패 이유와 일치하면 true를 반환한다', () => {
      const attempt = LoginAttempt.createFailure({
        uid: mockUid,
        failureReason: LoginFailureReason.ACCOUNT_SUSPENDED,
      });

      expect(
        attempt.hasFailureReason(LoginFailureReason.ACCOUNT_SUSPENDED),
      ).toBe(true);
    });

    it('특정 실패 이유와 일치하지 않으면 false를 반환한다', () => {
      const attempt = LoginAttempt.createFailure({
        uid: mockUid,
        failureReason: LoginFailureReason.INVALID_CREDENTIALS,
      });

      expect(
        attempt.hasFailureReason(LoginFailureReason.ACCOUNT_SUSPENDED),
      ).toBe(false);
    });

    it('성공한 로그인 시도에 대해 false를 반환한다', () => {
      const attempt = LoginAttempt.createSuccess({
        uid: mockUid,
        userId: mockUserId,
      });

      expect(
        attempt.hasFailureReason(LoginFailureReason.INVALID_CREDENTIALS),
      ).toBe(false);
    });
  });

  describe('toPersistence', () => {
    it('성공한 로그인 시도를 Persistence 형식으로 변환한다', () => {
      const attempt = LoginAttempt.createSuccess({
        uid: mockUid,
        userId: mockUserId,
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
        deviceFingerprint: mockDeviceFingerprint,
        isMobile: false,
        email: mockEmail,
        isAdmin: false,
        attemptedAt: mockAttemptedAt,
      });

      const persistence = attempt.toPersistence();

      expect(persistence).toEqual({
        id: null,
        uid: mockUid,
        userId: mockUserId,
        result: LoginAttemptResult.SUCCESS,
        failureReason: null,
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
        deviceFingerprint: mockDeviceFingerprint,
        isMobile: false,
        attemptedAt: mockAttemptedAt,
        email: mockEmail,
        isAdmin: false,
      });
    });

    it('실패한 로그인 시도를 Persistence 형식으로 변환한다', () => {
      const attempt = LoginAttempt.createFailure({
        uid: mockUid,
        failureReason: LoginFailureReason.INVALID_CREDENTIALS,
        ipAddress: mockIpAddress,
        email: mockEmail,
        attemptedAt: mockAttemptedAt,
      });

      const persistence = attempt.toPersistence();

      expect(persistence).toEqual({
        id: null,
        uid: mockUid,
        userId: null,
        result: LoginAttemptResult.FAILED,
        failureReason: LoginFailureReason.INVALID_CREDENTIALS,
        ipAddress: mockIpAddress,
        userAgent: null,
        deviceFingerprint: null,
        isMobile: null,
        attemptedAt: mockAttemptedAt,
        email: mockEmail,
        isAdmin: false,
      });
    });

    it('영속화된 엔티티를 Persistence 형식으로 변환한다', () => {
      const attempt = LoginAttempt.fromPersistence({
        id: BigInt(123),
        uid: mockUid,
        userId: mockUserId,
        result: 'SUCCESS',
        failureReason: null,
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
        deviceFingerprint: mockDeviceFingerprint,
        isMobile: true,
        attemptedAt: mockAttemptedAt,
        email: mockEmail,
        isAdmin: true,
      });

      const persistence = attempt.toPersistence();

      expect(persistence.id).toBe(BigInt(123));
      expect(persistence.uid).toBe(mockUid);
      expect(persistence.isAdmin).toBe(true);
    });
  });

  describe('Integration', () => {
    it('createSuccess → toPersistence → fromPersistence 순환 테스트', () => {
      const original = LoginAttempt.createSuccess({
        uid: mockUid,
        userId: mockUserId,
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
        deviceFingerprint: mockDeviceFingerprint,
        isMobile: false,
        email: mockEmail,
        isAdmin: false,
        attemptedAt: mockAttemptedAt,
      });

      const persistence = original.toPersistence();
      const recreated = LoginAttempt.fromPersistence({
        id: BigInt(1),
        uid: persistence.uid,
        userId: persistence.userId,
        result: persistence.result,
        failureReason: persistence.failureReason,
        ipAddress: persistence.ipAddress,
        userAgent: persistence.userAgent,
        deviceFingerprint: persistence.deviceFingerprint,
        isMobile: persistence.isMobile,
        attemptedAt: persistence.attemptedAt,
        email: persistence.email,
        isAdmin: persistence.isAdmin,
      });

      expect(recreated.uid).toBe(original.uid);
      expect(recreated.userId).toBe(original.userId);
      expect(recreated.result).toBe(original.result);
      expect(recreated.failureReason).toBe(original.failureReason);
      expect(recreated.ipAddress).toBe(original.ipAddress);
      expect(recreated.userAgent).toBe(original.userAgent);
      expect(recreated.deviceFingerprint).toBe(original.deviceFingerprint);
      expect(recreated.isMobile).toBe(original.isMobile);
      expect(recreated.email).toBe(original.email);
      expect(recreated.isAdmin).toBe(original.isAdmin);
      expect(recreated.attemptedAt).toEqual(original.attemptedAt);
    });

    it('createFailure → toPersistence → fromPersistence 순환 테스트', () => {
      const original = LoginAttempt.createFailure({
        uid: mockUid,
        userId: mockUserId,
        failureReason: LoginFailureReason.ACCOUNT_CLOSED,
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
        deviceFingerprint: mockDeviceFingerprint,
        isMobile: true,
        email: mockEmail,
        isAdmin: true,
        attemptedAt: mockAttemptedAt,
      });

      const persistence = original.toPersistence();
      const recreated = LoginAttempt.fromPersistence({
        id: BigInt(2),
        uid: persistence.uid,
        userId: persistence.userId,
        result: persistence.result,
        failureReason: persistence.failureReason,
        ipAddress: persistence.ipAddress,
        userAgent: persistence.userAgent,
        deviceFingerprint: persistence.deviceFingerprint,
        isMobile: persistence.isMobile,
        attemptedAt: persistence.attemptedAt,
        email: persistence.email,
        isAdmin: persistence.isAdmin,
      });

      expect(recreated.uid).toBe(original.uid);
      expect(recreated.userId).toBe(original.userId);
      expect(recreated.result).toBe(original.result);
      expect(recreated.failureReason).toBe(original.failureReason);
      expect(recreated.ipAddress).toBe(original.ipAddress);
      expect(recreated.userAgent).toBe(original.userAgent);
      expect(recreated.deviceFingerprint).toBe(original.deviceFingerprint);
      expect(recreated.isMobile).toBe(original.isMobile);
      expect(recreated.email).toBe(original.email);
      expect(recreated.isAdmin).toBe(original.isAdmin);
      expect(recreated.attemptedAt).toEqual(original.attemptedAt);
    });
  });
});
