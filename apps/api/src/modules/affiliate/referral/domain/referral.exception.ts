import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

/**
 * 레퍼럴 도메인 예외 기본 클래스
 */
export class ReferralException extends DomainException {
  public readonly errorCode: MessageCode;
  public readonly httpStatus: HttpStatus;

  constructor(
    message: string,
    errorCode: MessageCode = MessageCode.VALIDATION_ERROR,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message);
    this.name = 'ReferralException';
    this.errorCode = errorCode;
    this.httpStatus = httpStatus;
  }
}

/**
 * 자기 자신을 추천하려고 할 때 발생하는 예외
 */
export class SelfReferralException extends ReferralException {
  constructor() {
    super(
      'Cannot refer yourself',
      MessageCode.REFERRAL_SELF_REFERRAL,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'SelfReferralException';
  }
}

/**
 * 이미 레퍼럴 관계가 존재할 때 발생하는 예외
 */
export class DuplicateReferralException extends ReferralException {
  constructor() {
    super(
      'Referral relationship already exists',
      MessageCode.REFERRAL_DUPLICATE,
      HttpStatus.CONFLICT,
    );
    this.name = 'DuplicateReferralException';
  }
}

/**
 * 레퍼럴 관계를 찾을 수 없을 때 발생하는 예외
 */
export class ReferralNotFoundException extends ReferralException {
  constructor(id?: string | bigint) {
    super(
      id ? `Referral '${id}' not found` : 'Referral not found',
      MessageCode.REFERRAL_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'ReferralNotFoundException';
  }
}

/**
 * 레퍼럴 관계에 대한 접근 권한이 없을 때 발생하는 예외
 */
export class ReferralAccessDeniedException extends ReferralException {
  constructor() {
    super(
      'Access denied for this referral relationship',
      MessageCode.REFERRAL_ACCESS_DENIED,
      HttpStatus.FORBIDDEN,
    );
    this.name = 'ReferralAccessDeniedException';
  }
}

/**
 * 레퍼럴 코드가 존재하지 않을 때 발생하는 예외
 */
export class ReferralCodeNotFoundException extends ReferralException {
  constructor(code?: string) {
    super(
      code ? `Referral code '${code}' not found` : 'Referral code not found',
      MessageCode.REFERRAL_CODE_NOT_FOUND,
      HttpStatus.NOT_FOUND,
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
      code ? `Referral code '${code}' is inactive` : 'Referral code is inactive',
      MessageCode.REFERRAL_CODE_INACTIVE,
      HttpStatus.BAD_REQUEST,
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
      code ? `Referral code '${code}' has expired` : 'Referral code has expired',
      MessageCode.REFERRAL_CODE_EXPIRED,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'ReferralCodeExpiredException';
  }
}

/**
 * 커미션을 찾을 수 없을 때 발생하는 예외
 */
export class ReferralCommissionNotFoundException extends ReferralException {
  constructor(id?: string | bigint) {
    super(
      id ? `Referral commission '${id}' not found` : 'Referral commission not found',
      MessageCode.REFERRAL_COMMISSION_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'ReferralCommissionNotFoundException';
  }
}

/**
 * 커미션 상태가 잘못되었을 때 발생하는 예외
 */
export class ReferralCommissionInvalidStatusException extends ReferralException {
  constructor(status: string, expectedStatus: string) {
    super(
      `Invalid commission status: ${status}. Expected: ${expectedStatus}`,
      MessageCode.REFERRAL_COMMISSION_INVALID_STATUS,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'ReferralCommissionInvalidStatusException';
  }
}

/**
 * 마일스톤을 찾을 수 없을 때 발생하는 예외
 */
export class ReferralMilestoneNotFoundException extends ReferralException {
  constructor(id?: string | bigint) {
    super(
      id ? `Referral milestone '${id}' not found` : 'Referral milestone not found',
      MessageCode.REFERRAL_MILESTONE_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'ReferralMilestoneNotFoundException';
  }
}

/**
 * 마일스톤이 이미 클레임되었을 때 발생하는 예외
 */
export class ReferralMilestoneAlreadyClaimedException extends ReferralException {
  constructor(id?: string | bigint) {
    super(
      id ? `Referral milestone '${id}' is already claimed` : 'Referral milestone is already claimed',
      MessageCode.REFERRAL_MILESTONE_ALREADY_CLAIMED,
      HttpStatus.CONFLICT,
    );
    this.name = 'ReferralMilestoneAlreadyClaimedException';
  }
}

/**
 * 유저 통계를 찾을 수 없을 때 발생하는 예외
 */
export class UserReferralStatsNotFoundException extends ReferralException {
  constructor(userId?: string | bigint) {
    super(
      userId ? `User referral stats for '${userId}' not found` : 'User referral stats not found',
      MessageCode.REFERRAL_STATS_NOT_FOUND,
      HttpStatus.NOT_FOUND,
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
      MessageCode.REFERRAL_BONUS_INSUFFICIENT_AMOUNT,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InsufficientPendingAmountException';
  }
}
