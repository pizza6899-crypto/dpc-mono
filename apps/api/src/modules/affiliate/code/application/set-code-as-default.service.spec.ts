// src/modules/affiliate/code/application/set-code-as-default.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PrismaModule } from 'src/platform/prisma/prisma.module';
import { EnvModule } from 'src/platform/env/env.module';
import { SetCodeAsDefaultService } from './set-code-as-default.service';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';
import { AffiliateCode, AffiliateCodeNotFoundException } from '../domain';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import type { ActivityLogPort } from 'src/platform/activity-log/activity-log.port';

describe('SetCodeAsDefaultService', () => {
  let module: TestingModule;
  let service: SetCodeAsDefaultService;
  let mockRepository: jest.Mocked<AffiliateCodeRepositoryPort>;
  let mockActivityLog: jest.Mocked<ActivityLogPort>;

  const userId = 'user-123';
  const codeId = 'code-123';
  const existingDefaultId = 'existing-default-id';
  const mockCode = AffiliateCode.fromPersistence({
    id: codeId,
    userId,
    code: 'TESTCODE1',
    campaignName: 'Test Campaign',
    isActive: true,
    isDefault: false,
    expiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastUsedAt: null,
  });

  const existingDefaultCode = AffiliateCode.fromPersistence({
    id: existingDefaultId,
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
    };

    const mockActivityLogProvider = {
      provide: ACTIVITY_LOG,
      useValue: {
        log: jest.fn(),
        logSuccess: jest.fn(),
        logFailure: jest.fn(),
      },
    };

    module = await Test.createTestingModule({
      imports: [PrismaModule, EnvModule],
      providers: [
        SetCodeAsDefaultService,
        {
          provide: AFFILIATE_CODE_REPOSITORY,
          useValue: mockRepository,
        },
        mockActivityLogProvider,
      ],
    }).compile();

    service = module.get<SetCodeAsDefaultService>(SetCodeAsDefaultService);
    mockRepository = module.get(AFFILIATE_CODE_REPOSITORY);
    mockActivityLog = module.get(ACTIVITY_LOG);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('execute', () => {
    it('should set code as default when no existing default', async () => {
      const defaultCode = AffiliateCode.fromPersistence({
        ...mockCode.toPersistence(),
        isDefault: true,
      });

      mockRepository.findById.mockResolvedValue(mockCode);
      mockRepository.findDefaultByUserId.mockResolvedValue(null);
      mockRepository.updateMany.mockResolvedValue([defaultCode]);

      const result = await service.execute({ id: codeId, userId });

      expect(result.isDefault).toBe(true);
      expect(mockRepository.findById).toHaveBeenCalledWith(codeId, userId);
      expect(mockRepository.findDefaultByUserId).toHaveBeenCalledWith(userId);
      expect(mockRepository.updateMany).toHaveBeenCalledWith([
        { code: expect.objectContaining({ id: codeId }) },
      ]);
    });

    it('should unset existing default and set new default', async () => {
      const newDefaultCode = AffiliateCode.fromPersistence({
        ...mockCode.toPersistence(),
        isDefault: true,
      });
      const unsetDefaultCode = AffiliateCode.fromPersistence({
        ...existingDefaultCode.toPersistence(),
        isDefault: false,
      });

      mockRepository.findById.mockResolvedValue(mockCode);
      mockRepository.findDefaultByUserId.mockResolvedValue(existingDefaultCode);
      mockRepository.updateMany.mockResolvedValue([
        newDefaultCode,
        unsetDefaultCode,
      ]);

      const result = await service.execute({ id: codeId, userId });

      expect(result.isDefault).toBe(true);
      expect(mockRepository.updateMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          { code: expect.objectContaining({ id: codeId }) },
          { code: expect.objectContaining({ id: existingDefaultId }) },
        ]),
      );
    });

    it('should not unset when setting same code as default', async () => {
      const defaultCode = AffiliateCode.fromPersistence({
        ...mockCode.toPersistence(),
        isDefault: true,
      });

      mockRepository.findById.mockResolvedValue(defaultCode);
      mockRepository.findDefaultByUserId.mockResolvedValue(defaultCode);
      mockRepository.updateMany.mockResolvedValue([defaultCode]);

      const result = await service.execute({ id: codeId, userId });

      expect(result.isDefault).toBe(true);
      // 같은 코드이므로 하나만 업데이트
      expect(mockRepository.updateMany).toHaveBeenCalledWith([
        { code: expect.objectContaining({ id: codeId }) },
      ]);
    });

    it('should throw error when code not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.execute({ id: codeId, userId })).rejects.toThrow(
        AffiliateCodeNotFoundException,
      );
      expect(mockRepository.updateMany).not.toHaveBeenCalled();
    });
  });
});
