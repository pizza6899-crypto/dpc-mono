// src/modules/affiliate/code/application/toggle-code-active.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ToggleCodeActiveService } from './toggle-code-active.service';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';
import { AffiliateCode, AffiliateCodeNotFoundException } from '../domain';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';

describe('ToggleCodeActiveService', () => {
  let service: ToggleCodeActiveService;
  let mockRepository: jest.Mocked<AffiliateCodeRepositoryPort>;
  let mockDispatchLogService: jest.Mocked<DispatchLogService>;

  const userId = BigInt(123);
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
        ToggleCodeActiveService,
        {
          provide: AFFILIATE_CODE_REPOSITORY,
          useValue: mockRepository,
        },
        mockDispatchLogServiceProvider,
      ],
    }).compile();

    service = module.get<ToggleCodeActiveService>(ToggleCodeActiveService);
    mockRepository = module.get(AFFILIATE_CODE_REPOSITORY);
    mockDispatchLogService = module.get(DispatchLogService);

    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should toggle code from active to inactive', async () => {
      const inactiveCode = AffiliateCode.fromPersistence({
        ...mockCode.toPersistence(),
        isActive: false,
      });

      mockRepository.findById.mockResolvedValue(mockCode);
      mockRepository.update.mockResolvedValue(inactiveCode);

      const result = await service.execute({ id: codeId, userId });

      expect(result.isActive).toBe(false);
      expect(mockRepository.findById).toHaveBeenCalledWith(codeId, userId);
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should toggle code from inactive to active', async () => {
      const inactiveCode = AffiliateCode.fromPersistence({
        ...mockCode.toPersistence(),
        isActive: false,
      });
      const activeCode = AffiliateCode.fromPersistence({
        ...mockCode.toPersistence(),
        isActive: true,
      });

      mockRepository.findById.mockResolvedValue(inactiveCode);
      mockRepository.update.mockResolvedValue(activeCode);

      const result = await service.execute({ id: codeId, userId });

      expect(result.isActive).toBe(true);
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should throw error when code not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.execute({ id: codeId, userId })).rejects.toThrow(
        AffiliateCodeNotFoundException,
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });
});
