import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

export class ChatRoomException extends DomainException {
    constructor(
        message: string,
        errorCode: MessageCode,
        httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
    ) {
        super(message, errorCode, httpStatus);
        this.name = 'ChatRoomException';
    }
}

export class ChatRoomNotFoundException extends ChatRoomException {
    constructor() {
        super(
            'Chat room not found',
            MessageCode.CHAT_ROOM_NOT_FOUND,
            HttpStatus.NOT_FOUND,
        );
        this.name = 'ChatRoomNotFoundException';
    }
}

export class ChatRoomUnauthorizedException extends ChatRoomException {
    constructor() {
        super(
            'You are not authorized to access this chat room',
            MessageCode.CHAT_UNAUTHORIZED,
            HttpStatus.FORBIDDEN,
        );
        this.name = 'ChatRoomUnauthorizedException';
    }
}
