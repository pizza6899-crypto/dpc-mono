import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

export class WageringRequirementException extends DomainException {
    constructor(
        message: string,
        errorCode: MessageCode = MessageCode.VALIDATION_ERROR,
        httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
    ) {
        super(message, errorCode, httpStatus);
        this.name = 'WageringRequirementException';
    }
}

export class WageringRequirementNotFoundException extends WageringRequirementException {
    constructor() {
        super(
            'Wagering requirement not found',
            MessageCode.WAGERING_NOT_FOUND,
            HttpStatus.NOT_FOUND,
        );
        this.name = 'WageringRequirementNotFoundException';
    }
}

export class InvalidWageringStatusException extends WageringRequirementException {
    constructor(reason: string) {
        super(
            `Invalid wagering status: ${reason}`,
            MessageCode.WAGERING_INVALID_STATUS,
            HttpStatus.BAD_REQUEST,
        );
        this.name = 'InvalidWageringStatusException';
    }
}
