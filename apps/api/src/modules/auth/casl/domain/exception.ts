import { DomainException } from 'src/platform/exception/domain.exception';

/**
 * 권한 부족 예외
 */
export class InsufficientPermissionException extends DomainException {
  constructor(action: string, subject: string) {
    super(`Insufficient permission: cannot ${action} ${subject}`);
  }
}

