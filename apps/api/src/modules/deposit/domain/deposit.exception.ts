import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

/**
 * Deposit 도메인 예외 기본 클래스
 *
 * @errorCode MessageCode.VALIDATION_ERROR
 */
export class DepositException extends DomainException {
  constructor(
    message: string,
    errorCode: MessageCode = MessageCode.VALIDATION_ERROR,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, errorCode, httpStatus);
    this.name = 'DepositException';
  }
}

/**
 * Deposit을 찾을 수 없을 때 발생하는 예외
 *
 * @errorCode MessageCode.DEPOSIT_NOT_FOUND
 * @httpStatus 404
 */
export class DepositNotFoundException extends DepositException {
  constructor() {
    super(
      'Deposit not found',
      MessageCode.DEPOSIT_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'DepositNotFoundException';
  }
}

/**
 * Deposit이 이미 처리되었을 때 발생하는 예외
 * (승인/거부할 수 없는 상태일 때)
 *
 * @errorCode MessageCode.DEPOSIT_ALREADY_PROCESSED
 * @httpStatus 400
 */
export class DepositAlreadyProcessedException extends DepositException {
  constructor(currentStatus: string) {
    super(
      `Deposit already processed (Current status: ${currentStatus})`,
      MessageCode.DEPOSIT_ALREADY_PROCESSED,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'DepositAlreadyProcessedException';
  }
}

/**
 * 이미 대기 중인 입금 신청이 있을 때 발생하는 예외
 *
 * @errorCode MessageCode.DEPOSIT_REQUEST_ALREADY_EXISTS
 * @httpStatus 409
 */
export class PendingDepositExistsException extends DepositException {
  constructor() {
    super(
      'A pending deposit request already exists for this user',
      MessageCode.DEPOSIT_REQUEST_ALREADY_EXISTS,
      HttpStatus.CONFLICT,
    );
    this.name = 'PendingDepositExistsException';
  }
}

/**
 * 진행 중인 웨이저링(롤링)이 있어 입금 신청이 불가능할 때 발생하는 예외
 *
 * @errorCode MessageCode.VALIDATION_ERROR
 * @httpStatus 400
 */
export class OngoingWageringRequirementException extends DepositException {
  constructor() {
    super(
      'You have an ongoing wagering requirement. Please complete or cancel it before making a new deposit.',
      MessageCode.ROLLING_NOT_COMPLETED,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'OngoingWageringRequirementException';
  }
}

/**
 * Deposit 상태가 유효하지 않을 때 발생하는 예외
 *
 * @errorCode MessageCode.DEPOSIT_INVALID_STATUS
 * @httpStatus 400
 */
export class InvalidDepositStatusException extends DepositException {
  constructor(currentStatus: string, expectedStatuses: string[]) {
    super(
      `Invalid deposit status (Current status: ${currentStatus}, expected: ${expectedStatuses.join(', ')})`,
      MessageCode.DEPOSIT_INVALID_STATUS,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InvalidDepositStatusException';
  }
}

/**
 * 입금 금액이 유효하지 않을 때 발생하는 예외
 *
 * @errorCode MessageCode.DEPOSIT_INVALID_AMOUNT
 * @httpStatus 400
 */
export class InvalidDepositAmountException extends DepositException {
  constructor(amount: string | number, reason?: string) {
    const message = reason
      ? `Invalid deposit amount: ${amount}. ${reason}`
      : `Invalid deposit amount: ${amount}`;
    super(message, MessageCode.DEPOSIT_INVALID_AMOUNT, HttpStatus.BAD_REQUEST);
    this.name = 'InvalidDepositAmountException';
  }
}

/**
 * 입금 금액이 최소 금액보다 작을 때 발생하는 예외
 *
 * @errorCode MessageCode.DEPOSIT_AMOUNT_BELOW_MINIMUM
 * @httpStatus 400
 */
export class DepositAmountBelowMinimumException extends DepositException {
  constructor(amount: string | number, minimumAmount: string | number) {
    super(
      `Deposit amount below minimum: amount=${amount}, minimumAmount=${minimumAmount}`,
      MessageCode.DEPOSIT_AMOUNT_BELOW_MINIMUM,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'DepositAmountBelowMinimumException';
  }
}

/**
 * 입금 금액이 최대 금액을 초과할 때 발생하는 예외
 *
 * @errorCode MessageCode.DEPOSIT_AMOUNT_EXCEEDS_MAXIMUM
 * @httpStatus 400
 */
export class DepositAmountExceedsMaximumException extends DepositException {
  constructor(amount: string | number, maximumAmount: string | number) {
    super(
      `Deposit amount exceeds maximum: amount=${amount}, maximumAmount=${maximumAmount}`,
      MessageCode.DEPOSIT_AMOUNT_EXCEEDS_MAXIMUM,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'DepositAmountExceedsMaximumException';
  }
}


/**
 * 선택한 프로모션이 유효하지 않을 때 발생하는 예외
 *
 * @errorCode MessageCode.PROMOTION_NOT_FOUND
 * @httpStatus 400
 */
export class InvalidPromotionSelectionException extends DepositException {
  constructor() {
    super(
      'The selected promotion is invalid or ineligible',
      MessageCode.PROMOTION_NOT_FOUND,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InvalidPromotionSelectionException';
  }
}
/**
 * 입금 신청 요구조건을 충족하지 못했을 때 발생하는 예외 (예: 본인인증 미비 등)
 *
 * @errorCode MessageCode.VALIDATION_ERROR
 * @httpStatus 400
 */
export class DepositRequirementNotMetException extends DepositException {
  constructor(
    reason: string,
    errorCode: MessageCode = MessageCode.VALIDATION_ERROR,
  ) {
    super(reason, errorCode, HttpStatus.BAD_REQUEST);
    this.name = 'DepositRequirementNotMetException';
  }
}

/**
 * 활성화된 유저가 아닐 때 발생하는 예외
 */
export class UserStatusNotActiveException extends DepositRequirementNotMetException {
  constructor(status: string) {
    super(
      `User status is not active: ${status}. Only ACTIVE users can make deposits.`,
      MessageCode.AUTH_ACCOUNT_INACTIVE,
    );
    this.name = 'UserStatusNotActiveException';
  }
}

/**
 * 이메일 인증이 완료되지 않았을 때 발생하는 예외
 */
export class EmailNotVerifiedException extends DepositRequirementNotMetException {
  constructor() {
    super(
      'Email verification is required for this deposit method.',
      MessageCode.EMAIL_VERIFICATION_REQUIRED,
    );
    this.name = 'EmailNotVerifiedException';
  }
}

/**
 * 휴대전화 인증이 완료되지 않았을 때 발생하는 예외
 */
export class PhoneNotVerifiedException extends DepositRequirementNotMetException {
  constructor() {
    super(
      'Phone verification is required for this deposit method.',
      MessageCode.PHONE_VERIFICATION_REQUIRED,
    );
    this.name = 'PhoneNotVerifiedException';
  }
}

/**
 * 본인인증(KYC)이 완료되지 않았을 때 발생하는 예외
 */
export class IdentityNotVerifiedException extends DepositRequirementNotMetException {
  constructor() {
    super(
      'Identity verification (KYC) is required for this deposit method.',
      MessageCode.IDENTITY_VERIFICATION_REQUIRED,
    );
    this.name = 'IdentityNotVerifiedException';
  }
}

/**
 * 승인되지 않은 입금 처리 액션일 때 발생하는 예외 (예: 일반 사용자가 수동 입금 처리를 시도할 때)
 */
export class DepositUnauthorizedActionException extends DepositException {
  constructor() {
    super(
      'Unauthorized action on deposit processing',
      MessageCode.DEPOSIT_UNAUTHORIZED_ACTION,
      HttpStatus.FORBIDDEN,
    );
    this.name = 'DepositUnauthorizedActionException';
  }
}

/**
 * 피아트 입금이 승인/거절 전 PROCESSING 상태가 아닐 때 발생하는 예외
 */
export class DepositFiatNotInProcessingException extends DepositException {
  constructor() {
    super(
      'Fiat deposits must be in PROCESSING state before approval or rejection',
      MessageCode.DEPOSIT_FIAT_NOT_IN_PROCESSING,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'DepositFiatNotInProcessingException';
  }
}

/**
 * 엔티티가 아직 저장(영속화)되지 않았을 때 발생하는 예외
 * (ID가 0n인 상태에서 비즈니스 로직 수행 시)
 */
export class DepositNotPersistedException extends DepositException {
  constructor(action: string) {
    super(
      `Cannot perform action '${action}': Deposit entity must be persisted first.`,
      MessageCode.DEPOSIT_ENTITY_NOT_PERSISTED,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    this.name = 'DepositNotPersistedException';
  }
}

/**
 * 엔티티가 이미 저장(영속화)되어 있어 생성이 불가능할 때 발생하는 예외
 */
export class DepositAlreadyPersistedException extends DepositException {
  constructor() {
    super(
      'Cannot create deposit: Entity is already persisted.',
      MessageCode.DEPOSIT_ENTITY_ALREADY_PERSISTED,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    this.name = 'DepositAlreadyPersistedException';
  }
}
