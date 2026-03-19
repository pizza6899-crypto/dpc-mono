import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

export class CouponException extends DomainException {
  constructor(
    message: string,
    errorCode: MessageCode = MessageCode.VALIDATION_ERROR,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, errorCode, httpStatus);
    this.name = 'CouponException';
  }
}

export class CouponNotFoundException extends CouponException {
  constructor() {
    super(
      'Coupon not found',
      MessageCode.COUPON_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'CouponNotFoundException';
  }
}

export class CouponInactiveException extends CouponException {
  constructor() {
    super('Coupon is inactive', MessageCode.COUPON_INACTIVE);
    this.name = 'CouponInactiveException';
  }
}

export class CouponNotStartedException extends CouponException {
  constructor() {
    super('Coupon has not started yet', MessageCode.COUPON_NOT_STARTED);
    this.name = 'CouponNotStartedException';
  }
}

export class CouponExpiredException extends CouponException {
  constructor() {
    super('Coupon has expired', MessageCode.COUPON_EXPIRED);
    this.name = 'CouponExpiredException';
  }
}

export class CouponExhaustedException extends CouponException {
  constructor() {
    super('Coupon usage limit reached', MessageCode.COUPON_EXHAUSTED);
    this.name = 'CouponExhaustedException';
  }
}

export class CouponVoidedException extends CouponException {
  constructor() {
    super('Coupon has been voided', MessageCode.COUPON_VOIDED);
    this.name = 'CouponVoidedException';
  }
}

export class CouponUserUsageExceededException extends CouponException {
  constructor() {
    super(
      'User has exceeded the usage limit for this coupon',
      MessageCode.COUPON_USER_USAGE_EXCEEDED,
    );
    this.name = 'CouponUserUsageExceededException';
  }
}

export class CouponAllowlistOnlyException extends CouponException {
  constructor() {
    super(
      'This coupon is restricted to specific users only',
      MessageCode.COUPON_ALLOWLIST_ONLY,
    );
    this.name = 'CouponAllowlistOnlyException';
  }
}

export class CouponAlreadyUsedException extends CouponException {
  constructor() {
    super('You have already used this coupon', MessageCode.COUPON_ALREADY_USED);
    this.name = 'CouponAlreadyUsedException';
  }
}
