import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

/**
 * 유효하지 않은 Sqid 형식이거나 접두사가 일치하지 않을 때 발생하는 예외
 */
export class InvalidSqidFormatException extends DomainException {
  constructor(sqid: string, prefix?: string) {
    super(
      `Invalid identifier format${prefix ? ` (expected prefix: ${prefix})` : ''}`,
      MessageCode.SQID_INVALID_FORMAT,
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * 인코딩할 ID가 유효하지 않을 때(0 이하) 발생하는 예외
 */
export class InvalidSqidIdException extends DomainException {
  constructor(id: bigint | number) {
    super(
      `ID must be a positive integer (greater than 0): ${id}`,
      MessageCode.SQID_INVALID_ID,
      HttpStatus.BAD_REQUEST,
    );
  }
}
