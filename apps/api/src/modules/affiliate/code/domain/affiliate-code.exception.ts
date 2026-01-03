import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

export class AffiliateCodeException extends DomainException {
  constructor(
    message: string,
    errorCode: MessageCode = MessageCode.VALIDATION_ERROR,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, errorCode, httpStatus);
    this.name = 'AffiliateCodeException';
  }
}

export class AffiliateCodeLimitExceededException extends AffiliateCodeException {
  constructor(maxCodes: number) {
    super(
      `Maximum ${maxCodes} codes allowed per user`,
      MessageCode.AFFILIATE_CODE_LIMIT_EXCEEDED,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'AffiliateCodeLimitExceededException';
  }
}

export class AffiliateCodeAlreadyExistsException extends AffiliateCodeException {
  constructor(info: string) {
    super(
      info.includes('exists') ? info : `Code '${info}' already exists`,
      MessageCode.AFFILIATE_CODE_ALREADY_EXISTS,
      HttpStatus.CONFLICT,
    );
    this.name = 'AffiliateCodeAlreadyExistsException';
  }
}

export class AffiliateCodeNotFoundException extends AffiliateCodeException {
  constructor(id?: string | bigint) {
    super(
      id ? `Affiliate code '${id}' not found` : 'Affiliate code not found',
      MessageCode.AFFILIATE_CODE_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'AffiliateCodeNotFoundException';
  }
}

export class AffiliateCodeCannotDeleteException extends AffiliateCodeException {
  constructor() {
    super(
      'Cannot delete the only default code',
      MessageCode.AFFILIATE_CODE_CANNOT_DELETE,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'AffiliateCodeCannotDeleteException';
  }
}

export class AffiliateCodeInvalidFormatException extends AffiliateCodeException {
  constructor(code: string) {
    super(
      `Invalid affiliate code format: ${code}`,
      MessageCode.AFFILIATE_CODE_INVALID_FORMAT,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'AffiliateCodeInvalidFormatException';
  }
}
