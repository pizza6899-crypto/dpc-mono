import type {
  ExchangeCurrencyCode,
  Language,
  LoginIdType,
  OAuthProvider,
  UserStatus,
} from '@prisma/client';

export interface UserConfigProps {
  id: number;
  allowSignup: boolean;
  defaultStatus: UserStatus;
  maxDailySignupPerIp: number;
  loginIdType: LoginIdType;
  requireEmail: boolean;
  requirePhoneNumber: boolean;
  requireBirthDate: boolean;
  requireNickname: boolean;
  requireReferralCode: boolean;
  allowedOAuthProviders: OAuthProvider[];
  loginIdEmailRegex: string | null;
  loginIdPhoneNumberRegex: string | null;
  loginIdUsernameRegex: string | null;
  nicknameRegex: string | null;
  passwordRegex: string | null;
  defaultPrimaryCurrency: ExchangeCurrencyCode;
  defaultPlayCurrency: ExchangeCurrencyCode;
  defaultLanguage: Language;
  adminNote: string | null;
  updatedBy: bigint | null;
  createdAt: Date;
  updatedAt: Date;
}

export class UserConfig {
  private constructor(private readonly props: UserConfigProps) {}

  /**
   * 리포지토리(DB)에서 데이터를 불러와 엔티티로 변환할 때 사용합니다.
   */
  static fromPersistence(props: UserConfigProps): UserConfig {
    return new UserConfig(props);
  }

  // --- Getters ---

  get id(): number {
    return this.props.id;
  }
  get allowSignup(): boolean {
    return this.props.allowSignup;
  }
  get defaultStatus(): UserStatus {
    return this.props.defaultStatus;
  }
  get maxDailySignupPerIp(): number {
    return this.props.maxDailySignupPerIp;
  }
  get loginIdType(): LoginIdType {
    return this.props.loginIdType;
  }
  get requireEmail(): boolean {
    return this.props.requireEmail;
  }
  get requirePhoneNumber(): boolean {
    return this.props.requirePhoneNumber;
  }
  get requireBirthDate(): boolean {
    return this.props.requireBirthDate;
  }
  get requireNickname(): boolean {
    return this.props.requireNickname;
  }
  get requireReferralCode(): boolean {
    return this.props.requireReferralCode;
  }
  get allowedOAuthProviders(): OAuthProvider[] {
    return [...this.props.allowedOAuthProviders];
  }
  get loginIdEmailRegex(): string | null {
    return this.props.loginIdEmailRegex;
  }
  get loginIdPhoneNumberRegex(): string | null {
    return this.props.loginIdPhoneNumberRegex;
  }
  get loginIdUsernameRegex(): string | null {
    return this.props.loginIdUsernameRegex;
  }
  get nicknameRegex(): string | null {
    return this.props.nicknameRegex;
  }
  get passwordRegex(): string | null {
    return this.props.passwordRegex;
  }
  get defaultPrimaryCurrency(): ExchangeCurrencyCode {
    return this.props.defaultPrimaryCurrency;
  }
  get defaultPlayCurrency(): ExchangeCurrencyCode {
    return this.props.defaultPlayCurrency;
  }
  get defaultLanguage(): Language {
    return this.props.defaultLanguage;
  }
  get adminNote(): string | null {
    return this.props.adminNote;
  }
  get updatedBy(): bigint | null {
    return this.props.updatedBy;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // --- Business Methods ---

  /**
   * 설정을 업데이트합니다.
   * 각 필드는 선택적으로 업데이트할 수 있습니다.
   */
  update(
    updateData: Partial<
      Omit<UserConfigProps, 'id' | 'createdAt' | 'updatedAt'>
    >,
    adminUserId: bigint,
  ): void {
    Object.assign(this.props, {
      ...updateData,
      updatedBy: adminUserId,
      // updatedAt은 Mapper가 저장 시점에 갱신하거나 DB 레벨에서 처리됨을 가정
    });
  }

  /**
   * 특정 OAuth 프로바이더가 허용되는지 확인합니다.
   */
  isOAuthProviderAllowed(provider: OAuthProvider): boolean {
    return this.props.allowedOAuthProviders.includes(provider);
  }

  /**
   * 회원가입 시 주어진 LoginIdType이 현재 설정과 일치하는지 확인합니다.
   */
  isValidLoginIdType(type: LoginIdType): boolean {
    return this.props.loginIdType === type;
  }
}
