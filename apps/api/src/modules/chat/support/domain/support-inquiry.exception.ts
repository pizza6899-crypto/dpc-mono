import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

export class SupportInquiryException extends DomainException {
    constructor(
        message: string,
        errorCode: MessageCode,
        httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
    ) {
        super(message, errorCode, httpStatus);
        this.name = 'SupportInquiryException';
    }
}

export class SupportInquiryStatusUpdateRestrictedException extends SupportInquiryException {
    constructor() {
        super(
            'Cannot update status to CLOSED via this endpoint. Please use the dedicated close endpoint.',
            MessageCode.CHAT_SUPPORT_INVALID_ACTION,
            HttpStatus.BAD_REQUEST,
        );
        this.name = 'SupportInquiryStatusUpdateRestrictedException';
    }
}
