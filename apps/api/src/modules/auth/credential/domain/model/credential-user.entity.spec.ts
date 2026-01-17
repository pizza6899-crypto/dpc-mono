// src/modules/auth/credential/domain/model/credential-user.entity.spec.ts
import { UserStatus, UserRoleType } from 'src/generated/prisma';
import { CredentialUser } from './credential-user.entity';

describe('CredentialUser Entity', () => {
  const mockId = 'user-123';
  const mockEmail = 'user@example.com';
  const mockPasswordHash = '$2b$10$hashedpassword123';

  describe('create', () => {
    it('모든 필드가 올바르게 설정된 CredentialUser를 생성한다', () => {
      const user = CredentialUser.create({
        id: mockId,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(user.id).toBe(mockId);
      expect(user.email).toBe(mockEmail);
      expect(user.passwordHash).toBe(mockPasswordHash);
      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.role).toBe(UserRoleType.USER);
    });

    it('passwordHash가 null인 CredentialUser를 생성한다', () => {
      const user = CredentialUser.create({
        id: mockId,
        email: mockEmail,
        passwordHash: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(user.passwordHash).toBeNull();
    });

    it('다양한 UserStatus로 CredentialUser를 생성한다', () => {
      const statuses = [
        UserStatus.ACTIVE,
        UserStatus.SUSPENDED,
        UserStatus.CLOSED,
      ];

      statuses.forEach((status) => {
        const user = CredentialUser.create({
          id: mockId,
          email: mockEmail,
          passwordHash: mockPasswordHash,
          status,
          role: UserRoleType.USER,
        });

        expect(user.status).toBe(status);
      });
    });

    it('다양한 UserRoleType으로 CredentialUser를 생성한다', () => {
      const roles = [
        UserRoleType.USER,
        UserRoleType.AGENT,
        UserRoleType.ADMIN,
        UserRoleType.SUPER_ADMIN,
      ];

      roles.forEach((role) => {
        const user = CredentialUser.create({
          id: mockId,
          email: mockEmail,
          passwordHash: mockPasswordHash,
          status: UserStatus.ACTIVE,
          role,
        });

        expect(user.role).toBe(role);
      });
    });
  });

  describe('fromPersistence', () => {
    it('DB 데이터로부터 CredentialUser 엔티티를 생성한다', () => {
      const user = CredentialUser.fromPersistence({
        id: mockId,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(user.id).toBe(mockId);
      expect(user.email).toBe(mockEmail);
      expect(user.passwordHash).toBe(mockPasswordHash);
      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.role).toBe(UserRoleType.USER);
    });

    it('passwordHash가 null인 DB 데이터로부터 CredentialUser를 생성한다', () => {
      const user = CredentialUser.fromPersistence({
        id: mockId,
        email: mockEmail,
        passwordHash: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(user.passwordHash).toBeNull();
    });

    it('다양한 상태의 DB 데이터로부터 CredentialUser를 생성한다', () => {
      const statuses = [
        UserStatus.ACTIVE,
        UserStatus.SUSPENDED,
        UserStatus.CLOSED,
      ];

      statuses.forEach((status) => {
        const user = CredentialUser.fromPersistence({
          id: mockId,
          email: mockEmail,
          passwordHash: mockPasswordHash,
          status,
          role: UserRoleType.USER,
        });

        expect(user.status).toBe(status);
      });
    });

    it('다양한 역할의 DB 데이터로부터 CredentialUser를 생성한다', () => {
      const roles = [
        UserRoleType.USER,
        UserRoleType.AGENT,
        UserRoleType.ADMIN,
        UserRoleType.SUPER_ADMIN,
      ];

      roles.forEach((role) => {
        const user = CredentialUser.fromPersistence({
          id: mockId,
          email: mockEmail,
          passwordHash: mockPasswordHash,
          status: UserStatus.ACTIVE,
          role,
        });

        expect(user.role).toBe(role);
      });
    });
  });

  describe('isActive', () => {
    it('ACTIVE 상태인 사용자에 대해 true를 반환한다', () => {
      const user = CredentialUser.create({
        id: mockId,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(user.isActive()).toBe(true);
    });

    it('SUSPENDED 상태인 사용자에 대해 false를 반환한다', () => {
      const user = CredentialUser.create({
        id: mockId,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        status: UserStatus.SUSPENDED,
        role: UserRoleType.USER,
      });

      expect(user.isActive()).toBe(false);
    });

    it('CLOSED 상태인 사용자에 대해 false를 반환한다', () => {
      const user = CredentialUser.create({
        id: mockId,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        status: UserStatus.CLOSED,
        role: UserRoleType.USER,
      });

      expect(user.isActive()).toBe(false);
    });

    it('fromPersistence로 생성한 ACTIVE 사용자에 대해 true를 반환한다', () => {
      const user = CredentialUser.fromPersistence({
        id: mockId,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(user.isActive()).toBe(true);
    });
  });

  describe('isAdmin', () => {
    it('ADMIN 역할인 사용자에 대해 true를 반환한다', () => {
      const user = CredentialUser.create({
        id: mockId,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        status: UserStatus.ACTIVE,
        role: UserRoleType.ADMIN,
      });

      expect(user.isAdmin()).toBe(true);
    });

    it('SUPER_ADMIN 역할인 사용자에 대해 true를 반환한다', () => {
      const user = CredentialUser.create({
        id: mockId,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        status: UserStatus.ACTIVE,
        role: UserRoleType.SUPER_ADMIN,
      });

      expect(user.isAdmin()).toBe(true);
    });

    it('USER 역할인 사용자에 대해 false를 반환한다', () => {
      const user = CredentialUser.create({
        id: mockId,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(user.isAdmin()).toBe(false);
    });

    it('AGENT 역할인 사용자에 대해 false를 반환한다', () => {
      const user = CredentialUser.create({
        id: mockId,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        status: UserStatus.ACTIVE,
        role: UserRoleType.AGENT,
      });

      expect(user.isAdmin()).toBe(false);
    });

    it('fromPersistence로 생성한 ADMIN 사용자에 대해 true를 반환한다', () => {
      const user = CredentialUser.fromPersistence({
        id: mockId,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        status: UserStatus.ACTIVE,
        role: UserRoleType.ADMIN,
      });

      expect(user.isAdmin()).toBe(true);
    });

    it('fromPersistence로 생성한 SUPER_ADMIN 사용자에 대해 true를 반환한다', () => {
      const user = CredentialUser.fromPersistence({
        id: mockId,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        status: UserStatus.ACTIVE,
        role: UserRoleType.SUPER_ADMIN,
      });

      expect(user.isAdmin()).toBe(true);
    });
  });

  describe('Integration', () => {
    it('create → fromPersistence 순환 테스트', () => {
      const original = CredentialUser.create({
        id: mockId,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        status: UserStatus.ACTIVE,
        role: UserRoleType.ADMIN,
      });

      const recreated = CredentialUser.fromPersistence({
        id: original.id,
        email: original.email,
        passwordHash: original.passwordHash,
        status: original.status,
        role: original.role,
      });

      expect(recreated.id).toBe(original.id);
      expect(recreated.email).toBe(original.email);
      expect(recreated.passwordHash).toBe(original.passwordHash);
      expect(recreated.status).toBe(original.status);
      expect(recreated.role).toBe(original.role);
      expect(recreated.isActive()).toBe(original.isActive());
      expect(recreated.isAdmin()).toBe(original.isAdmin());
    });

    it('fromPersistence → create 순환 테스트', () => {
      const original = CredentialUser.fromPersistence({
        id: mockId,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        status: UserStatus.SUSPENDED,
        role: UserRoleType.USER,
      });

      const recreated = CredentialUser.create({
        id: original.id,
        email: original.email,
        passwordHash: original.passwordHash,
        status: original.status,
        role: original.role,
      });

      expect(recreated.id).toBe(original.id);
      expect(recreated.email).toBe(original.email);
      expect(recreated.passwordHash).toBe(original.passwordHash);
      expect(recreated.status).toBe(original.status);
      expect(recreated.role).toBe(original.role);
      expect(recreated.isActive()).toBe(original.isActive());
      expect(recreated.isAdmin()).toBe(original.isAdmin());
    });

    it('passwordHash가 null인 경우 순환 테스트', () => {
      const original = CredentialUser.create({
        id: mockId,
        email: mockEmail,
        passwordHash: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      const recreated = CredentialUser.fromPersistence({
        id: original.id,
        email: original.email,
        passwordHash: original.passwordHash,
        status: original.status,
        role: original.role,
      });

      expect(recreated.passwordHash).toBeNull();
      expect(recreated.passwordHash).toBe(original.passwordHash);
    });
  });
});
