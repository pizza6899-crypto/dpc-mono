// src/modules/auth/session/application/list-sessions.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import {
  ListSessionsService,
  type ListSessionsServiceParams,
} from './list-sessions.service';
import {
  USER_SESSION_REPOSITORY,
  type UserSessionRepositoryPort,
  type FindSessionsParams,
} from '../ports/out';
import { UserSession, SessionType, SessionStatus, DeviceInfo } from '../domain';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';

describe('ListSessionsService', () => {
  let service: ListSessionsService;
  let repository: jest.Mocked<UserSessionRepositoryPort>;
  let mockDispatchLogService: jest.Mocked<DispatchLogService>;
  let module: TestingModule;

  const mockUserId = BigInt(123);
  const mockUserIdString = '123';
  const mockExpiresAt = new Date(Date.now() + 3600000); // 1시간 후

  const mockDeviceInfo: DeviceInfo = DeviceInfo.create({
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    deviceFingerprint: 'fingerprint-123',
    isMobile: false,
    deviceName: 'Chrome on Windows',
    os: 'Windows 11',
    browser: 'Chrome 120',
  });

  const createMockSession = (
    overrides?: Partial<Parameters<typeof UserSession.create>[0]>,
  ): UserSession => {
    return UserSession.create({
      uid: `uid-${Date.now()}-${Math.random()}`,
      userId: mockUserId,
      sessionId: `session-${Date.now()}-${Math.random()}`,
      type: SessionType.HTTP,
      isAdmin: false,
      deviceInfo: mockDeviceInfo,
      expiresAt: mockExpiresAt,
      ...overrides,
    });
  };

  beforeEach(async () => {
    const mockRepository: jest.Mocked<UserSessionRepositoryPort> = {
      findActiveByUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findBySessionId: jest.fn(),
      findByUserId: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      findExpiredSessions: jest.fn(),
      deleteExpiredSessions: jest.fn(),
    };

    const mockDispatchLogServiceProvider = {
      provide: DispatchLogService,
      useValue: {
        dispatch: jest.fn().mockResolvedValue(undefined),
      },
    };

    module = await Test.createTestingModule({
      imports: [],
      providers: [
        ListSessionsService,
        {
          provide: USER_SESSION_REPOSITORY,
          useValue: mockRepository,
        },
        mockDispatchLogServiceProvider,
      ],
    })
      .setLogger(new Logger())
      .compile();

    service = module.get<ListSessionsService>(ListSessionsService);
    repository = module.get(USER_SESSION_REPOSITORY);
    mockDispatchLogService = module.get(DispatchLogService);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('execute', () => {
    it('기본 파라미터로 세션 목록을 조회해야 함', async () => {
      // Arrange
      const params: ListSessionsServiceParams = {};

      const mockSessions = [
        createMockSession({ uid: 'uid-1' }),
        createMockSession({ uid: 'uid-2' }),
      ];

      repository.findMany.mockResolvedValue({
        sessions: mockSessions,
        total: 2,
      });

      // Act
      const result = await service.execute(params);

      // Assert
      expect(repository.findMany).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        userId: undefined,
        status: undefined,
        type: undefined,
        activeOnly: undefined,
        startDate: undefined,
        endDate: undefined,
      });
      expect(result).toEqual({
        data: mockSessions,
        page: 1,
        limit: 20,
        total: 2,
      });
    });

    it('커스텀 페이징 파라미터를 사용해야 함', async () => {
      // Arrange
      const params: ListSessionsServiceParams = {
        page: 2,
        limit: 10,
      };

      const mockSessions = [createMockSession()];

      repository.findMany.mockResolvedValue({
        sessions: mockSessions,
        total: 15,
      });

      // Act
      const result = await service.execute(params);

      // Assert
      expect(repository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 10,
        }),
      );
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(15);
    });

    it('userId 필터를 적용해야 함', async () => {
      // Arrange
      const params: ListSessionsServiceParams = {
        userId: mockUserIdString,
      };

      const mockSessions = [createMockSession()];

      repository.findMany.mockResolvedValue({
        sessions: mockSessions,
        total: 1,
      });

      // Act
      const result = await service.execute(params);

      // Assert
      expect(repository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
        }),
      );
      expect(result.data).toEqual(mockSessions);
    });

    it('status 필터를 적용해야 함', async () => {
      // Arrange
      const params: ListSessionsServiceParams = {
        status: SessionStatus.ACTIVE,
      };

      const mockSessions = [
        createMockSession({ uid: 'uid-1' }),
        createMockSession({ uid: 'uid-2' }),
      ];

      repository.findMany.mockResolvedValue({
        sessions: mockSessions,
        total: 2,
      });

      // Act
      const result = await service.execute(params);

      // Assert
      expect(repository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SessionStatus.ACTIVE,
        }),
      );
      expect(result.data).toEqual(mockSessions);
    });

    it('type 필터를 적용해야 함', async () => {
      // Arrange
      const params: ListSessionsServiceParams = {
        type: SessionType.WEBSOCKET,
      };

      const mockSessions = [createMockSession({ type: SessionType.WEBSOCKET })];

      repository.findMany.mockResolvedValue({
        sessions: mockSessions,
        total: 1,
      });

      // Act
      const result = await service.execute(params);

      // Assert
      expect(repository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          type: SessionType.WEBSOCKET,
        }),
      );
      expect(result.data).toEqual(mockSessions);
    });

    it('activeOnly 필터를 적용해야 함', async () => {
      // Arrange
      const params: ListSessionsServiceParams = {
        activeOnly: true,
      };

      const mockSessions = [createMockSession()];

      repository.findMany.mockResolvedValue({
        sessions: mockSessions,
        total: 1,
      });

      // Act
      const result = await service.execute(params);

      // Assert
      expect(repository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          activeOnly: true,
        }),
      );
      expect(result.data).toEqual(mockSessions);
    });

    it('날짜 범위 필터를 적용해야 함', async () => {
      // Arrange
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-12-31T23:59:59Z';
      const params: ListSessionsServiceParams = {
        startDate,
        endDate,
      };

      const mockSessions = [createMockSession()];

      repository.findMany.mockResolvedValue({
        sessions: mockSessions,
        total: 1,
      });

      // Act
      const result = await service.execute(params);

      // Assert
      expect(repository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        }),
      );
      expect(result.data).toEqual(mockSessions);
    });

    it('정렬 옵션을 적용해야 함', async () => {
      // Arrange
      const params: ListSessionsServiceParams = {
        sortBy: 'lastActiveAt',
        sortOrder: 'asc',
      };

      const mockSessions = [createMockSession()];

      repository.findMany.mockResolvedValue({
        sessions: mockSessions,
        total: 1,
      });

      // Act
      const result = await service.execute(params);

      // Assert
      expect(repository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'lastActiveAt',
          sortOrder: 'asc',
        }),
      );
      expect(result.data).toEqual(mockSessions);
    });

    it('모든 필터를 조합해서 사용해야 함', async () => {
      // Arrange
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-12-31T23:59:59Z';
      const params: ListSessionsServiceParams = {
        page: 1,
        limit: 50,
        sortBy: 'updatedAt',
        sortOrder: 'asc',
        userId: mockUserIdString,
        status: SessionStatus.ACTIVE,
        type: SessionType.HTTP,
        activeOnly: true,
        startDate,
        endDate,
      };

      const mockSessions = [
        createMockSession({ type: SessionType.HTTP }),
        createMockSession({ type: SessionType.HTTP }),
      ];

      repository.findMany.mockResolvedValue({
        sessions: mockSessions,
        total: 2,
      });

      // Act
      const result = await service.execute(params);

      // Assert
      expect(repository.findMany).toHaveBeenCalledWith({
        page: 1,
        limit: 50,
        sortBy: 'updatedAt',
        sortOrder: 'asc',
        userId: mockUserId,
        status: SessionStatus.ACTIVE,
        type: SessionType.HTTP,
        activeOnly: true,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
      expect(result).toEqual({
        data: mockSessions,
        page: 1,
        limit: 50,
        total: 2,
      });
    });

    it('빈 결과를 반환해야 함', async () => {
      // Arrange
      const params: ListSessionsServiceParams = {
        page: 1,
        limit: 20,
      };

      repository.findMany.mockResolvedValue({
        sessions: [],
        total: 0,
      });

      // Act
      const result = await service.execute(params);

      // Assert
      expect(result).toEqual({
        data: [],
        page: 1,
        limit: 20,
        total: 0,
      });
    });

    it('repository 에러 발생 시 에러를 재throw해야 함', async () => {
      // Arrange
      const params: ListSessionsServiceParams = {
        page: 1,
        limit: 20,
      };

      const error = new Error('Database connection failed');
      repository.findMany.mockRejectedValue(error);

      // Act & Assert
      await expect(service.execute(params)).rejects.toThrow(error);
      expect(repository.findMany).toHaveBeenCalled();
    });

    it('userId가 undefined일 때 BigInt 변환을 하지 않아야 함', async () => {
      // Arrange
      const params: ListSessionsServiceParams = {
        userId: undefined,
      };

      const mockSessions = [createMockSession()];

      repository.findMany.mockResolvedValue({
        sessions: mockSessions,
        total: 1,
      });

      // Act
      await service.execute(params);

      // Assert
      expect(repository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: undefined,
        }),
      );
    });

    it('날짜가 undefined일 때 Date 변환을 하지 않아야 함', async () => {
      // Arrange
      const params: ListSessionsServiceParams = {
        startDate: undefined,
        endDate: undefined,
      };

      const mockSessions = [createMockSession()];

      repository.findMany.mockResolvedValue({
        sessions: mockSessions,
        total: 1,
      });

      // Act
      await service.execute(params);

      // Assert
      expect(repository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: undefined,
          endDate: undefined,
        }),
      );
    });

    it('다양한 정렬 필드를 지원해야 함', async () => {
      // Arrange
      const sortFields: Array<
        'createdAt' | 'updatedAt' | 'lastActiveAt' | 'expiresAt'
      > = ['createdAt', 'updatedAt', 'lastActiveAt', 'expiresAt'];

      for (const sortBy of sortFields) {
        jest.clearAllMocks();

        const params: ListSessionsServiceParams = {
          sortBy,
          sortOrder: 'desc',
        };

        const mockSessions = [createMockSession()];

        repository.findMany.mockResolvedValue({
          sessions: mockSessions,
          total: 1,
        });

        // Act
        await service.execute(params);

        // Assert
        expect(repository.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            sortBy,
            sortOrder: 'desc',
          }),
        );
      }
    });
  });
});
