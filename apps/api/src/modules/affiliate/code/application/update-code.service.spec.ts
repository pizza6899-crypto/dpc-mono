// src/modules/affiliate/code/application/update-code.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { UpdateCodeService } from './update-code.service';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';
import { AffiliateCode, AffiliateCodeNotFoundException } from '../domain';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';

describe('UpdateCodeService', () => {
  let service: UpdateCodeService;
  let mockRepository: jest.Mocked<AffiliateCodeRepositoryPort>;
  let mockActivityLog: jest.Mocked<ActivityLogPort>;

  const userId = 'user-123';
  const codeId = 'code-123';
  const mockCode = AffiliateCode.fromPersistence({
    id: codeId,
    userId,
    code: 'TESTCODE1',
    campaignName: 'Old Campaign',
    isActive: true,
    isDefault: true,
    expiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastUsedAt: null,
  });

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      findByUserId: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      countByUserId: jest.fn(),
      existsByCode: jest.fn(),
      findDefaultByUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
    };

    const mockActivityLogProvider = {
      provide: ACTIVITY_LOG,
      useValue: {
        log: jest.fn(),
        logSuccess: jest.fn(),
        logFailure: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCodeService,
        {
          provide: AFFILIATE_CODE_REPOSITORY,
          useValue: mockRepository,
        },
        mockActivityLogProvider,
      ],
    }).compile();

    service = module.get<UpdateCodeService>(UpdateCodeService);
    mockRepository = module.get(AFFILIATE_CODE_REPOSITORY);
    mockActivityLog = module.get(ACTIVITY_LOG);

    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should update code campaign name', async () => {
      const updatedCode = AffiliateCode.fromPersistence({
        ...mockCode.toPersistence(),
        campaignName: 'Updated Campaign',
      });

      mockRepository.findById.mockResolvedValue(mockCode);
      mockRepository.update.mockResolvedValue(updatedCode);

      const result = await service.execute({
        id: codeId,
        userId,
        campaignName: 'Updated Campaign',
      });

      expect(result.campaignName).toBe('Updated Campaign');
      expect(mockRepository.findById).toHaveBeenCalledWith(codeId, userId);
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should update campaign name to null', async () => {
      const updatedCode = AffiliateCode.fromPersistence({
        ...mockCode.toPersistence(),
        campaignName: null,
      });

      mockRepository.findById.mockResolvedValue(mockCode);
      mockRepository.update.mockResolvedValue(updatedCode);

      const result = await service.execute({
        id: codeId,
        userId,
        campaignName: null as any,
      });

      expect(result.campaignName).toBeNull();
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should throw error when code not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.execute({
          id: codeId,
          userId,
          campaignName: 'Updated',
        }),
      ).rejects.toThrow(AffiliateCodeNotFoundException);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });
});
