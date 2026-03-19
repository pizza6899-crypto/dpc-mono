import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

export class WageringConfigException extends DomainException {
  constructor(
    message: string,
    errorCode: MessageCode = MessageCode.VALIDATION_ERROR,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, errorCode, httpStatus);
    this.name = 'WageringConfigException';
  }
}

export class InvalidWageringConfigException extends WageringConfigException {
  constructor(reason: string) {
    super(
      `Invalid wagering configuration: ${reason}`,
      MessageCode.WAGERING_CONFIG_INVALID,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InvalidWageringConfigException';
  }
}

export class WageringConfigNegativeValueException extends WageringConfigException {
  constructor(field: string) {
    super(
      `${field} cannot be negative`,
      MessageCode.WAGERING_CONFIG_NEGATIVE_VALUE,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'WageringConfigNegativeValueException';
  }
}

export class WageringConfigMinGTMaxException extends WageringConfigException {
  constructor() {
    super(
      'Minimum bet amount cannot be greater than maximum bet amount',
      MessageCode.WAGERING_CONFIG_MIN_GT_MAX,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'WageringConfigMinGTMaxException';
  }
}

export class WageringConfigInvalidNumberFormatException extends WageringConfigException {
  constructor() {
    super(
      'Currency setting values must be a valid number',
      MessageCode.WAGERING_CONFIG_INVALID_NUMBER_FORMAT,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'WageringConfigInvalidNumberFormatException';
  }
}

export class WageringConfigNotFoundException extends WageringConfigException {
  constructor() {
    super(
      'Global wagering configuration not found. Please run seeders.',
      MessageCode.WAGERING_CONFIG_NOT_FOUND,
      HttpStatus.INTERNAL_SERVER_ERROR, // 시스템 필수 데이터 부재는 서버 에러로 간주
    );
    this.name = 'WageringConfigNotFoundException';
  }
}
