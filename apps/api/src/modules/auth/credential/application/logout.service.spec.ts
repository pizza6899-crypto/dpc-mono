// src/modules/auth/credential/application/logout.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { LogoutService } from './logout.service';
import { ACTIVITY_LOG } from 'src/common/activity-log/activity-log.token';
import type { ActivityLogPort } from 'src/common/activity-log/activity-log.port';
import { ActivityType } from 'src/common/activity-log/activity-log.types';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { RevokeSessionService } from '../../session/application/revoke-session.service';
import { LogType } from 'src/modules/audit-log/domain';

describe('LogoutService', () => {
  let module: TestingModule;
  let service: LogoutService;
  let mockActivityLog: jest.Mocked<ActivityLogPort>;
  let mockDispatchLogService: jest.Mocked<DispatchLogService>;
  let mockRevokeSessionService: jest.Mocked<RevokeSessionService>;

  const mockUserId = BigInt(123);
  const mockAdminUserId = BigInt(456);

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
    path: '/auth/logout',
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
    const mockActivityLogProvider = {
      provide: ACTIVITY_LOG,
      useValue: {
        logSuccess: jest.fn(),
        logFailure: jest.fn(),
        log: jest.fn(),
      },
    };

    const mockDispatchLogServiceProvider = {
      provide: DispatchLogService,
      useValue: {
        dispatch: jest.fn().mockResolvedValue(undefined),
      },
    };

    const mockRevokeSessionServiceProvider = {
      provide: RevokeSessionService,
      useValue: {
        execute: jest.fn().mockResolvedValue(undefined),
      },
    };

    module = await Test.createTestingModule({
      providers: [
        LogoutService,
        mockActivityLogProvider,
        mockDispatchLogServiceProvider,
        mockRevokeSessionServiceProvider,
      ],
    })
      .setLogger(new Logger())
      .compile();

    service = module.get<LogoutService>(LogoutService);
    mockActivityLog = module.get(ACTIVITY_LOG);
    mockDispatchLogService = module.get(DispatchLogService);
    mockRevokeSessionService = module.get(RevokeSessionService);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('execute', () => {
    it('사용자 로그아웃 시 USER_LOGOUT 액티비티 타입으로 기록해야 함', async () => {
      // Arrange
      mockActivityLog.logSuccess.mockResolvedValue(undefined);

      // Act
      await service.execute({
        userId: mockUserId,
        clientInfo: mockClientInfo,
        isAdmin: false,
      });

      // Assert
      expect(mockActivityLog.logSuccess).toHaveBeenCalledTimes(1);
      expect(mockActivityLog.logSuccess).toHaveBeenCalledWith(
        {
          userId: mockUserId,
          activityType: ActivityType.USER_LOGOUT,
          description: 'User logged out',
        },
        mockClientInfo,
      );
      expect(mockDispatchLogService.dispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatchLogService.dispatch).toHaveBeenCalledWith({
        type: LogType.AUTH,
        data: {
          userId: mockUserId.toString(),
          action: 'USER_LOGOUT',
          status: 'SUCCESS',
          ip: mockClientInfo.ip,
          userAgent: mockClientInfo.userAgent,
          metadata: {
            isAdmin: false,
          },
        },
      });
    });

    it('관리자 로그아웃 시 isAdmin=true로 기록하고 ADMIN_LOGOUT 액티비티 타입을 사용해야 함', async () => {
      // Arrange
      mockActivityLog.logSuccess.mockResolvedValue(undefined);

      // Act
      await service.execute({
        userId: mockAdminUserId,
        clientInfo: mockClientInfo,
        isAdmin: true,
      });

      // Assert
      expect(mockActivityLog.logSuccess).toHaveBeenCalledWith(
        {
          userId: mockAdminUserId,
          activityType: ActivityType.ADMIN_LOGOUT,
          description: 'Admin logged out',
        },
        mockClientInfo,
      );
      expect(mockDispatchLogService.dispatch).toHaveBeenCalledWith({
        type: LogType.AUTH,
        data: {
          userId: mockAdminUserId.toString(),
          action: 'ADMIN_LOGOUT',
          status: 'SUCCESS',
          ip: mockClientInfo.ip,
          userAgent: mockClientInfo.userAgent,
          metadata: {
            isAdmin: true,
          },
        },
      });
    });

    it('isAdmin이 명시되지 않으면 기본값 false를 사용해야 함', async () => {
      // Arrange
      mockActivityLog.logSuccess.mockResolvedValue(undefined);

      // Act
      await service.execute({
        userId: mockUserId,
        clientInfo: mockClientInfo,
        // isAdmin 생략
      });

      // Assert
      expect(mockActivityLog.logSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          activityType: ActivityType.USER_LOGOUT,
          description: 'User logged out',
        }),
        mockClientInfo,
      );
    });

    it('clientInfo 필드가 null이어도 정상적으로 처리해야 함', async () => {
      // Arrange
      mockActivityLog.logSuccess.mockResolvedValue(undefined);

      // Act
      await service.execute({
        userId: mockUserId,
        clientInfo: mockClientInfoWithNulls,
        isAdmin: false,
      });

      // Assert
      expect(mockActivityLog.logSuccess).toHaveBeenCalledTimes(1);
      expect(mockActivityLog.logSuccess).toHaveBeenCalledWith(
        {
          userId: mockUserId,
          activityType: ActivityType.USER_LOGOUT,
          description: 'User logged out',
        },
        mockClientInfoWithNulls,
      );
    });

    it('activityLog.logSuccess가 실패해도 로그아웃은 성공해야 함 (에러는 조용히 처리)', async () => {
      // Arrange
      const activityLogError = new Error('Activity log failed');
      mockActivityLog.logSuccess.mockRejectedValue(activityLogError);

      // Logger.error를 모킹하여 에러 로깅 확인
      const loggerErrorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => {});

      // Act
      await service.execute({
        userId: mockUserId,
        clientInfo: mockClientInfo,
        isAdmin: false,
      });

      // Assert
      expect(mockActivityLog.logSuccess).toHaveBeenCalledTimes(1);
      // 에러가 조용히 처리되어 예외가 전파되지 않아야 함
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        activityLogError,
        expect.stringContaining('Activity log 기록 실패 (로그아웃은 성공)'),
      );
      // Audit 로그는 여전히 호출되어야 함
      expect(mockDispatchLogService.dispatch).toHaveBeenCalledTimes(1);

      loggerErrorSpy.mockRestore();
    });

    it('dispatchLogService.dispatch가 실패해도 로그아웃은 성공해야 함 (에러는 조용히 처리)', async () => {
      // Arrange
      const auditLogError = new Error('Audit log failed');
      mockActivityLog.logSuccess.mockResolvedValue(undefined);
      mockDispatchLogService.dispatch.mockRejectedValue(auditLogError);

      // Logger.error를 모킹하여 에러 로깅 확인
      const loggerErrorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => {});

      // Act
      await service.execute({
        userId: mockUserId,
        clientInfo: mockClientInfo,
        isAdmin: false,
      });

      // Assert
      expect(mockActivityLog.logSuccess).toHaveBeenCalledTimes(1);
      expect(mockDispatchLogService.dispatch).toHaveBeenCalledTimes(1);
      // 에러가 조용히 처리되어 예외가 전파되지 않아야 함
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        auditLogError,
        expect.stringContaining('Audit log 기록 실패 (로그아웃은 성공)'),
      );

      loggerErrorSpy.mockRestore();
    });

    it('sessionId가 있으면 revokeSessionService를 호출해야 함', async () => {
      // Arrange
      const sessionId = 'session-123';
      mockActivityLog.logSuccess.mockResolvedValue(undefined);
      mockRevokeSessionService.execute.mockResolvedValue(undefined as any);

      // Act
      await service.execute({
        userId: mockUserId,
        sessionId,
        clientInfo: mockClientInfo,
        isAdmin: false,
      });

      // Assert
      expect(mockRevokeSessionService.execute).toHaveBeenCalledTimes(1);
      expect(mockRevokeSessionService.execute).toHaveBeenCalledWith({
        sessionId,
        revokedBy: mockUserId,
      });
      expect(mockActivityLog.logSuccess).toHaveBeenCalledTimes(1);
      expect(mockDispatchLogService.dispatch).toHaveBeenCalledTimes(1);
    });

    it('revokeSessionService가 실패해도 로그아웃은 성공해야 함 (에러는 조용히 처리)', async () => {
      // Arrange
      const sessionId = 'session-123';
      const revokeError = new Error('Session revoke failed');
      mockRevokeSessionService.execute.mockRejectedValue(revokeError);
      mockActivityLog.logSuccess.mockResolvedValue(undefined);

      // Logger.error를 모킹하여 에러 로깅 확인
      const loggerErrorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => {});

      // Act
      await service.execute({
        userId: mockUserId,
        sessionId,
        clientInfo: mockClientInfo,
        isAdmin: false,
      });

      // Assert
      expect(mockRevokeSessionService.execute).toHaveBeenCalledTimes(1);
      // 에러가 조용히 처리되어 예외가 전파되지 않아야 함
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        revokeError,
        expect.stringContaining('세션 종료 실패 (로그아웃은 성공)'),
      );
      // Activity log와 Audit log는 여전히 호출되어야 함
      expect(mockActivityLog.logSuccess).toHaveBeenCalledTimes(1);
      expect(mockDispatchLogService.dispatch).toHaveBeenCalledTimes(1);

      loggerErrorSpy.mockRestore();
    });

    it('sessionId가 없으면 revokeSessionService를 호출하지 않아야 함', async () => {
      // Arrange
      mockActivityLog.logSuccess.mockResolvedValue(undefined);

      // Act
      await service.execute({
        userId: mockUserId,
        clientInfo: mockClientInfo,
        isAdmin: false,
      });

      // Assert
      expect(mockRevokeSessionService.execute).not.toHaveBeenCalled();
      expect(mockActivityLog.logSuccess).toHaveBeenCalledTimes(1);
      expect(mockDispatchLogService.dispatch).toHaveBeenCalledTimes(1);
    });

    it('userId가 없으면 activity log와 audit log를 기록하지 않아야 함', async () => {
      // Arrange
      const sessionId = 'session-123';

      // Act
      await service.execute({
        sessionId,
        clientInfo: mockClientInfo,
        isAdmin: false,
      });

      // Assert
      expect(mockActivityLog.logSuccess).not.toHaveBeenCalled();
      expect(mockDispatchLogService.dispatch).not.toHaveBeenCalled();
      // sessionId만 있고 userId가 없으면 revokeSessionService도 호출되지 않음
      expect(mockRevokeSessionService.execute).not.toHaveBeenCalled();
    });

    it('모바일 기기에서 로그아웃 시도도 정상적으로 처리해야 함', async () => {
      // Arrange
      const mobileClientInfo: RequestClientInfo = {
        ...mockClientInfo,
        isMobile: true,
      };

      mockActivityLog.logSuccess.mockResolvedValue(undefined);

      // Act
      await service.execute({
        userId: mockUserId,
        clientInfo: mobileClientInfo,
        isAdmin: false,
      });

      // Assert
      expect(mockActivityLog.logSuccess).toHaveBeenCalledWith(
        {
          userId: mockUserId,
          activityType: ActivityType.USER_LOGOUT,
          description: 'User logged out',
        },
        mobileClientInfo,
      );
    });
  });
});
