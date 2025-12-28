// src/modules/auth/credential/application/verify-credential.service.spec.ts
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { VerifyCredentialService } from './verify-credential.service';
import {
  CREDENTIAL_USER_REPOSITORY,
  type CredentialUserRepositoryPort,
} from '../ports/out';
import { CredentialUser } from '../domain/model/credential-user.entity';
import { UserStatus, UserRoleType } from '@repo/database';
import { hashPassword } from 'src/utils/password.util';

describe('VerifyCredentialService', () => {
  let service: VerifyCredentialService;
  let repository: jest.Mocked<CredentialUserRepositoryPort>;

  const mockUserId = 'user-123';
  const mockEmail = 'user@example.com';
  const mockPassword = 'password123';
  let mockPasswordHash: string;

  beforeAll(async () => {
    mockPasswordHash = await hashPassword(mockPassword);
  });

  beforeEach(async () => {
    const mockRepository: jest.Mocked<CredentialUserRepositoryPort> = {
      findByEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifyCredentialService,
        {
          provide: CREDENTIAL_USER_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<VerifyCredentialService>(VerifyCredentialService);
    repository = module.get(CREDENTIAL_USER_REPOSITORY);
  });

  describe('execute', () => {
    it('유효한 자격 증명으로 사용자를 반환한다', async () => {
      // Arrange
      const user = CredentialUser.fromPersistence({
        id: mockUserId,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      repository.findByEmail.mockResolvedValue(user);

      // Act
      const result = await service.execute({
        email: mockEmail,
        password: mockPassword,
      });

      // Assert
      expect(result).toEqual({
        id: mockUserId,
        email: mockEmail,
        role: UserRoleType.USER,
      });
      expect(repository.findByEmail).toHaveBeenCalledWith(mockEmail);
    });

    it('사용자가 없으면 null을 반환한다', async () => {
      // Arrange
      repository.findByEmail.mockResolvedValue(null);

      // Act
      const result = await service.execute({
        email: mockEmail,
        password: mockPassword,
      });

      // Assert
      expect(result).toBeNull();
    });

    it('passwordHash가 null이면 null을 반환한다', async () => {
      // Arrange
      const user = CredentialUser.fromPersistence({
        id: mockUserId,
        email: mockEmail,
        passwordHash: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      repository.findByEmail.mockResolvedValue(user);

      // Act
      const result = await service.execute({
        email: mockEmail,
        password: mockPassword,
      });

      // Assert
      expect(result).toBeNull();
    });

    it('비밀번호가 틀리면 null을 반환한다', async () => {
      // Arrange
      const user = CredentialUser.fromPersistence({
        id: mockUserId,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      repository.findByEmail.mockResolvedValue(user);

      // Act
      const result = await service.execute({
        email: mockEmail,
        password: 'wrong-password',
      });

      // Assert
      expect(result).toBeNull();
    });

    it('비활성화된 사용자는 null을 반환한다', async () => {
      // Arrange
      const user = CredentialUser.fromPersistence({
        id: mockUserId,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        status: UserStatus.SUSPENDED,
        role: UserRoleType.USER,
      });

      repository.findByEmail.mockResolvedValue(user);

      // Act
      const result = await service.execute({
        email: mockEmail,
        password: mockPassword,
      });

      // Assert
      expect(result).toBeNull();
    });

    it('관리자 로그인 시도에서 일반 사용자는 null을 반환한다', async () => {
      // Arrange
      const user = CredentialUser.fromPersistence({
        id: mockUserId,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      repository.findByEmail.mockResolvedValue(user);

      // Act
      const result = await service.execute({
        email: mockEmail,
        password: mockPassword,
        isAdmin: true,
      });

      // Assert
      expect(result).toBeNull();
    });

    it('관리자 로그인 시도에서 ADMIN 권한 사용자는 성공한다', async () => {
      // Arrange
      const user = CredentialUser.fromPersistence({
        id: mockUserId,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        status: UserStatus.ACTIVE,
        role: UserRoleType.ADMIN,
      });

      repository.findByEmail.mockResolvedValue(user);

      // Act
      const result = await service.execute({
        email: mockEmail,
        password: mockPassword,
        isAdmin: true,
      });

      // Assert
      expect(result).toEqual({
        id: mockUserId,
        email: mockEmail,
        role: UserRoleType.ADMIN,
      });
    });

    it('관리자 로그인 시도에서 SUPER_ADMIN 권한 사용자는 성공한다', async () => {
      // Arrange
      const user = CredentialUser.fromPersistence({
        id: mockUserId,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        status: UserStatus.ACTIVE,
        role: UserRoleType.SUPER_ADMIN,
      });

      repository.findByEmail.mockResolvedValue(user);

      // Act
      const result = await service.execute({
        email: mockEmail,
        password: mockPassword,
        isAdmin: true,
      });

      // Assert
      expect(result).toEqual({
        id: mockUserId,
        email: mockEmail,
        role: UserRoleType.SUPER_ADMIN,
      });
    });

    it('타이밍 공격 방지: 사용자가 없어도 비밀번호 검증을 수행한다', async () => {
      // Arrange
      repository.findByEmail.mockResolvedValue(null);

      const startTime = Date.now();

      // Act
      await service.execute({
        email: mockEmail,
        password: mockPassword,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert
      // 비밀번호 검증이 수행되었으므로 일정 시간이 소요되어야 함
      // (더미 해시로 검증하므로 실제 검증 시간과 유사해야 함)
      expect(duration).toBeGreaterThan(0);
      expect(repository.findByEmail).toHaveBeenCalledWith(mockEmail);
    });
  });
});

