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
  constructor() {
    super(
      'Promotion not found',
      MessageCode.PROMOTION_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'PromotionNotFoundException';
  }
}

export class PromotionNotActiveException extends PromotionException {
  constructor() {
    super(
      'Promotion is not active',
      MessageCode.PROMOTION_NOT_ACTIVE,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'PromotionNotActiveException';
  }
}

export class PromotionNotEligibleException extends PromotionException {
  constructor(reason?: string) {
    super(
      reason ? `Promotion not eligible: ${reason}` : 'Promotion not eligible',
      MessageCode.PROMOTION_NOT_ELIGIBLE,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'PromotionNotEligibleException';
  }
}

export class PromotionAlreadyUsedException extends PromotionException {
  constructor() {
    super(
      'Promotion has already been used',
      MessageCode.PROMOTION_ALREADY_USED,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'PromotionAlreadyUsedException';
  }
}

export class PromotionUsageLimitExceededException extends PromotionException {
  constructor() {
    super(
      'Promotion usage limit has been exceeded',
      MessageCode.PROMOTION_ALREADY_USED, // 사용 가능한 적절한 코드가 없으면 근사한 것 사용
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'PromotionUsageLimitExceededException';
  }
}

export class PromotionBonusLimitExceededException extends PromotionException {
  constructor() {
    super(
      'Bonus amount exceeds the maximum limit',
      MessageCode.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'PromotionBonusLimitExceededException';
  }
}

export class UserPromotionNotFoundException extends PromotionException {
  constructor() {
    super(
      'User promotion not found',
      MessageCode.PROMOTION_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'UserPromotionNotFoundException';
  }
}

export class PromotionCodeAlreadyExistsException extends PromotionException {
  constructor() {
    super(
      'Promotion code already exists',
      MessageCode.VALIDATION_ERROR,
      HttpStatus.CONFLICT,
    );
    this.name = 'PromotionCodeAlreadyExistsException';
  }
}

export class PromotionInvalidConfigurationException extends PromotionException {
  constructor(reason?: string) {
    super(
      reason ? `Invalid promotion configuration: ${reason}` : 'Invalid promotion configuration',
      MessageCode.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'PromotionInvalidConfigurationException';
  }
}
