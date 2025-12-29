// src/modules/wallet/domain/wallet.exception.ts

/**
 * Wallet 도메인 예외 기본 클래스
 */
export class WalletException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletException';
  }
}

/**
 * Wallet을 찾을 수 없을 때 발생하는 예외
 */
export class WalletNotFoundException extends WalletException {
  constructor(userId: bigint, currency: string) {
    super(`Wallet not found: userId=${userId}, currency=${currency}`);
    this.name = 'WalletNotFoundException';
  }
}

/**
 * Wallet 잔액이 유효하지 않은 경우
 */
export class InvalidWalletBalanceException extends WalletException {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidWalletBalanceException';
  }
}

/**
 * 잔액이 부족한 경우
 */
export class InsufficientBalanceException extends WalletException {
  constructor(
    availableBalance: string,
    requestedAmount: string,
  ) {
    super(
      `Insufficient balance. Available: ${availableBalance}, Requested: ${requestedAmount}`,
    );
    this.name = 'InsufficientBalanceException';
  }
}

