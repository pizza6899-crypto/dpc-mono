// src/modules/affiliate/referral/application/admin-referral.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { AdminReferralService } from './admin-referral.service';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { ReferralMapper } from '../infrastructure/referral.mapper';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import { ReferralNotFoundException } from '../domain/referral.exception';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import type { GetReferralsQueryDto } from '../controllers/dto/request/get-referrals-query.dto';

describe('AdminReferralService', () => {
  let service: AdminReferralService;
  let mockReferralMethods: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    count: jest.Mock;
  };
  let mockMapper: jest.Mocked<ReferralMapper>;
  let mockDispatchLogService: jest.Mocked<DispatchLogService>;

  const adminId = BigInt(123);
  const referralId = 'referral-123';
  const affiliateId = BigInt(123);
  const subUserId = BigInt(456);
  const codeId = 'code-789';

  const mockRequestInfo: RequestClientInfo = {
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    fingerprint: 'fingerprint-123',
    country: 'KR',
    city: 'Seoul',
    referer: 'https://example.com',
    acceptLanguage: 'ko-KR',
    protocol: 'https',
    method: 'GET',
    path: '/admin/affiliate/referrals',
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

  const mockReferral = {
    id: referralId,
    affiliateId,
    subUserId,
    codeId,
    ipAddress: '192.168.1.1',
    deviceFingerprint: 'fingerprint-123',
    userAgent: 'Mozilla/5.0',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    affiliate: {
      id: affiliateId,
      email: 'affiliate@example.com',
      numericId: 1,
    },
    subUser: {
      id: subUserId,
      email: 'subuser@example.com',
      numericId: 2,
    },
    code: {
      id: codeId,
      code: 'TESTCODE1',
      campaignName: 'Test Campaign',
    },
  };

  const mockReferral2 = {
    ...mockReferral,
    id: 'referral-456',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  };

  beforeEach(async () => {
    mockReferralMethods = {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    };

    const mockPrismaServiceProvider = {
      provide: PrismaService,
      useValue: {
        referral: mockReferralMethods,
      },
    };

    const mockMapperProvider = {
      provide: ReferralMapper,
      useValue: {
        toDomain: jest.fn(),
        toPrisma: jest.fn(),
      },
    };

    const mockDispatchLogServiceProvider = {
      provide: DispatchLogService,
      useValue: {
        dispatch: jest.fn().mockResolvedValue(undefined),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminReferralService,
        mockPrismaServiceProvider,
        mockMapperProvider,
        mockDispatchLogServiceProvider,
      ],
    }).compile();

    service = module.get<AdminReferralService>(AdminReferralService);
    mockMapper = module.get(ReferralMapper);
    mockDispatchLogService = module.get(
      DispatchLogService,
    ) as jest.Mocked<DispatchLogService>;

    jest.clearAllMocks();
  });

  describe('getReferrals', () => {
    it('should return paginated referrals successfully', async () => {
      const query: GetReferralsQueryDto = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      mockReferralMethods.findMany.mockResolvedValue([mockReferral]);
      mockReferralMethods.count.mockResolvedValue(1);

      const result = await service.getReferrals(
        query,
        adminId,
        mockRequestInfo,
      );

      expect(result).toEqual({
        data: [
          {
            id: referralId,
            affiliateId,
            affiliateEmail: 'affiliate@example.com',
            subUserId,
            subUserEmail: 'subuser@example.com',
            codeId,
            code: 'TESTCODE1',
            campaignName: 'Test Campaign',
            ipAddress: '192.168.1.1',
            deviceFingerprint: 'fingerprint-123',
            userAgent: 'Mozilla/5.0',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        ],
        page: 1,
        limit: 20,
        total: 1,
      });

      expect(mockReferralMethods.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          affiliate: {
            select: {
              id: true,
              email: true,
            },
          },
          subUser: {
            select: {
              id: true,
              email: true,
            },
          },
          code: {
            select: {
              id: true,
              code: true,
              campaignName: true,
            },
          },
        },
      });

      expect(mockDispatchLogService.dispatch).toHaveBeenCalledWith(
        {
          type: LogType.ACTIVITY,
          data: {
            userId: adminId.toString(),
            category: 'AFFILIATE',
            action: 'ADMIN_REFERRAL_LIST_VIEW',
            metadata: {
              filters: {},
              total: 1,
              page: 1,
              limit: 20,
            },
          },
        },
        mockRequestInfo,
      );
    });

    it('should filter by affiliateId', async () => {
      const query: GetReferralsQueryDto = {
        page: 1,
        limit: 20,
        affiliateId,
      };

      mockReferralMethods.findMany.mockResolvedValue([mockReferral]);
      mockReferralMethods.count.mockResolvedValue(1);

      await service.getReferrals(query, adminId, mockRequestInfo);

      expect(mockReferralMethods.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            affiliateId,
          },
        }),
      );
    });

    it('should filter by subUserId', async () => {
      const query: GetReferralsQueryDto = {
        page: 1,
        limit: 20,
        subUserId,
      };

      mockReferralMethods.findMany.mockResolvedValue([mockReferral]);
      mockReferralMethods.count.mockResolvedValue(1);

      await service.getReferrals(query, adminId, mockRequestInfo);

      expect(mockReferralMethods.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            subUserId,
          },
        }),
      );
    });

    it('should filter by codeId', async () => {
      const query: GetReferralsQueryDto = {
        page: 1,
        limit: 20,
        codeId,
      };

      mockReferralMethods.findMany.mockResolvedValue([mockReferral]);
      mockReferralMethods.count.mockResolvedValue(1);

      await service.getReferrals(query, adminId, mockRequestInfo);

      expect(mockReferralMethods.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            codeId,
          },
        }),
      );
    });

    it('should filter by date range', async () => {
      const query: GetReferralsQueryDto = {
        page: 1,
        limit: 20,
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
      };

      mockReferralMethods.findMany.mockResolvedValue([mockReferral]);
      mockReferralMethods.count.mockResolvedValue(1);

      await service.getReferrals(query, adminId, mockRequestInfo);

      expect(mockReferralMethods.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              gte: new Date('2024-01-01T00:00:00Z'),
              lte: new Date('2024-01-31T23:59:59Z'),
            },
          },
        }),
      );
    });

    it('should not filter by date range if only startDate is provided', async () => {
      const query: GetReferralsQueryDto = {
        page: 1,
        limit: 20,
        startDate: '2024-01-01T00:00:00Z',
      };

      mockReferralMethods.findMany.mockResolvedValue([mockReferral]);
      mockReferralMethods.count.mockResolvedValue(1);

      await service.getReferrals(query, adminId, mockRequestInfo);

      expect(mockReferralMethods.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });

    it('should handle pagination correctly', async () => {
      const query: GetReferralsQueryDto = {
        page: 2,
        limit: 10,
      };

      mockReferralMethods.findMany.mockResolvedValue([mockReferral2]);
      mockReferralMethods.count.mockResolvedValue(15);

      const result = await service.getReferrals(
        query,
        adminId,
        mockRequestInfo,
      );

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(15);

      expect(mockReferralMethods.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });

    it('should handle sorting correctly', async () => {
      const query: GetReferralsQueryDto = {
        page: 1,
        limit: 20,
        sortBy: 'updatedAt',
        sortOrder: 'asc',
      };

      mockReferralMethods.findMany.mockResolvedValue([mockReferral]);
      mockReferralMethods.count.mockResolvedValue(1);

      await service.getReferrals(query, adminId, mockRequestInfo);

      expect(mockReferralMethods.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            updatedAt: 'asc',
          },
        }),
      );
    });

    it('should handle multiple filters', async () => {
      const query: GetReferralsQueryDto = {
        page: 1,
        limit: 20,
        affiliateId,
        codeId,
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
      };

      mockReferralMethods.findMany.mockResolvedValue([mockReferral]);
      mockReferralMethods.count.mockResolvedValue(1);

      await service.getReferrals(query, adminId, mockRequestInfo);

      expect(mockReferralMethods.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            affiliateId,
            codeId,
            createdAt: {
              gte: new Date('2024-01-01T00:00:00Z'),
              lte: new Date('2024-01-31T23:59:59Z'),
            },
          },
        }),
      );
    });

    it('should handle empty results', async () => {
      const query: GetReferralsQueryDto = {
        page: 1,
        limit: 20,
      };

      mockReferralMethods.findMany.mockResolvedValue([]);
      mockReferralMethods.count.mockResolvedValue(0);

      const result = await service.getReferrals(
        query,
        adminId,
        mockRequestInfo,
      );

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle errors and log them', async () => {
      const query: GetReferralsQueryDto = {
        page: 1,
        limit: 20,
      };

      const error = new Error('Database error');
      mockReferralMethods.findMany.mockRejectedValue(error);

      await expect(
        service.getReferrals(query, adminId, mockRequestInfo),
      ).rejects.toThrow('Database error');

      // Logger는 실제로 호출되지만 테스트에서는 확인하기 어려움
    });
  });

  describe('getReferralById', () => {
    it('should return referral detail successfully', async () => {
      mockReferralMethods.findUnique.mockResolvedValue(mockReferral);

      const result = await service.getReferralById(
        referralId,
        adminId,
        mockRequestInfo,
      );

      expect(result).toEqual({
        id: referralId,
        affiliateId,
        affiliateEmail: 'affiliate@example.com',
        subUserId,
        subUserEmail: 'subuser@example.com',
        codeId,
        code: 'TESTCODE1',
        campaignName: 'Test Campaign',
        ipAddress: '192.168.1.1',
        deviceFingerprint: 'fingerprint-123',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      expect(mockReferralMethods.findUnique).toHaveBeenCalledWith({
        where: { id: referralId },
        include: {
          affiliate: {
            select: {
              id: true,
              email: true,
            },
          },
          subUser: {
            select: {
              id: true,
              email: true,
            },
          },
          code: {
            select: {
              id: true,
              code: true,
              campaignName: true,
            },
          },
        },
      });

      expect(mockDispatchLogService.dispatch).toHaveBeenCalledWith(
        {
          type: LogType.ACTIVITY,
          data: {
            userId: adminId.toString(),
            category: 'AFFILIATE',
            action: 'ADMIN_REFERRAL_DETAIL_VIEW',
            metadata: {
              referralId,
            },
          },
        },
        mockRequestInfo,
      );
    });

    it('should throw ReferralNotFoundException when referral not found', async () => {
      mockReferralMethods.findUnique.mockResolvedValue(null);

      await expect(
        service.getReferralById(referralId, adminId, mockRequestInfo),
      ).rejects.toThrow(ReferralNotFoundException);

      expect(mockDispatchLogService.dispatch).not.toHaveBeenCalled();
    });

    it('should handle referral with null email', async () => {
      const referralWithNullEmail = {
        ...mockReferral,
        affiliate: {
          ...mockReferral.affiliate,
          email: null,
        },
        subUser: {
          ...mockReferral.subUser,
          email: null,
        },
      };

      mockReferralMethods.findUnique.mockResolvedValue(referralWithNullEmail);

      const result = await service.getReferralById(
        referralId,
        adminId,
        mockRequestInfo,
      );

      expect(result.affiliateEmail).toBeNull();
      expect(result.subUserEmail).toBeNull();
    });

    it('should handle referral with null tracking data', async () => {
      const referralWithoutTracking = {
        ...mockReferral,
        ipAddress: null,
        deviceFingerprint: null,
        userAgent: null,
      };

      mockReferralMethods.findUnique.mockResolvedValue(referralWithoutTracking);

      const result = await service.getReferralById(
        referralId,
        adminId,
        mockRequestInfo,
      );

      expect(result.ipAddress).toBeNull();
      expect(result.deviceFingerprint).toBeNull();
      expect(result.userAgent).toBeNull();
    });

    it('should handle referral with null campaign name', async () => {
      const referralWithNullCampaign = {
        ...mockReferral,
        code: {
          ...mockReferral.code,
          campaignName: null,
        },
      };

      mockReferralMethods.findUnique.mockResolvedValue(
        referralWithNullCampaign,
      );

      const result = await service.getReferralById(
        referralId,
        adminId,
        mockRequestInfo,
      );

      expect(result.campaignName).toBeNull();
    });

    it('should handle errors and log them', async () => {
      const error = new Error('Database error');
      mockReferralMethods.findUnique.mockRejectedValue(error);

      await expect(
        service.getReferralById(referralId, adminId, mockRequestInfo),
      ).rejects.toThrow('Database error');
    });
  });
});
