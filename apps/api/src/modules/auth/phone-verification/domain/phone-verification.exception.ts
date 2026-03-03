import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

export class PhoneVerificationException extends DomainException {
    constructor(
        message: string,
        errorCode: MessageCode = MessageCode.VALIDATION_ERROR,
        httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
    ) {
        super(message, errorCode, httpStatus);
        this.name = 'PhoneVerificationException';
    }
}

export class VerificationCodeExpiredException extends PhoneVerificationException {
    constructor() {
        super(
            'Verification code has expired',
            MessageCode.VALIDATION_ERROR,
            HttpStatus.BAD_REQUEST,
        );
        this.name = 'VerificationCodeExpiredException';
    }
}

export class InvalidVerificationCodeException extends PhoneVerificationException {
    constructor() {
        super(
            'Invalid verification code',
            MessageCode.VALIDATION_ERROR,
            HttpStatus.BAD_REQUEST,
        );
        this.name = 'InvalidVerificationCodeException';
    }
}

export class VerificationTokenNotFoundException extends PhoneVerificationException {
    constructor() {
        super(
            'Verification request not found',
            MessageCode.VALIDATION_ERROR,
            HttpStatus.NOT_FOUND,
        );
        this.name = 'VerificationTokenNotFoundException';
    }
}

export class TooManyVerificationRequestsException extends PhoneVerificationException {
    constructor() {
        super(
            'Too many verification requests. Please try again later.',
            MessageCode.VALIDATION_ERROR,
            HttpStatus.TOO_MANY_REQUESTS,
        );
        this.name = 'TooManyVerificationRequestsException';
    }
}
