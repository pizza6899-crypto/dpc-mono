// src/modules/affiliate/code/application/create-code.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PrismaModule } from 'src/platform/prisma/prisma.module';
import { EnvModule } from 'src/platform/env/env.module';
import { CreateCodeService } from './create-code.service';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';
import {
  AffiliateCode,
  AffiliateCodePolicy,
  AffiliateCodeLimitExceededException,
  AffiliateCodeAlreadyExistsException,
} from '../domain';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';

describe('CreateCodeService', () => {
  let service: CreateCodeService;
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
      imports: [PrismaModule, EnvModule],
      providers: [
        CreateCodeService,
        {
          provide: AFFILIATE_CODE_REPOSITORY,
          useValue: mockRepository,
        },
        AffiliateCodePolicy,
        mockActivityLogProvider,
      ],
    }).compile();

    service = module.get<CreateCodeService>(CreateCodeService);
    mockRepository = module.get(AFFILIATE_CODE_REPOSITORY);
    mockActivityLog = module.get(ACTIVITY_LOG);

    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create a new affiliate code', async () => {
      mockRepository.findByUserId.mockResolvedValue([]);
      mockRepository.existsByCode.mockResolvedValue(false);
      mockRepository.create.mockResolvedValue(mockCode);

      const result = await service.execute({
        userId,
        campaignName: 'Test Campaign',
      });

      expect(result).toEqual(mockCode);
      expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(mockRepository.existsByCode).toHaveBeenCalled();
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          campaignName: 'Test Campaign',
        }),
      );
    });

    it('should set first code as default', async () => {
      mockRepository.findByUserId.mockResolvedValue([]);
      mockRepository.existsByCode.mockResolvedValue(false);
      mockRepository.create.mockResolvedValue(mockCode);

      await service.execute({ userId });

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isDefault: true,
        }),
      );
    });

    it('should not set default when user has existing codes', async () => {
      const existingCode = AffiliateCode.fromPersistence({
        ...mockCode.toPersistence(),
        id: 'existing-code',
      });
      mockRepository.findByUserId.mockResolvedValue([existingCode]);
      mockRepository.existsByCode.mockResolvedValue(false);
      mockRepository.create.mockResolvedValue(mockCode);

      await service.execute({ userId });

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isDefault: false,
        }),
      );
    });

    it('should throw error when code limit exceeded', async () => {
      const existingCodes = Array(20).fill(mockCode);
      mockRepository.findByUserId.mockResolvedValue(existingCodes);

      await expect(service.execute({ userId })).rejects.toThrow(
        AffiliateCodeLimitExceededException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should retry when generated code already exists', async () => {
      mockRepository.findByUserId.mockResolvedValue([]);
      // 첫 번째 시도는 중복, 두 번째는 성공
      mockRepository.existsByCode
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      mockRepository.create.mockResolvedValue(mockCode);

      const result = await service.execute({ userId });

      expect(result).toEqual(mockCode);
      expect(mockRepository.existsByCode).toHaveBeenCalledTimes(2);
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should throw error after max retries', async () => {
      mockRepository.findByUserId.mockResolvedValue([]);
      // 모든 시도가 중복
      mockRepository.existsByCode.mockResolvedValue(true);

      await expect(service.execute({ userId })).rejects.toThrow(
        AffiliateCodeAlreadyExistsException,
      );
      expect(mockRepository.existsByCode).toHaveBeenCalledTimes(10);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });
});
