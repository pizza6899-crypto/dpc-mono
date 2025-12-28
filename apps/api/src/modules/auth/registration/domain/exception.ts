import { DomainException } from 'src/platform/exception/domain.exception';

/**
 * 이메일 중복 예외
 */
export class DuplicateEmailException extends DomainException {
  constructor(email: string) {
    super(`Email already exists: ${email}`);
  }
}

/**
 * 소셜 계정 중복 예외
 */
export class DuplicateSocialAccountException extends DomainException {
  constructor(socialId: string, socialType: string) {
    super(`Social account already exists: ${socialType} (${socialId})`);
  }
}

/**
 * 회원가입 실패 예외
 */
export class RegistrationFailedException extends DomainException {
  constructor(reason: string) {
    super(`Registration failed: ${reason}`);
  }
}
