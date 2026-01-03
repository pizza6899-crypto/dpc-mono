import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

/**
 * 권한 부족 예외
 */
export class InsufficientPermissionException extends DomainException {
  constructor(action: string, subject: string) {
    super(
      `Insufficient permission: cannot ${action} ${subject}`,
      MessageCode.AUTH_INSUFFICIENT_PERMISSIONS,
      HttpStatus.FORBIDDEN,
    );
    this.name = 'InsufficientPermissionException';
  }
}

