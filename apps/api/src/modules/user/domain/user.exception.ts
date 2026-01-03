import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

/**
 * User 도메인 예외 기본 클래스
 */
export class UserException extends DomainException {
  constructor(
    message: string,
    errorCode: MessageCode = MessageCode.VALIDATION_ERROR,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, errorCode, httpStatus);
    this.name = 'UserException';
  }
}

/**
 * User를 찾을 수 없을 때 발생하는 예외
 */
export class UserNotFoundException extends UserException {
  constructor(identifier: string | bigint) {
    const id = typeof identifier === 'bigint' ? identifier.toString() : identifier;
    super(`User not found: ${id}`, MessageCode.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    this.name = 'UserNotFoundException';
  }
}

/**
 * User가 이미 존재할 때 발생하는 예외
 */
export class UserAlreadyExistsException extends UserException {
  constructor(email: string) {
    super(`User already exists: ${email}`, MessageCode.USER_ALREADY_EXISTS, HttpStatus.BAD_REQUEST);
    this.name = 'UserAlreadyExistsException';
  }
}

