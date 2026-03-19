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

export class ChatRoomInactiveException extends ChatRoomException {
  constructor() {
    super(
      'Chat room is inactive',
      MessageCode.CHAT_ROOM_LOCKED,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'ChatRoomInactiveException';
  }
}

export class ChatRoomInsufficientTierException extends ChatRoomException {
  constructor(minTier: number) {
    super(
      `Minimum tier level ${minTier} is required to join this chat room`,
      MessageCode.CHAT_INSUFFICIENT_TIER,
      HttpStatus.FORBIDDEN,
    );
    this.name = 'ChatRoomInsufficientTierException';
  }
}

export class ChatRoomInvalidFileTypeException extends ChatRoomException {
  constructor() {
    super(
      'Only image files are allowed in chat',
      MessageCode.CHAT_INVALID_FILE_TYPE,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'ChatRoomInvalidFileTypeException';
  }
}
