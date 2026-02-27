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
    const id =
      typeof identifier === 'bigint' ? identifier.toString() : identifier;
    super(
      `User not found: ${id}`,
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
  constructor(email: string) {
    super(
      `Email already in use: ${email}`,
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
  constructor(loginId: string) {
    super(
      `Login ID already in use: ${loginId}`,
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
  constructor(nickname: string) {
    super(
      `Nickname already in use: ${nickname}`,
      MessageCode.USER_ALREADY_EXISTS,
      HttpStatus.CONFLICT,
    );
    this.name = 'DuplicateNicknameException';
  }
}

/**
 * 휴대폰 번호가 이미 존재할 때 발생하는 예외
 */
export class DuplicatePhoneNumberException extends UserException {
  constructor(phoneNumber: string) {
    super(
      `Phone number already in use: ${phoneNumber}`,
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
      `Social account already linked.`,
      MessageCode.USER_ALREADY_EXISTS,
      HttpStatus.CONFLICT,
    );
    this.name = 'DuplicateOAuthIdException';
  }
}


