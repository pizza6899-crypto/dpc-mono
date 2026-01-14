import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

export class PromotionException extends DomainException {
  constructor(
    message: string,
    errorCode: MessageCode = MessageCode.VALIDATION_ERROR,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, errorCode, httpStatus);
    this.name = 'PromotionException';
  }
}

export class PromotionNotFoundException extends PromotionException {
  constructor(identifier?: bigint | string) {
    super(
      identifier ? `Promotion '${identifier}' not found` : 'Promotion not found',
      MessageCode.PROMOTION_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'PromotionNotFoundException';
  }
}

export class PromotionNotActiveException extends PromotionException {
  constructor(identifier: bigint | string) {
    super(
      `Promotion '${identifier}' is not active`,
      MessageCode.PROMOTION_NOT_ACTIVE,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'PromotionNotActiveException';
  }
}

export class PromotionNotEligibleException extends PromotionException {
  constructor(reason: string) {
    super(
      `Promotion not eligible: ${reason}`,
      MessageCode.PROMOTION_NOT_ELIGIBLE,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'PromotionNotEligibleException';
  }
}

export class PromotionAlreadyUsedException extends PromotionException {
  constructor(identifier: bigint | string) {
    super(
      `Promotion '${identifier}' has already been used`,
      MessageCode.PROMOTION_ALREADY_USED,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'PromotionAlreadyUsedException';
  }
}


export class UserPromotionNotFoundException extends PromotionException {
  constructor(id?: bigint) {
    super(
      id ? `User promotion '${id}' not found` : 'User promotion not found',
      MessageCode.PROMOTION_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'UserPromotionNotFoundException';
  }
}

export class PromotionCodeAlreadyExistsException extends PromotionException {
  constructor(code: string) {
    super(
      `Promotion code '${code}' already exists`,
      MessageCode.VALIDATION_ERROR,
      HttpStatus.CONFLICT,
    );
    this.name = 'PromotionCodeAlreadyExistsException';
  }
}

export class PromotionInvalidConfigurationException extends PromotionException {
  constructor(reason: string) {
    super(
      `Invalid promotion configuration: ${reason}`,
      MessageCode.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'PromotionInvalidConfigurationException';
  }
}
