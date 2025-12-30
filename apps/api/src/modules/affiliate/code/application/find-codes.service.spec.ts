// src/modules/affiliate/code/application/find-codes.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { FindCodesService } from './find-codes.service';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';
import { AffiliateCode } from '../domain';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';

describe('FindCodesService', () => {
  let service: FindCodesService;
  let mockRepository: jest.Mocked<AffiliateCodeRepositoryPort>;
  let mockDispatchLogService: jest.Mocked<DispatchLogService>;

  const userId = BigInt(123);
  const mockCode = AffiliateCode.fromPersistence({
    id: 'code-123',
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
        FindCodesService,
        {
          provide: AFFILIATE_CODE_REPOSITORY,
          useValue: mockRepository,
        },
        mockDispatchLogServiceProvider,
      ],
    }).compile();

    service = module.get<FindCodesService>(FindCodesService);
    mockRepository = module.get(AFFILIATE_CODE_REPOSITORY);
    mockDispatchLogService = module.get(DispatchLogService);

    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return codes for user', async () => {
      const codes = [mockCode];
      mockRepository.findByUserId.mockResolvedValue(codes);
      mockRepository.countByUserId.mockResolvedValue(1);

      const result = await service.execute({ userId });

      expect(result.codes).toEqual(codes);
      expect(result.total).toBe(1);
      expect(result.limit).toBe(20);
      expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(mockRepository.countByUserId).toHaveBeenCalledWith(userId);
    });

    it('should return empty array when user has no codes', async () => {
      mockRepository.findByUserId.mockResolvedValue([]);
      mockRepository.countByUserId.mockResolvedValue(0);

      const result = await service.execute({ userId });

      expect(result.codes).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.limit).toBe(20);
    });

    it('should return multiple codes', async () => {
      const codes = [mockCode, mockCode, mockCode];
      mockRepository.findByUserId.mockResolvedValue(codes);
      mockRepository.countByUserId.mockResolvedValue(3);

      const result = await service.execute({ userId });

      expect(result.codes).toHaveLength(3);
      expect(result.total).toBe(3);
    });
  });
});
