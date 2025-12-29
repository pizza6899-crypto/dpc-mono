// src/modules/affiliate/code/application/find-codes-admin.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { FindCodesAdminService } from './find-codes-admin.service';
import { AFFILIATE_CODE_REPOSITORY } from '../ports/out/affiliate-code.repository.token';
import type { AffiliateCodeRepositoryPort } from '../ports/out/affiliate-code.repository.port';
import { AffiliateCode } from '../domain';
import { PrismaModule } from 'src/platform/prisma/prisma.module';
import { EnvModule } from 'src/platform/env/env.module';

describe('FindCodesAdminService', () => {
  let module: TestingModule;
  let service: FindCodesAdminService;
  let mockRepository: jest.Mocked<AffiliateCodeRepositoryPort>;

  const mockUserId1 = BigInt(123);
  const mockUserId2 = BigInt(456);
  const mockId1 = 'code-123';
  const mockId2 = 'code-456';
  const mockCode1 = 'TESTCODE1';
  const mockCode2 = 'TESTCODE2';
  const mockCreatedAt = new Date('2024-01-01T00:00:00Z');
  const mockUpdatedAt = new Date('2024-01-02T00:00:00Z');

  const createMockCode = (overrides?: {
    id?: string;
    userId?: bigint;
    code?: string;
    campaignName?: string | null;
    isActive?: boolean;
    isDefault?: boolean;
    expiresAt?: Date | null;
  }) => {
    return AffiliateCode.fromPersistence({
      id: overrides?.id ?? mockId1,
      userId: overrides?.userId ?? mockUserId1,
      code: overrides?.code ?? mockCode1,
      campaignName: overrides?.campaignName ?? 'Test Campaign',
      isActive: overrides?.isActive ?? true,
      isDefault: overrides?.isDefault ?? false,
      expiresAt: overrides?.expiresAt ?? null,
      createdAt: mockCreatedAt,
      updatedAt: mockUpdatedAt,
      lastUsedAt: null,
    });
  };

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

    module = await Test.createTestingModule({
      imports: [PrismaModule, EnvModule], // TransactionHost를 위해 필요
      providers: [
        FindCodesAdminService,
        {
          provide: AFFILIATE_CODE_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<FindCodesAdminService>(FindCodesAdminService);
    mockRepository = module.get(AFFILIATE_CODE_REPOSITORY);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('execute', () => {
    it('기본값으로 코드 목록을 조회해야 함', async () => {
      // Given
      const codes = [
        createMockCode(),
        createMockCode({
          id: mockId2,
          userId: mockUserId2,
          code: mockCode2,
        }),
      ];
      const result = {
        codes,
        total: 2,
      };

      mockRepository.findManyForAdmin.mockResolvedValue(result);

      // When
      const response = await service.execute({});

      // Then
      expect(response.data).toEqual(codes);
      expect(response.page).toBe(1);
      expect(response.limit).toBe(20);
      expect(response.total).toBe(2);
      expect(mockRepository.findManyForAdmin).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        userId: undefined,
        code: undefined,
        isActive: undefined,
        isDefault: undefined,
        startDate: undefined,
        endDate: undefined,
      });
    });

    it('커스텀 페이징 파라미터를 적용해야 함', async () => {
      // Given
      const codes = [createMockCode()];
      const result = {
        codes,
        total: 50,
      };

      mockRepository.findManyForAdmin.mockResolvedValue(result);

      // When
      const response = await service.execute({
        page: 2,
        limit: 10,
      });

      // Then
      expect(response.page).toBe(2);
      expect(response.limit).toBe(10);
      expect(response.total).toBe(50);
      expect(mockRepository.findManyForAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 10,
        }),
      );
    });

    it('정렬 파라미터를 적용해야 함', async () => {
      // Given
      const codes = [createMockCode()];
      const result = {
        codes,
        total: 1,
      };

      mockRepository.findManyForAdmin.mockResolvedValue(result);

      // When
      await service.execute({
        sortBy: 'updatedAt',
        sortOrder: 'asc',
      });

      // Then
      expect(mockRepository.findManyForAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'updatedAt',
          sortOrder: 'asc',
        }),
      );
    });

    it('code 정렬 파라미터를 적용해야 함', async () => {
      // Given
      const codes = [createMockCode()];
      const result = {
        codes,
        total: 1,
      };

      mockRepository.findManyForAdmin.mockResolvedValue(result);

      // When
      await service.execute({
        sortBy: 'code',
        sortOrder: 'asc',
      });

      // Then
      expect(mockRepository.findManyForAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'code',
          sortOrder: 'asc',
        }),
      );
    });

    it('필터 파라미터를 적용해야 함', async () => {
      // Given
      const codes = [createMockCode()];
      const result = {
        codes,
        total: 1,
      };

      mockRepository.findManyForAdmin.mockResolvedValue(result);

      // When
      await service.execute({
        userId: '123',
        code: 'TEST',
        isActive: true,
        isDefault: false,
      });

      // Then
      expect(mockRepository.findManyForAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: BigInt(123),
          code: 'TEST',
          isActive: true,
          isDefault: false,
        }),
      );
    });

    it('userId 문자열을 BigInt로 변환해야 함', async () => {
      // Given
      const codes = [createMockCode()];
      const result = {
        codes,
        total: 1,
      };

      mockRepository.findManyForAdmin.mockResolvedValue(result);

      // When
      await service.execute({
        userId: '1234567890123456789',
      });

      // Then
      expect(mockRepository.findManyForAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: BigInt('1234567890123456789'),
        }),
      );
    });

    it('userId가 없으면 undefined로 전달해야 함', async () => {
      // Given
      const codes = [createMockCode()];
      const result = {
        codes,
        total: 1,
      };

      mockRepository.findManyForAdmin.mockResolvedValue(result);

      // When
      await service.execute({});

      // Then
      expect(mockRepository.findManyForAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: undefined,
        }),
      );
    });

    it('날짜 문자열을 Date 객체로 변환해야 함', async () => {
      // Given
      const codes = [createMockCode()];
      const result = {
        codes,
        total: 1,
      };

      mockRepository.findManyForAdmin.mockResolvedValue(result);

      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-12-31T23:59:59Z';

      // When
      await service.execute({
        startDate,
        endDate,
      });

      // Then
      expect(mockRepository.findManyForAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        }),
      );
    });

    it('날짜가 없으면 undefined로 전달해야 함', async () => {
      // Given
      const codes = [createMockCode()];
      const result = {
        codes,
        total: 1,
      };

      mockRepository.findManyForAdmin.mockResolvedValue(result);

      // When
      await service.execute({});

      // Then
      expect(mockRepository.findManyForAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: undefined,
          endDate: undefined,
        }),
      );
    });

    it('빈 결과를 처리해야 함', async () => {
      // Given
      const result = {
        codes: [],
        total: 0,
      };

      mockRepository.findManyForAdmin.mockResolvedValue(result);

      // When
      const response = await service.execute({});

      // Then
      expect(response.data).toEqual([]);
      expect(response.total).toBe(0);
      expect(response.page).toBe(1);
      expect(response.limit).toBe(20);
    });

    it('모든 필터를 조합하여 적용해야 함', async () => {
      // Given
      const codes = [createMockCode()];
      const result = {
        codes,
        total: 1,
      };

      mockRepository.findManyForAdmin.mockResolvedValue(result);

      // When
      await service.execute({
        page: 2,
        limit: 15,
        sortBy: 'code',
        sortOrder: 'asc',
        userId: '789',
        code: 'SUMMER',
        isActive: true,
        isDefault: true,
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
      });

      // Then
      expect(mockRepository.findManyForAdmin).toHaveBeenCalledWith({
        page: 2,
        limit: 15,
        sortBy: 'code',
        sortOrder: 'asc',
        userId: BigInt(789),
        code: 'SUMMER',
        isActive: true,
        isDefault: true,
        startDate: new Date('2024-01-01T00:00:00Z'),
        endDate: new Date('2024-12-31T23:59:59Z'),
      });
    });

    it('Repository 에러를 전파해야 함', async () => {
      // Given
      const repositoryError = new Error('Database query error');
      mockRepository.findManyForAdmin.mockRejectedValue(repositoryError);

      // When & Then
      await expect(service.execute({})).rejects.toThrow(
        'Database query error',
      );
    });

    it('에러 발생 시 로깅해야 함', async () => {
      // Given
      const repositoryError = new Error('Database query error');
      mockRepository.findManyForAdmin.mockRejectedValue(repositoryError);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      // When
      try {
        await service.execute({
          page: 1,
          limit: 20,
          userId: '123',
          code: 'TEST',
          isActive: true,
          isDefault: false,
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-12-31T23:59:59Z',
        });
      } catch (error) {
        // Expected to throw
      }

      // Then
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('관리자 어플리에이트 코드 목록 조회 실패'),
        repositoryError,
      );
    });
  });
});

