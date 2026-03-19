import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

export class WageringRequirementException extends DomainException {
  constructor(
    message: string,
    errorCode: MessageCode = MessageCode.VALIDATION_ERROR,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, errorCode, httpStatus);
    this.name = 'WageringRequirementException';
  }
}

export class WageringRequirementNotFoundException extends WageringRequirementException {
  constructor() {
    super(
      'Wagering requirement not found',
      MessageCode.WAGERING_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'WageringRequirementNotFoundException';
  }
}

export class InvalidWageringStatusException extends WageringRequirementException {
  constructor(reason: string) {
    super(
      `Invalid wagering status: ${reason}`,
      MessageCode.WAGERING_INVALID_STATUS,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InvalidWageringStatusException';
  }
}

export class WageringNotForfeitableException extends WageringRequirementException {
  constructor() {
    super(
      'This wagering requirement cannot be forfeited',
      MessageCode.WAGERING_NOT_FORFEITABLE,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'WageringNotForfeitableException';
  }
}

export class InvalidBaseAmountException extends WageringRequirementException {
  constructor() {
    super(
      'Base amount (Principal + Bonus) must be greater than zero.',
      MessageCode.WAGERING_INVALID_BASE_AMOUNT,
    );
    this.name = 'InvalidBaseAmountException';
  }
}

export class InvalidWageringMultiplierException extends WageringRequirementException {
  constructor() {
    super(
      'Multiplier cannot be negative.',
      MessageCode.WAGERING_INVALID_MULTIPLIER,
    );
    this.name = 'InvalidWageringMultiplierException';
  }
}

export class WageringExceedsLimitException extends WageringRequirementException {
  constructor(max: number) {
    super(
      `Wagering multiplier exceeds system limit (max ${max}x).`,
      MessageCode.WAGERING_EXCEEDS_LIMIT,
    );
    this.name = 'WageringExceedsLimitException';
  }
}

export class AlreadyCompletedWageringException extends WageringRequirementException {
  constructor() {
    super(
      'The wagering requirement is already completed.',
      MessageCode.WAGERING_ALREADY_COMPLETED,
    );
    this.name = 'AlreadyCompletedWageringException';
  }
}

export class AlreadyCancelledWageringException extends WageringRequirementException {
  constructor() {
    super(
      'The wagering requirement is already cancelled.',
      MessageCode.WAGERING_ALREADY_CANCELLED,
    );
    this.name = 'AlreadyCancelledWageringException';
  }
}

export class WageringRequirementExpiredException extends WageringRequirementException {
  constructor() {
    super(
      'The wagering requirement has expired.',
      MessageCode.WAGERING_EXPIRED,
    );
    this.name = 'WageringRequirementExpiredException';
  }
}

export class WageringRequirementPausedException extends WageringRequirementException {
  constructor() {
    super(
      'The wagering requirement is currently paused.',
      MessageCode.WAGERING_PAUSED,
    );
    this.name = 'WageringRequirementPausedException';
  }
}
