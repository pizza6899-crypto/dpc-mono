// src/modules/affiliate/code/application/find-default-code.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { FindDefaultCodeService } from './find-default-code.service';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';
import { AffiliateCode } from '../domain';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';

describe('FindDefaultCodeService', () => {
  let service: FindDefaultCodeService;
  let mockRepository: jest.Mocked<AffiliateCodeRepositoryPort>;
  let mockDispatchLogService: jest.Mocked<DispatchLogService>;

  const userId = BigInt(123);
  const mockDefaultCode = AffiliateCode.fromPersistence({
    id: 'code-123',
    userId,
    code: 'DEFAULTCODE',
    campaignName: 'Default Campaign',
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
      findManyForAdmin: jest.fn(),
    };

    const mockDispatchLogServiceProvider = {
      provide: DispatchLogService,
      useValue: {
        dispatch: jest.fn().mockResolvedValue(undefined),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindDefaultCodeService,
        {
          provide: AFFILIATE_CODE_REPOSITORY,
          useValue: mockRepository,
        },
        mockDispatchLogServiceProvider,
      ],
    }).compile();

    service = module.get<FindDefaultCodeService>(FindDefaultCodeService);
    mockRepository = module.get(AFFILIATE_CODE_REPOSITORY);
    mockDispatchLogService = module.get(DispatchLogService);

    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return default code when it exists', async () => {
      mockRepository.findDefaultByUserId.mockResolvedValue(mockDefaultCode);

      const result = await service.execute({ userId });

      expect(result).toEqual(mockDefaultCode);
      expect(result?.isDefault).toBe(true);
      expect(mockRepository.findDefaultByUserId).toHaveBeenCalledWith(userId);
      expect(mockRepository.findDefaultByUserId).toHaveBeenCalledTimes(1);
    });

    it('should return null when default code does not exist', async () => {
      mockRepository.findDefaultByUserId.mockResolvedValue(null);

      const result = await service.execute({ userId });

      expect(result).toBeNull();
      expect(mockRepository.findDefaultByUserId).toHaveBeenCalledWith(userId);
      expect(mockRepository.findDefaultByUserId).toHaveBeenCalledTimes(1);
    });

    it('should handle repository errors', async () => {
      const error = new Error('Database error');
      mockRepository.findDefaultByUserId.mockRejectedValue(error);

      await expect(service.execute({ userId })).rejects.toThrow(
        'Database error',
      );
      expect(mockRepository.findDefaultByUserId).toHaveBeenCalledWith(userId);
    });
  });
});
