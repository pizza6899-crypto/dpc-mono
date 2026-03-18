import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

export class CouponConfigException extends DomainException {
  constructor(
    message: string,
    errorCode: MessageCode = MessageCode.VALIDATION_ERROR,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, errorCode, httpStatus);
    this.name = 'CouponConfigException';
  }
}

export class InvalidCouponConfigException extends CouponConfigException {
  constructor(reason: string) {
    super(
      `Invalid coupon configuration: ${reason}`,
      MessageCode.COUPON_CONFIG_INVALID,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InvalidCouponConfigException';
  }
}

export class CouponConfigNegativeValueException extends CouponConfigException {
  constructor(field: string) {
    super(
      `${field} cannot be negative`,
      MessageCode.COUPON_CONFIG_NEGATIVE_VALUE,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'CouponConfigNegativeValueException';
  }
}

export class CouponConfigNotFoundException extends CouponConfigException {
  constructor() {
    super(
      'Global coupon configuration not found. Please run seeders.',
      MessageCode.COUPON_CONFIG_NOT_FOUND,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    this.name = 'CouponConfigNotFoundException';
  }
}
