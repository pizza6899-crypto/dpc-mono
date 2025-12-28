// src/modules/auth/credential/application/logout.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { LogoutService } from './logout.service';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';
import { ActivityType } from 'src/platform/activity-log/activity-log.types';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';

describe('LogoutService', () => {
  let service: LogoutService;
  let mockActivityLog: jest.Mocked<ActivityLogPort>;

  const mockUserId = 'user-123';
  const mockAdminUserId = 'admin-123';

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [LogoutService, mockActivityLogProvider],
    })
      .setLogger(new Logger())
      .compile();

    service = module.get<LogoutService>(LogoutService);
    mockActivityLog = module.get(ACTIVITY_LOG);

    jest.clearAllMocks();
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

      loggerErrorSpy.mockRestore();
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
