import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

export class ChatConfigException extends DomainException {
    constructor(
        message: string,
        errorCode: MessageCode,
        httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
    ) {
        super(message, errorCode, httpStatus);
        this.name = 'ChatConfigException';
    }
}

export class ChatConfigNotFoundException extends ChatConfigException {
    constructor() {
        super(
            'Chat configuration not found',
            MessageCode.CHAT_CONFIG_NOT_FOUND,
            HttpStatus.NOT_FOUND,
        );
        this.name = 'ChatConfigNotFoundException';
    }
}
