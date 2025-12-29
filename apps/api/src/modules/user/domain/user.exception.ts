// src/modules/user/domain/user.exception.ts

/**
 * User 도메인 예외 기본 클래스
 */
export class UserException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserException';
  }
}

/**
 * User를 찾을 수 없을 때 발생하는 예외
 */
export class UserNotFoundException extends UserException {
  constructor(identifier: string | bigint) {
    const id = typeof identifier === 'bigint' ? identifier.toString() : identifier;
    super(`User not found: ${id}`);
    this.name = 'UserNotFoundException';
  }
}

/**
 * User가 이미 존재할 때 발생하는 예외
 */
export class UserAlreadyExistsException extends UserException {
  constructor(email: string) {
    super(`User already exists: ${email}`);
    this.name = 'UserAlreadyExistsException';
  }
}

