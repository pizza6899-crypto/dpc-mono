import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

export class CasinoException extends DomainException {
    constructor(message: string, errorCode: MessageCode, httpStatus: HttpStatus = HttpStatus.BAD_REQUEST) {
        super(message, errorCode, httpStatus);
    }
}

export class CurrencyUnsupportedException extends CasinoException {
    constructor(currency: string) {
        super(`Currency unsupported: ${currency}`, MessageCode.CURRENCY_UNSUPPORTED, HttpStatus.BAD_REQUEST);
    }
}
