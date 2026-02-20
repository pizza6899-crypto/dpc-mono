// src/modules/affiliate/referral/application/find-referral-by-id.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { FindReferralByIdService } from './find-referral-by-id.service';
import { REFERRAL_REPOSITORY } from '../ports/out/referral.repository.token';
import type { ReferralRepositoryPort } from '../ports/out/referral.repository.port';
import { Referral } from '../domain/model/referral.entity';
import { ReferralNotFoundException } from '../domain/referral.exception';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';

describe('FindReferralByIdService', () => {
  let service: FindReferralByIdService;
  let mockRepository: jest.Mocked<ReferralRepositoryPort>;
  let mockDispatchLogService: jest.Mocked<DispatchLogService>;

  const referralId = 'referral-123';
  const affiliateId = BigInt(123);
  const subUserId = BigInt(456);
  const codeId = 'code-789';

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

    const mockDispatchLogServiceProvider = {
      provide: DispatchLogService,
      useValue: {
        dispatch: jest.fn().mockResolvedValue(undefined),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindReferralByIdService,
        {
          provide: REFERRAL_REPOSITORY,
          useValue: mockRepository,
        },
        mockDispatchLogServiceProvider,
      ],
    }).compile();

    service = module.get<FindReferralByIdService>(FindReferralByIdService);
    mockRepository = module.get(REFERRAL_REPOSITORY);
    mockDispatchLogService = module.get(DispatchLogService);

    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return referral when found', async () => {
      mockRepository.findById.mockResolvedValue(mockReferral);

      const result = await service.execute({ id: referralId });

      expect(result).toEqual(mockReferral);
      expect(mockRepository.findById).toHaveBeenCalledWith(referralId);
      expect(mockRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should throw ReferralNotFoundException when referral not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.execute({ id: referralId })).rejects.toThrow(
        ReferralNotFoundException,
      );

      expect(mockRepository.findById).toHaveBeenCalledWith(referralId);
      expect(mockRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should throw ReferralNotFoundException with correct message when id is provided', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.execute({ id: referralId })).rejects.toThrow(
        `Referral '${referralId}' not found`,
      );
    });
  });
});
