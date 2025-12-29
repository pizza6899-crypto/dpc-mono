// src/modules/auth/credential/controllers/admin/credential-admin.controller.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CredentialAdminController } from './credential-admin.controller';
import { AuthenticateCredentialAdminService } from '../../application/authenticate-credential-admin.service';
import { LoginService } from '../../application/login.service';
import { LogoutService } from '../../application/logout.service';
import { FindLoginAttemptsService } from '../../application/find-login-attempts.service';
import { CredentialUserLoginRequestDto } from '../user/dto/request/login.request.dto';
import { FindLoginAttemptsQueryDto } from './dto/request/find-login-attempts-query.dto';
import type { CurrentUserWithSession } from 'src/platform/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/platform/auth/types/auth.types';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import { UserRoleType } from '@repo/database';
import type { Request } from 'express';
import {
  LoginAttempt,
  LoginAttemptResult,
  LoginFailureReason,
} from '../../domain';

describe('CredentialAdminController', () => {
  let controller: CredentialAdminController;
  let mockAuthenticateCredentialAdminService: jest.Mocked<AuthenticateCredentialAdminService>;
  let mockLoginService: jest.Mocked<LoginService>;
  let mockLogoutService: jest.Mocked<LogoutService>;
  let mockFindAttemptsService: jest.Mocked<FindLoginAttemptsService>;

  const mockAdminUser: CurrentUserWithSession = {
    id: BigInt(123),
    uid: 'admin-123',
    email: 'admin@example.com',
    role: UserRoleType.ADMIN,
    sessionId: 'session-456',
  };

  const mockSuperAdminUser: CurrentUserWithSession = {
    id: BigInt(789),
    uid: 'super-admin-123',
    email: 'superadmin@example.com',
    role: UserRoleType.SUPER_ADMIN,
    sessionId: 'session-789',
  };

  const mockUser: CurrentUserWithSession = {
    id: BigInt(456),
    uid: 'user-123',
    email: 'user@example.com',
    role: UserRoleType.USER,
    sessionId: 'session-123',
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
    path: '/admin/auth/login',
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
    email: 'admin@example.com',
    password: 'password123',
  };

  const mockAuthenticatedAdminUser: AuthenticatedUser = {
    id: BigInt(123),
    uid: 'admin-123',
    email: 'admin@example.com',
    role: UserRoleType.ADMIN,
  };

  beforeEach(async () => {
    const mockAuthenticateCredentialAdminServiceProvider = {
      provide: AuthenticateCredentialAdminService,
      useValue: {
        execute: jest.fn(),
      },
    };

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

    const mockFindAttemptsServiceProvider = {
      provide: FindLoginAttemptsService,
      useValue: {
        execute: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CredentialAdminController],
      providers: [
        mockAuthenticateCredentialAdminServiceProvider,
        mockLoginServiceProvider,
        mockLogoutServiceProvider,
        mockFindAttemptsServiceProvider,
      ],
    }).compile();

    controller = module.get<CredentialAdminController>(
      CredentialAdminController,
    );
    mockAuthenticateCredentialAdminService = module.get(
      AuthenticateCredentialAdminService,
    );
    mockLoginService = module.get(LoginService);
    mockLogoutService = module.get(LogoutService);
    mockFindAttemptsService = module.get(FindLoginAttemptsService);

    jest.clearAllMocks();
  });

  describe('login', () => {
    it('관리자 로그인 성공 시 사용자 정보를 반환하고 AuthenticateCredentialAdminService와 LoginService를 호출해야 함', async () => {
      // Arrange
      mockAuthenticateCredentialAdminService.execute.mockResolvedValue(
        mockAuthenticatedAdminUser,
      );
      mockLoginService.execute.mockResolvedValue(undefined);

      const mockRequest = {
        login: jest.fn((user: any, callback: (err?: Error) => void) => {
          callback();
        }),
      } as unknown as Request;

      // Act
      const result = await controller.login(
        mockLoginDto,
        mockClientInfo,
        mockRequest,
      );

      // Assert
      expect(result).toEqual({
        user: {
          uid: mockAuthenticatedAdminUser.uid,
          email: mockAuthenticatedAdminUser.email,
        },
      });

      expect(
        mockAuthenticateCredentialAdminService.execute,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockAuthenticateCredentialAdminService.execute,
      ).toHaveBeenCalledWith({
        email: mockLoginDto.email,
        password: mockLoginDto.password,
        clientInfo: mockClientInfo,
      });

      expect(mockRequest.login).toHaveBeenCalledTimes(1);
      expect(mockRequest.login).toHaveBeenCalledWith(
        mockAuthenticatedAdminUser,
        expect.any(Function),
      );

      expect(mockLoginService.execute).toHaveBeenCalledTimes(1);
      expect(mockLoginService.execute).toHaveBeenCalledWith({
        user: mockAuthenticatedAdminUser,
        clientInfo: mockClientInfo,
        isAdmin: true,
      });
    });

    it('AuthenticateCredentialAdminService가 에러를 던지면 예외를 전파해야 함', async () => {
      // Arrange
      const error = new Error('Authentication failed');
      mockAuthenticateCredentialAdminService.execute.mockRejectedValue(error);

      const mockRequest = {
        login: jest.fn(),
      } as unknown as Request;

      // Act & Assert
      await expect(
        controller.login(mockLoginDto, mockClientInfo, mockRequest),
      ).rejects.toThrow('Authentication failed');

      expect(
        mockAuthenticateCredentialAdminService.execute,
      ).toHaveBeenCalledTimes(1);
      expect(mockRequest.login).not.toHaveBeenCalled();
      expect(mockLoginService.execute).not.toHaveBeenCalled();
    });

    it('req.login이 실패하면 예외를 전파해야 함', async () => {
      // Arrange
      mockAuthenticateCredentialAdminService.execute.mockResolvedValue(
        mockAuthenticatedAdminUser,
      );

      const loginError = new Error('Session login failed');
      const mockRequest = {
        login: jest.fn((user: any, callback: (err?: Error) => void) => {
          callback(loginError);
        }),
      } as unknown as Request;

      // Act & Assert
      await expect(
        controller.login(mockLoginDto, mockClientInfo, mockRequest),
      ).rejects.toThrow('Session login failed');

      expect(
        mockAuthenticateCredentialAdminService.execute,
      ).toHaveBeenCalledTimes(1);
      expect(mockRequest.login).toHaveBeenCalledTimes(1);
      expect(mockLoginService.execute).not.toHaveBeenCalled();
    });

    it('LoginService가 에러를 던지면 예외를 전파해야 함', async () => {
      // Arrange
      mockAuthenticateCredentialAdminService.execute.mockResolvedValue(
        mockAuthenticatedAdminUser,
      );
      const error = new Error('Login service error');
      mockLoginService.execute.mockRejectedValue(error);

      const mockRequest = {
        login: jest.fn((user: any, callback: (err?: Error) => void) => {
          callback();
        }),
      } as unknown as Request;

      // Act & Assert
      await expect(
        controller.login(mockLoginDto, mockClientInfo, mockRequest),
      ).rejects.toThrow('Login service error');

      expect(
        mockAuthenticateCredentialAdminService.execute,
      ).toHaveBeenCalledTimes(1);
      expect(mockRequest.login).toHaveBeenCalledTimes(1);
      expect(mockLoginService.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('logout', () => {
    it('관리자 로그아웃 시 isAdmin=true로 LogoutService를 호출하고 세션을 종료해야 함', async () => {
      // Arrange
      mockLogoutService.execute.mockResolvedValue(undefined);

      const mockDestroy = jest.fn((callback: (err?: Error) => void) => {
        callback();
      });
      const mockRequest = {
        logout: jest.fn((callback: (err?: Error) => void) => {
          callback();
        }),
        session: {
          destroy: mockDestroy,
        },
      } as unknown as Request;

      // Act
      const result = await controller.logout(
        mockAdminUser,
        mockClientInfo,
        mockRequest,
      );

      // Assert
      expect(result).toEqual({ success: true });
      expect(mockLogoutService.execute).toHaveBeenCalledTimes(1);
      expect(mockLogoutService.execute).toHaveBeenCalledWith({
        userId: mockAdminUser.id,
        clientInfo: mockClientInfo,
        isAdmin: true,
      });

      expect(mockRequest.logout).toHaveBeenCalledTimes(1);
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(mockDestroy).toHaveBeenCalledTimes(1);
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
      const result = await controller.logout(
        mockSuperAdminUser,
        mockClientInfo,
        mockRequest,
      );

      // Assert
      expect(result).toEqual({ success: true });
      expect(mockLogoutService.execute).toHaveBeenCalledWith({
        userId: mockSuperAdminUser.id,
        clientInfo: mockClientInfo,
        isAdmin: true,
      });
    });

    it('req.logout이 실패해도 성공 응답을 반환해야 함', async () => {
      // Arrange
      mockLogoutService.execute.mockResolvedValue(undefined);

      const logoutError = new Error('Logout failed');
      const mockDestroy = jest.fn((callback: (err?: Error) => void) => {
        callback();
      });
      const mockRequest = {
        logout: jest.fn((callback: (err?: Error) => void) => {
          callback(logoutError);
        }),
        session: {
          destroy: mockDestroy,
        },
      } as unknown as Request;

      // Act
      const result = await controller.logout(
        mockAdminUser,
        mockClientInfo,
        mockRequest,
      );

      // Assert
      expect(result).toEqual({ success: true });
      expect(mockLogoutService.execute).toHaveBeenCalledTimes(1);
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(mockDestroy).toHaveBeenCalledTimes(1);
    });

    it('req.session.destroy가 실패해도 성공 응답을 반환해야 함', async () => {
      // Arrange
      mockLogoutService.execute.mockResolvedValue(undefined);

      const destroyError = new Error('Session destroy failed');
      const mockDestroy = jest.fn((callback: (err?: Error) => void) => {
        callback(destroyError);
      });
      const mockRequest = {
        logout: jest.fn((callback: (err?: Error) => void) => {
          callback();
        }),
        session: {
          destroy: mockDestroy,
        },
      } as unknown as Request;

      // Act
      const result = await controller.logout(
        mockAdminUser,
        mockClientInfo,
        mockRequest,
      );

      // Assert
      expect(result).toEqual({ success: true });
      expect(mockLogoutService.execute).toHaveBeenCalledTimes(1);
      expect(mockRequest.logout).toHaveBeenCalledTimes(1);
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(mockDestroy).toHaveBeenCalledTimes(1);
    });

    it('LogoutService가 에러를 던져도 성공 응답을 반환해야 함', async () => {
      // Arrange
      const error = new Error('Logout service error');
      mockLogoutService.execute.mockRejectedValue(error);

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
      const result = await controller.logout(
        mockAdminUser,
        mockClientInfo,
        mockRequest,
      );

      // Assert
      expect(result).toEqual({ success: true });
      expect(mockLogoutService.execute).toHaveBeenCalledTimes(1);
    });

    it('인증되지 않은 사용자도 로그아웃 요청 시 성공 응답을 반환해야 함', async () => {
      // Arrange
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
      const result = await controller.logout(undefined, undefined, mockRequest);

      // Assert
      expect(result).toEqual({ success: true });
      expect(mockLogoutService.execute).not.toHaveBeenCalled();
    });

    it('req가 없어도 성공 응답을 반환해야 함', async () => {
      // Act
      const result = await controller.logout(undefined, undefined, undefined);

      // Assert
      expect(result).toEqual({ success: true });
      expect(mockLogoutService.execute).not.toHaveBeenCalled();
    });
  });

  describe('checkStatus', () => {
    it('ADMIN 역할 사용자의 경우 isAuthenticated=true와 사용자 정보를 반환해야 함', async () => {
      // Arrange
      const mockRequest = {
        isAuthenticated: jest.fn().mockReturnValue(true),
      } as unknown as Request;

      // Act
      const result = await controller.checkStatus(mockRequest, mockAdminUser);

      // Assert
      expect(result).toEqual({
        isAuthenticated: true,
        user: {
          uid: mockAdminUser.uid,
          email: mockAdminUser.email,
        },
      });

      expect(mockRequest.isAuthenticated).toHaveBeenCalledTimes(1);
    });

    it('SUPER_ADMIN 역할 사용자의 경우 isAuthenticated=true와 사용자 정보를 반환해야 함', async () => {
      // Arrange
      const mockRequest = {
        isAuthenticated: jest.fn().mockReturnValue(true),
      } as unknown as Request;

      // Act
      const result = await controller.checkStatus(
        mockRequest,
        mockSuperAdminUser,
      );

      // Assert
      expect(result).toEqual({
        isAuthenticated: true,
        user: {
          uid: mockSuperAdminUser.uid,
          email: mockSuperAdminUser.email,
        },
      });
    });

    it('USER 역할 사용자의 경우 isAuthenticated=false를 반환해야 함', async () => {
      // Arrange
      const mockRequest = {
        isAuthenticated: jest.fn().mockReturnValue(true),
      } as unknown as Request;

      // Act
      const result = await controller.checkStatus(mockRequest, mockUser);

      // Assert
      expect(result).toEqual({
        isAuthenticated: false,
        user: null,
      });
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
      const result = await controller.checkStatus(mockRequest, mockAdminUser);

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

  describe('getAttempts', () => {
    const baseDate = new Date('2024-01-01T00:00:00Z');
    const mockUid = 'clx1234567890';

    it('이메일로 로그인 시도 내역을 조회해야 함', async () => {
      // Arrange
      const mockAttempts = [
        LoginAttempt.createSuccess({
          uid: mockUid,
          userId: 'user-123',
          email: 'user@example.com',
          ipAddress: '192.168.1.1',
          attemptedAt: baseDate,
        }),
        LoginAttempt.createFailure({
          uid: `${mockUid}-2`,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: 'user@example.com',
          ipAddress: '192.168.1.1',
          attemptedAt: new Date(baseDate.getTime() - 1000),
        }),
      ];

      mockFindAttemptsService.execute.mockResolvedValue(mockAttempts);

      const query: FindLoginAttemptsQueryDto = {
        email: 'user@example.com',
        limit: 50,
      };

      // Act
      const result = await controller.getAttempts(query);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: mockAttempts[0].id?.toString() || '',
        uid: mockAttempts[0].uid,
        userId: mockAttempts[0].userId,
        result: mockAttempts[0].result,
        failureReason: mockAttempts[0].failureReason,
        ipAddress: mockAttempts[0].ipAddress,
        email: mockAttempts[0].email,
        attemptedAt: mockAttempts[0].attemptedAt,
        isAdmin: mockAttempts[0].isAdmin,
      });

      expect(mockFindAttemptsService.execute).toHaveBeenCalledTimes(1);
      expect(mockFindAttemptsService.execute).toHaveBeenCalledWith({
        email: query.email,
        ipAddress: undefined,
        limit: query.limit,
      });
    });

    it('IP 주소로 로그인 시도 내역을 조회해야 함', async () => {
      // Arrange
      const mockAttempts = [
        LoginAttempt.createFailure({
          uid: mockUid,
          failureReason: LoginFailureReason.INVALID_CREDENTIALS,
          email: 'user@example.com',
          ipAddress: '192.168.1.1',
          attemptedAt: baseDate,
        }),
      ];

      mockFindAttemptsService.execute.mockResolvedValue(mockAttempts);

      const query: FindLoginAttemptsQueryDto = {
        ipAddress: '192.168.1.1',
        limit: 50,
      };

      // Act
      const result = await controller.getAttempts(query);

      // Assert
      expect(result).toHaveLength(1);
      expect(mockFindAttemptsService.execute).toHaveBeenCalledWith({
        email: undefined,
        ipAddress: query.ipAddress,
        limit: query.limit,
      });
    });

    it('이메일과 IP 주소 모두로 로그인 시도 내역을 조회해야 함', async () => {
      // Arrange
      const mockAttempts: LoginAttempt[] = [];
      mockFindAttemptsService.execute.mockResolvedValue(mockAttempts);

      const query: FindLoginAttemptsQueryDto = {
        email: 'user@example.com',
        ipAddress: '192.168.1.1',
        limit: 50,
      };

      // Act
      const result = await controller.getAttempts(query);

      // Assert
      expect(result).toHaveLength(0);
      expect(mockFindAttemptsService.execute).toHaveBeenCalledWith({
        email: query.email,
        ipAddress: query.ipAddress,
        limit: query.limit,
      });
    });

    it('limit가 지정되지 않은 경우 기본값을 사용해야 함', async () => {
      // Arrange
      const mockAttempts: LoginAttempt[] = [];
      mockFindAttemptsService.execute.mockResolvedValue(mockAttempts);

      const query: FindLoginAttemptsQueryDto = {
        email: 'user@example.com',
      };

      // Act
      await controller.getAttempts(query);

      // Assert
      expect(mockFindAttemptsService.execute).toHaveBeenCalledWith({
        email: query.email,
        ipAddress: undefined,
        limit: undefined,
      });
    });

    it('FindLoginAttemptsService가 에러를 던지면 예외를 전파해야 함', async () => {
      // Arrange
      const error = new BadRequestException(
        'At least one filter condition (email or ipAddress) is required',
      );
      mockFindAttemptsService.execute.mockRejectedValue(error);

      const query: FindLoginAttemptsQueryDto = {};

      // Act & Assert
      await expect(controller.getAttempts(query)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockFindAttemptsService.execute).toHaveBeenCalledTimes(1);
    });

    it('관리자 로그인 시도도 포함하여 조회해야 함', async () => {
      // Arrange
      const mockAttempts = [
        LoginAttempt.createSuccess({
          uid: mockUid,
          userId: 'admin-123',
          email: 'admin@example.com',
          ipAddress: '192.168.1.1',
          attemptedAt: baseDate,
          isAdmin: true,
        }),
      ];

      mockFindAttemptsService.execute.mockResolvedValue(mockAttempts);

      const query: FindLoginAttemptsQueryDto = {
        email: 'admin@example.com',
        limit: 50,
      };

      // Act
      const result = await controller.getAttempts(query);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].isAdmin).toBe(true);
    });
  });
});

