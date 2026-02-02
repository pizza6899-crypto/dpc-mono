import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

export class WageringConfigException extends DomainException {
    constructor(
        message: string,
        errorCode: MessageCode = MessageCode.VALIDATION_ERROR,
        httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
    ) {
        super(message, errorCode, httpStatus);
        this.name = 'WageringConfigException';
    }
}

export class InvalidWageringConfigException extends WageringConfigException {
    constructor(reason: string) {
        super(
            `Invalid wagering config: ${reason}`,
            MessageCode.VALIDATION_ERROR,
            HttpStatus.BAD_REQUEST,
        );
        this.name = 'InvalidWageringConfigException';
    }
}

export class WageringConfigNotFoundException extends WageringConfigException {
    constructor() {
        super(
            'Global wagering configuration not found. Please run seeders.',
            MessageCode.WAGERING_NOT_FOUND,
            HttpStatus.INTERNAL_SERVER_ERROR, // 시스템 필수 데이터 부재는 서버 에러로 간주
        );
        this.name = 'WageringConfigNotFoundException';
    }
}
