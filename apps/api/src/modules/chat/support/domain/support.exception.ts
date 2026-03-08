import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

export class SupportException extends DomainException {
    constructor(
        message: string,
        errorCode: MessageCode,
        httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
    ) {
        super(message, errorCode, httpStatus);
        this.name = 'SupportException';
    }
}

export class SupportTicketNotFoundException extends SupportException {
    constructor() {
        super(
            'Support ticket not found',
            MessageCode.CHAT_TICKET_NOT_FOUND,
            HttpStatus.NOT_FOUND,
        );
        this.name = 'SupportTicketNotFoundException';
    }
}

export class SupportTicketUnauthorizedException extends SupportException {
    constructor() {
        super(
            'You are not authorized to access this support ticket',
            MessageCode.CHAT_UNAUTHORIZED,
            HttpStatus.FORBIDDEN,
        );
        this.name = 'SupportTicketUnauthorizedException';
    }
}
