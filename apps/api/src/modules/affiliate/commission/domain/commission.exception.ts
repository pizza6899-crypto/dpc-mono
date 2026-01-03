// src/modules/affiliate/commission/domain/commission.exception.ts

import { HttpStatus } from '@nestjs/common';
import { MessageCode } from '@repo/shared';
import { DomainException } from 'src/common/exception/domain.exception';

/**
 * 커미션 도메인 예외 기본 클래스
 */
export class CommissionException extends DomainException {
  constructor(
    message: string,
    errorCode: MessageCode = MessageCode.VALIDATION_ERROR,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, errorCode, httpStatus);
    this.name = 'CommissionException';
  }
}

/**
 * 커미션 요율이 유효하지 않은 경우
 */
export class InvalidCommissionRateException extends CommissionException {
  constructor(rate: bigint) {
    super(
      `Invalid commission rate: ${rate}. Rate must be between 1 and 10000 (0.01% - 100%)`,
      MessageCode.COMMISSION_INVALID_RATE,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InvalidCommissionRateException';
  }
}

/**
 * 잔액이 부족한 경우
 */
export class InsufficientBalanceException extends CommissionException {
  constructor(availableBalance: bigint, requestedAmount: bigint) {
    super(
      `Insufficient balance. Available: ${availableBalance}, Requested: ${requestedAmount}`,
      MessageCode.COMMISSION_INSUFFICIENT_BALANCE,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InsufficientBalanceException';
  }
}

/**
 * 커미션을 찾을 수 없는 경우
 */
export class CommissionNotFoundException extends CommissionException {
  constructor(commissionId: string | bigint) {
    super(
      `Commission not found: ${commissionId}`,
      MessageCode.COMMISSION_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'CommissionNotFoundException';
  }
}

/**
 * 커미션이 사용 불가능한 상태인 경우
 */
export class CommissionNotAvailableException extends CommissionException {
  constructor(message: string) {
    super(
      message,
      MessageCode.COMMISSION_NOT_AVAILABLE,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'CommissionNotAvailableException';
  }
}

/**
 * 월렛을 찾을 수 없는 경우
 */
export class WalletNotFoundException extends CommissionException {
  constructor(affiliateId: bigint, currency: string) {
    super(
      `Wallet not found for affiliate: ${affiliateId}, currency: ${currency}`,
      MessageCode.COMMISSION_WALLET_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'WalletNotFoundException';
  }
}

/**
 * 티어를 찾을 수 없는 경우
 */
export class TierNotFoundException extends CommissionException {
  constructor(affiliateId: bigint) {
    super(
      `Tier not found for affiliate: ${affiliateId}`,
      MessageCode.COMMISSION_TIER_NOT_FOUND,
      HttpStatus.NOT_FOUND,
    );
    this.name = 'TierNotFoundException';
  }
}

/**
 * 커미션 계산이 올바르지 않은 경우
 */
export class InvalidCommissionCalculationException extends CommissionException {
  constructor(
    wagerAmount: string,
    rateApplied: string,
    expectedCommission: string,
    actualCommission: string,
  ) {
    super(
      `Invalid commission calculation. wagerAmount: ${wagerAmount}, rateApplied: ${rateApplied}, expected: ${expectedCommission}, actual: ${actualCommission}`,
      MessageCode.COMMISSION_INVALID_CALCULATION,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InvalidCommissionCalculationException';
  }
}

/**
 * 정산일이 생성일보다 이전인 경우
 */
export class InvalidSettlementDateException extends CommissionException {
  constructor(settlementDate: Date, createdAt: Date) {
    super(
      `Settlement date (${settlementDate.toISOString()}) cannot be before creation date (${createdAt.toISOString()})`,
      MessageCode.COMMISSION_INVALID_SETTLEMENT_DATE,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InvalidSettlementDateException';
  }
}

/**
 * 월렛 잔액이 유효하지 않은 경우
 */
export class InvalidWalletBalanceException extends CommissionException {
  constructor(message: string) {
    super(
      message,
      MessageCode.COMMISSION_INVALID_WALLET_BALANCE,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InvalidWalletBalanceException';
  }
}

/**
 * 파라미터가 유효하지 않은 경우
 */
export class InvalidParameterException extends CommissionException {
  constructor(message: string) {
    super(
      message,
      MessageCode.COMMISSION_INVALID_PARAMETER,
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'InvalidParameterException';
  }
}
