// src/modules/affiliate/referral/application/find-referrals-by-affiliate-id.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { FindReferralsByAffiliateIdService } from './find-referrals-by-affiliate-id.service';
import { REFERRAL_REPOSITORY } from '../ports/out/referral.repository.token';
import type { ReferralRepositoryPort } from '../ports/out/referral.repository.port';
import { Referral } from '../domain/model/referral.entity';

describe('FindReferralsByAffiliateIdService', () => {
  let service: FindReferralsByAffiliateIdService;
  let mockRepository: jest.Mocked<ReferralRepositoryPort>;

  const affiliateId = 'affiliate-123';
  const codeId = 'code-789';

  const mockReferral1 = Referral.fromPersistence({
    id: 'referral-1',
    affiliateId,
    codeId,
    subUserId: 'sub-user-1',
    ipAddress: '192.168.1.1',
    deviceFingerprint: 'fingerprint-1',
    userAgent: 'Mozilla/5.0',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  });

  const mockReferral2 = Referral.fromPersistence({
    id: 'referral-2',
    affiliateId,
    codeId,
    subUserId: 'sub-user-2',
    ipAddress: '192.168.1.2',
    deviceFingerprint: 'fingerprint-2',
    userAgent: 'Mozilla/5.0',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  });

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindReferralsByAffiliateIdService,
        {
          provide: REFERRAL_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<FindReferralsByAffiliateIdService>(
      FindReferralsByAffiliateIdService,
    );
    mockRepository = module.get(REFERRAL_REPOSITORY);

    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return array of referrals when found', async () => {
      const mockReferrals = [mockReferral1, mockReferral2];
      mockRepository.findByAffiliateId.mockResolvedValue(mockReferrals);

      const result = await service.execute({ affiliateId });

      expect(result).toEqual(mockReferrals);
      expect(result).toHaveLength(2);
      expect(mockRepository.findByAffiliateId).toHaveBeenCalledWith(
        affiliateId,
      );
      expect(mockRepository.findByAffiliateId).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no referrals found', async () => {
      mockRepository.findByAffiliateId.mockResolvedValue([]);

      const result = await service.execute({ affiliateId });

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(mockRepository.findByAffiliateId).toHaveBeenCalledWith(
        affiliateId,
      );
      expect(mockRepository.findByAffiliateId).toHaveBeenCalledTimes(1);
    });

    it('should return single referral when only one exists', async () => {
      mockRepository.findByAffiliateId.mockResolvedValue([mockReferral1]);

      const result = await service.execute({ affiliateId });

      expect(result).toEqual([mockReferral1]);
      expect(result).toHaveLength(1);
      expect(mockRepository.findByAffiliateId).toHaveBeenCalledWith(
        affiliateId,
      );
    });
  });
});
