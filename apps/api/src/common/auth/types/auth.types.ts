import type {
  UserRoleType,
  Language,
  UserStatus,
  ExchangeCurrencyCode,
  RegistrationMethod,
} from '@prisma/client';

export interface AuthenticatedUser {
  id: bigint;
  email: string | null;
  nickname: string;
  role: UserRoleType;
  status: UserStatus;
  avatarUrl: string | null;

  // Verifications
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isIdentityVerified: boolean;
  isKycMandatory: boolean;

  // Settings
  language: Language;
  primaryCurrency: ExchangeCurrencyCode;
  playCurrency: ExchangeCurrencyCode;
  timezone: string | null;
  registrationMethod: RegistrationMethod;
  sessionId?: string;
}
