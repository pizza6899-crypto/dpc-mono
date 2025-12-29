// src/modules/auth/registration/domain/model/registration-user.entity.spec.ts
import { UserStatus, UserRoleType, SocialType } from '@repo/database';
import { RegistrationUser } from './registration-user.entity';

describe('RegistrationUser Entity', () => {
  const mockId = BigInt(123);
  const mockUid = 'user-uid-123';
  const mockEmail = 'user@example.com';
  const mockPasswordHash = '$2b$10$hashedpassword123';
  const mockSocialId = 'google-123456';
  const mockSocialType = SocialType.GOOGLE;

  describe('create', () => {
    it('모든 필드가 올바르게 설정된 일반 회원가입 RegistrationUser를 생성한다', () => {
      const user = RegistrationUser.create({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(user.id).toBe(mockId);
      expect(user.uid).toBe(mockUid);
      expect(user.email).toBe(mockEmail);
      expect(user.passwordHash).toBe(mockPasswordHash);
      expect(user.socialId).toBeNull();
      expect(user.socialType).toBeNull();
      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.role).toBe(UserRoleType.USER);
    });

    it('모든 필드가 올바르게 설정된 소셜 회원가입 RegistrationUser를 생성한다', () => {
      const user = RegistrationUser.create({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: null,
        socialId: mockSocialId,
        socialType: mockSocialType,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(user.id).toBe(mockId);
      expect(user.uid).toBe(mockUid);
      expect(user.email).toBe(mockEmail);
      expect(user.passwordHash).toBeNull();
      expect(user.socialId).toBe(mockSocialId);
      expect(user.socialType).toBe(mockSocialType);
      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.role).toBe(UserRoleType.USER);
    });

    it('passwordHash가 null인 일반 회원가입 RegistrationUser를 생성한다', () => {
      const user = RegistrationUser.create({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: null,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(user.passwordHash).toBeNull();
      expect(user.socialId).toBeNull();
    });

    it('다양한 UserStatus로 RegistrationUser를 생성한다', () => {
      const statuses = [
        UserStatus.ACTIVE,
        UserStatus.SUSPENDED,
        UserStatus.CLOSED,
      ];

      statuses.forEach((status) => {
        const user = RegistrationUser.create({
          id: mockId,
          uid: mockUid,
          email: mockEmail,
          passwordHash: mockPasswordHash,
          socialId: null,
          socialType: null,
          status,
          role: UserRoleType.USER,
        });

        expect(user.status).toBe(status);
      });
    });

    it('다양한 UserRoleType으로 RegistrationUser를 생성한다', () => {
      const roles = [
        UserRoleType.USER,
        UserRoleType.AGENT,
        UserRoleType.ADMIN,
        UserRoleType.SUPER_ADMIN,
      ];

      roles.forEach((role) => {
        const user = RegistrationUser.create({
          id: mockId,
          uid: mockUid,
          email: mockEmail,
          passwordHash: mockPasswordHash,
          socialId: null,
          socialType: null,
          status: UserStatus.ACTIVE,
          role,
        });

        expect(user.role).toBe(role);
      });
    });

    it('다양한 SocialType으로 소셜 회원가입 RegistrationUser를 생성한다', () => {
      const socialTypes = [SocialType.GOOGLE];

      socialTypes.forEach((socialType) => {
        const user = RegistrationUser.create({
          id: mockId,
          uid: mockUid,
          email: mockEmail,
          passwordHash: null,
          socialId: `social-${socialType}`,
          socialType,
          status: UserStatus.ACTIVE,
          role: UserRoleType.USER,
        });

        expect(user.socialType).toBe(socialType);
      });
    });
  });

  describe('fromPersistence', () => {
    it('DB 데이터로부터 일반 회원가입 RegistrationUser 엔티티를 생성한다', () => {
      const user = RegistrationUser.fromPersistence({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(user.id).toBe(mockId);
      expect(user.uid).toBe(mockUid);
      expect(user.email).toBe(mockEmail);
      expect(user.passwordHash).toBe(mockPasswordHash);
      expect(user.socialId).toBeNull();
      expect(user.socialType).toBeNull();
      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.role).toBe(UserRoleType.USER);
    });

    it('DB 데이터로부터 소셜 회원가입 RegistrationUser 엔티티를 생성한다', () => {
      const user = RegistrationUser.fromPersistence({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: null,
        socialId: mockSocialId,
        socialType: mockSocialType,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(user.id).toBe(mockId);
      expect(user.uid).toBe(mockUid);
      expect(user.email).toBe(mockEmail);
      expect(user.passwordHash).toBeNull();
      expect(user.socialId).toBe(mockSocialId);
      expect(user.socialType).toBe(mockSocialType);
      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.role).toBe(UserRoleType.USER);
    });

    it('passwordHash가 null인 DB 데이터로부터 RegistrationUser를 생성한다', () => {
      const user = RegistrationUser.fromPersistence({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: null,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(user.passwordHash).toBeNull();
    });

    it('다양한 상태의 DB 데이터로부터 RegistrationUser를 생성한다', () => {
      const statuses = [
        UserStatus.ACTIVE,
        UserStatus.SUSPENDED,
        UserStatus.CLOSED,
      ];

      statuses.forEach((status) => {
        const user = RegistrationUser.fromPersistence({
          id: mockId,
          uid: mockUid,
          email: mockEmail,
          passwordHash: mockPasswordHash,
          socialId: null,
          socialType: null,
          status,
          role: UserRoleType.USER,
        });

        expect(user.status).toBe(status);
      });
    });

    it('다양한 역할의 DB 데이터로부터 RegistrationUser를 생성한다', () => {
      const roles = [
        UserRoleType.USER,
        UserRoleType.AGENT,
        UserRoleType.ADMIN,
        UserRoleType.SUPER_ADMIN,
      ];

      roles.forEach((role) => {
        const user = RegistrationUser.fromPersistence({
          id: mockId,
          uid: mockUid,
          email: mockEmail,
          passwordHash: mockPasswordHash,
          socialId: null,
          socialType: null,
          status: UserStatus.ACTIVE,
          role,
        });

        expect(user.role).toBe(role);
      });
    });
  });

  describe('isCredentialUser', () => {
    it('passwordHash가 있고 socialId가 없는 일반 회원가입 사용자에 대해 true를 반환한다', () => {
      const user = RegistrationUser.create({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(user.isCredentialUser()).toBe(true);
    });

    it('passwordHash가 null인 사용자에 대해 false를 반환한다', () => {
      const user = RegistrationUser.create({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: null,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(user.isCredentialUser()).toBe(false);
    });

    it('socialId가 있는 소셜 회원가입 사용자에 대해 false를 반환한다', () => {
      const user = RegistrationUser.create({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: null,
        socialId: mockSocialId,
        socialType: mockSocialType,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(user.isCredentialUser()).toBe(false);
    });

    it('fromPersistence로 생성한 일반 회원가입 사용자에 대해 true를 반환한다', () => {
      const user = RegistrationUser.fromPersistence({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(user.isCredentialUser()).toBe(true);
    });
  });

  describe('isSocialUser', () => {
    it('socialId가 있는 소셜 회원가입 사용자에 대해 true를 반환한다', () => {
      const user = RegistrationUser.create({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: null,
        socialId: mockSocialId,
        socialType: mockSocialType,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(user.isSocialUser()).toBe(true);
    });

    it('socialId가 null인 일반 회원가입 사용자에 대해 false를 반환한다', () => {
      const user = RegistrationUser.create({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(user.isSocialUser()).toBe(false);
    });

    it('fromPersistence로 생성한 소셜 회원가입 사용자에 대해 true를 반환한다', () => {
      const user = RegistrationUser.fromPersistence({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: null,
        socialId: mockSocialId,
        socialType: mockSocialType,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(user.isSocialUser()).toBe(true);
    });
  });

  describe('isActive', () => {
    it('ACTIVE 상태인 사용자에 대해 true를 반환한다', () => {
      const user = RegistrationUser.create({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(user.isActive()).toBe(true);
    });

    it('SUSPENDED 상태인 사용자에 대해 false를 반환한다', () => {
      const user = RegistrationUser.create({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.SUSPENDED,
        role: UserRoleType.USER,
      });

      expect(user.isActive()).toBe(false);
    });

    it('CLOSED 상태인 사용자에 대해 false를 반환한다', () => {
      const user = RegistrationUser.create({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.CLOSED,
        role: UserRoleType.USER,
      });

      expect(user.isActive()).toBe(false);
    });

    it('fromPersistence로 생성한 ACTIVE 사용자에 대해 true를 반환한다', () => {
      const user = RegistrationUser.fromPersistence({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(user.isActive()).toBe(true);
    });

    it('소셜 회원가입 ACTIVE 사용자에 대해 true를 반환한다', () => {
      const user = RegistrationUser.create({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: null,
        socialId: mockSocialId,
        socialType: mockSocialType,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(user.isActive()).toBe(true);
    });
  });

  describe('Integration', () => {
    it('create → fromPersistence 순환 테스트 (일반 회원가입)', () => {
      const original = RegistrationUser.create({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.ADMIN,
      });

      const recreated = RegistrationUser.fromPersistence({
        id: original.id,
        uid: original.uid,
        email: original.email,
        passwordHash: original.passwordHash,
        socialId: original.socialId,
        socialType: original.socialType,
        status: original.status,
        role: original.role,
      });

      expect(recreated.id).toBe(original.id);
      expect(recreated.uid).toBe(original.uid);
      expect(recreated.email).toBe(original.email);
      expect(recreated.passwordHash).toBe(original.passwordHash);
      expect(recreated.socialId).toBe(original.socialId);
      expect(recreated.socialType).toBe(original.socialType);
      expect(recreated.status).toBe(original.status);
      expect(recreated.role).toBe(original.role);
      expect(recreated.isActive()).toBe(original.isActive());
      expect(recreated.isCredentialUser()).toBe(original.isCredentialUser());
      expect(recreated.isSocialUser()).toBe(original.isSocialUser());
    });

    it('create → fromPersistence 순환 테스트 (소셜 회원가입)', () => {
      const original = RegistrationUser.create({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: null,
        socialId: mockSocialId,
        socialType: mockSocialType,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      const recreated = RegistrationUser.fromPersistence({
        id: original.id,
        uid: original.uid,
        email: original.email,
        passwordHash: original.passwordHash,
        socialId: original.socialId,
        socialType: original.socialType,
        status: original.status,
        role: original.role,
      });

      expect(recreated.id).toBe(original.id);
      expect(recreated.uid).toBe(original.uid);
      expect(recreated.email).toBe(original.email);
      expect(recreated.passwordHash).toBe(original.passwordHash);
      expect(recreated.socialId).toBe(original.socialId);
      expect(recreated.socialType).toBe(original.socialType);
      expect(recreated.status).toBe(original.status);
      expect(recreated.role).toBe(original.role);
      expect(recreated.isActive()).toBe(original.isActive());
      expect(recreated.isCredentialUser()).toBe(original.isCredentialUser());
      expect(recreated.isSocialUser()).toBe(original.isSocialUser());
    });

    it('fromPersistence → create 순환 테스트', () => {
      const original = RegistrationUser.fromPersistence({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.SUSPENDED,
        role: UserRoleType.USER,
      });

      const recreated = RegistrationUser.create({
        id: original.id,
        uid: original.uid,
        email: original.email,
        passwordHash: original.passwordHash,
        socialId: original.socialId,
        socialType: original.socialType,
        status: original.status,
        role: original.role,
      });

      expect(recreated.id).toBe(original.id);
      expect(recreated.uid).toBe(original.uid);
      expect(recreated.email).toBe(original.email);
      expect(recreated.passwordHash).toBe(original.passwordHash);
      expect(recreated.socialId).toBe(original.socialId);
      expect(recreated.socialType).toBe(original.socialType);
      expect(recreated.status).toBe(original.status);
      expect(recreated.role).toBe(original.role);
      expect(recreated.isActive()).toBe(original.isActive());
      expect(recreated.isCredentialUser()).toBe(original.isCredentialUser());
      expect(recreated.isSocialUser()).toBe(original.isSocialUser());
    });

    it('passwordHash가 null인 경우 순환 테스트', () => {
      const original = RegistrationUser.create({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: null,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      const recreated = RegistrationUser.fromPersistence({
        id: original.id,
        uid: original.uid,
        email: original.email,
        passwordHash: original.passwordHash,
        socialId: original.socialId,
        socialType: original.socialType,
        status: original.status,
        role: original.role,
      });

      expect(recreated.passwordHash).toBeNull();
      expect(recreated.passwordHash).toBe(original.passwordHash);
      expect(recreated.isCredentialUser()).toBe(original.isCredentialUser());
    });

    it('일반 회원가입과 소셜 회원가입이 서로 배타적임을 확인', () => {
      const credentialUser = RegistrationUser.create({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      const socialUser = RegistrationUser.create({
        id: BigInt(456),
        uid: 'user-uid-456',
        email: 'social@example.com',
        passwordHash: null,
        socialId: mockSocialId,
        socialType: mockSocialType,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(credentialUser.isCredentialUser()).toBe(true);
      expect(credentialUser.isSocialUser()).toBe(false);

      expect(socialUser.isCredentialUser()).toBe(false);
      expect(socialUser.isSocialUser()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('passwordHash와 socialId가 모두 null인 경우 isCredentialUser와 isSocialUser가 모두 false를 반환해야 함', () => {
      const user = RegistrationUser.create({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: null,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(user.isCredentialUser()).toBe(false);
      expect(user.isSocialUser()).toBe(false);
    });

    it('passwordHash와 socialId가 모두 있는 경우 (잘못된 상태) isCredentialUser는 false, isSocialUser는 true를 반환해야 함', () => {
      const user = RegistrationUser.create({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: mockSocialId,
        socialType: mockSocialType,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      // socialId가 있으면 isCredentialUser는 false
      expect(user.isCredentialUser()).toBe(false);
      // socialId가 있으면 isSocialUser는 true
      expect(user.isSocialUser()).toBe(true);
    });

    it('socialId가 있지만 socialType이 null인 경우 isSocialUser가 true를 반환해야 함', () => {
      const user = RegistrationUser.create({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: null,
        socialId: mockSocialId,
        socialType: null, // null인 경우
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(user.isSocialUser()).toBe(true);
    });
  });

  describe('hasValidUserType', () => {
    it('일반 회원가입 사용자는 유효한 사용자 타입을 가져야 함', () => {
      const user = RegistrationUser.create({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(user.hasValidUserType()).toBe(true);
    });

    it('소셜 회원가입 사용자는 유효한 사용자 타입을 가져야 함', () => {
      const user = RegistrationUser.create({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: null,
        socialId: mockSocialId,
        socialType: mockSocialType,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(user.hasValidUserType()).toBe(true);
    });

    it('passwordHash와 socialId가 모두 null인 경우 유효하지 않은 사용자 타입이어야 함', () => {
      const user = RegistrationUser.create({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: null,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(user.hasValidUserType()).toBe(false);
    });

    it('passwordHash와 socialId가 모두 있는 경우 유효하지 않은 사용자 타입이어야 함', () => {
      const user = RegistrationUser.create({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: mockSocialId,
        socialType: mockSocialType,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(user.hasValidUserType()).toBe(false);
    });

    it('fromPersistence로 생성한 일반 회원가입 사용자는 유효한 사용자 타입을 가져야 함', () => {
      const user = RegistrationUser.fromPersistence({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(user.hasValidUserType()).toBe(true);
    });

    it('fromPersistence로 생성한 소셜 회원가입 사용자는 유효한 사용자 타입을 가져야 함', () => {
      const user = RegistrationUser.fromPersistence({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: null,
        socialId: mockSocialId,
        socialType: mockSocialType,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(user.hasValidUserType()).toBe(true);
    });
  });
});
