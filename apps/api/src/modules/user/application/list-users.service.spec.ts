// src/modules/user/application/list-users.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ListUsersService } from './list-users.service';
import { USER_REPOSITORY } from '../ports/out/user.repository.token';
import type {
  UserRepositoryPort,
  FindUsersResult,
} from '../ports/out/user.repository.port';
import { User } from '../domain';
import { UserRoleType, UserStatus, ExchangeCurrencyCode } from '@prisma/client';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';

describe('ListUsersService', () => {
  let module: TestingModule;
  let service: ListUsersService;
  let mockUserRepository: jest.Mocked<UserRepositoryPort>;

  const mockId1 = BigInt(123);
  const mockId2 = BigInt(456);
  const mockEmail1 = 'user1@example.com';
  const mockEmail2 = 'user2@example.com';
  const mockPasswordHash = '$2b$10$hashedpassword123';
  const mockCountry = 'KR';
  const mockTimezone = 'Asia/Seoul';
  const mockCreatedAt = new Date('2024-01-01T00:00:00Z');
  const mockUpdatedAt = new Date('2024-01-02T00:00:00Z');

  const createMockUser = (overrides?: {
    id?: bigint;
    email?: string;
    role?: UserRoleType;
    status?: UserStatus;
  }) => {
    return User.fromPersistence({
      id: overrides?.id ?? mockId1,
      email: overrides?.email ?? mockEmail1,
      passwordHash: mockPasswordHash,
      socialId: null,
      socialType: null,
      status: overrides?.status ?? UserStatus.ACTIVE,
      role: overrides?.role ?? UserRoleType.USER,
      country: mockCountry,
      timezone: mockTimezone,
      primaryCurrency: ExchangeCurrencyCode.USD,
      playCurrency: ExchangeCurrencyCode.USD,
      createdAt: mockCreatedAt,
      updatedAt: mockUpdatedAt,
    });
  };

  beforeEach(async () => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      findBySocialId: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      updatePassword: jest.fn(),
    };

    module = await Test.createTestingModule({
      imports: [PrismaModule, EnvModule], // TransactionHost를 위해 필요
      providers: [
        ListUsersService,
        {
          provide: USER_REPOSITORY,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<ListUsersService>(ListUsersService);
    mockUserRepository = module.get(USER_REPOSITORY);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('execute', () => {
    it('기본값으로 사용자 목록을 조회해야 함', async () => {
      // Given
      const users = [
        createMockUser(),
        createMockUser({ id: mockId2, email: mockEmail2 }),
      ];
      const result: FindUsersResult = {
        users,
        total: 2,
      };

      mockUserRepository.findMany.mockResolvedValue(result);

      // When
      const response = await service.execute({});

      // Then
      expect(response.data).toEqual(users);
      expect(response.page).toBe(1);
      expect(response.limit).toBe(20);
      expect(response.total).toBe(2);
      expect(mockUserRepository.findMany).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        email: undefined,
        role: undefined,
        status: undefined,
        startDate: undefined,
        endDate: undefined,
      });
    });

    it('커스텀 페이징 파라미터를 적용해야 함', async () => {
      // Given
      const users = [createMockUser()];
      const result: FindUsersResult = {
        users,
        total: 50,
      };

      mockUserRepository.findMany.mockResolvedValue(result);

      // When
      const response = await service.execute({
        page: 2,
        limit: 10,
      });

      // Then
      expect(response.page).toBe(2);
      expect(response.limit).toBe(10);
      expect(response.total).toBe(50);
      expect(mockUserRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 10,
        }),
      );
    });

    it('정렬 파라미터를 적용해야 함', async () => {
      // Given
      const users = [createMockUser()];
      const result: FindUsersResult = {
        users,
        total: 1,
      };

      mockUserRepository.findMany.mockResolvedValue(result);

      // When
      await service.execute({
        sortBy: 'updatedAt',
        sortOrder: 'asc',
      });

      // Then
      expect(mockUserRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'updatedAt',
          sortOrder: 'asc',
        }),
      );
    });

    it('필터 파라미터를 적용해야 함', async () => {
      // Given
      const users = [createMockUser()];
      const result: FindUsersResult = {
        users,
        total: 1,
      };

      mockUserRepository.findMany.mockResolvedValue(result);

      // When
      await service.execute({
        email: 'test',
        role: UserRoleType.ADMIN,
        status: UserStatus.ACTIVE,
      });

      // Then
      expect(mockUserRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test',
          role: UserRoleType.ADMIN,
          status: UserStatus.ACTIVE,
        }),
      );
    });

    it('날짜 문자열을 Date 객체로 변환해야 함', async () => {
      // Given
      const users = [createMockUser()];
      const result: FindUsersResult = {
        users,
        total: 1,
      };

      mockUserRepository.findMany.mockResolvedValue(result);

      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-12-31T23:59:59Z';

      // When
      await service.execute({
        startDate,
        endDate,
      });

      // Then
      expect(mockUserRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        }),
      );
    });

    it('날짜가 없으면 undefined로 전달해야 함', async () => {
      // Given
      const users = [createMockUser()];
      const result: FindUsersResult = {
        users,
        total: 1,
      };

      mockUserRepository.findMany.mockResolvedValue(result);

      // When
      await service.execute({});

      // Then
      expect(mockUserRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: undefined,
          endDate: undefined,
        }),
      );
    });

    it('빈 결과를 처리해야 함', async () => {
      // Given
      const result: FindUsersResult = {
        users: [],
        total: 0,
      };

      mockUserRepository.findMany.mockResolvedValue(result);

      // When
      const response = await service.execute({});

      // Then
      expect(response.data).toEqual([]);
      expect(response.total).toBe(0);
      expect(response.page).toBe(1);
      expect(response.limit).toBe(20);
    });

    it('Repository 에러를 전파해야 함', async () => {
      // Given
      const repositoryError = new Error('Database query error');
      mockUserRepository.findMany.mockRejectedValue(repositoryError);

      // When & Then
      await expect(service.execute({})).rejects.toThrow('Database query error');
    });
  });
});
