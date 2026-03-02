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
  constructor() {
    super(
      'User not found',
      MessageCode.USER_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'UserNotFoundException';
  }
}

/**
 * 이메일이 이미 존재할 때 발생하는 예외
 */
export class DuplicateEmailException extends UserException {
  constructor() {
    super(
      'Email already in use',
      MessageCode.USER_ALREADY_EXISTS,
      HttpStatus.CONFLICT,
    );
    this.name = 'DuplicateEmailException';
  }
}

/**
 * 로그인 ID가 이미 존재할 때 발생하는 예외
 */
export class DuplicateLoginIdException extends UserException {
  constructor() {
    super(
      'Login ID already in use',
      MessageCode.USER_ALREADY_EXISTS,
      HttpStatus.CONFLICT,
    );
    this.name = 'DuplicateLoginIdException';
  }
}

/**
 * 닉네임이 이미 존재할 때 발생하는 예외
 */
export class DuplicateNicknameException extends UserException {
  constructor() {
    super(
      'Nickname already in use',
      MessageCode.USER_ALREADY_EXISTS,
      HttpStatus.CONFLICT,
    );
    this.name = 'DuplicateNicknameException';
  }
}

/**
 * 닉네임이 현재와 동일할 때 발생하는 예외
 */
export class NicknameSameAsCurrentException extends UserException {
  constructor() {
    super(
      'New nickname must be different from the current one',
      MessageCode.NICKNAME_SAME_AS_CURRENT,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'NicknameSameAsCurrentException';
  }
}

/**
 * 닉네임 형식이 잘못되었을 때 발생하는 예외
 */
export class InvalidNicknameException extends UserException {
  constructor() {
    super(
      'Nickname format is invalid',
      MessageCode.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InvalidNicknameException';
  }
}

/**
 * 로그인 ID 형식이 잘못되었을 때 발생하는 예외
 */
export class InvalidLoginIdException extends UserException {
  constructor() {
    super(
      'Login ID format is invalid',
      MessageCode.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InvalidLoginIdException';
  }
}

/**
 * 휴대폰 번호가 이미 존재할 때 발생하는 예외
 */
export class DuplicatePhoneNumberException extends UserException {
  constructor() {
    super(
      'Phone number already in use',
      MessageCode.USER_ALREADY_EXISTS,
      HttpStatus.CONFLICT,
    );
    this.name = 'DuplicatePhoneNumberException';
  }
}

/**
 * 소셜 계정(OAuth)이 이미 연동되어 있을 때 발생하는 예외
 */
export class DuplicateOAuthIdException extends UserException {
  constructor() {
    super(
      'Social account already linked',
      MessageCode.USER_ALREADY_EXISTS,
      HttpStatus.CONFLICT,
    );
    this.name = 'DuplicateOAuthIdException';
  }
}

/**
 * 기존 비밀번호가 일치하지 않을 때 발생하는 예외
 */
export class IncorrectPasswordException extends UserException {
  constructor() {
    super(
      'Incorrect current password',
      MessageCode.AUTH_LOGIN_FAILED,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'IncorrectPasswordException';
  }
}

/**
 * 비밀번호 형식이 잘못되었을 때 발생하는 예외
 */
export class InvalidPasswordException extends UserException {
  constructor() {
    super(
      'Password format is invalid',
      MessageCode.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InvalidPasswordException';
  }
}

/**
 * 이미 종료된 계정일 때 발생하는 예외
 */
export class AccountAlreadyClosedException extends UserException {
  constructor() {
    super(
      'Account is already closed',
      MessageCode.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'AccountAlreadyClosedException';
  }
}

/**
 * 종료(CLOSED) 상태가 아닌 계정을 복구하려 할 때 발생하는 예외
 */
export class UserNotClosedException extends UserException {
  constructor() {
    super(
      'User is not in closed status',
      MessageCode.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'UserNotClosedException';
  }
}


