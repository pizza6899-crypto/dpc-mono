// src/modules/auth/credential/application/logout.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { LogoutService } from './logout.service';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { RevokeSessionService } from '../../session/application/revoke-session.service';

describe('LogoutService', () => {
  let module: TestingModule;
  let service: LogoutService;
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
    const mockRevokeSessionServiceProvider = {
      provide: RevokeSessionService,
      useValue: {
        execute: jest.fn().mockResolvedValue(undefined),
      },
    };

    module = await Test.createTestingModule({
      providers: [LogoutService, mockRevokeSessionServiceProvider],
    })
      .setLogger(new Logger())
      .compile();

    service = module.get<LogoutService>(LogoutService);
    mockRevokeSessionService = module.get(RevokeSessionService);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('execute', () => {
    it('사용자 로그아웃 시 세션을 정상적으로 종료해야 함', async () => {
      // Arrange
      const sessionId = 'session-123';
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
    });

    it('관리자 로그아웃 시 세션을 정상적으로 종료해야 함', async () => {
      // Arrange
      const sessionId = 'session-123';
      mockRevokeSessionService.execute.mockResolvedValue(undefined as any);

      // Act
      await service.execute({
        userId: mockAdminUserId,
        sessionId,
        clientInfo: mockClientInfo,
        isAdmin: true,
      });

      // Assert
      expect(mockRevokeSessionService.execute).toHaveBeenCalledTimes(1);
      expect(mockRevokeSessionService.execute).toHaveBeenCalledWith({
        sessionId,
        revokedBy: mockAdminUserId,
      });
    });

    it('isAdmin이 명시되지 않으면 기본값 false를 사용해야 함', async () => {
      // Arrange
      const sessionId = 'session-123';
      mockRevokeSessionService.execute.mockResolvedValue(undefined as any);

      // Act
      await service.execute({
        userId: mockUserId,
        sessionId,
        clientInfo: mockClientInfo,
        // isAdmin 생략
      });

      // Assert
      expect(mockRevokeSessionService.execute).toHaveBeenCalledTimes(1);
    });

    it('clientInfo 필드가 null이어도 정상적으로 처리해야 함', async () => {
      // Arrange
      const sessionId = 'session-123';
      mockRevokeSessionService.execute.mockResolvedValue(undefined as any);

      // Act
      await service.execute({
        userId: mockUserId,
        sessionId,
        clientInfo: mockClientInfoWithNulls,
        isAdmin: false,
      });

      // Assert
      expect(mockRevokeSessionService.execute).toHaveBeenCalledTimes(1);
    });

    it('sessionId가 있으면 revokeSessionService를 호출해야 함', async () => {
      // Arrange
      const sessionId = 'session-123';
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
    });

    it('revokeSessionService가 실패해도 로그아웃은 성공해야 함 (에러는 조용히 처리)', async () => {
      // Arrange
      const sessionId = 'session-123';
      const revokeError = new Error('Session revoke failed');
      mockRevokeSessionService.execute.mockRejectedValue(revokeError);

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

      loggerErrorSpy.mockRestore();
    });

    it('sessionId가 없으면 revokeSessionService를 호출하지 않아야 함', async () => {
      // Act
      await service.execute({
        userId: mockUserId,
        clientInfo: mockClientInfo,
        isAdmin: false,
      });

      // Assert
      expect(mockRevokeSessionService.execute).not.toHaveBeenCalled();
    });

    it('userId가 없으면 revokeSessionService를 호출하지 않아야 함', async () => {
      // Arrange
      const sessionId = 'session-123';

      // Act
      await service.execute({
        sessionId,
        clientInfo: mockClientInfo,
        isAdmin: false,
      });

      // Assert
      // sessionId만 있고 userId가 없으면 revokeSessionService도 호출되지 않음
      expect(mockRevokeSessionService.execute).not.toHaveBeenCalled();
    });

    it('모바일 기기에서 로그아웃 시도도 정상적으로 처리해야 함', async () => {
      // Arrange
      const mobileClientInfo: RequestClientInfo = {
        ...mockClientInfo,
        isMobile: true,
      };
      const sessionId = 'session-123';
      mockRevokeSessionService.execute.mockResolvedValue(undefined as any);

      // Act
      await service.execute({
        userId: mockUserId,
        sessionId,
        clientInfo: mobileClientInfo,
        isAdmin: false,
      });

      // Assert
      expect(mockRevokeSessionService.execute).toHaveBeenCalledTimes(1);
    });
  });
});
