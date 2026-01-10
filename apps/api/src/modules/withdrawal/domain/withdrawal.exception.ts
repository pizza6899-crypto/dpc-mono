import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

/**
 * Withdrawal 도메인 예외 기본 클래스
 */
export class WithdrawalException extends DomainException {
    constructor(
        message: string,
        errorCode: MessageCode = MessageCode.VALIDATION_ERROR,
        httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
    ) {
        super(message, errorCode, httpStatus);
        this.name = 'WithdrawalException';
    }
}

/**
 * Withdrawal을 찾을 수 없을 때 발생하는 예외
 */
export class WithdrawalNotFoundException extends WithdrawalException {
    constructor(identifier: bigint | string) {
        super(
            `Withdrawal not found: ${identifier}`,
            MessageCode.WITHDRAWAL_NOT_FOUND,
            HttpStatus.NOT_FOUND,
        );
        this.name = 'WithdrawalNotFoundException';
    }
}

/**
 * Withdrawal 상태가 유효하지 않을 때 발생하는 예외
 */
export class InvalidWithdrawalStatusException extends WithdrawalException {
    constructor(
        identifier: bigint | string,
        currentStatus: string,
        expectedStatuses: string[],
    ) {
        super(
            `Invalid withdrawal status: id=${identifier}, currentStatus=${currentStatus}, expectedStatuses=[${expectedStatuses.join(', ')}]`,
            MessageCode.WITHDRAWAL_INVALID_STATUS,
            HttpStatus.BAD_REQUEST,
        );
        this.name = 'InvalidWithdrawalStatusException';
    }
}

/**
 * 출금 금액이 최소 금액보다 작을 때 발생하는 예외
 */
export class WithdrawalAmountBelowMinimumException extends WithdrawalException {
    constructor(amount: string | number, minimumAmount: string | number) {
        super(
            `Withdrawal amount below minimum: amount=${amount}, minimumAmount=${minimumAmount}`,
            MessageCode.WITHDRAWAL_AMOUNT_BELOW_MINIMUM,
            HttpStatus.BAD_REQUEST,
        );
        this.name = 'WithdrawalAmountBelowMinimumException';
    }
}

/**
 * 출금 금액이 최대 금액을 초과할 때 발생하는 예외
 */
export class WithdrawalAmountExceedsMaximumException extends WithdrawalException {
    constructor(amount: string | number, maximumAmount: string | number) {
        super(
            `Withdrawal amount exceeds maximum: amount=${amount}, maximumAmount=${maximumAmount}`,
            MessageCode.WITHDRAWAL_AMOUNT_EXCEEDS_MAXIMUM,
            HttpStatus.BAD_REQUEST,
        );
        this.name = 'WithdrawalAmountExceedsMaximumException';
    }
}

/**
 * 잔액이 부족할 때 발생하는 예외
 */
export class InsufficientBalanceException extends WithdrawalException {
    constructor(requestedAmount: string | number, availableBalance: string | number) {
        super(
            `Insufficient balance: requested=${requestedAmount}, available=${availableBalance}`,
            MessageCode.INSUFFICIENT_BALANCE,
            HttpStatus.BAD_REQUEST,
        );
        this.name = 'InsufficientBalanceException';
    }
}

/**
 * 롤링 조건이 완료되지 않았을 때 발생하는 예외
 */
export class WageringNotCompletedException extends WithdrawalException {
    constructor(userId: bigint | string) {
        super(
            `Wagering requirement not completed for user: ${userId}`,
            MessageCode.ROLLING_NOT_COMPLETED,
            HttpStatus.BAD_REQUEST,
        );
        this.name = 'WageringNotCompletedException';
    }
}

/**
 * 암호화폐 출금 설정을 찾을 수 없을 때 발생하는 예외
 */
export class CryptoWithdrawConfigNotFoundException extends WithdrawalException {
    constructor(identifier: string | bigint) {
        super(
            `Crypto withdraw config not found: ${identifier}`,
            MessageCode.CRYPTO_CONFIG_NOT_FOUND,
            HttpStatus.NOT_FOUND,
        );
        this.name = 'CryptoWithdrawConfigNotFoundException';
    }
}

/**
 * 암호화폐 출금 설정이 이미 존재할 때 발생하는 예외
 */
export class CryptoWithdrawConfigAlreadyExistsException extends WithdrawalException {
    constructor(symbol: string, network: string) {
        super(
            `Crypto withdraw config already exists for symbol=${symbol}, network=${network}`,
            MessageCode.VALIDATION_ERROR,
            HttpStatus.CONFLICT,
        );
        this.name = 'CryptoWithdrawConfigAlreadyExistsException';
    }
}

/**
 * 은행 출금 설정을 찾을 수 없을 때 발생하는 예외
 */
export class BankWithdrawConfigNotFoundException extends WithdrawalException {
    constructor(identifier: bigint | string) {
        super(
            `Bank withdraw config not found: ${identifier}`,
            MessageCode.BANK_CONFIG_NOT_FOUND,
            HttpStatus.NOT_FOUND,
        );
        this.name = 'BankWithdrawConfigNotFoundException';
    }
}

/**
 * 은행 출금 설정이 이미 존재할 때 발생하는 예외
 */
export class BankWithdrawConfigAlreadyExistsException extends WithdrawalException {
    constructor(currency: string, bankName: string) {
        super(
            `Bank withdraw config already exists for currency=${currency}, bankName=${bankName}`,
            MessageCode.VALIDATION_ERROR,
            HttpStatus.CONFLICT,
        );
        this.name = 'BankWithdrawConfigAlreadyExistsException';
    }
}

/**
 * 출금을 취소할 수 없는 상태일 때 발생하는 예외
 */
export class WithdrawalCannotBeCancelledException extends WithdrawalException {
    constructor(identifier: bigint | string, currentStatus: string) {
        super(
            `Withdrawal cannot be cancelled: id=${identifier}, status=${currentStatus}`,
            MessageCode.WITHDRAWAL_INVALID_STATUS,
            HttpStatus.BAD_REQUEST,
        );
        this.name = 'WithdrawalCannotBeCancelledException';
    }
}
