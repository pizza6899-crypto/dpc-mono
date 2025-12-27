// src/modules/affiliate/code/application/increment-code-usage.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { IncrementCodeUsageService } from './increment-code-usage.service';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';
import { AffiliateCode } from '../domain';

describe('IncrementCodeUsageService', () => {
  let service: IncrementCodeUsageService;
  let mockRepository: jest.Mocked<AffiliateCodeRepositoryPort>;

  const codeString = 'TESTCODE1';
  const mockCode = AffiliateCode.fromPersistence({
    id: 'code-123',
    userId: 'user-123',
    code: codeString,
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
        IncrementCodeUsageService,
        {
          provide: AFFILIATE_CODE_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<IncrementCodeUsageService>(IncrementCodeUsageService);
    mockRepository = module.get(AFFILIATE_CODE_REPOSITORY);

    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should increment code usage', async () => {
      const usedCode = AffiliateCode.fromPersistence({
        ...mockCode.toPersistence(),
        lastUsedAt: new Date(),
      });

      mockRepository.findByCode.mockResolvedValue(mockCode);
      mockRepository.update.mockResolvedValue(usedCode);

      await service.execute({ code: codeString });

      expect(mockRepository.findByCode).toHaveBeenCalledWith(codeString);
      expect(mockRepository.update).toHaveBeenCalled();
      const updateCall = mockRepository.update.mock.calls[0][0];
      expect(updateCall.lastUsedAt).toBeDefined();
    });

    it('should not throw error when code not found', async () => {
      mockRepository.findByCode.mockResolvedValue(null);

      await expect(
        service.execute({ code: 'NOTFOUND' }),
      ).resolves.not.toThrow();
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should update lastUsedAt timestamp', async () => {
      const beforeTime = new Date();
      mockRepository.findByCode.mockResolvedValue(mockCode);
      mockRepository.update.mockImplementation(async (code) => {
        return code;
      });

      await service.execute({ code: codeString });

      const updateCall = mockRepository.update.mock.calls[0][0];
      expect(updateCall.lastUsedAt).toBeInstanceOf(Date);
      expect(updateCall.lastUsedAt!.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime(),
      );
    });
  });
});
