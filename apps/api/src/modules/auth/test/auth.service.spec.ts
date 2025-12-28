// src/modules/auth/application/auth.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/platform/prisma/prisma.service';
import { VipMembershipService } from 'src/modules/vip/application/vip-membership.service';
import { EnvService } from 'src/platform/env/env.service';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';
import { UserRoleType, UserStatus } from '@repo/database';
import { ApiException } from 'src/platform/http/exception/api.exception';
import { MessageCode } from 'src/platform/http/types/message-codes';
import * as passwordUtil from 'src/utils/password.util';
import * as idUtil from 'src/utils/id.util';
import * as countryUtil from 'src/utils/country.util';
import { AuthService } from '../application/auth.service';
import type { RequestClientInfo } from 'src/platform/http/types';
import { LinkReferralService } from 'src/modules/affiliate/referral/application/link-referral.service';
import { Referral } from 'src/modules/affiliate/referral/domain/model/referral.entity';

// 유틸리티 함수 모킹
jest.mock('src/utils/password.util');
jest.mock('src/utils/id.util');
jest.mock('src/utils/country.util');

describe('AuthService', () => {
  let service: AuthService;
  let mockPrisma: jest.Mocked<PrismaService>;
  let mockActivityLog: jest.Mocked<ActivityLogPort>;
  let mockVipMembershipService: jest.Mocked<VipMembershipService>;
  let mockEnvService: jest.Mocked<EnvService>;
  let mockLinkReferralService: jest.Mocked<LinkReferralService>;

  beforeEach(async () => {
    const mockPrismaProvider = {
      provide: PrismaService,
      useValue: {
        user: {
          findFirst: jest.fn(),
          create: jest.fn(),
        },
      },
    };

    const mockActivityLogProvider = {
      provide: ACTIVITY_LOG,
      useValue: {
        logSuccess: jest.fn(),
        logFailure: jest.fn(),
      },
    };

    const mockVipMembershipServiceProvider = {
      provide: VipMembershipService,
      useValue: {
        getOrCreateMembership: jest.fn(),
      },
    };

    const mockEnvServiceProvider = {
      provide: EnvService,
      useValue: {
        wallet: {
          allowedCurrencies: ['USD', 'KRW'],
        },
      },
    };

    const mockLinkReferralServiceProvider = {
      provide: LinkReferralService,
      useValue: {
        execute: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        mockPrismaProvider,
        mockActivityLogProvider,
        mockVipMembershipServiceProvider,
        mockEnvServiceProvider,
        mockLinkReferralServiceProvider,
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    mockPrisma = module.get(PrismaService);
    mockActivityLog = module.get(ACTIVITY_LOG);
    mockVipMembershipService = module.get(VipMembershipService);
    mockEnvService = module.get(EnvService);
    mockLinkReferralService = module.get(LinkReferralService);

    // 유틸리티 함수 모킹 초기화
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return authenticated user when credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = 'hashed_password';

      const mockUser = {
        id: 'user-123',
        email,
        passwordHash: hashedPassword,
        role: UserRoleType.USER,
        status: UserStatus.ACTIVE,
      };

      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(
        mockUser as any,
      );
      (passwordUtil.comparePassword as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(email, password);

      expect(result).toEqual({
        id: 'user-123',
        email,
        role: UserRoleType.USER,
      });
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { email },
      });
      expect(passwordUtil.comparePassword).toHaveBeenCalledWith(
        password,
        hashedPassword,
      );
    });

    it('should return null when user not found', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.validateUser(
        'notfound@example.com',
        'password',
      );

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        status: UserStatus.ACTIVE,
      };

      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(
        mockUser as any,
      );
      (passwordUtil.comparePassword as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrong');

      expect(result).toBeNull();
    });

    it('should return null when user status is not ACTIVE', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        status: UserStatus.SUSPENDED,
      };

      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(
        mockUser as any,
      );
      (passwordUtil.comparePassword as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null when user has no password hash', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: null,
        status: UserStatus.ACTIVE,
      };

      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(
        mockUser as any,
      );

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
    });
  });

  describe('validateAdmin', () => {
    it('should return authenticated admin user when credentials are valid', async () => {
      const email = 'admin@example.com';
      const password = 'admin123';
      const hashedPassword = 'hashed_password';

      const mockUser = {
        id: 'admin-123',
        email,
        passwordHash: hashedPassword,
        role: UserRoleType.ADMIN,
        status: UserStatus.ACTIVE,
      };

      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(
        mockUser as any,
      );
      (passwordUtil.comparePassword as jest.Mock).mockResolvedValue(true);

      const result = await service.validateAdmin(email, password);

      expect(result).toEqual({
        id: 'admin-123',
        email,
        role: UserRoleType.ADMIN,
      });
    });

    it('should return null when user is not admin', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        passwordHash: 'hashed_password',
        role: UserRoleType.USER,
        status: UserStatus.ACTIVE,
      };

      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(
        mockUser as any,
      );
      (passwordUtil.comparePassword as jest.Mock).mockResolvedValue(true);

      const result = await service.validateAdmin(
        'user@example.com',
        'password',
      );

      expect(result).toBeNull();
    });

    it('should return authenticated super admin user', async () => {
      const mockUser = {
        id: 'super-admin-123',
        email: 'superadmin@example.com',
        passwordHash: 'hashed_password',
        role: UserRoleType.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
      };

      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(
        mockUser as any,
      );
      (passwordUtil.comparePassword as jest.Mock).mockResolvedValue(true);

      const result = await service.validateAdmin(
        'superadmin@example.com',
        'password',
      );

      expect(result).toEqual({
        id: 'super-admin-123',
        email: 'superadmin@example.com',
        role: UserRoleType.SUPER_ADMIN,
      });
    });
  });

  describe('register', () => {
    const mockRequestInfo: RequestClientInfo = {
      country: 'KR',
      timezone: 'Asia/Seoul',
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      fingerprint: 'fingerprint-123',
      city: 'Seoul',
      referer: 'https://example.com',
      acceptLanguage: 'ko-KR',
      protocol: 'https',
      method: 'POST',
      path: '/auth/register',
      timestamp: new Date(),
      isMobile: false,
      browser: 'Chrome',
      os: 'Windows',
      isp: 'ISP',
      asn: 'AS123',
      threat: 'low',
      bot: false,
    };

    it('should register a new user successfully', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-123',
        email: registerDto.email,
        role: UserRoleType.USER,
      };

      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (passwordUtil.hashPassword as jest.Mock).mockResolvedValue('hashed_pass');
      (idUtil.IdUtil.generateNextWhitecliffId as jest.Mock).mockResolvedValue(
        12345,
      );
      (countryUtil.CountryUtil.getCountryConfig as jest.Mock) = jest
        .fn()
        .mockReturnValue({
          timezone: 'Asia/Seoul',
          currency: 'KRW',
        });
      (mockPrisma.user.create as jest.Mock).mockResolvedValue(mockUser as any);
      mockVipMembershipService.getOrCreateMembership.mockResolvedValue({
        id: 1,
        userId: 'user-123',
        accumulatedRolling: { toNumber: () => 0 } as any,
        achievedAt: new Date(),
        vipLevel: {
          id: 1,
          rank: 0,
          nameKey: 'BRONZE',
          compRate: { toNumber: () => 0.01 } as any,
        },
      });
      mockActivityLog.logSuccess.mockResolvedValue(undefined);

      const result = await service.register(registerDto, mockRequestInfo);

      expect(result).toEqual({
        id: 'user-123',
        email: registerDto.email,
      });
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(passwordUtil.hashPassword).toHaveBeenCalledWith(
        registerDto.password,
      );
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(
        mockVipMembershipService.getOrCreateMembership,
      ).toHaveBeenCalledWith('user-123');
      expect(mockActivityLog.logSuccess).toHaveBeenCalled();
    });

    it('should throw error when email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
      };

      const existingUser = {
        id: 'existing-123',
        email: registerDto.email,
      };

      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(
        existingUser as any,
      );

      await expect(
        service.register(registerDto, mockRequestInfo),
      ).rejects.toThrow(ApiException);

      await expect(
        service.register(registerDto, mockRequestInfo),
      ).rejects.toMatchObject({
        messageCode: MessageCode.USER_ALREADY_EXISTS,
      });
    });

    it('should register user with referral code successfully', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
        referralCode: 'REFERRAL123',
      };

      const mockUser = {
        id: 'user-123',
        email: registerDto.email,
      };

      const mockReferral = Referral.fromPersistence({
        id: 'referral-123',
        affiliateId: 'affiliate-123',
        codeId: 'code-123',
        subUserId: 'user-123',
        ipAddress: mockRequestInfo.ip,
        deviceFingerprint: mockRequestInfo.fingerprint,
        userAgent: mockRequestInfo.userAgent,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (passwordUtil.hashPassword as jest.Mock).mockResolvedValue('hashed_pass');
      (idUtil.IdUtil.generateNextWhitecliffId as jest.Mock).mockResolvedValue(
        12345,
      );
      (countryUtil.CountryUtil.getCountryConfig as jest.Mock) = jest
        .fn()
        .mockReturnValue({
          timezone: 'Asia/Seoul',
          currency: 'KRW',
        });
      (mockPrisma.user.create as jest.Mock).mockResolvedValue(mockUser as any);
      mockVipMembershipService.getOrCreateMembership.mockResolvedValue({
        id: 1,
        userId: 'user-123',
        accumulatedRolling: { toNumber: () => 0 } as any,
        achievedAt: new Date(),
        vipLevel: {
          id: 1,
          rank: 0,
          nameKey: 'BRONZE',
          compRate: { toNumber: () => 0.01 } as any,
        },
      });
      mockLinkReferralService.execute.mockResolvedValue(mockReferral);
      mockActivityLog.logSuccess.mockResolvedValue(undefined);

      const result = await service.register(registerDto, mockRequestInfo);

      expect(result).toEqual({
        id: 'user-123',
        email: registerDto.email,
      });
      expect(mockLinkReferralService.execute).toHaveBeenCalledWith({
        subUserId: 'user-123',
        referralCode: 'REFERRAL123',
        ipAddress: mockRequestInfo.ip,
        deviceFingerprint: mockRequestInfo.fingerprint,
        userAgent: mockRequestInfo.userAgent,
        requestInfo: mockRequestInfo,
      });
      expect(mockActivityLog.logSuccess).toHaveBeenCalled();
    });

    it('should register user successfully even when referral code is invalid', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
        referralCode: 'INVALID_CODE',
      };

      const mockUser = {
        id: 'user-123',
        email: registerDto.email,
      };

      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (passwordUtil.hashPassword as jest.Mock).mockResolvedValue('hashed_pass');
      (idUtil.IdUtil.generateNextWhitecliffId as jest.Mock).mockResolvedValue(
        12345,
      );
      (countryUtil.CountryUtil.getCountryConfig as jest.Mock) = jest
        .fn()
        .mockReturnValue({
          timezone: 'Asia/Seoul',
          currency: 'KRW',
        });
      (mockPrisma.user.create as jest.Mock).mockResolvedValue(mockUser as any);
      mockVipMembershipService.getOrCreateMembership.mockResolvedValue({
        id: 1,
        userId: 'user-123',
        accumulatedRolling: { toNumber: () => 0 } as any,
        achievedAt: new Date(),
        vipLevel: {
          id: 1,
          rank: 0,
          nameKey: 'BRONZE',
          compRate: { toNumber: () => 0.01 } as any,
        },
      });
      // 레퍼럴 서비스가 에러를 던짐
      mockLinkReferralService.execute.mockRejectedValue(
        new Error('Referral code not found'),
      );
      mockActivityLog.logSuccess.mockResolvedValue(undefined);

      const result = await service.register(registerDto, mockRequestInfo);

      // 레퍼럴 처리 실패해도 회원가입은 성공해야 함
      expect(result).toEqual({
        id: 'user-123',
        email: registerDto.email,
      });
      expect(mockLinkReferralService.execute).toHaveBeenCalled();
      expect(mockActivityLog.logSuccess).toHaveBeenCalled();
    });

    it('should register user without referral code', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-123',
        email: registerDto.email,
      };

      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (passwordUtil.hashPassword as jest.Mock).mockResolvedValue('hashed_pass');
      (idUtil.IdUtil.generateNextWhitecliffId as jest.Mock).mockResolvedValue(
        12345,
      );
      (countryUtil.CountryUtil.getCountryConfig as jest.Mock) = jest
        .fn()
        .mockReturnValue({
          timezone: 'Asia/Seoul',
          currency: 'KRW',
        });
      (mockPrisma.user.create as jest.Mock).mockResolvedValue(mockUser as any);
      mockVipMembershipService.getOrCreateMembership.mockResolvedValue({
        id: 1,
        userId: 'user-123',
        accumulatedRolling: { toNumber: () => 0 } as any,
        achievedAt: new Date(),
        vipLevel: {
          id: 1,
          rank: 0,
          nameKey: 'BRONZE',
          compRate: { toNumber: () => 0.01 } as any,
        },
      });
      mockActivityLog.logSuccess.mockResolvedValue(undefined);

      const result = await service.register(registerDto, mockRequestInfo);

      expect(result).toEqual({
        id: 'user-123',
        email: registerDto.email,
      });
      // 레퍼럴 코드가 없으면 레퍼럴 서비스가 호출되지 않아야 함
      expect(mockLinkReferralService.execute).not.toHaveBeenCalled();
      expect(mockActivityLog.logSuccess).toHaveBeenCalled();
    });
  });
});
