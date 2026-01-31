import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

export class TierProfileException extends DomainException {
    constructor(
        message: string,
        errorCode: MessageCode,
        httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
    ) {
        super(message, errorCode, httpStatus);
        this.name = 'TierProfileException';
    }
}

export class UserTierNotFoundException extends TierProfileException {
    constructor() {
        super(
            'User tier record not found',
            MessageCode.USER_TIER_NOT_FOUND,
            HttpStatus.NOT_FOUND,
        );
        this.name = 'UserTierNotFoundException';
    }
}
