// src/modules/user/domain/model/user.entity.spec.ts
import { User } from './user.entity';
import { UserRoleType, UserStatus, SocialType } from 'src/generated/prisma';
import { UserAuth } from './value-objects/user-auth.vo';
import { UserLocation } from './value-objects/user-location.vo';

describe('User', () => {
  const mockId = BigInt(123);
  const mockUid = 'user-1234567890';
  const mockEmail = 'test@example.com';
  const mockPasswordHash = '$2b$10$hashedpassword123';
  const mockSocialId = 'social-123';
  const mockCountry = 'KR';
  const mockTimezone = 'Asia/Seoul';
  const mockCreatedAt = new Date('2024-01-01T00:00:00Z');
  const mockUpdatedAt = new Date('2024-01-02T00:00:00Z');

  describe('fromPersistence', () => {
    it('일반 회원가입 사용자를 생성할 수 있어야 함', () => {
      // Arrange
      const persistenceData = {
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
        country: mockCountry,
        timezone: mockTimezone,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      };

      // Act
      const user = User.fromPersistence(persistenceData);

      // Assert
      expect(user.id).toBe(mockId);
      expect(user.uid).toBe(mockUid);
      expect(user.email).toBe(mockEmail);
      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.role).toBe(UserRoleType.USER);
      expect(user.createdAt).toBe(mockCreatedAt);
      expect(user.updatedAt).toBe(mockUpdatedAt);
      expect(user.isCredentialUser()).toBe(true);
      expect(user.isSocialUser()).toBe(false);
      expect(user.hasValidUserType()).toBe(true);
    });

    it('소셜 로그인 사용자를 생성할 수 있어야 함', () => {
      // Arrange
      const persistenceData = {
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: null,
        socialId: mockSocialId,
        socialType: SocialType.GOOGLE,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
        country: mockCountry,
        timezone: mockTimezone,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      };

      // Act
      const user = User.fromPersistence(persistenceData);

      // Assert
      expect(user.id).toBe(mockId);
      expect(user.uid).toBe(mockUid);
      expect(user.email).toBe(mockEmail);
      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.role).toBe(UserRoleType.USER);
      expect(user.isCredentialUser()).toBe(false);
      expect(user.isSocialUser()).toBe(true);
      expect(user.hasValidUserType()).toBe(true);
    });

    it('위치 정보가 없는 사용자를 생성할 수 있어야 함', () => {
      // Arrange
      const persistenceData = {
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
        country: null,
        timezone: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      };

      // Act
      const user = User.fromPersistence(persistenceData);

      // Assert
      expect(user.id).toBe(mockId);
      expect(user.uid).toBe(mockUid);
      expect(user.email).toBe(mockEmail);
      const location = user.getLocation();
      expect(location.country).toBeNull();
      expect(location.timezone).toBeNull();
    });

    it('ADMIN 역할 사용자를 생성할 수 있어야 함', () => {
      // Arrange
      const persistenceData = {
        id: mockId,
        uid: mockUid,
        email: 'admin@example.com',
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.ADMIN,
        country: mockCountry,
        timezone: mockTimezone,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      };

      // Act
      const user = User.fromPersistence(persistenceData);

      // Assert
      expect(user.role).toBe(UserRoleType.ADMIN);
    });

    it('SUSPENDED 상태 사용자를 생성할 수 있어야 함', () => {
      // Arrange
      const persistenceData = {
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.SUSPENDED,
        role: UserRoleType.USER,
        country: mockCountry,
        timezone: mockTimezone,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      };

      // Act
      const user = User.fromPersistence(persistenceData);

      // Assert
      expect(user.status).toBe(UserStatus.SUSPENDED);
    });
  });

  describe('toPersistence', () => {
    it('일반 회원가입 사용자의 Persistence 데이터로 변환할 수 있어야 함', () => {
      // Arrange
      const persistenceData = {
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
        country: mockCountry,
        timezone: mockTimezone,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      };
      const user = User.fromPersistence(persistenceData);

      // Act
      const result = user.toPersistence();

      // Assert
      expect(result).toEqual(persistenceData);
    });

    it('소셜 로그인 사용자의 Persistence 데이터로 변환할 수 있어야 함', () => {
      // Arrange
      const persistenceData = {
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: null,
        socialId: mockSocialId,
        socialType: SocialType.GOOGLE,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
        country: mockCountry,
        timezone: mockTimezone,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      };
      const user = User.fromPersistence(persistenceData);

      // Act
      const result = user.toPersistence();

      // Assert
      expect(result).toEqual(persistenceData);
    });

    it('위치 정보가 없는 사용자의 Persistence 데이터로 변환할 수 있어야 함', () => {
      // Arrange
      const persistenceData = {
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
        country: null,
        timezone: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      };
      const user = User.fromPersistence(persistenceData);

      // Act
      const result = user.toPersistence();

      // Assert
      expect(result).toEqual(persistenceData);
    });

    it('fromPersistence와 toPersistence가 round-trip으로 동작해야 함', () => {
      // Arrange
      const originalData = {
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
        country: mockCountry,
        timezone: mockTimezone,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      };

      // Act
      const user = User.fromPersistence(originalData);
      const convertedData = user.toPersistence();
      const recreatedUser = User.fromPersistence(convertedData);

      // Assert
      expect(convertedData).toEqual(originalData);
      expect(recreatedUser.id).toBe(user.id);
      expect(recreatedUser.uid).toBe(user.uid);
      expect(recreatedUser.email).toBe(user.email);
      expect(recreatedUser.status).toBe(user.status);
      expect(recreatedUser.role).toBe(user.role);
    });
  });

  describe('Getters', () => {
    it('email getter가 올바른 이메일을 반환해야 함', () => {
      // Arrange
      const user = User.fromPersistence({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
        country: mockCountry,
        timezone: mockTimezone,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      // Act & Assert
      expect(user.email).toBe(mockEmail);
    });

    it('getAuthInfo가 올바른 UserAuth를 반환해야 함', () => {
      // Arrange
      const user = User.fromPersistence({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
        country: mockCountry,
        timezone: mockTimezone,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      // Act
      const authInfo = user.getAuthInfo();

      // Assert
      expect(authInfo).toBeInstanceOf(UserAuth);
      expect(authInfo.email).toBe(mockEmail);
      expect(authInfo.passwordHash).toBe(mockPasswordHash);
      expect(authInfo.socialId).toBeNull();
      expect(authInfo.socialType).toBeNull();
    });

    it('getLocation이 올바른 UserLocation을 반환해야 함', () => {
      // Arrange
      const user = User.fromPersistence({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
        country: mockCountry,
        timezone: mockTimezone,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      // Act
      const location = user.getLocation();

      // Assert
      expect(location).toBeInstanceOf(UserLocation);
      expect(location.country).toBe(mockCountry);
      expect(location.timezone).toBe(mockTimezone);
    });

    it('getLocation이 null 위치 정보를 올바르게 반환해야 함', () => {
      // Arrange
      const user = User.fromPersistence({
        id: mockId,
        uid: mockUid,
        email: mockEmail,
        passwordHash: mockPasswordHash,
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
        country: null,
        timezone: null,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      // Act
      const location = user.getLocation();

      // Assert
      expect(location).toBeInstanceOf(UserLocation);
      expect(location.country).toBeNull();
      expect(location.timezone).toBeNull();
    });
  });

  describe('Business Logic Methods', () => {
    describe('isCredentialUser', () => {
      it('일반 회원가입 사용자인 경우 true를 반환해야 함', () => {
        // Arrange
        const user = User.fromPersistence({
          id: mockId,
          uid: mockUid,
          email: mockEmail,
          passwordHash: mockPasswordHash,
          socialId: null,
          socialType: null,
          status: UserStatus.ACTIVE,
          role: UserRoleType.USER,
          country: mockCountry,
          timezone: mockTimezone,
          createdAt: mockCreatedAt,
          updatedAt: mockUpdatedAt,
        });

        // Act & Assert
        expect(user.isCredentialUser()).toBe(true);
      });

      it('소셜 로그인 사용자인 경우 false를 반환해야 함', () => {
        // Arrange
        const user = User.fromPersistence({
          id: mockId,
          uid: mockUid,
          email: mockEmail,
          passwordHash: null,
          socialId: mockSocialId,
          socialType: SocialType.GOOGLE,
          status: UserStatus.ACTIVE,
          role: UserRoleType.USER,
          country: mockCountry,
          timezone: mockTimezone,
          createdAt: mockCreatedAt,
          updatedAt: mockUpdatedAt,
        });

        // Act & Assert
        expect(user.isCredentialUser()).toBe(false);
      });
    });

    describe('isSocialUser', () => {
      it('소셜 로그인 사용자인 경우 true를 반환해야 함', () => {
        // Arrange
        const user = User.fromPersistence({
          id: mockId,
          uid: mockUid,
          email: mockEmail,
          passwordHash: null,
          socialId: mockSocialId,
          socialType: SocialType.GOOGLE,
          status: UserStatus.ACTIVE,
          role: UserRoleType.USER,
          country: mockCountry,
          timezone: mockTimezone,
          createdAt: mockCreatedAt,
          updatedAt: mockUpdatedAt,
        });

        // Act & Assert
        expect(user.isSocialUser()).toBe(true);
      });

      it('일반 회원가입 사용자인 경우 false를 반환해야 함', () => {
        // Arrange
        const user = User.fromPersistence({
          id: mockId,
          uid: mockUid,
          email: mockEmail,
          passwordHash: mockPasswordHash,
          socialId: null,
          socialType: null,
          status: UserStatus.ACTIVE,
          role: UserRoleType.USER,
          country: mockCountry,
          timezone: mockTimezone,
          createdAt: mockCreatedAt,
          updatedAt: mockUpdatedAt,
        });

        // Act & Assert
        expect(user.isSocialUser()).toBe(false);
      });

      it('다양한 소셜 타입에 대해 true를 반환해야 함', () => {
        // Arrange & Act & Assert
        const googleUser = User.fromPersistence({
          id: mockId,
          uid: mockUid,
          email: mockEmail,
          passwordHash: null,
          socialId: mockSocialId,
          socialType: SocialType.GOOGLE,
          status: UserStatus.ACTIVE,
          role: UserRoleType.USER,
          country: mockCountry,
          timezone: mockTimezone,
          createdAt: mockCreatedAt,
          updatedAt: mockUpdatedAt,
        });
        expect(googleUser.isSocialUser()).toBe(true);

        const appleUser = User.fromPersistence({
          id: mockId,
          uid: mockUid,
          email: mockEmail,
          passwordHash: null,
          socialId: mockSocialId,
          socialType: SocialType.APPLE,
          status: UserStatus.ACTIVE,
          role: UserRoleType.USER,
          country: mockCountry,
          timezone: mockTimezone,
          createdAt: mockCreatedAt,
          updatedAt: mockUpdatedAt,
        });
        expect(appleUser.isSocialUser()).toBe(true);

        const telegramUser = User.fromPersistence({
          id: mockId,
          uid: mockUid,
          email: mockEmail,
          passwordHash: null,
          socialId: mockSocialId,
          socialType: SocialType.TELEGRAM,
          status: UserStatus.ACTIVE,
          role: UserRoleType.USER,
          country: mockCountry,
          timezone: mockTimezone,
          createdAt: mockCreatedAt,
          updatedAt: mockUpdatedAt,
        });
        expect(telegramUser.isSocialUser()).toBe(true);
      });
    });

    describe('hasValidUserType', () => {
      it('일반 회원가입 사용자인 경우 true를 반환해야 함', () => {
        // Arrange
        const user = User.fromPersistence({
          id: mockId,
          uid: mockUid,
          email: mockEmail,
          passwordHash: mockPasswordHash,
          socialId: null,
          socialType: null,
          status: UserStatus.ACTIVE,
          role: UserRoleType.USER,
          country: mockCountry,
          timezone: mockTimezone,
          createdAt: mockCreatedAt,
          updatedAt: mockUpdatedAt,
        });

        // Act & Assert
        expect(user.hasValidUserType()).toBe(true);
      });

      it('소셜 로그인 사용자인 경우 true를 반환해야 함', () => {
        // Arrange
        const user = User.fromPersistence({
          id: mockId,
          uid: mockUid,
          email: mockEmail,
          passwordHash: null,
          socialId: mockSocialId,
          socialType: SocialType.GOOGLE,
          status: UserStatus.ACTIVE,
          role: UserRoleType.USER,
          country: mockCountry,
          timezone: mockTimezone,
          createdAt: mockCreatedAt,
          updatedAt: mockUpdatedAt,
        });

        // Act & Assert
        expect(user.hasValidUserType()).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('모든 필드가 최소값으로 설정된 사용자를 생성할 수 있어야 함', () => {
      // Arrange
      const persistenceData = {
        id: BigInt(1),
        uid: 'u-1',
        email: 'a@b.c',
        passwordHash: 'hash',
        socialId: null,
        socialType: null,
        status: UserStatus.ACTIVE,
        role: UserRoleType.USER,
        country: null,
        timezone: null,
        createdAt: new Date(0),
        updatedAt: new Date(0),
      };

      // Act
      const user = User.fromPersistence(persistenceData);

      // Assert
      expect(user.id).toBe(BigInt(1));
      expect(user.uid).toBe('u-1');
      expect(user.email).toBe('a@b.c');
    });

    it('다양한 UserStatus 값을 처리할 수 있어야 함', () => {
      const statuses = [
        UserStatus.ACTIVE,
        UserStatus.SUSPENDED,
        UserStatus.CLOSED,
      ];

      statuses.forEach((status) => {
        // Arrange
        const persistenceData = {
          id: mockId,
          uid: mockUid,
          email: mockEmail,
          passwordHash: mockPasswordHash,
          socialId: null,
          socialType: null,
          status,
          role: UserRoleType.USER,
          country: mockCountry,
          timezone: mockTimezone,
          createdAt: mockCreatedAt,
          updatedAt: mockUpdatedAt,
        };

        // Act
        const user = User.fromPersistence(persistenceData);

        // Assert
        expect(user.status).toBe(status);
      });
    });

    it('다양한 UserRoleType 값을 처리할 수 있어야 함', () => {
      const roles = [UserRoleType.USER, UserRoleType.ADMIN];

      roles.forEach((role) => {
        // Arrange
        const persistenceData = {
          id: mockId,
          uid: mockUid,
          email: mockEmail,
          passwordHash: mockPasswordHash,
          socialId: null,
          socialType: null,
          status: UserStatus.ACTIVE,
          role,
          country: mockCountry,
          timezone: mockTimezone,
          createdAt: mockCreatedAt,
          updatedAt: mockUpdatedAt,
        };

        // Act
        const user = User.fromPersistence(persistenceData);

        // Assert
        expect(user.role).toBe(role);
      });
    });
  });
});

