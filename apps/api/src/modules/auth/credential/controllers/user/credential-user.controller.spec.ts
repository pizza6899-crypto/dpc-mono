// src/modules/auth/credential/controllers/user/credential-user.controller.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { ExecutionContext } from '@nestjs/common';
import { CredentialUserController } from './credential-user.controller';
import { LoginService } from '../../application/login.service';
import { LogoutService } from '../../application/logout.service';
import { CredentialUserLoginRequestDto } from './dto/request/login.request.dto';
import type { CurrentUserWithSession } from 'src/platform/auth/decorators/current-user.decorator';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import { UserRoleType } from '@repo/database';
import type { Request } from 'express';

describe('CredentialUserController', () => {
  let controller: CredentialUserController;
  let mockLoginService: jest.Mocked<LoginService>;
  let mockLogoutService: jest.Mocked<LogoutService>;

  const mockUser: CurrentUserWithSession = {
    id: 'user-123',
    email: 'user@example.com',
    role: UserRoleType.USER,
    sessionId: 'session-123',
  };

  const mockAdminUser: CurrentUserWithSession = {
    id: 'admin-123',
    email: 'admin@example.com',
    role: UserRoleType.ADMIN,
    sessionId: 'session-456',
  };

  const mockSuperAdminUser: CurrentUserWithSession = {
    id: 'super-admin-123',
    email: 'superadmin@example.com',
    role: UserRoleType.SUPER_ADMIN,
    sessionId: 'session-789',
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

  const mockLoginDto: CredentialUserLoginRequestDto = {
    email: 'user@example.com',
    password: 'password123',
  };

  beforeEach(async () => {
    const mockLoginServiceProvider = {
      provide: LoginService,
      useValue: {
        execute: jest.fn(),
      },
    };

    const mockLogoutServiceProvider = {
      provide: LogoutService,
      useValue: {
        execute: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CredentialUserController],
      providers: [mockLoginServiceProvider, mockLogoutServiceProvider],
    }).compile();

    controller = module.get<CredentialUserController>(
      CredentialUserController,
    );
    mockLoginService = module.get(LoginService);
    mockLogoutService = module.get(LogoutService);

    jest.clearAllMocks();
  });

  describe('login', () => {
    it('로그인 성공 시 사용자 정보를 반환하고 isAdmin=false로 LoginService를 호출해야 함', async () => {
      // Arrange
      mockLoginService.execute.mockResolvedValue(undefined);

      // Act
      const result = await controller.login(
        mockUser,
        mockClientInfo,
        mockLoginDto,
      );

      // Assert
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
        },
      });

      expect(mockLoginService.execute).toHaveBeenCalledTimes(1);
      expect(mockLoginService.execute).toHaveBeenCalledWith({
        user: mockUser,
        clientInfo: mockClientInfo,
        isAdmin: false,
      });
    });

    it('LoginService가 에러를 던지면 예외를 전파해야 함', async () => {
      // Arrange
      const error = new Error('Login service error');
      mockLoginService.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.login(mockUser, mockClientInfo, mockLoginDto),
      ).rejects.toThrow('Login service error');

      expect(mockLoginService.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('logout', () => {
    it('일반 사용자 로그아웃 시 isAdmin=false로 LogoutService를 호출하고 세션을 종료해야 함', async () => {
      // Arrange
      mockLogoutService.execute.mockResolvedValue(undefined);

      const mockRequest = {
        logout: jest.fn((callback: (err?: Error) => void) => {
          callback();
        }),
        session: {
          destroy: jest.fn((callback: (err?: Error) => void) => {
            callback();
          }),
        },
      } as unknown as Request;

      // Act
      await controller.logout(mockUser, mockClientInfo, mockRequest);

      // Assert
      expect(mockLogoutService.execute).toHaveBeenCalledTimes(1);
      expect(mockLogoutService.execute).toHaveBeenCalledWith({
        userId: mockUser.id,
        clientInfo: mockClientInfo,
        isAdmin: false,
      });

      expect(mockRequest.logout).toHaveBeenCalledTimes(1);
      expect(mockRequest.session.destroy).toHaveBeenCalledTimes(1);
    });

    it('관리자 로그아웃 시 isAdmin=true로 LogoutService를 호출해야 함', async () => {
      // Arrange
      mockLogoutService.execute.mockResolvedValue(undefined);

      const mockRequest = {
        logout: jest.fn((callback: (err?: Error) => void) => {
          callback();
        }),
        session: {
          destroy: jest.fn((callback: (err?: Error) => void) => {
            callback();
          }),
        },
      } as unknown as Request;

      // Act
      await controller.logout(mockAdminUser, mockClientInfo, mockRequest);

      // Assert
      expect(mockLogoutService.execute).toHaveBeenCalledWith({
        userId: mockAdminUser.id,
        clientInfo: mockClientInfo,
        isAdmin: true,
      });
    });

    it('SUPER_ADMIN 역할 사용자 로그아웃 시 isAdmin=true로 LogoutService를 호출해야 함', async () => {
      // Arrange
      mockLogoutService.execute.mockResolvedValue(undefined);

      const mockRequest = {
        logout: jest.fn((callback: (err?: Error) => void) => {
          callback();
        }),
        session: {
          destroy: jest.fn((callback: (err?: Error) => void) => {
            callback();
          }),
        },
      } as unknown as Request;

      // Act
      await controller.logout(mockSuperAdminUser, mockClientInfo, mockRequest);

      // Assert
      expect(mockLogoutService.execute).toHaveBeenCalledWith({
        userId: mockSuperAdminUser.id,
        clientInfo: mockClientInfo,
        isAdmin: true,
      });
    });

    it('req.logout이 실패하면 예외를 던져야 함', async () => {
      // Arrange
      mockLogoutService.execute.mockResolvedValue(undefined);

      const logoutError = new Error('Logout failed');
      const mockRequest = {
        logout: jest.fn((callback: (err?: Error) => void) => {
          callback(logoutError);
        }),
        session: {
          destroy: jest.fn(),
        },
      } as unknown as Request;

      // Act & Assert
      await expect(
        controller.logout(mockUser, mockClientInfo, mockRequest),
      ).rejects.toThrow('Logout failed');

      expect(mockLogoutService.execute).toHaveBeenCalledTimes(1);
      expect(mockRequest.session.destroy).not.toHaveBeenCalled();
    });

    it('req.session.destroy가 실패하면 예외를 던져야 함', async () => {
      // Arrange
      mockLogoutService.execute.mockResolvedValue(undefined);

      const destroyError = new Error('Session destroy failed');
      const mockRequest = {
        logout: jest.fn((callback: (err?: Error) => void) => {
          callback();
        }),
        session: {
          destroy: jest.fn((callback: (err?: Error) => void) => {
            callback(destroyError);
          }),
        },
      } as unknown as Request;

      // Act & Assert
      await expect(
        controller.logout(mockUser, mockClientInfo, mockRequest),
      ).rejects.toThrow('Session destroy failed');

      expect(mockLogoutService.execute).toHaveBeenCalledTimes(1);
      expect(mockRequest.logout).toHaveBeenCalledTimes(1);
      expect(mockRequest.session.destroy).toHaveBeenCalledTimes(1);
    });

    it('LogoutService가 에러를 던지면 예외를 전파해야 함', async () => {
      // Arrange
      const error = new Error('Logout service error');
      mockLogoutService.execute.mockRejectedValue(error);

      const mockRequest = {
        logout: jest.fn(),
        session: {
          destroy: jest.fn(),
        },
      } as unknown as Request;

      // Act & Assert
      await expect(
        controller.logout(mockUser, mockClientInfo, mockRequest),
      ).rejects.toThrow('Logout service error');

      expect(mockLogoutService.execute).toHaveBeenCalledTimes(1);
      expect(mockRequest.logout).not.toHaveBeenCalled();
    });
  });

  describe('checkStatus', () => {
    it('인증된 사용자의 경우 isAuthenticated=true와 사용자 정보를 반환해야 함', async () => {
      // Arrange
      const mockRequest = {
        isAuthenticated: jest.fn().mockReturnValue(true),
      } as unknown as Request;

      // Act
      const result = await controller.checkStatus(mockRequest, mockUser);

      // Assert
      expect(result).toEqual({
        isAuthenticated: true,
        user: {
          id: mockUser.id,
          email: mockUser.email,
        },
      });

      expect(mockRequest.isAuthenticated).toHaveBeenCalledTimes(1);
    });

    it('인증되지 않은 사용자의 경우 isAuthenticated=false와 user=null을 반환해야 함', async () => {
      // Arrange
      const mockRequest = {
        isAuthenticated: jest.fn().mockReturnValue(false),
      } as unknown as Request;

      // Act
      const result = await controller.checkStatus(mockRequest, undefined);

      // Assert
      expect(result).toEqual({
        isAuthenticated: false,
        user: null,
      });

      expect(mockRequest.isAuthenticated).toHaveBeenCalledTimes(1);
    });

    it('req.isAuthenticated()가 false인 경우 isAuthenticated=false를 반환해야 함', async () => {
      // Arrange
      const mockRequest = {
        isAuthenticated: jest.fn().mockReturnValue(false),
      } as unknown as Request;

      // Act
      const result = await controller.checkStatus(mockRequest, mockUser);

      // Assert
      expect(result).toEqual({
        isAuthenticated: false,
        user: null,
      });
    });

    it('user가 undefined인 경우 isAuthenticated=false를 반환해야 함', async () => {
      // Arrange
      const mockRequest = {
        isAuthenticated: jest.fn().mockReturnValue(true),
      } as unknown as Request;

      // Act
      const result = await controller.checkStatus(mockRequest, undefined);

      // Assert
      expect(result).toEqual({
        isAuthenticated: false,
        user: null,
      });
    });
  });
});

