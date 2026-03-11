import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

export class CasinoGameSessionException extends DomainException {
  constructor(
    message: string,
    errorCode: MessageCode = MessageCode.VALIDATION_ERROR,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, errorCode, httpStatus);
    this.name = 'CasinoGameSessionException';
  }
}

export class CasinoGameSessionNotFoundException extends CasinoGameSessionException {
  constructor(token?: string) {
    super(
      token
        ? `Casino Game Session not found for token: ${token}`
        : 'Casino Game Session not found',
      MessageCode.CASINO_SESSION_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'CasinoGameSessionNotFoundException';
  }
}
