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
  constructor(id: bigint | string) {
    const idStr = typeof id === 'bigint' ? id.toString() : id;
    super(
      `Deposit not found: id=${idStr}`,
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
  constructor(id: bigint | string, currentStatus: string) {
    const idStr = typeof id === 'bigint' ? id.toString() : id;
    super(
      `Deposit already processed: id=${idStr}, currentStatus=${currentStatus}`,
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
  constructor(userId: bigint | string) {
    const idStr = typeof userId === 'bigint' ? userId.toString() : userId;
    super(
      `Pending deposit request already exists for user: ${idStr}`,
      MessageCode.DEPOSIT_REQUEST_ALREADY_EXISTS,
      HttpStatus.CONFLICT,
    );
    this.name = 'PendingDepositExistsException';
  }
}

/**
 * Deposit 상태가 유효하지 않을 때 발생하는 예외
 *
 * @errorCode MessageCode.DEPOSIT_INVALID_STATUS
 * @httpStatus 400
 */
export class InvalidDepositStatusException extends DepositException {
  constructor(
    id: bigint | string,
    currentStatus: string,
    expectedStatuses: string[],
  ) {
    const idStr = typeof id === 'bigint' ? id.toString() : id;
    super(
      `Invalid deposit status: id=${idStr}, currentStatus=${currentStatus}, expectedStatuses=[${expectedStatuses.join(', ')}]`,
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
  constructor(promotionId: bigint | string | number) {
    const idStr = promotionId.toString();
    super(
      `Invalid or ineligible promotion selected: ${idStr}`,
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
  constructor(reason: string) {
    super(reason, MessageCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST);
    this.name = 'DepositRequirementNotMetException';
  }
}
