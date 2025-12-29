// src/modules/affiliate/code/test/affiliate-code.integration.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PrismaModule } from 'src/platform/prisma/prisma.module';
import { EnvModule } from 'src/platform/env/env.module';
import { AffiliateCodeModule } from '../code.module';
import { CreateCodeService } from '../application/create-code.service';
import { FindCodesService } from '../application/find-codes.service';
import { FindCodeByCodeService } from '../application/find-code-by-code.service';
import { UpdateCodeService } from '../application/update-code.service';
import { ToggleCodeActiveService } from '../application/toggle-code-active.service';
import { SetCodeAsDefaultService } from '../application/set-code-as-default.service';
import { IncrementCodeUsageService } from '../application/increment-code-usage.service';
import { ValidateCodeFormatService } from '../application/validate-code-format.service';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';
import {
  AffiliateCode,
  AffiliateCodeNotFoundException,
  AffiliateCodeLimitExceededException,
} from '../domain';

describe('AffiliateCodeModule Integration', () => {
  let module: TestingModule;
  let createCodeService: CreateCodeService;
  let findCodesService: FindCodesService;
  let findCodeByCodeService: FindCodeByCodeService;
  let updateCodeService: UpdateCodeService;
  let toggleCodeActiveService: ToggleCodeActiveService;
  let setCodeAsDefaultService: SetCodeAsDefaultService;
  let incrementCodeUsageService: IncrementCodeUsageService;
  let validateCodeFormatService: ValidateCodeFormatService;
  let mockRepository: jest.Mocked<AffiliateCodeRepositoryPort>;

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
    // Mock Repository 생성
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

    module = await Test.createTestingModule({
      imports: [EnvModule, PrismaModule, AffiliateCodeModule],
    })
      .overrideProvider(AFFILIATE_CODE_REPOSITORY)
      .useValue(mockRepository)
      .compile();

    createCodeService = module.get<CreateCodeService>(CreateCodeService);
    findCodesService = module.get<FindCodesService>(FindCodesService);
    findCodeByCodeService = module.get<FindCodeByCodeService>(
      FindCodeByCodeService,
    );
    updateCodeService = module.get<UpdateCodeService>(UpdateCodeService);
    toggleCodeActiveService = module.get<ToggleCodeActiveService>(
      ToggleCodeActiveService,
    );
    setCodeAsDefaultService = module.get<SetCodeAsDefaultService>(
      SetCodeAsDefaultService,
    );
    incrementCodeUsageService = module.get<IncrementCodeUsageService>(
      IncrementCodeUsageService,
    );
    validateCodeFormatService = module.get<ValidateCodeFormatService>(
      ValidateCodeFormatService,
    );

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('CreateCodeService', () => {
    it('should create a new affiliate code', async () => {
      mockRepository.findByUserId.mockResolvedValue([]);
      mockRepository.existsByCode.mockResolvedValue(false);
      mockRepository.create.mockResolvedValue(mockCode);

      const result = await createCodeService.execute({
        userId,
        campaignName: 'Test Campaign',
      });

      expect(result).toBeDefined();
      expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(mockRepository.existsByCode).toHaveBeenCalled();
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should throw error when code limit exceeded', async () => {
      const existingCodes = Array(20).fill(mockCode);
      mockRepository.findByUserId.mockResolvedValue(existingCodes);

      await expect(createCodeService.execute({ userId })).rejects.toThrow(
        AffiliateCodeLimitExceededException,
      );
    });

    it('should set first code as default', async () => {
      mockRepository.findByUserId.mockResolvedValue([]);
      mockRepository.existsByCode.mockResolvedValue(false);
      mockRepository.create.mockResolvedValue(mockCode);

      await createCodeService.execute({ userId });

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isDefault: true,
        }),
      );
    });
  });

  describe('FindCodesService', () => {
    it('should return codes for user', async () => {
      const codes = [mockCode];
      mockRepository.findByUserId.mockResolvedValue(codes);
      mockRepository.countByUserId.mockResolvedValue(1);

      const result = await findCodesService.execute({ userId });

      expect(result.codes).toEqual(codes);
      expect(result.total).toBe(1);
      expect(result.limit).toBe(20);
      expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(mockRepository.countByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('FindCodeByCodeService', () => {
    it('should return code by code string', async () => {
      mockRepository.findByCode.mockResolvedValue(mockCode);

      const result = await findCodeByCodeService.execute({
        code: 'TESTCODE1',
      });

      expect(result).toEqual(mockCode);
      expect(mockRepository.findByCode).toHaveBeenCalledWith('TESTCODE1');
    });

    it('should return null when code not found', async () => {
      mockRepository.findByCode.mockResolvedValue(null);

      const result = await findCodeByCodeService.execute({
        code: 'NOTFOUND',
      });

      expect(result).toBeNull();
    });
  });

  describe('UpdateCodeService', () => {
    it('should update code campaign name', async () => {
      const updatedCode = AffiliateCode.fromPersistence({
        ...mockCode.toPersistence(),
        campaignName: 'Updated Campaign',
      });

      mockRepository.findById.mockResolvedValue(mockCode);
      mockRepository.update.mockResolvedValue(updatedCode);

      const result = await updateCodeService.execute({
        id: codeId,
        userId,
        campaignName: 'Updated Campaign',
      });

      expect(result.campaignName).toBe('Updated Campaign');
      expect(mockRepository.findById).toHaveBeenCalledWith(codeId, userId);
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should throw error when code not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        updateCodeService.execute({
          id: codeId,
          userId,
          campaignName: 'Updated',
        }),
      ).rejects.toThrow(AffiliateCodeNotFoundException);
    });
  });

  describe('ToggleCodeActiveService', () => {
    it('should toggle code active status', async () => {
      const inactiveCode = AffiliateCode.fromPersistence({
        ...mockCode.toPersistence(),
        isActive: false,
      });

      mockRepository.findById.mockResolvedValue(mockCode);
      mockRepository.update.mockResolvedValue(inactiveCode);

      const result = await toggleCodeActiveService.execute({
        id: codeId,
        userId,
      });

      expect(result.isActive).toBe(false);
      expect(mockRepository.findById).toHaveBeenCalledWith(codeId, userId);
      expect(mockRepository.update).toHaveBeenCalled();
    });
  });

  describe('SetCodeAsDefaultService', () => {
    it('should set code as default', async () => {
      const defaultCode = AffiliateCode.fromPersistence({
        ...mockCode.toPersistence(),
        isDefault: true,
      });

      mockRepository.findById.mockResolvedValue(mockCode);
      mockRepository.findDefaultByUserId.mockResolvedValue(null);
      mockRepository.updateMany.mockResolvedValue([defaultCode]);

      const result = await setCodeAsDefaultService.execute({
        id: codeId,
        userId,
      });

      expect(result.isDefault).toBe(true);
      expect(mockRepository.findById).toHaveBeenCalledWith(codeId, userId);
      expect(mockRepository.findDefaultByUserId).toHaveBeenCalledWith(userId);
      expect(mockRepository.updateMany).toHaveBeenCalled();
    });
  });

  describe('IncrementCodeUsageService', () => {
    it('should increment code usage', async () => {
      const usedCode = AffiliateCode.fromPersistence({
        ...mockCode.toPersistence(),
        lastUsedAt: new Date(),
      });

      mockRepository.findByCode.mockResolvedValue(mockCode);
      mockRepository.update.mockResolvedValue(usedCode);

      await incrementCodeUsageService.execute({
        code: 'TESTCODE1',
      });

      expect(mockRepository.findByCode).toHaveBeenCalledWith('TESTCODE1');
      expect(mockRepository.update).toHaveBeenCalled();
      const updateCall = mockRepository.update.mock.calls[0][0];
      expect(updateCall.lastUsedAt).toBeDefined();
    });

    it('should not throw error when code not found', async () => {
      mockRepository.findByCode.mockResolvedValue(null);

      await expect(
        incrementCodeUsageService.execute({ code: 'NOTFOUND' }),
      ).resolves.not.toThrow();
    });
  });

  describe('ValidateCodeFormatService', () => {
    it('should validate code format correctly', () => {
      expect(validateCodeFormatService.execute({ code: 'VALID123' })).toBe(
        true,
      );
      expect(validateCodeFormatService.execute({ code: 'SHORT' })).toBe(false);
      expect(
        validateCodeFormatService.execute({ code: 'VERYLONGCODE12345' }),
      ).toBe(false);
      expect(validateCodeFormatService.execute({ code: 'INVALID-123' })).toBe(
        false,
      );
    });
  });

  describe('Module Integration', () => {
    it('should have all services registered', () => {
      expect(createCodeService).toBeDefined();
      expect(findCodesService).toBeDefined();
      expect(findCodeByCodeService).toBeDefined();
      expect(updateCodeService).toBeDefined();
      expect(toggleCodeActiveService).toBeDefined();
      expect(setCodeAsDefaultService).toBeDefined();
      expect(incrementCodeUsageService).toBeDefined();
      expect(validateCodeFormatService).toBeDefined();
    });

    it('should have repository injected correctly', () => {
      const repository = module.get<AffiliateCodeRepositoryPort>(
        AFFILIATE_CODE_REPOSITORY,
      );
      expect(repository).toBeDefined();
    });
  });
});
