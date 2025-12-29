// src/modules/affiliate/referral/application/link-referral.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PrismaModule } from 'src/platform/prisma/prisma.module';
import { EnvModule } from 'src/platform/env/env.module';
import { LinkReferralService } from './link-referral.service';
import { REFERRAL_REPOSITORY } from '../ports/out/referral.repository.token';
import type { ReferralRepositoryPort } from '../ports/out/referral.repository.port';
import { FindCodeByCodeService } from '../../code/application/find-code-by-code.service';
import { ReferralPolicy } from '../domain/referral-policy';
import {
  DuplicateReferralException,
  ReferralCodeNotFoundException,
  SelfReferralException,
  ReferralCodeInactiveException,
  ReferralCodeExpiredException,
} from '../domain/referral.exception';
import { Referral } from '../domain/model/referral.entity';
import { AffiliateCode } from '../../code/domain/model/affiliate-code.entity';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';
import { ActivityType } from 'src/platform/activity-log/activity-log.types';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';

describe('LinkReferralService', () => {
  let module: TestingModule;
  let service: LinkReferralService;
  let mockRepository: jest.Mocked<ReferralRepositoryPort>;
  let mockFindCodeService: jest.Mocked<FindCodeByCodeService>;
  let mockPolicy: ReferralPolicy;
  let mockActivityLog: jest.Mocked<ActivityLogPort>;

  const affiliateId = 'affiliate-123';
  const subUserId = 'sub-user-456';
  const codeId = 'code-789';
  const referralCode = 'TESTCODE1';
  const referralId = 'referral-123';

  const mockCode = AffiliateCode.fromPersistence({
    id: codeId,
    userId: affiliateId,
    code: referralCode,
    campaignName: 'Test Campaign',
    isActive: true,
    isDefault: true,
    expiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastUsedAt: null,
  });

  const mockReferral = Referral.fromPersistence({
    id: referralId,
    affiliateId,
    codeId,
    subUserId,
    ipAddress: '192.168.1.1',
    deviceFingerprint: 'fingerprint-123',
    userAgent: 'Mozilla/5.0',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

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
    path: '/api/referral',
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

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      getById: jest.fn(),
      findByAffiliateId: jest.fn(),
      findBySubUserId: jest.fn(),
      findByCodeId: jest.fn(),
      findByAffiliateAndSubUser: jest.fn(),
      countByAffiliateId: jest.fn(),
    };

    mockFindCodeService = {
      execute: jest.fn(),
    } as any;

    mockPolicy = new ReferralPolicy();

    mockActivityLog = {
      log: jest.fn(),
      logSuccess: jest.fn(),
      logFailure: jest.fn(),
    };

    module = await Test.createTestingModule({
      imports: [PrismaModule, EnvModule],
      providers: [
        LinkReferralService,
        {
          provide: REFERRAL_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: FindCodeByCodeService,
          useValue: mockFindCodeService,
        },
        ReferralPolicy,
        {
          provide: ACTIVITY_LOG,
          useValue: mockActivityLog,
        },
      ],
    }).compile();

    service = module.get<LinkReferralService>(LinkReferralService);
    mockRepository = module.get(REFERRAL_REPOSITORY);
    mockFindCodeService = module.get(FindCodeByCodeService);
    mockActivityLog = module.get(ACTIVITY_LOG);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('execute', () => {
    it('should create a referral relationship successfully', async () => {
      mockFindCodeService.execute.mockResolvedValue(mockCode);
      mockRepository.findBySubUserId.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockReferral);

      const result = await service.execute({
        subUserId,
        referralCode,
        ipAddress: '192.168.1.1',
        deviceFingerprint: 'fingerprint-123',
        userAgent: 'Mozilla/5.0',
      });

      expect(result).toEqual(mockReferral);
      expect(mockFindCodeService.execute).toHaveBeenCalledWith({
        code: referralCode,
      });
      expect(mockRepository.findBySubUserId).toHaveBeenCalledWith(subUserId);
      expect(mockRepository.create).toHaveBeenCalledWith({
        affiliateId,
        codeId,
        subUserId,
        ipAddress: '192.168.1.1',
        deviceFingerprint: 'fingerprint-123',
        userAgent: 'Mozilla/5.0',
      });
    });

    it('should create a referral relationship with optional tracking data', async () => {
      mockFindCodeService.execute.mockResolvedValue(mockCode);
      mockRepository.findBySubUserId.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockReferral);

      const result = await service.execute({
        subUserId,
        referralCode,
      });

      expect(result).toEqual(mockReferral);
      expect(mockRepository.create).toHaveBeenCalledWith({
        affiliateId,
        codeId,
        subUserId,
        ipAddress: undefined,
        deviceFingerprint: undefined,
        userAgent: undefined,
      });
    });

    it('should throw ReferralCodeNotFoundException when code not found', async () => {
      mockFindCodeService.execute.mockResolvedValue(null);

      await expect(
        service.execute({
          subUserId,
          referralCode,
        }),
      ).rejects.toThrow(ReferralCodeNotFoundException);

      expect(mockRepository.findBySubUserId).not.toHaveBeenCalled();
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw SelfReferralException when affiliate and sub user are same', async () => {
      const selfReferralCode = AffiliateCode.fromPersistence({
        ...mockCode.toPersistence(),
        userId: subUserId, // 같은 사용자
      });

      mockFindCodeService.execute.mockResolvedValue(selfReferralCode);

      await expect(
        service.execute({
          subUserId,
          referralCode,
        }),
      ).rejects.toThrow(SelfReferralException);

      expect(mockRepository.findBySubUserId).not.toHaveBeenCalled();
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ReferralCodeInactiveException when code is inactive', async () => {
      const inactiveCode = AffiliateCode.fromPersistence({
        ...mockCode.toPersistence(),
        isActive: false,
      });

      mockFindCodeService.execute.mockResolvedValue(inactiveCode);

      await expect(
        service.execute({
          subUserId,
          referralCode,
        }),
      ).rejects.toThrow(ReferralCodeInactiveException);

      expect(mockRepository.findBySubUserId).not.toHaveBeenCalled();
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ReferralCodeExpiredException when code is expired', async () => {
      const expiredCode = AffiliateCode.fromPersistence({
        ...mockCode.toPersistence(),
        expiresAt: new Date('2020-01-01'), // 과거 날짜
      });

      mockFindCodeService.execute.mockResolvedValue(expiredCode);

      await expect(
        service.execute({
          subUserId,
          referralCode,
        }),
      ).rejects.toThrow(ReferralCodeExpiredException);

      expect(mockRepository.findBySubUserId).not.toHaveBeenCalled();
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw DuplicateReferralException when referral already exists', async () => {
      const existingReferral = Referral.fromPersistence({
        ...mockReferral.toPersistence(),
        id: 'existing-referral',
      });

      mockFindCodeService.execute.mockResolvedValue(mockCode);
      mockRepository.findBySubUserId.mockResolvedValue(existingReferral);

      await expect(
        service.execute({
          subUserId,
          referralCode,
        }),
      ).rejects.toThrow(DuplicateReferralException);

      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should log activity when requestInfo is provided', async () => {
      mockFindCodeService.execute.mockResolvedValue(mockCode);
      mockRepository.findBySubUserId.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockReferral);

      await service.execute({
        subUserId,
        referralCode,
        requestInfo: mockRequestInfo,
      });

      expect(mockActivityLog.logSuccess).toHaveBeenCalledWith(
        {
          userId: subUserId,
          activityType: ActivityType.REFERRAL_LINKED,
          description: expect.stringContaining('레퍼럴 관계 생성 완료'),
          metadata: {
            referralId,
            affiliateId,
            referralCode,
            codeId,
            codeCampaignName: 'Test Campaign',
          },
        },
        mockRequestInfo,
      );
    });

    it('should not log activity when requestInfo is not provided', async () => {
      mockFindCodeService.execute.mockResolvedValue(mockCode);
      mockRepository.findBySubUserId.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockReferral);

      await service.execute({
        subUserId,
        referralCode,
      });

      expect(mockActivityLog.logSuccess).not.toHaveBeenCalled();
    });

    it('should handle code with null campaign name', async () => {
      const codeWithoutCampaign = AffiliateCode.fromPersistence({
        ...mockCode.toPersistence(),
        campaignName: null,
      });

      mockFindCodeService.execute.mockResolvedValue(codeWithoutCampaign);
      mockRepository.findBySubUserId.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockReferral);

      await service.execute({
        subUserId,
        referralCode,
        requestInfo: mockRequestInfo,
      });

      expect(mockActivityLog.logSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            codeCampaignName: null,
          }),
        }),
        mockRequestInfo,
      );
    });
  });
});
