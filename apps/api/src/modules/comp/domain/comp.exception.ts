import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

export class CompDomainException extends DomainException {
    constructor(
        message: string,
        errorCode: MessageCode = MessageCode.VALIDATION_ERROR,
        httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
    ) {
        super(message, errorCode, httpStatus);
    }
}

export class InsufficientCompBalanceException extends CompDomainException {
    constructor(userId: bigint, required: string, current: string) {
        super(
            `Insufficient comp balance for user ${userId}. Required: ${required}, Current: ${current}`,
            MessageCode.COMP_INSUFFICIENT_BALANCE,
            HttpStatus.BAD_REQUEST,
        );
    }
}

export class CompNotFoundException extends CompDomainException {
    constructor(userId: bigint, currency: string) {
        super(
            `Comp wallet not found for user ${userId} and currency ${currency}`,
            MessageCode.COMP_NOT_FOUND,
            HttpStatus.NOT_FOUND,
        );
    }
}

export class CompInvalidParameterException extends CompDomainException {
    constructor(message: string) {
        super(
            message,
            MessageCode.COMP_INVALID_PARAMETER,
            HttpStatus.BAD_REQUEST,
        );
    }
}

export class CompPolicyViolationException extends CompDomainException {
    constructor(message: string) {
        super(
            message,
            MessageCode.VALIDATION_ERROR,
            HttpStatus.FORBIDDEN,
        );
    }
}
