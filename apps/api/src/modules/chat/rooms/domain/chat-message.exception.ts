import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { ChatRoomException } from './chat-room.exception';

export class ChatMessageNotFoundException extends ChatRoomException {
    constructor() {
        super(
            'Chat message not found / 메시지를 찾을 수 없습니다.',
            MessageCode.CHAT_MESSAGE_NOT_FOUND,
            HttpStatus.NOT_FOUND,
        );
        this.name = 'ChatMessageNotFoundException';
    }
}

export class ChatMessageForbiddenException extends ChatRoomException {
    constructor() {
        super(
            'You do not have permission to modify this message / 메시지를 수정할 권한이 없습니다.',
            MessageCode.CHAT_UNAUTHORIZED,
            HttpStatus.FORBIDDEN,
        );
        this.name = 'ChatMessageForbiddenException';
    }
}
