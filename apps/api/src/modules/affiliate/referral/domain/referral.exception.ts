// src/modules/affiliate/referral/domain/referral.exception.ts

/**
 * 레퍼럴 도메인 예외 기본 클래스
 */
export class ReferralException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReferralException';
  }
}

/**
 * 자기 자신을 추천하려고 할 때 발생하는 예외
 */
export class SelfReferralException extends ReferralException {
  constructor() {
    super('자신을 추천할 수 없습니다');
    this.name = 'SelfReferralException';
  }
}

/**
 * 이미 레퍼럴 관계가 존재할 때 발생하는 예외
 */
export class DuplicateReferralException extends ReferralException {
  constructor() {
    super('이미 레퍼럴 관계가 존재합니다');
    this.name = 'DuplicateReferralException';
  }
}

/**
 * 레퍼럴 관계를 찾을 수 없을 때 발생하는 예외
 */
export class ReferralNotFoundException extends ReferralException {
  constructor(id?: string) {
    super(id ? `Referral '${id}' not found` : 'Referral not found');
    this.name = 'ReferralNotFoundException';
  }
}

/**
 * 레퍼럴 관계에 대한 접근 권한이 없을 때 발생하는 예외
 */
export class ReferralAccessDeniedException extends ReferralException {
  constructor() {
    super('레퍼럴 관계에 대한 접근 권한이 없습니다');
    this.name = 'ReferralAccessDeniedException';
  }
}

/**
 * 레퍼럴 코드가 존재하지 않을 때 발생하는 예외
 * (code 모듈의 예외를 재사용하거나 별도 정의)
 */
export class ReferralCodeNotFoundException extends ReferralException {
  constructor(code?: string) {
    super(
      code ? `Referral code '${code}' not found` : 'Referral code not found',
    );
    this.name = 'ReferralCodeNotFoundException';
  }
}

/**
 * 레퍼럴 코드가 비활성화되어 있을 때 발생하는 예외
 */
export class ReferralCodeInactiveException extends ReferralException {
  constructor(code?: string) {
    super(
      code
        ? `Referral code '${code}' is inactive`
        : 'Referral code is inactive',
    );
    this.name = 'ReferralCodeInactiveException';
  }
}

/**
 * 레퍼럴 코드가 만료되었을 때 발생하는 예외
 */
export class ReferralCodeExpiredException extends ReferralException {
  constructor(code?: string) {
    super(
      code
        ? `Referral code '${code}' has expired`
        : 'Referral code has expired',
    );
    this.name = 'ReferralCodeExpiredException';
  }
}

/**
 * 커미션을 찾을 수 없을 때 발생하는 예외
 */
export class ReferralCommissionNotFoundException extends ReferralException {
  constructor(id?: string) {
    super(
      id
        ? `Referral commission '${id}' not found`
        : 'Referral commission not found',
    );
    this.name = 'ReferralCommissionNotFoundException';
  }
}

/**
 * 커미션 상태가 잘못되었을 때 발생하는 예외
 */
export class ReferralCommissionInvalidStatusException extends ReferralException {
  constructor(status: string, expectedStatus: string) {
    super(`Invalid commission status: ${status}. Expected: ${expectedStatus}`);
    this.name = 'ReferralCommissionInvalidStatusException';
  }
}

/**
 * 마일스톤을 찾을 수 없을 때 발생하는 예외
 */
export class ReferralMilestoneNotFoundException extends ReferralException {
  constructor(id?: string) {
    super(
      id
        ? `Referral milestone '${id}' not found`
        : 'Referral milestone not found',
    );
    this.name = 'ReferralMilestoneNotFoundException';
  }
}

/**
 * 마일스톤이 이미 클레임되었을 때 발생하는 예외
 */
export class ReferralMilestoneAlreadyClaimedException extends ReferralException {
  constructor(id?: string) {
    super(
      id
        ? `Referral milestone '${id}' is already claimed`
        : 'Referral milestone is already claimed',
    );
    this.name = 'ReferralMilestoneAlreadyClaimedException';
  }
}

/**
 * 유저 통계를 찾을 수 없을 때 발생하는 예외
 */
export class UserReferralStatsNotFoundException extends ReferralException {
  constructor(userId?: string) {
    super(
      userId
        ? `User referral stats for '${userId}' not found`
        : 'User referral stats not found',
    );
    this.name = 'UserReferralStatsNotFoundException';
  }
}

/**
 * 출금 가능 금액이 부족할 때 발생하는 예외
 */
export class InsufficientPendingAmountException extends ReferralException {
  constructor(available: bigint, requested: bigint) {
    super(
      `Insufficient pending amount. Available: ${available}, Requested: ${requested}`,
    );
    this.name = 'InsufficientPendingAmountException';
  }
}
