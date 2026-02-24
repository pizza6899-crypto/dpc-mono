import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

export class CompDomainException extends DomainException {
  constructor(
    message: string,
    errorCode: MessageCode = MessageCode.VALIDATION_ERROR,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, errorCode, httpStatus);
    this.name = 'CompDomainException';
  }
}

export class InsufficientCompBalanceException extends CompDomainException {
  constructor(required: string, current: string) {
    super(
      `Insufficient comp balance. Required: ${required}, Current: ${current}`,
      MessageCode.COMP_INSUFFICIENT_BALANCE,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InsufficientCompBalanceException';
  }
}

export class CompNotFoundException extends CompDomainException {
  constructor() {
    super(
      `Comp wallet not found for the requested criteria.`,
      MessageCode.COMP_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'CompNotFoundException';
  }
}

export class CompInvalidParameterException extends CompDomainException {
  constructor(message: string) {
    super(message, MessageCode.COMP_INVALID_PARAMETER, HttpStatus.BAD_REQUEST);
    this.name = 'CompInvalidParameterException';
  }
}

export class CompPolicyViolationException extends CompDomainException {
  constructor(message: string) {
    super(message, MessageCode.COMP_POLICY_VIOLATION, HttpStatus.FORBIDDEN);
    this.name = 'CompPolicyViolationException';
  }
}
