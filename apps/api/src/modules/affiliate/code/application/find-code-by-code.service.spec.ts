// src/modules/affiliate/code/application/find-code-by-code.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { FindCodeByCodeService } from './find-code-by-code.service';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';
import { AffiliateCode } from '../domain';

describe('FindCodeByCodeService', () => {
  let service: FindCodeByCodeService;
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
        FindCodeByCodeService,
        {
          provide: AFFILIATE_CODE_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<FindCodeByCodeService>(FindCodeByCodeService);
    mockRepository = module.get(AFFILIATE_CODE_REPOSITORY);

    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return code by code string', async () => {
      mockRepository.findByCode.mockResolvedValue(mockCode);

      const result = await service.execute({ code: codeString });

      expect(result).toEqual(mockCode);
      expect(mockRepository.findByCode).toHaveBeenCalledWith(codeString);
    });

    it('should return null when code not found', async () => {
      mockRepository.findByCode.mockResolvedValue(null);

      const result = await service.execute({ code: 'NOTFOUND' });

      expect(result).toBeNull();
      expect(mockRepository.findByCode).toHaveBeenCalledWith('NOTFOUND');
    });
  });
});
