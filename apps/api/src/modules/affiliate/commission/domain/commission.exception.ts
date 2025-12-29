// src/modules/affiliate/commission/domain/commission.exception.ts

/**
 * 커미션 도메인 예외 기본 클래스
 */
export class CommissionException extends Error {
  constructor(message: string) {
    super(message);
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
    );
    this.name = 'InsufficientBalanceException';
  }
}

/**
 * 커미션을 찾을 수 없는 경우
 */
export class CommissionNotFoundException extends CommissionException {
  constructor(commissionId: string) {
    super(`Commission not found: ${commissionId}`);
    this.name = 'CommissionNotFoundException';
  }
}

/**
 * 커미션이 사용 불가능한 상태인 경우
 */
export class CommissionNotAvailableException extends CommissionException {
  constructor(message: string) {
    super(message);
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
    );
    this.name = 'WalletNotFoundException';
  }
}

/**
 * 티어를 찾을 수 없는 경우
 */
export class TierNotFoundException extends CommissionException {
  constructor(affiliateId: bigint) {
    super(`Tier not found for affiliate: ${affiliateId}`);
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
    );
    this.name = 'InvalidSettlementDateException';
  }
}

/**
 * 월렛 잔액이 유효하지 않은 경우
 */
export class InvalidWalletBalanceException extends CommissionException {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidWalletBalanceException';
  }
}

/**
 * 파라미터가 유효하지 않은 경우
 */
export class InvalidParameterException extends CommissionException {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidParameterException';
  }
}
