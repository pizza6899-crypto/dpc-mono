// src/platform/user-validation/user-validation.types.ts
import { UserRoleType, UserStatus, KycLevel } from '@prisma/client';

/**
 * 유저 유효성 검사 옵션
 */
export interface UserValidationOptions {
  /**
   * 활성 상태 필수 여부 (기본값: true)
   */
  requireActiveStatus?: boolean;

  /**
   * 이메일 인증 필수 여부
   * (스키마에 emailVerified 필드 추가 필요)
   */
  requireEmailVerified?: boolean;

  /**
   * 전화번호 인증 필수 여부
   * (스키마에 phoneVerified 필드 추가 필요)
   */
  requirePhoneVerified?: boolean;

  /**
   * 필요한 KYC 레벨
   */
  requireKycLevel?: KycLevel;

  /**
   * 검증에서 제외할 역할들 (예: ADMIN, SUPER_ADMIN)
   */
  excludeRoles?: UserRoleType[];

  /**
   * 에러 메시지 커스터마이징
   */
  customErrorMessage?: {
    inactive?: string;
    emailNotVerified?: string;
    phoneNotVerified?: string;
    kycInsufficient?: string;
    userNotFound?: string;
  };
}

/**
 * KYC 레벨 우선순위
 */
export const KYC_LEVEL_PRIORITY: Record<KycLevel, number> = {
  NONE: 0,
  BASIC: 1,
  FULL: 2,
} as const;
