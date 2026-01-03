import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

/**
 * Wallet 도메인 예외 기본 클래스
 */
export class WalletException extends DomainException {
  constructor(
    message: string,
    errorCode: MessageCode = MessageCode.VALIDATION_ERROR,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, errorCode, httpStatus);
    this.name = 'WalletException';
  }
}

/**
 * Wallet을 찾을 수 없을 때 발생하는 예외
 */
export class WalletNotFoundException extends WalletException {
  constructor(userId: bigint, currency: string) {
    super(
      `Wallet not found: userId=${userId}, currency=${currency}`,
      MessageCode.USER_BALANCE_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'WalletNotFoundException';
  }
}

/**
 * Wallet 잔액이 유효하지 않은 경우
 */
export class InvalidWalletBalanceException extends WalletException {
  constructor(message: string) {
    super(message, MessageCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST);
    this.name = 'InvalidWalletBalanceException';
  }
}

/**
 * 잔액이 부족한 경우
 */
export class InsufficientBalanceException extends WalletException {
  constructor(availableBalance: string, requestedAmount: string) {
    super(
      `Insufficient balance. Available: ${availableBalance}, Requested: ${requestedAmount}`,
      MessageCode.VALIDATION_ERROR, // Could use a more specific one if exists
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InsufficientBalanceException';
  }
}

