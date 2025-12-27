// src/modules/affiliate/referral/application/find-referral-by-sub-user-id.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { FindReferralBySubUserIdService } from './find-referral-by-sub-user-id.service';
import { REFERRAL_REPOSITORY } from '../ports/out/referral.repository.token';
import type { ReferralRepositoryPort } from '../ports/out/referral.repository.port';
import { Referral } from '../domain/model/referral.entity';

describe('FindReferralBySubUserIdService', () => {
  let service: FindReferralBySubUserIdService;
  let mockRepository: jest.Mocked<ReferralRepositoryPort>;

  const subUserId = 'sub-user-456';
  const affiliateId = 'affiliate-123';
  const codeId = 'code-789';
  const referralId = 'referral-123';

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
        FindReferralBySubUserIdService,
        {
          provide: REFERRAL_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<FindReferralBySubUserIdService>(
      FindReferralBySubUserIdService,
    );
    mockRepository = module.get(REFERRAL_REPOSITORY);

    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return referral when found', async () => {
      mockRepository.findBySubUserId.mockResolvedValue(mockReferral);

      const result = await service.execute({ subUserId });

      expect(result).toEqual(mockReferral);
      expect(mockRepository.findBySubUserId).toHaveBeenCalledWith(subUserId);
      expect(mockRepository.findBySubUserId).toHaveBeenCalledTimes(1);
    });

    it('should return null when referral not found', async () => {
      mockRepository.findBySubUserId.mockResolvedValue(null);

      const result = await service.execute({ subUserId });

      expect(result).toBeNull();
      expect(mockRepository.findBySubUserId).toHaveBeenCalledWith(subUserId);
      expect(mockRepository.findBySubUserId).toHaveBeenCalledTimes(1);
    });

    it('should handle referral with null tracking data', async () => {
      const referralWithoutTracking = Referral.fromPersistence({
        ...mockReferral.toPersistence(),
        ipAddress: null,
        deviceFingerprint: null,
        userAgent: null,
      });

      mockRepository.findBySubUserId.mockResolvedValue(referralWithoutTracking);

      const result = await service.execute({ subUserId });

      expect(result).toEqual(referralWithoutTracking);
      expect(result?.ipAddress).toBeNull();
      expect(result?.deviceFingerprint).toBeNull();
      expect(result?.userAgent).toBeNull();
    });
  });
});
