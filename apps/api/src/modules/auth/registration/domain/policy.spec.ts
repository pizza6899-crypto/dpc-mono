// src/modules/auth/registration/domain/policy.spec.ts
import { RegistrationPolicy } from './policy';
import { RegistrationUser } from './model/registration-user.entity';
import { UserStatus, UserRoleType, SocialType } from '@repo/database';

describe('RegistrationPolicy', () => {
  let policy: RegistrationPolicy;
  const mockId = 'user-123';
  const mockEmail = 'user@example.com';
  const mockPasswordHash = '$2b$10$hashedpassword123';
  const mockSocialId = 'google-123456';

  beforeEach(() => {
    policy = new RegistrationPolicy();
  });

  describe('isDuplicateEmail', () => {
    it('기존 사용자가 있으면 true를 반환한다', () => {
      const existingUser = RegistrationUser.create({
        id: mockId,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(policy.isDuplicateEmail(existingUser)).toBe(true);
    });

    it('기존 사용자가 null이면 false를 반환한다', () => {
      expect(policy.isDuplicateEmail(null)).toBe(false);
    });

    it('소셜 회원가입 사용자도 중복으로 판단한다', () => {
      const existingUser = RegistrationUser.create({
        id: mockId,
        email: mockEmail,
        passwordHash: null,
        socialId: mockSocialId,
        socialType: SocialType.GOOGLE,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(policy.isDuplicateEmail(existingUser)).toBe(true);
    });

    it('다양한 상태의 사용자도 중복으로 판단한다', () => {
      const statuses = [
        UserStatus.ACTIVE,
        UserStatus.SUSPENDED,
        UserStatus.CLOSED,
      ];

      statuses.forEach((status) => {
        const existingUser = RegistrationUser.create({
          id: mockId,
          email: mockEmail,
          passwordHash: mockPasswordHash,
          socialId: null,
          socialType: null,
          status,
          role: UserRoleType.USER,
        });

        expect(policy.isDuplicateEmail(existingUser)).toBe(true);
      });
    });
  });

  describe('isDuplicateSocialAccount', () => {
    it('기존 소셜 사용자가 있으면 true를 반환한다', () => {
      const existingUser = RegistrationUser.create({
        id: mockId,
        email: mockEmail,
        passwordHash: null,
        socialId: mockSocialId,
        socialType: SocialType.GOOGLE,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(policy.isDuplicateSocialAccount(existingUser)).toBe(true);
    });

    it('기존 사용자가 null이면 false를 반환한다', () => {
      expect(policy.isDuplicateSocialAccount(null)).toBe(false);
    });

    it('일반 회원가입 사용자도 중복으로 판단한다', () => {
      const existingUser = RegistrationUser.create({
        id: mockId,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(policy.isDuplicateSocialAccount(existingUser)).toBe(true);
    });

    it('다양한 소셜 타입의 사용자도 중복으로 판단한다', () => {
      const socialTypes = [SocialType.GOOGLE];

      socialTypes.forEach((socialType) => {
        const existingUser = RegistrationUser.create({
          id: mockId,
          email: mockEmail,
          passwordHash: null,
          socialId: `social-${socialType}`,
          socialType,
          status: UserStatus.ACTIVE,
          role: UserRoleType.USER,
        });

        expect(policy.isDuplicateSocialAccount(existingUser)).toBe(true);
      });
    });
  });

  describe('canRegister', () => {
    it('기존 사용자가 null이면 회원가입 가능하다', () => {
      expect(policy.canRegister(null)).toBe(true);
    });

    it('기존 사용자가 있으면 회원가입 불가능하다', () => {
      const existingUser = RegistrationUser.create({
        id: mockId,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(policy.canRegister(existingUser)).toBe(false);
    });

    it('일반 회원가입 사용자가 있으면 회원가입 불가능하다', () => {
      const existingUser = RegistrationUser.create({
        id: mockId,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(policy.canRegister(existingUser)).toBe(false);
    });

    it('소셜 회원가입 사용자가 있으면 회원가입 불가능하다', () => {
      const existingUser = RegistrationUser.create({
        id: mockId,
        email: mockEmail,
        passwordHash: null,
        socialId: mockSocialId,
        socialType: SocialType.GOOGLE,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(policy.canRegister(existingUser)).toBe(false);
    });

    it('다양한 상태의 사용자가 있어도 회원가입 불가능하다', () => {
      const statuses = [
        UserStatus.ACTIVE,
        UserStatus.SUSPENDED,
        UserStatus.CLOSED,
      ];

      statuses.forEach((status) => {
        const existingUser = RegistrationUser.create({
          id: mockId,
          email: mockEmail,
          passwordHash: mockPasswordHash,
          socialId: null,
          socialType: null,
          status,
          role: UserRoleType.USER,
        });

        expect(policy.canRegister(existingUser)).toBe(false);
      });
    });

    it('다양한 역할의 사용자가 있어도 회원가입 불가능하다', () => {
      const roles = [
        UserRoleType.USER,
        UserRoleType.AGENT,
        UserRoleType.ADMIN,
        UserRoleType.SUPER_ADMIN,
      ];

      roles.forEach((role) => {
        const existingUser = RegistrationUser.create({
          id: mockId,
          email: mockEmail,
          passwordHash: mockPasswordHash,
          socialId: null,
          socialType: null,
          status: UserStatus.ACTIVE,
          role,
        });

        expect(policy.canRegister(existingUser)).toBe(false);
      });
    });
  });

  describe('Integration', () => {
    it('isDuplicateEmail과 canRegister는 반대 결과를 반환한다', () => {
      const existingUser = RegistrationUser.create({
        id: mockId,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(policy.isDuplicateEmail(existingUser)).toBe(
        !policy.canRegister(existingUser),
      );
    });

    it('isDuplicateSocialAccount와 canRegister는 반대 결과를 반환한다', () => {
      const existingUser = RegistrationUser.create({
        id: mockId,
        email: mockEmail,
        passwordHash: null,
        socialId: mockSocialId,
        socialType: SocialType.GOOGLE,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(policy.isDuplicateSocialAccount(existingUser)).toBe(
        !policy.canRegister(existingUser),
      );
    });

    it('null인 경우 모든 메서드가 일관된 결과를 반환한다', () => {
      expect(policy.isDuplicateEmail(null)).toBe(false);
      expect(policy.isDuplicateSocialAccount(null)).toBe(false);
      expect(policy.canRegister(null)).toBe(true);
    });

    it('기존 사용자가 있는 경우 모든 메서드가 일관된 결과를 반환한다', () => {
      const existingUser = RegistrationUser.create({
        id: mockId,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
      });

      expect(policy.isDuplicateEmail(existingUser)).toBe(true);
      expect(policy.isDuplicateSocialAccount(existingUser)).toBe(true);
      expect(policy.canRegister(existingUser)).toBe(false);
    });
  });
});

