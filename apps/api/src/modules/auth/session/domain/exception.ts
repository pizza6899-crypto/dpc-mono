import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

/**
 * Session 도메인 예외 base 클래스
 */
export class SessionException extends DomainException {
  constructor(
    message: string,
    errorCode: MessageCode = MessageCode.VALIDATION_ERROR,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, errorCode, httpStatus);
    this.name = 'SessionException';
  }
}

/**
 * 다중 로그인 제한 예외
 */
export class MultipleLoginNotAllowedException extends SessionException {
  constructor(public readonly existingSessionCount: number, message?: string) {
    super(
      message ??
      `Multiple login is not allowed. You have ${existingSessionCount} active session(s).`,
      MessageCode.AUTH_MULTIPLE_LOGIN_NOT_ALLOWED,
      HttpStatus.FORBIDDEN,
    );
    this.name = 'MultipleLoginNotAllowedException';
  }
}

/**
 * 세션을 찾을 수 없을 때 발생하는 예외
 */
export class SessionNotFoundException extends SessionException {
  constructor(public readonly sessionId: string) {
    super(
      `Session not found: ${sessionId}`,
      MessageCode.AUTH_SESSION_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'SessionNotFoundException';
  }
}

/**
 * 세션 소유자가 아닐 때 발생하는 예외
 */
export class SessionOwnershipException extends SessionException {
  constructor(public readonly sessionId: string, public readonly userId: bigint) {
    super(
      `User ${userId} does not own session ${sessionId}`,
      MessageCode.AUTH_SESSION_NOT_OWNER,
      HttpStatus.FORBIDDEN,
    );
    this.name = 'SessionOwnershipException';
  }
}

