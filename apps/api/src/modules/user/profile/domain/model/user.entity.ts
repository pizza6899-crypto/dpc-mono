import {
  UserRoleType,
  OAuthProvider,
  RegistrationMethod,
  Language,
  UserStatus,
  ExchangeCurrencyCode,
} from '@prisma/client';
import { UserAuth } from './value-objects/user-auth.vo';
import { UserLocation } from './value-objects/user-location.vo';
import { UserCurrency } from './value-objects/user-currency.vo';
import { UserTrust } from './value-objects/user-trust.vo';

/**
 * User 도메인 엔티티
 *
 * 사용자 계정 정보를 표현하는 도메인 엔티티입니다.
 */
export class User {
  private constructor(
    public readonly id: bigint,
    public readonly nickname: string,
    private authInfo: UserAuth,
    private location: UserLocation,
    private currency: UserCurrency,
    private trust: UserTrust,
    public readonly status: UserStatus,
    public readonly role: UserRoleType,
    public readonly language: Language,
    public readonly birthDate: Date | null,
    public readonly phoneNumber: string | null,
    public readonly avatarUrl: string | null,
    // [Lifecycle & Audit]
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly closedAt: Date | null,
    public readonly closedBy: bigint | null,
    public readonly closeReason: string | null,
    // [External Integration]
    public readonly whitecliffId: bigint | null,
    public readonly whitecliffUsername: string | null,
    public readonly dcsId: string | null,
  ) { }

  /**
   * DB에서 조회한 데이터로부터 엔티티 생성
   */
  static fromPersistence(data: {
    id: bigint;
    loginId: string | null;
    nickname: string;
    email: string | null;
    passwordHash: string | null;
    registrationMethod: RegistrationMethod;
    telegramUsername: string | null;
    oauthProvider: OAuthProvider | null;
    oauthId: string | null;
    phoneNumber: string | null;
    status: UserStatus;
    role: UserRoleType;
    country: string | null;
    language: Language;
    timezone: string | null;
    timezoneOffset: number | null;
    avatarUrl: string | null;
    primaryCurrency: ExchangeCurrencyCode;
    playCurrency: ExchangeCurrencyCode;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    isTelegramVerified: boolean;
    isIdentityVerified: boolean;
    isBankVerified: boolean;
    isKycMandatory: boolean;
    whitecliffId: bigint | null;
    whitecliffUsername: string | null;
    dcsId: string | null;
    closedAt: Date | null;
    closedBy: bigint | null;
    closeReason: string | null;
    birthDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User(
      data.id,
      data.nickname,
      UserAuth.fromPersistence({
        loginId: data.loginId,
        email: data.email,
        passwordHash: data.passwordHash,
        registrationMethod: data.registrationMethod,
        oauthId: data.oauthId,
        oauthProvider: data.oauthProvider,
      }),
      UserLocation.fromPersistence({
        country: data.country,
        timezone: data.timezone,
        timezoneOffset: data.timezoneOffset,
      }),
      UserCurrency.fromPersistence({
        primaryCurrency: data.primaryCurrency,
        playCurrency: data.playCurrency,
      }),
      UserTrust.fromPersistence({
        isEmailVerified: data.isEmailVerified,
        isPhoneVerified: data.isPhoneVerified,
        isTelegramVerified: data.isTelegramVerified,
        isIdentityVerified: data.isIdentityVerified,
        isBankVerified: data.isBankVerified,
        isKycMandatory: data.isKycMandatory,
      }),
      data.status,
      data.role,
      data.language,
      data.birthDate,
      data.phoneNumber,
      data.avatarUrl,
      data.createdAt,
      data.updatedAt,
      data.closedAt,
      data.closedBy,
      data.closeReason,
      data.whitecliffId,
      data.whitecliffUsername,
      data.dcsId,
    );
  }

  /**
   * Domain 엔티티를 Persistence 레이어로 변환
   */
  toPersistence(): any {
    const auth = this.authInfo.toPersistence();
    const location = this.location.toPersistence();
    const currency = this.currency.toPersistence();
    const trust = this.trust.toPersistence();

    return {
      id: this.id,
      nickname: this.nickname,
      loginId: auth.loginId,
      registrationMethod: auth.registrationMethod,
      email: auth.email,
      passwordHash: auth.passwordHash,
      oauthProvider: auth.oauthProvider,
      oauthId: auth.oauthId,
      country: location.country,
      timezone: location.timezone,
      timezoneOffset: location.timezoneOffset,
      primaryCurrency: currency.primaryCurrency,
      playCurrency: currency.playCurrency,
      ...trust,
      status: this.status,
      role: this.role,
      language: this.language,
      birthDate: this.birthDate,
      phoneNumber: this.phoneNumber,
      avatarUrl: this.avatarUrl,
      whitecliffId: this.whitecliffId,
      whitecliffUsername: this.whitecliffUsername,
      dcsId: this.dcsId,
      closedAt: this.closedAt,
      closedBy: this.closedBy,
      closeReason: this.closeReason,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Getters
  get loginId(): string | null { return this.authInfo.loginId; }
  get email(): string | null { return this.authInfo.email; }

  getLocation(): UserLocation { return this.location; }
  getCurrency(): UserCurrency { return this.currency; }
  getTrust(): UserTrust { return this.trust; }
  getAuthInfo(): UserAuth { return this.authInfo; }

  // Business Logic Methods
  isCredentialUser(): boolean { return this.authInfo.isCredentialUser(); }
  isAdminCreated(): boolean { return this.authInfo.isAdminCreated(); }
  isPasswordUser(): boolean { return this.authInfo.isPasswordUser(); }
  isSocialUser(): boolean { return this.authInfo.isSocialUser(); }

  /**
   * 관리자 도구를 통한 정보 업데이트 (불변성 유지)
   */
  updateAdmin(updates: {
    email?: string | null;
    nickname?: string;
    status?: UserStatus;
    role?: UserRoleType; // 추가
    primaryCurrency?: ExchangeCurrencyCode;
    playCurrency?: ExchangeCurrencyCode;
  }): User {
    let newAuthInfo = this.authInfo;
    if (updates.email !== undefined && updates.email !== this.authInfo.email) {
      newAuthInfo = this.authInfo.withEmail(updates.email);
    }

    let newCurrency = this.currency;
    if (updates.primaryCurrency || updates.playCurrency) {
      newCurrency = this.currency.update({
        primaryCurrency: updates.primaryCurrency,
        playCurrency: updates.playCurrency,
      });
    }

    return new User(
      this.id,
      updates.nickname || this.nickname,
      newAuthInfo,
      this.location,
      newCurrency,
      this.trust,
      updates.status || this.status,
      updates.role || this.role, // 업데이트 반영
      this.language,
      this.birthDate,
      this.phoneNumber,
      this.avatarUrl,
      this.createdAt,
      new Date(), // updatedAt
      this.closedAt,
      this.closedBy,
      this.closeReason,
      this.whitecliffId,
      this.whitecliffUsername,
      this.dcsId,
    );
  }

  /**
   * 계정 종료 처리 (관리자용)
   */
  closeAccount(closedBy: bigint, reason: string): User {
    return new User(
      this.id,
      this.nickname,
      this.authInfo,
      this.location,
      this.currency,
      this.trust,
      UserStatus.CLOSED, // 탈퇴 상태로 변경
      this.role,
      this.language,
      this.birthDate,
      this.phoneNumber,
      this.avatarUrl,
      this.createdAt,
      new Date(), // updatedAt
      new Date(), // closedAt
      closedBy,
      reason,
      this.whitecliffId,
      this.whitecliffUsername,
      this.dcsId,
    );
  }
  /**
   * 계정 복구 처리 (관리자용)
   */
  restoreAccount(): User {
    return new User(
      this.id,
      this.nickname,
      this.authInfo,
      this.location,
      this.currency,
      this.trust,
      UserStatus.ACTIVE, // 다시 활성 상태로 변경
      this.role,
      this.language,
      this.birthDate,
      this.phoneNumber,
      this.avatarUrl,
      this.createdAt,
      new Date(), // updatedAt
      null, // closedAt 초기화
      null, // closedBy 초기화
      null, // closeReason 초기화
      this.whitecliffId,
      this.whitecliffUsername,
      this.dcsId,
    );
  }

  /**
   * 사용자 본인의 정보 업데이트 (불변성 유지)
   */
  updateProfile(updates: {
    nickname?: string;
    language?: Language;
    timezone?: string;
    phoneNumber?: string;
    avatarUrl?: string | null;
    primaryCurrency?: ExchangeCurrencyCode;
    playCurrency?: ExchangeCurrencyCode;
  }): User {
    let newLocation = this.location;
    if (updates.timezone !== undefined) {
      newLocation = this.location.update({ timezone: updates.timezone });
    }

    let newCurrency = this.currency;
    if (updates.primaryCurrency || updates.playCurrency) {
      newCurrency = this.currency.update({
        primaryCurrency: updates.primaryCurrency,
        playCurrency: updates.playCurrency,
      });
    }

    return new User(
      this.id,
      updates.nickname || this.nickname,
      this.authInfo,
      newLocation,
      newCurrency,
      this.trust,
      this.status,
      this.role,
      updates.language || this.language,
      this.birthDate,
      updates.phoneNumber || this.phoneNumber,
      updates.avatarUrl !== undefined ? updates.avatarUrl : this.avatarUrl,
      this.createdAt,
      new Date(), // updatedAt
      this.closedAt,
      this.closedBy,
      this.closeReason,
      this.whitecliffId,
      this.whitecliffUsername,
      this.dcsId,
    );
  }
}
