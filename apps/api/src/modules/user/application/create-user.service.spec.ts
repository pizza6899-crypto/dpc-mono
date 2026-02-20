// src/modules/user/application/create-user.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { CreateUserService } from './create-user.service';
import { USER_REPOSITORY } from '../ports/out/user.repository.token';
import type { UserRepositoryPort } from '../ports/out/user.repository.port';
import { User } from '../domain';
import { UserAlreadyExistsException } from '../domain/user.exception';
import { UserRoleType, UserStatus, SocialType } from '@prisma/client';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';

describe('CreateUserService', () => {
  let module: TestingModule;
  let service: CreateUserService;
  let mockUserRepository: jest.Mocked<UserRepositoryPort>;

  const mockId = BigInt(123);
  const mockUid = 'user-1234567890';
  const mockEmail = 'test@example.com';
  const mockPasswordHash = '$2b$10$hashedpassword123';
  const mockSocialId = 'social-123';
  const mockCountry = 'KR';
  const mockTimezone = 'Asia/Seoul';
  const mockCreatedAt = new Date('2024-01-01T00:00:00Z');
  const mockUpdatedAt = new Date('2024-01-02T00:00:00Z');

  const createMockUser = (overrides?: {
    email?: string;
    passwordHash?: string | null;
    socialId?: string | null;
    socialType?: SocialType | null;
    role?: UserRoleType;
    country?: string | null;
    timezone?: string | null;
  }) => {
    // passwordHash와 socialId는 기본값을 사용하지 않고, 명시적으로 전달된 값만 사용
    // 둘 다 전달되지 않으면 passwordHash를 기본값으로 사용 (일반 회원가입)
    const passwordHash =
      overrides?.passwordHash !== undefined
        ? overrides.passwordHash
        : overrides?.socialId === undefined
          ? mockPasswordHash
          : null;
    const socialId = overrides?.socialId ?? null;
    const socialType = overrides?.socialType ?? null;

    return User.fromPersistence({
      id: mockId,
      uid: mockUid,
      email: overrides?.email ?? mockEmail,
      passwordHash,
      socialId,
      socialType,
      status: UserStatus.ACTIVE,
      role: overrides?.role ?? UserRoleType.USER,
      country:
        overrides?.country !== undefined ? overrides.country : mockCountry,
      timezone:
        overrides?.timezone !== undefined ? overrides.timezone : mockTimezone,
      createdAt: mockCreatedAt,
      updatedAt: mockUpdatedAt,
    });
  };

  beforeEach(async () => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      findBySocialId: jest.fn(),
      findById: jest.fn(),
      findByUid: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      updatePassword: jest.fn(),
    };

    module = await Test.createTestingModule({
      imports: [PrismaModule, EnvModule], // @Transactional() 데코레이터를 위해 필요
      providers: [
        CreateUserService,
        {
          provide: USER_REPOSITORY,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<CreateUserService>(CreateUserService);
    mockUserRepository = module.get(USER_REPOSITORY);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('execute', () => {
    it('일반 회원가입 사용자를 정상적으로 생성해야 함', async () => {
      // Arrange
      const params = {
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        role: UserRoleType.USER,
        country: mockCountry,
        timezone: mockTimezone,
      };

      const createdUser = createMockUser({
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
      });

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(createdUser);

      // Act
      const result = await service.execute(params);

      // Assert
      expect(result.user).toEqual(createdUser);
      expect(result.user.email).toBe(mockEmail);
      expect(result.user.isCredentialUser()).toBe(true);
      expect(result.user.isSocialUser()).toBe(false);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(mockEmail);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.findBySocialId).not.toHaveBeenCalled();
      expect(mockUserRepository.create).toHaveBeenCalledWith(params);
      expect(mockUserRepository.create).toHaveBeenCalledTimes(1);
    });

    it('소셜 로그인 사용자를 정상적으로 생성해야 함', async () => {
      // Arrange
      const params = {
        email: mockEmail,
        passwordHash: null,
        socialId: mockSocialId,
        socialType: SocialType.GOOGLE,
        role: UserRoleType.USER,
        country: mockCountry,
        timezone: mockTimezone,
      };

      const createdUser = createMockUser({
        email: mockEmail,
        passwordHash: null,
        socialId: mockSocialId,
        socialType: SocialType.GOOGLE,
      });

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findBySocialId.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(createdUser);

      // Act
      const result = await service.execute(params);

      // Assert
      expect(result.user).toEqual(createdUser);
      expect(result.user.email).toBe(mockEmail);
      expect(result.user.isCredentialUser()).toBe(false);
      expect(result.user.isSocialUser()).toBe(true);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(mockEmail);
      expect(mockUserRepository.findBySocialId).toHaveBeenCalledWith(
        mockSocialId,
      );
      expect(mockUserRepository.findBySocialId).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.create).toHaveBeenCalledWith(params);
    });

    it('위치 정보가 없는 사용자를 정상적으로 생성해야 함', async () => {
      // Arrange
      const params = {
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        role: UserRoleType.USER,
        country: null,
        timezone: null,
      };

      const createdUser = createMockUser({
        email: mockEmail,
        passwordHash: mockPasswordHash,
        country: null,
        timezone: null,
      });

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(createdUser);

      // Act
      const result = await service.execute(params);

      // Assert
      expect(result.user).toEqual(createdUser);
      const location = result.user.getLocation();
      expect(location.country).toBeNull();
      expect(location.timezone).toBeNull();
      expect(mockUserRepository.create).toHaveBeenCalledWith(params);
    });

    it('ADMIN 역할 사용자를 정상적으로 생성해야 함', async () => {
      // Arrange
      const params = {
        email: 'admin@example.com',
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        role: UserRoleType.ADMIN,
        country: mockCountry,
        timezone: mockTimezone,
      };

      const createdUser = createMockUser({
        email: 'admin@example.com',
        passwordHash: mockPasswordHash,
        role: UserRoleType.ADMIN,
      });

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(createdUser);

      // Act
      const result = await service.execute(params);

      // Assert
      expect(result.user.role).toBe(UserRoleType.ADMIN);
      expect(mockUserRepository.create).toHaveBeenCalledWith(params);
    });

    it('이메일이 이미 존재하는 경우 UserAlreadyExistsException을 발생시켜야 함', async () => {
      // Arrange
      const params = {
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        role: UserRoleType.USER,
        country: mockCountry,
        timezone: mockTimezone,
      };

      const existingUser = createMockUser();

      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(service.execute(params)).rejects.toThrow(
        UserAlreadyExistsException,
      );
      await expect(service.execute(params)).rejects.toThrow(
        `User already exists: ${mockEmail}`,
      );

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(mockEmail);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledTimes(2);
      expect(mockUserRepository.findBySocialId).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('소셜 ID가 이미 존재하는 경우 UserAlreadyExistsException을 발생시켜야 함', async () => {
      // Arrange
      const params = {
        email: mockEmail,
        passwordHash: null,
        socialId: mockSocialId,
        socialType: SocialType.GOOGLE,
        role: UserRoleType.USER,
        country: mockCountry,
        timezone: mockTimezone,
      };

      const existingSocialUser = createMockUser({
        email: 'other@example.com',
        passwordHash: null,
        socialId: mockSocialId,
        socialType: SocialType.GOOGLE,
      });

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findBySocialId.mockResolvedValue(existingSocialUser);

      // Act & Assert
      await expect(service.execute(params)).rejects.toThrow(
        UserAlreadyExistsException,
      );
      await expect(service.execute(params)).rejects.toThrow(
        `User already exists: ${mockEmail}`,
      );

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(mockEmail);
      expect(mockUserRepository.findBySocialId).toHaveBeenCalledWith(
        mockSocialId,
      );
      expect(mockUserRepository.findBySocialId).toHaveBeenCalledTimes(2);
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('소셜 ID가 없으면 소셜 ID 중복 확인을 하지 않아야 함', async () => {
      // Arrange
      const params = {
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        role: UserRoleType.USER,
        country: mockCountry,
        timezone: mockTimezone,
      };

      const createdUser = createMockUser();

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(createdUser);

      // Act
      await service.execute(params);

      // Assert
      expect(mockUserRepository.findBySocialId).not.toHaveBeenCalled();
    });

    it('다양한 소셜 타입으로 사용자를 생성할 수 있어야 함', async () => {
      const socialTypes = [
        SocialType.GOOGLE,
        SocialType.APPLE,
        SocialType.TELEGRAM,
      ];

      for (const socialType of socialTypes) {
        // Arrange
        const params = {
          email: `test-${socialType}@example.com`,
          passwordHash: null,
          socialId: `social-${socialType}`,
          socialType,
          role: UserRoleType.USER,
          country: mockCountry,
          timezone: mockTimezone,
        };

        const createdUser = createMockUser({
          email: `test-${socialType}@example.com`,
          passwordHash: null,
          socialId: `social-${socialType}`,
          socialType,
        });

        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockUserRepository.findBySocialId.mockResolvedValue(null);
        mockUserRepository.create.mockResolvedValue(createdUser);

        // Act
        const result = await service.execute(params);

        // Assert
        expect(result.user.isSocialUser()).toBe(true);
        expect(result.user.getAuthInfo().socialType).toBe(socialType);
      }
    });

    it('Repository의 create 메서드가 실패하면 예외를 전파해야 함', async () => {
      // Arrange
      const params = {
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        role: UserRoleType.USER,
        country: mockCountry,
        timezone: mockTimezone,
      };

      const repositoryError = new Error('Database connection error');
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(service.execute(params)).rejects.toThrow(
        'Database connection error',
      );

      expect(mockUserRepository.findByEmail).toHaveBeenCalled();
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('Repository의 findByEmail이 실패하면 예외를 전파해야 함', async () => {
      // Arrange
      const params = {
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        role: UserRoleType.USER,
        country: mockCountry,
        timezone: mockTimezone,
      };

      const repositoryError = new Error('Database query error');
      mockUserRepository.findByEmail.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(service.execute(params)).rejects.toThrow(
        'Database query error',
      );

      expect(mockUserRepository.findByEmail).toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('Repository의 findBySocialId가 실패하면 예외를 전파해야 함', async () => {
      // Arrange
      const params = {
        email: mockEmail,
        passwordHash: null,
        socialId: mockSocialId,
        socialType: SocialType.GOOGLE,
        role: UserRoleType.USER,
        country: mockCountry,
        timezone: mockTimezone,
      };

      const repositoryError = new Error('Database query error');
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findBySocialId.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(service.execute(params)).rejects.toThrow(
        'Database query error',
      );

      expect(mockUserRepository.findByEmail).toHaveBeenCalled();
      expect(mockUserRepository.findBySocialId).toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });
});
