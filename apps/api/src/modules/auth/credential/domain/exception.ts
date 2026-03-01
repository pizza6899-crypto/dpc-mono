import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

/**
 * 로그인 실패 예외
 */
export class LoginFailedException extends DomainException {
  constructor(reason: string) {
    super(
      `Login failed: ${reason}`,
      MessageCode.AUTH_LOGIN_FAILED,
      HttpStatus.UNAUTHORIZED,
    );
    this.name = 'LoginFailedException';
  }
}

/**
 * 비밀번호 불일치 예외
 */
export class PasswordMismatchException extends DomainException {
  constructor() {
    super(
      'Password does not match',
      MessageCode.AUTH_PASSWORD_MISMATCH,
      HttpStatus.UNAUTHORIZED,
    );
    this.name = 'PasswordMismatchException';
  }
}

/**
 * 계정 잠김 예외
 */
export class AccountLockedException extends DomainException {
  constructor() {
    super(
      'Account is locked due to multiple failed login attempts',
      MessageCode.THROTTLE_TOO_MANY_REQUESTS,
      HttpStatus.TOO_MANY_REQUESTS,
    );
    this.name = 'AccountLockedException';
  }
}


/**
 * 권한 부족 예외
 */
export class InsufficientPermissionException extends DomainException {
  constructor() {
    super(
      'Insufficient permission to perform this action',
      MessageCode.AUTH_INSUFFICIENT_PERMISSIONS,
      HttpStatus.FORBIDDEN,
    );
    this.name = 'InsufficientPermissionException';
  }
}
