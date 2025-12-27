// src/modules/affiliate/code/application/find-code-by-id.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { FindCodeByIdService } from './find-code-by-id.service';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';
import { AffiliateCode, AffiliateCodeNotFoundException } from '../domain';

describe('FindCodeByIdService', () => {
  let service: FindCodeByIdService;
  let mockRepository: jest.Mocked<AffiliateCodeRepositoryPort>;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindCodeByIdService,
        {
          provide: AFFILIATE_CODE_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<FindCodeByIdService>(FindCodeByIdService);
    mockRepository = module.get(AFFILIATE_CODE_REPOSITORY);

    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return code by id', async () => {
      mockRepository.findById.mockResolvedValue(mockCode);

      const result = await service.execute({ id: codeId, userId });

      expect(result).toEqual(mockCode);
      expect(mockRepository.findById).toHaveBeenCalledWith(codeId, userId);
    });

    it('should throw error when code not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.execute({ id: codeId, userId })).rejects.toThrow(
        AffiliateCodeNotFoundException,
      );
      expect(mockRepository.findById).toHaveBeenCalledWith(codeId, userId);
    });

    it('should throw error with correct id in exception', async () => {
      mockRepository.findById.mockResolvedValue(null);

      try {
        await service.execute({ id: codeId, userId });
      } catch (error) {
        expect(error).toBeInstanceOf(AffiliateCodeNotFoundException);
        expect(error.message).toContain(codeId);
      }
    });
  });
});
