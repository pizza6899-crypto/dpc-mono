import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from '../../../common/exception/domain.exception';

export class TierException extends DomainException {
    constructor(
        message: string,
        errorCode: MessageCode = MessageCode.VALIDATION_ERROR,
        httpStatus: HttpStatus = HttpStatus.BAD_REQUEST
    ) {
        super(message, errorCode, httpStatus);
    }
}

export class TierNotFoundException extends TierException {
    constructor(identifier: string | bigint | number) {
        super(
            `Tier not found: ${identifier}`,
            MessageCode.TIER_NOT_FOUND,
            HttpStatus.NOT_FOUND
        );
    }
}

export class UserTierNotFoundException extends TierException {
    constructor(identifier: string | bigint | number) {
        super(
            `User tier not found for: ${identifier}`,
            MessageCode.USER_TIER_NOT_FOUND,
            HttpStatus.NOT_FOUND
        );
    }
}

export class InvalidRollingAmountException extends TierException {
    constructor(amount: string) {
        super(
            `Invalid rolling amount: ${amount}`,
            MessageCode.TIER_INVALID_ROLLING_AMOUNT,
            HttpStatus.BAD_REQUEST
        );
    }
}
