// src/modules/affiliate/code/application/delete-code.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { DeleteCodeService } from './delete-code.service';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';
import {
  AffiliateCode,
  AffiliateCodeNotFoundException,
  AffiliateCodePolicy,
  AffiliateCodeCannotDeleteException,
} from '../domain';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';

describe('DeleteCodeService', () => {
  let service: DeleteCodeService;
  let mockRepository: jest.Mocked<AffiliateCodeRepositoryPort>;
  let mockPolicy: AffiliateCodePolicy;
  let mockActivityLog: jest.Mocked<ActivityLogPort>;

  const userId = 'user-123';
  const codeId = 'code-123';
  const mockCode = AffiliateCode.fromPersistence({
    id: codeId,
    userId,
    code: 'TESTCODE1',
    campaignName: 'Test Campaign',
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

    mockPolicy = new AffiliateCodePolicy();

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
        DeleteCodeService,
        {
          provide: AFFILIATE_CODE_REPOSITORY,
          useValue: mockRepository,
        },
        AffiliateCodePolicy,
        mockActivityLogProvider,
      ],
    }).compile();

    service = module.get<DeleteCodeService>(DeleteCodeService);
    mockRepository = module.get(AFFILIATE_CODE_REPOSITORY);
    mockActivityLog = module.get(ACTIVITY_LOG);

    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should delete code', async () => {
      mockRepository.findById.mockResolvedValue(mockCode);
      mockRepository.countByUserId.mockResolvedValue(2);
      mockRepository.delete.mockResolvedValue();

      await service.execute({ id: codeId, userId });

      expect(mockRepository.findById).toHaveBeenCalledWith(codeId, userId);
      expect(mockRepository.countByUserId).toHaveBeenCalledWith(userId);
      expect(mockRepository.delete).toHaveBeenCalledWith(codeId, userId);
    });

    it('should delete non-default code', async () => {
      const nonDefaultCode = AffiliateCode.fromPersistence({
        ...mockCode.toPersistence(),
        isDefault: false,
      });

      mockRepository.findById.mockResolvedValue(nonDefaultCode);
      mockRepository.countByUserId.mockResolvedValue(2);
      mockRepository.delete.mockResolvedValue();

      await service.execute({ id: codeId, userId });

      expect(mockRepository.delete).toHaveBeenCalled();
    });

    it('should throw error when code not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.execute({ id: codeId, userId })).rejects.toThrow(
        AffiliateCodeNotFoundException,
      );
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw error when trying to delete only default code', async () => {
      mockRepository.findById.mockResolvedValue(mockCode);
      mockRepository.countByUserId.mockResolvedValue(1);

      await expect(service.execute({ id: codeId, userId })).rejects.toThrow(
        AffiliateCodeCannotDeleteException,
      );
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should allow deleting default code when there are other codes', async () => {
      mockRepository.findById.mockResolvedValue(mockCode);
      mockRepository.countByUserId.mockResolvedValue(2);
      mockRepository.delete.mockResolvedValue();

      await service.execute({ id: codeId, userId });

      expect(mockRepository.delete).toHaveBeenCalled();
    });
  });
});
