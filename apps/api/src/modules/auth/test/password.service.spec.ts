// src/modules/auth/application/password.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/platform/prisma/prisma.service';
import { MailService } from 'src/platform/mail/mail.service';
import { EnvService } from 'src/platform/env/env.service';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';
import { TokenType, UserStatus } from '@prisma/client';
import { ApiException } from 'src/platform/http/exception/api.exception';
import { MessageCode } from 'src/platform/http/types/message-codes';
import { RequestClientInfo } from 'src/platform/http/types';
import * as passwordUtil from 'src/utils/password.util';
import * as idUtil from 'src/utils/id.util';
import * as dateUtil from 'src/utils/date.util';
import { PasswordService } from '../application/password.service';

jest.mock('src/utils/password.util');
jest.mock('src/utils/id.util');
jest.mock('src/utils/date.util');

describe('PasswordService', () => {
  let service: PasswordService;
  let mockPrisma: jest.Mocked<PrismaService>;
  let mockMailService: jest.Mocked<MailService>;
  let mockActivityLog: jest.Mocked<ActivityLogPort>;
  let mockEnvService: jest.Mocked<EnvService>;

  const mockRequestInfo = {
    country: 'KR',
    timezone: 'Asia/Seoul',
    ip: '127.0.0.1',
  } as RequestClientInfo;

  beforeEach(async () => {
    const mockPrismaProvider = {
      provide: PrismaService,
      useValue: {
        user: {
          findFirst: jest.fn(),
          findUnique: jest.fn(),
          update: jest.fn(),
        },
        userToken: {
          create: jest.fn(),
          findFirst: jest.fn(),
          findUnique: jest.fn(),
          update: jest.fn(),
        },
        $transaction: jest.fn(),
      },
    };

    const mockMailServiceProvider = {
      provide: MailService,
      useValue: {
        sendMail: jest.fn(),
      },
    };

    const mockActivityLogProvider = {
      provide: ACTIVITY_LOG,
      useValue: {
        logSuccess: jest.fn(),
        logFailure: jest.fn(),
      },
    };

    const mockEnvServiceProvider = {
      provide: EnvService,
      useValue: {
        app: {
          frontendUrl: 'https://example.com',
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordService,
        mockPrismaProvider,
        mockMailServiceProvider,
        mockActivityLogProvider,
        mockEnvServiceProvider,
      ],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
    mockPrisma = module.get(PrismaService);
    mockMailService = module.get(MailService);
    mockActivityLog = module.get(ACTIVITY_LOG);
    mockEnvService = module.get(EnvService);

    jest.clearAllMocks();
  });

  describe('requestPasswordReset', () => {
    it('should send password reset email when user exists', async () => {
      const email = 'test@example.com';
      const mockUser = {
        id: 'user-123',
        email,
        passwordHash: 'hashed_password',
        status: UserStatus.ACTIVE,
      };

      const mockToken = 'reset-token-123';
      const mockExpiresAt = new Date('2024-12-31T23:59:59Z');

      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(
        mockUser as any,
      );
      (idUtil.IdUtil.generateUrlSafeNanoid as jest.Mock) = jest
        .fn()
        .mockReturnValue(mockToken);
      (dateUtil.nowUtcPlus as jest.Mock) = jest
        .fn()
        .mockReturnValue(mockExpiresAt);
      (mockPrisma.userToken.create as jest.Mock).mockResolvedValue({} as any);
      mockMailService.sendMail.mockResolvedValue(undefined);
      mockActivityLog.logSuccess.mockResolvedValue(undefined);

      await service.requestPasswordReset(email, mockRequestInfo);

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockPrisma.userToken.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          type: TokenType.PASSWORD_RESET,
          token: mockToken,
          expiresAt: mockExpiresAt,
          metadata: { email },
        },
      });
      expect(mockMailService.sendMail).toHaveBeenCalled();
      expect(mockActivityLog.logSuccess).toHaveBeenCalled();
    });

    it('should not send email when user not found', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await service.requestPasswordReset(
        'notfound@example.com',
        mockRequestInfo,
      );

      expect(mockMailService.sendMail).not.toHaveBeenCalled();
    });

    it('should not send email when user is inactive', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        status: UserStatus.SUSPENDED,
      };

      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(
        mockUser as any,
      );

      await service.requestPasswordReset('test@example.com', mockRequestInfo);

      expect(mockMailService.sendMail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully with valid token', async () => {
      const token = 'valid-token-123';
      const newPassword = 'newPassword123';
      const mockResetToken = {
        id: 'token-123',
        userId: 'user-123',
        user: {
          id: 'user-123',
          status: UserStatus.ACTIVE,
          passwordHash: 'old_hashed_password',
        },
      };

      const mockUpdatedUser = { id: 'user-123' };
      const mockUpdatedToken = { id: 'token-123' };
      const mockNowUtc = new Date('2024-12-21T14:00:00Z');

      (dateUtil.nowUtc as jest.Mock) = jest.fn().mockReturnValue(mockNowUtc);
      (mockPrisma.userToken.findFirst as jest.Mock).mockResolvedValue(
        mockResetToken as any,
      );
      (passwordUtil.comparePassword as jest.Mock).mockResolvedValue(false);
      (passwordUtil.hashPassword as jest.Mock).mockResolvedValue(
        'new_hashed_password',
      );

      (mockPrisma.$transaction as jest.Mock).mockImplementation(
        async (callback) => {
          const tx = {
            user: {
              update: jest.fn().mockResolvedValue(mockUpdatedUser),
            },
            userToken: {
              update: jest.fn().mockResolvedValue(mockUpdatedToken),
            },
          };
          return await callback(tx);
        },
      );

      mockActivityLog.logSuccess.mockResolvedValue(undefined);

      await service.resetPassword(token, newPassword, mockRequestInfo);

      expect(mockPrisma.userToken.findFirst).toHaveBeenCalledWith({
        where: {
          token,
          type: TokenType.PASSWORD_RESET,
          expiresAt: { gt: mockNowUtc },
          usedAt: null,
        },
        select: {
          id: true,
          userId: true,
          user: {
            select: {
              id: true,
              status: true,
              passwordHash: true,
            },
          },
        },
      });
      expect(passwordUtil.hashPassword).toHaveBeenCalledWith(newPassword);
      expect(mockActivityLog.logSuccess).toHaveBeenCalled();
    });

    it('should throw error when token is invalid', async () => {
      const token = 'invalid-token';

      (mockPrisma.userToken.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.userToken.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.resetPassword(token, 'newPassword', mockRequestInfo),
      ).rejects.toThrow(ApiException);

      await expect(
        service.resetPassword(token, 'newPassword', mockRequestInfo),
      ).rejects.toMatchObject({
        messageCode: MessageCode.PASSWORD_RESET_TOKEN_INVALID,
      });
    });

    it('should throw error when new password is same as current', async () => {
      const token = 'valid-token-123';
      const newPassword = 'samePassword';
      const mockResetToken = {
        id: 'token-123',
        userId: 'user-123',
        user: {
          id: 'user-123',
          status: UserStatus.ACTIVE,
          passwordHash: 'hashed_samePassword',
        },
      };

      (mockPrisma.userToken.findFirst as jest.Mock).mockResolvedValue(
        mockResetToken as any,
      );
      (passwordUtil.comparePassword as jest.Mock).mockResolvedValue(true);
      mockActivityLog.logFailure.mockResolvedValue(undefined);

      await expect(
        service.resetPassword(token, newPassword, mockRequestInfo),
      ).rejects.toThrow(ApiException);

      await expect(
        service.resetPassword(token, newPassword, mockRequestInfo),
      ).rejects.toMatchObject({
        messageCode: MessageCode.PASSWORD_SAME_AS_CURRENT,
      });

      expect(mockActivityLog.logFailure).toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const userId = 'user-123';
      const currentPassword = 'oldPassword';
      const newPassword = 'newPassword123';

      const mockUser = {
        id: userId,
        passwordHash: 'hashed_oldPassword',
      };

      (mockPrisma.$transaction as jest.Mock).mockImplementation(
        async (callback) => {
          const tx = {
            user: {
              findUnique: jest.fn().mockResolvedValue(mockUser),
              update: jest.fn().mockResolvedValue({ id: userId }),
            },
          };
          return await callback(tx);
        },
      );

      (passwordUtil.comparePassword as jest.Mock).mockResolvedValue(true);
      (passwordUtil.hashPassword as jest.Mock).mockResolvedValue(
        'hashed_newPassword',
      );
      mockActivityLog.logSuccess.mockResolvedValue(undefined);

      await service.changePassword(
        userId,
        currentPassword,
        newPassword,
        mockRequestInfo,
      );

      expect(passwordUtil.comparePassword).toHaveBeenCalledWith(
        currentPassword,
        'hashed_oldPassword',
      );
      expect(passwordUtil.hashPassword).toHaveBeenCalledWith(newPassword);
      expect(mockActivityLog.logSuccess).toHaveBeenCalled();
    });

    it('should throw error when current password is invalid', async () => {
      const userId = 'user-123';
      const currentPassword = 'wrongPassword';
      const newPassword = 'newPassword123';

      const mockUser = {
        id: userId,
        passwordHash: 'hashed_correctPassword',
      };

      (mockPrisma.$transaction as jest.Mock).mockImplementation(
        async (callback) => {
          const tx = {
            user: {
              findUnique: jest.fn().mockResolvedValue(mockUser),
            },
          };
          return await callback(tx);
        },
      );

      (passwordUtil.comparePassword as jest.Mock).mockResolvedValue(false);
      mockActivityLog.logFailure.mockResolvedValue(undefined);

      await expect(
        service.changePassword(
          userId,
          currentPassword,
          newPassword,
          mockRequestInfo,
        ),
      ).rejects.toThrow(ApiException);

      await expect(
        service.changePassword(
          userId,
          currentPassword,
          newPassword,
          mockRequestInfo,
        ),
      ).rejects.toMatchObject({
        messageCode: MessageCode.AUTH_INVALID_CREDENTIALS,
      });

      expect(mockActivityLog.logFailure).toHaveBeenCalled();
    });

    it('should throw error when new password is same as current', async () => {
      const userId = 'user-123';
      const password = 'samePassword';

      mockActivityLog.logFailure.mockResolvedValue(undefined);

      await expect(
        service.changePassword(userId, password, password, mockRequestInfo),
      ).rejects.toThrow(ApiException);

      await expect(
        service.changePassword(userId, password, password, mockRequestInfo),
      ).rejects.toMatchObject({
        messageCode: MessageCode.PASSWORD_SAME_AS_CURRENT,
      });
    });
  });

  describe('verifyResetToken', () => {
    it('should return valid true when token is valid', async () => {
      const token = 'valid-token';
      // 현재 시간보다 확실히 미래인 날짜 사용 (1년 후)
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const mockToken = {
        expiresAt: futureDate,
        usedAt: null,
        type: TokenType.PASSWORD_RESET,
        user: {
          status: UserStatus.ACTIVE,
        },
      };

      (mockPrisma.userToken.findUnique as jest.Mock).mockResolvedValue(
        mockToken as any,
      );

      const result = await service.verifyResetToken(token);

      expect(mockPrisma.userToken.findUnique).toHaveBeenCalledWith({
        where: { token },
        select: {
          expiresAt: true,
          usedAt: true,
          type: true,
          user: {
            select: {
              status: true,
            },
          },
        },
      });
      expect(result).toEqual({ valid: true, used: false });
    });

    it('should return valid false when token is expired', async () => {
      const token = 'expired-token';
      // 현재 시간보다 확실히 과거인 날짜 사용 (1년 전)
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      const mockToken = {
        expiresAt: pastDate,
        usedAt: null,
        type: TokenType.PASSWORD_RESET,
        user: {
          status: UserStatus.ACTIVE,
        },
      };

      (mockPrisma.userToken.findUnique as jest.Mock).mockResolvedValue(
        mockToken as any,
      );

      const result = await service.verifyResetToken(token);

      expect(result).toEqual({ valid: false });
    });

    it('should return valid false when token is already used', async () => {
      const token = 'used-token';
      // 현재 시간보다 확실히 미래인 날짜 사용 (1년 후)
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const mockToken = {
        expiresAt: futureDate,
        usedAt: new Date('2024-01-01T00:00:00Z'),
        type: TokenType.PASSWORD_RESET,
        user: {
          status: UserStatus.ACTIVE,
        },
      };

      (mockPrisma.userToken.findUnique as jest.Mock).mockResolvedValue(
        mockToken as any,
      );

      const result = await service.verifyResetToken(token);

      expect(result).toEqual({ valid: false, used: true });
    });
  });
});
