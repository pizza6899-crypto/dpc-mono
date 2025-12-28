// src/modules/auth/registration/application/register-credential.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { RegisterCredentialService } from './register-credential.service';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';
import { ActivityType } from 'src/platform/activity-log/activity-log.types';
import { VipMembershipService } from 'src/modules/vip/application/vip-membership.service';
import { EnvService } from 'src/platform/env/env.service';
import { LinkReferralService } from 'src/modules/affiliate/referral/application/link-referral.service';
import { FindCodeByCodeService } from 'src/modules/affiliate/code/application/find-code-by-code.service';
import { RegistrationPolicy } from '../domain/policy';
import { USER_REPOSITORY } from '../ports/out';
import type { UserRepositoryPort } from '../ports/out';
import { RegistrationUser } from '../domain/model/registration-user.entity';
import { AffiliateCode } from 'src/modules/affiliate/code/domain/model/affiliate-code.entity';
import {
  ReferralCodeNotFoundException,
  ReferralCodeInactiveException,
  ReferralCodeExpiredException,
} from 'src/modules/affiliate/referral/domain/referral.exception';
import { ApiException } from 'src/platform/http/exception/api.exception';
import { MessageCode } from 'src/platform/http/types/message-codes';
import { UserRoleType, UserStatus } from '@repo/database';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import { Referral } from 'src/modules/affiliate/referral/domain/model/referral.entity';
import { PrismaModule } from 'src/platform/prisma/prisma.module';
import { EnvModule } from 'src/platform/env/env.module';

describe('RegisterCredentialService', () => {
  let service: RegisterCredentialService;
  let mockActivityLog: jest.Mocked<ActivityLogPort>;
  let mockVipMembershipService: jest.Mocked<VipMembershipService>;
  let mockEnvService: jest.Mocked<EnvService>;
  let mockLinkReferralService: jest.Mocked<LinkReferralService>;
  let mockFindCodeByCodeService: jest.Mocked<FindCodeByCodeService>;
  let mockRegistrationPolicy: RegistrationPolicy;
  let mockUserRepository: jest.Mocked<UserRepositoryPort>;

  const mockEmail = 'test@example.com';
  const mockPassword = 'password123!';
  const mockUserId = 'user-123';
  const mockReferralCode = 'REFERRAL123';
  const mockCodeId = 'code-123';
  const mockAffiliateId = 'affiliate-123';

  const mockRequestInfo: RequestClientInfo = {
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    fingerprint: 'fingerprint-123',
    country: 'KR',
    city: 'Seoul',
    referer: 'https://example.com',
    acceptLanguage: 'ko-KR',
    protocol: 'https',
    method: 'POST',
    path: '/api/auth/register',
    timestamp: new Date(),
    isMobile: false,
    browser: 'Chrome',
    os: 'Windows',
    timezone: 'Asia/Seoul',
    isp: 'ISP',
    asn: 'AS123',
    threat: 'low',
    bot: false,
  };

  const mockUser = RegistrationUser.create({
    id: mockUserId,
    email: mockEmail,
    passwordHash: '$2b$10$hashedpassword123',
    socialId: null,
    socialType: null,
    status: UserStatus.ACTIVE,
    role: UserRoleType.USER,
  });

  const mockAffiliateCode = AffiliateCode.fromPersistence({
    id: mockCodeId,
    userId: mockAffiliateId,
    code: mockReferralCode,
    campaignName: 'Test Campaign',
    isActive: true,
    isDefault: true,
    expiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastUsedAt: null,
  });

  const mockReferral = Referral.fromPersistence({
    id: 'referral-123',
    affiliateId: mockAffiliateId,
    codeId: mockCodeId,
    subUserId: mockUserId,
    ipAddress: mockRequestInfo.ip,
    deviceFingerprint: mockRequestInfo.fingerprint,
    userAgent: mockRequestInfo.userAgent,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    mockActivityLog = {
      log: jest.fn(),
      logSuccess: jest.fn(),
      logFailure: jest.fn(),
    };

    mockVipMembershipService = {
      getOrCreateMembership: jest.fn(),
    } as any;

    mockEnvService = {
      wallet: {
        allowedCurrencies: ['USD', 'KRW'],
      },
    } as any;

    mockLinkReferralService = {
      execute: jest.fn(),
    } as any;

    mockFindCodeByCodeService = {
      execute: jest.fn(),
    } as any;

    mockRegistrationPolicy = new RegistrationPolicy();

    mockUserRepository = {
      findByEmail: jest.fn(),
      findBySocialId: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, EnvModule], // @Transactional() 데코레이터를 위해 필요
      providers: [
        RegisterCredentialService,
        {
          provide: ACTIVITY_LOG,
          useValue: mockActivityLog,
        },
        {
          provide: VipMembershipService,
          useValue: mockVipMembershipService,
        },
        {
          provide: EnvService,
          useValue: mockEnvService,
        },
        {
          provide: LinkReferralService,
          useValue: mockLinkReferralService,
        },
        {
          provide: FindCodeByCodeService,
          useValue: mockFindCodeByCodeService,
        },
        {
          provide: RegistrationPolicy,
          useValue: mockRegistrationPolicy,
        },
        {
          provide: USER_REPOSITORY,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<RegisterCredentialService>(RegisterCredentialService);
    mockActivityLog = module.get(ACTIVITY_LOG);
    mockVipMembershipService = module.get(VipMembershipService);
    mockEnvService = module.get(EnvService);
    mockLinkReferralService = module.get(LinkReferralService);
    mockFindCodeByCodeService = module.get(FindCodeByCodeService);
    mockUserRepository = module.get(USER_REPOSITORY);

    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('레퍼럴 코드 없이 정상적으로 회원가입을 완료한다', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);
      mockVipMembershipService.getOrCreateMembership.mockResolvedValue(
        {} as any,
      );
      mockActivityLog.logSuccess.mockResolvedValue(undefined);

      // Act
      const result = await service.execute({
        email: mockEmail,
        password: mockPassword,
        requestInfo: mockRequestInfo,
      });

      // Assert
      expect(result).toEqual({
        id: mockUserId,
        email: mockEmail,
      });

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(mockEmail);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: mockEmail,
        passwordHash: expect.any(String),
        socialId: null,
        socialType: null,
        role: UserRoleType.USER,
        country: mockRequestInfo.country,
        timezone: expect.any(String),
      });
      expect(mockVipMembershipService.getOrCreateMembership).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockLinkReferralService.execute).not.toHaveBeenCalled();
      expect(mockActivityLog.logSuccess).toHaveBeenCalledWith(
        {
          userId: mockUserId,
          activityType: ActivityType.USER_REGISTER,
          description: 'User registered successfully',
        },
        mockRequestInfo,
      );
    });

    it('유효한 레퍼럴 코드와 함께 정상적으로 회원가입을 완료한다', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockFindCodeByCodeService.execute.mockResolvedValue(mockAffiliateCode);
      mockUserRepository.create.mockResolvedValue(mockUser);
      mockVipMembershipService.getOrCreateMembership.mockResolvedValue(
        {} as any,
      );
      mockLinkReferralService.execute.mockResolvedValue(mockReferral);
      mockActivityLog.logSuccess.mockResolvedValue(undefined);

      // Act
      const result = await service.execute({
        email: mockEmail,
        password: mockPassword,
        referralCode: mockReferralCode,
        requestInfo: mockRequestInfo,
      });

      // Assert
      expect(result).toEqual({
        id: mockUserId,
        email: mockEmail,
      });

      expect(mockFindCodeByCodeService.execute).toHaveBeenCalledWith({
        code: mockReferralCode,
      });
      expect(mockLinkReferralService.execute).toHaveBeenCalledWith({
        subUserId: mockUserId,
        referralCode: mockReferralCode,
        ipAddress: mockRequestInfo.ip,
        deviceFingerprint: mockRequestInfo.fingerprint,
        userAgent: mockRequestInfo.userAgent,
        requestInfo: mockRequestInfo,
      });
    });

    it('이메일이 이미 존재하는 경우 에러를 발생시킨다', async () => {
      // Arrange
      const existingUser = RegistrationUser.create({
        id: 'existing-user-123',
        email: mockEmail,
        passwordHash: '$2b$10$existinghash',
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(
        service.execute({
          email: mockEmail,
          password: mockPassword,
          requestInfo: mockRequestInfo,
        }),
      ).rejects.toThrow(ApiException);

      try {
        await service.execute({
          email: mockEmail,
          password: mockPassword,
          requestInfo: mockRequestInfo,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ApiException);
        expect((error as ApiException).messageCode).toBe(
          MessageCode.USER_ALREADY_EXISTS,
        );
        expect((error as ApiException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
      }

      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('레퍼럴 코드가 존재하지 않는 경우 에러를 발생시킨다', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockFindCodeByCodeService.execute.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.execute({
          email: mockEmail,
          password: mockPassword,
          referralCode: mockReferralCode,
          requestInfo: mockRequestInfo,
        }),
      ).rejects.toThrow(ReferralCodeNotFoundException);

      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('레퍼럴 코드가 비활성화된 경우 에러를 발생시킨다', async () => {
      // Arrange
      const inactiveCode = AffiliateCode.fromPersistence({
        id: mockCodeId,
        userId: mockAffiliateId,
        code: mockReferralCode,
        campaignName: null,
        isActive: false, // 비활성화
        isDefault: false,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      });

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockFindCodeByCodeService.execute.mockResolvedValue(inactiveCode);

      // Act & Assert
      await expect(
        service.execute({
          email: mockEmail,
          password: mockPassword,
          referralCode: mockReferralCode,
          requestInfo: mockRequestInfo,
        }),
      ).rejects.toThrow(ReferralCodeInactiveException);

      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('레퍼럴 코드가 만료된 경우 에러를 발생시킨다', async () => {
      // Arrange
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1); // 어제

      const expiredCode = AffiliateCode.fromPersistence({
        id: mockCodeId,
        userId: mockAffiliateId,
        code: mockReferralCode,
        campaignName: null,
        isActive: true,
        isDefault: false,
        expiresAt: expiredDate, // 만료됨
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
      });

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockFindCodeByCodeService.execute.mockResolvedValue(expiredCode);

      // Act & Assert
      await expect(
        service.execute({
          email: mockEmail,
          password: mockPassword,
          referralCode: mockReferralCode,
          requestInfo: mockRequestInfo,
        }),
      ).rejects.toThrow(ReferralCodeExpiredException);

      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('액티비티 로그 실패 시에도 회원가입은 성공한다', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);
      mockVipMembershipService.getOrCreateMembership.mockResolvedValue(
        {} as any,
      );
      mockActivityLog.logSuccess.mockRejectedValue(
        new Error('Activity log failed'),
      );

      // Act
      const result = await service.execute({
        email: mockEmail,
        password: mockPassword,
        requestInfo: mockRequestInfo,
      });

      // Assert
      expect(result).toEqual({
        id: mockUserId,
        email: mockEmail,
      });

      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockVipMembershipService.getOrCreateMembership).toHaveBeenCalled();
      expect(mockActivityLog.logSuccess).toHaveBeenCalled();
    });

    it('레퍼럴 관계 생성 실패 시 트랜잭션이 롤백되어 회원가입도 실패한다', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockFindCodeByCodeService.execute.mockResolvedValue(mockAffiliateCode);
      mockUserRepository.create.mockResolvedValue(mockUser);
      mockVipMembershipService.getOrCreateMembership.mockResolvedValue(
        {} as any,
      );
      mockLinkReferralService.execute.mockRejectedValue(
        new Error('Referral link failed'),
      );

      // Act & Assert
      // 레퍼럴 관계 생성은 사전 검증을 통과한 후 실행되므로,
      // 여기서 실패하면 예외가 발생하고 트랜잭션이 롤백됩니다.
      await expect(
        service.execute({
          email: mockEmail,
          password: mockPassword,
          referralCode: mockReferralCode,
          requestInfo: mockRequestInfo,
        }),
      ).rejects.toThrow('Referral link failed');

      expect(mockLinkReferralService.execute).toHaveBeenCalled();
    });

    it('비밀번호가 올바르게 해싱되어 저장된다', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);
      mockVipMembershipService.getOrCreateMembership.mockResolvedValue(
        {} as any,
      );
      mockActivityLog.logSuccess.mockResolvedValue(undefined);

      // Act
      await service.execute({
        email: mockEmail,
        password: mockPassword,
        requestInfo: mockRequestInfo,
      });

      // Assert
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          passwordHash: expect.any(String),
        }),
      );

      // 비밀번호 해시는 원본 비밀번호와 다르야 함
      const createCall = mockUserRepository.create.mock.calls[0][0];
      expect(createCall.passwordHash).not.toBe(mockPassword);
      expect(createCall.passwordHash).toMatch(/^\$2[aby]\$/); // bcrypt 해시 형식
    });

    it('국가코드와 타임존이 올바르게 설정된다', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);
      mockVipMembershipService.getOrCreateMembership.mockResolvedValue(
        {} as any,
      );
      mockActivityLog.logSuccess.mockResolvedValue(undefined);

      // Act
      await service.execute({
        email: mockEmail,
        password: mockPassword,
        requestInfo: mockRequestInfo,
      });

      // Assert
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          country: mockRequestInfo.country,
          timezone: expect.any(String),
        }),
      );
    });

    it('VIP 멤버십이 생성된다', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);
      mockVipMembershipService.getOrCreateMembership.mockResolvedValue(
        {} as any,
      );
      mockActivityLog.logSuccess.mockResolvedValue(undefined);

      // Act
      await service.execute({
        email: mockEmail,
        password: mockPassword,
        requestInfo: mockRequestInfo,
      });

      // Assert
      expect(mockVipMembershipService.getOrCreateMembership).toHaveBeenCalledWith(
        mockUserId,
      );
    });
  });
});

