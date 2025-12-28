import { DomainException } from 'src/platform/exception/domain.exception';

/**
 * 로그인 실패 예외
 */
export class LoginFailedException extends DomainException {
  constructor(reason: string) {
    super(`Login failed: ${reason}`);
  }
}

/**
 * 계정 잠김 예외
 */
export class AccountLockedException extends DomainException {
  constructor(email: string) {
    super(`Account is locked for email: ${email}`);
  }
}

/**
 * 로그인 시도 기록을 찾을 수 없는 경우
 */
export class LoginAttemptNotFoundException extends DomainException {
  constructor(identifier: string | bigint) {
    super(`Login attempt not found: ${identifier}`);
  }
}
