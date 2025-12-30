import { DomainException } from 'src/common/exception/domain.exception';

/**
 * 로그인 실패 예외
 */
export class LoginFailedException extends DomainException {
  constructor(reason: string) {
    super(`Login failed: ${reason}`);
  }
}
