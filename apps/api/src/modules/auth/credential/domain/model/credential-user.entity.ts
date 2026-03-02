import { UserStatus, UserRoleType, Language, ExchangeCurrencyCode, RegistrationMethod } from '@prisma/client';

export class CredentialUser {
  private constructor(
    public readonly id: bigint | null,
    public readonly email: string | null,
    public readonly nickname: string,
    public readonly passwordHash: string | null,
    public readonly status: UserStatus,
    public readonly role: UserRoleType,
    public readonly language: Language,
    public readonly isEmailVerified: boolean,
    public readonly isPhoneVerified: boolean,
    public readonly isIdentityVerified: boolean,
    public readonly isKycMandatory: boolean,
    public readonly primaryCurrency: ExchangeCurrencyCode,
    public readonly playCurrency: ExchangeCurrencyCode,
    public readonly timezone: string | null,
    public readonly avatarUrl: string | null,
    public readonly registrationMethod: RegistrationMethod,
  ) { }

  static create(params: {
    id?: bigint;
    email: string | null;
    nickname: string;
    passwordHash: string | null;
    status: UserStatus;
    role: UserRoleType;
    language: Language;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    isIdentityVerified: boolean;
    isKycMandatory: boolean;
    primaryCurrency: ExchangeCurrencyCode;
    playCurrency: ExchangeCurrencyCode;
    timezone: string | null;
    avatarUrl: string | null;
    registrationMethod: RegistrationMethod;
  }): CredentialUser {
    return new CredentialUser(
      params.id ?? null,
      params.email,
      params.nickname,
      params.passwordHash,
      params.status,
      params.role,
      params.language,
      params.isEmailVerified,
      params.isPhoneVerified,
      params.isIdentityVerified,
      params.isKycMandatory,
      params.primaryCurrency,
      params.playCurrency,
      params.timezone,
      params.avatarUrl,
      params.registrationMethod,
    );
  }

  static fromPersistence(data: {
    id: bigint | null;
    email: string | null;
    nickname: string;
    passwordHash: string | null;
    status: UserStatus;
    role: UserRoleType;
    language?: Language;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    isIdentityVerified?: boolean;
    isKycMandatory?: boolean;
    primaryCurrency?: ExchangeCurrencyCode;
    playCurrency?: ExchangeCurrencyCode;
    timezone?: string | null;
    avatarUrl?: string | null;
    registrationMethod?: RegistrationMethod;
  }): CredentialUser {
    return new CredentialUser(
      data.id,
      data.email,
      data.nickname,
      data.passwordHash,
      data.status,
      data.role,
      data.language ?? Language.JA,
      data.isEmailVerified ?? false,
      data.isPhoneVerified ?? false,
      data.isIdentityVerified ?? false,
      data.isKycMandatory ?? false,
      data.primaryCurrency ?? ExchangeCurrencyCode.USD,
      data.playCurrency ?? ExchangeCurrencyCode.USD,
      data.timezone ?? null,
      data.avatarUrl ?? null,
      data.registrationMethod ?? RegistrationMethod.CREDENTIAL,
    );
  }

  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  isAdmin(): boolean {
    return (
      this.role === UserRoleType.ADMIN || this.role === UserRoleType.SUPER_ADMIN
    );
  }
}
