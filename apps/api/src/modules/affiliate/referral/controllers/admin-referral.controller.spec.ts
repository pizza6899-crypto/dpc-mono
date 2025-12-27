// src/modules/affiliate/referral/controllers/admin-referral.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AdminReferralController } from './admin-referral.controller';
import { AdminReferralService } from '../application/admin-referral.service';
import { ReferralNotFoundException } from '../domain/referral.exception';
import type { PaginatedData, RequestClientInfo } from 'src/platform/http/types';
import { AdminReferralListItemDto } from './dto/response/admin-referral-response.dto';
import { GetReferralsQueryDto } from './dto/request/get-referrals-query.dto';

describe('AdminReferralController', () => {
  let controller: AdminReferralController;
  let adminReferralService: jest.Mocked<AdminReferralService>;

  const mockAdmin = {
    id: 'admin-id',
    email: 'admin@test.com',
    role: 'ADMIN',
    session: {
      id: 'session-id',
    },
  } as any;

  const mockRequestInfo: RequestClientInfo = {
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
  };

  const mockReferral: AdminReferralListItemDto = {
    id: 'referral-id',
    affiliateId: 'affiliate-id',
    affiliateEmail: 'affiliate@test.com',
    affiliateNumericId: 1,
    subUserId: 'sub-user-id',
    subUserEmail: 'subuser@test.com',
    subUserNumericId: 2,
    codeId: 'code-id',
    code: 'TESTCODE123',
    campaignName: 'Test Campaign',
    ipAddress: '192.168.1.1',
    deviceFingerprint: 'fingerprint123',
    userAgent: 'Mozilla/5.0',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  };

  beforeEach(async () => {
    const mockAdminReferralService = {
      getReferrals: jest.fn(),
      getReferralById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminReferralController],
      providers: [
        {
          provide: AdminReferralService,
          useValue: mockAdminReferralService,
        },
      ],
    }).compile();

    controller = module.get<AdminReferralController>(AdminReferralController);
    adminReferralService = module.get(AdminReferralService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getReferrals', () => {
    it('should return paginated referrals list', async () => {
      const query: GetReferralsQueryDto = {
        page: 1,
        limit: 10,
      };

      const mockResult: PaginatedData<AdminReferralListItemDto> = {
        data: [mockReferral],
        page: 1,
        limit: 10,
        total: 1,
      };

      adminReferralService.getReferrals.mockResolvedValue(mockResult);

      const result = await controller.getReferrals(
        query,
        mockAdmin,
        mockRequestInfo,
      );

      expect(result).toEqual(mockResult);
      expect(adminReferralService.getReferrals).toHaveBeenCalledWith(
        query,
        mockAdmin.id,
        mockRequestInfo,
      );
    });

    it('should pass filters to service', async () => {
      const query: GetReferralsQueryDto = {
        page: 1,
        limit: 10,
        affiliateId: 'affiliate-id',
        subUserId: 'sub-user-id',
        codeId: 'code-id',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const mockResult: PaginatedData<AdminReferralListItemDto> = {
        data: [],
        page: 1,
        limit: 10,
        total: 0,
      };

      adminReferralService.getReferrals.mockResolvedValue(mockResult);

      await controller.getReferrals(query, mockAdmin, mockRequestInfo);

      expect(adminReferralService.getReferrals).toHaveBeenCalledWith(
        query,
        mockAdmin.id,
        mockRequestInfo,
      );
    });

    it('should handle empty results', async () => {
      const query: GetReferralsQueryDto = {
        page: 1,
        limit: 10,
      };

      const mockResult: PaginatedData<AdminReferralListItemDto> = {
        data: [],
        page: 1,
        limit: 10,
        total: 0,
      };

      adminReferralService.getReferrals.mockResolvedValue(mockResult);

      const result = await controller.getReferrals(
        query,
        mockAdmin,
        mockRequestInfo,
      );

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('getReferralById', () => {
    it('should return referral by id', async () => {
      adminReferralService.getReferralById.mockResolvedValue(mockReferral);

      const result = await controller.getReferralById(
        'referral-id',
        mockAdmin,
        mockRequestInfo,
      );

      expect(result).toEqual(mockReferral);
      expect(adminReferralService.getReferralById).toHaveBeenCalledWith(
        'referral-id',
        mockAdmin.id,
        mockRequestInfo,
      );
    });

    it('should throw error when referral not found', async () => {
      adminReferralService.getReferralById.mockRejectedValue(
        new ReferralNotFoundException('referral-id'),
      );

      await expect(
        controller.getReferralById(
          'non-existent-id',
          mockAdmin,
          mockRequestInfo,
        ),
      ).rejects.toThrow(ReferralNotFoundException);

      expect(adminReferralService.getReferralById).toHaveBeenCalledWith(
        'non-existent-id',
        mockAdmin.id,
        mockRequestInfo,
      );
    });
  });
});
