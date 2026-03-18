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

export class InvalidCouponCodeException extends CouponException {
  constructor() {
    super(
      'Invalid coupon code format',
      MessageCode.COUPON_INVALID_CODE,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InvalidCouponCodeException';
  }
}

export class CouponExpiredException extends CouponException {
  constructor() {
    super(
      'Coupon has expired',
      MessageCode.COUPON_EXPIRED,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'CouponExpiredException';
  }
}

export class CouponExhaustedException extends CouponException {
  constructor() {
    super(
      'Coupon usage limit reached (exhausted)',
      MessageCode.COUPON_EXHAUSTED,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'CouponExhaustedException';
  }
}

export class CouponUserUsageExceededException extends CouponException {
  constructor() {
    super(
      'You have reached the maximum usage limit for this coupon',
      MessageCode.COUPON_USER_USAGE_EXCEEDED,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'CouponUserUsageExceededException';
  }
}

export class CouponUserNotAllowedException extends CouponException {
  constructor() {
    super(
      'You are not eligible to redeem this coupon',
      MessageCode.COUPON_ALLOWLIST_ONLY,
      HttpStatus.FORBIDDEN,
    );
    this.name = 'CouponUserNotAllowedException';
  }
}

export class CouponAlreadyUsedException extends CouponException {
  constructor() {
    super(
      'You have already redeemed this coupon',
      MessageCode.COUPON_ALREADY_USED,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'CouponAlreadyUsedException';
  }
}

export class CouponDailyAttemptExceededException extends CouponException {
  constructor() {
    super(
      'Daily coupon attempt limit exceeded. Please try again tomorrow.',
      MessageCode.COUPON_DAILY_ATTEMPT_EXCEEDED,
      HttpStatus.TOO_MANY_REQUESTS,
    );
    this.name = 'CouponDailyAttemptExceededException';
  }
}
