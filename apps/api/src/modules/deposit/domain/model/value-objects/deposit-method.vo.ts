// src/modules/deposit/domain/model/value-objects/deposit-method.vo.ts
import { DepositMethodType, PaymentProvider } from '@prisma/client';

/**
 * 입금 방법 Value Object
 * 입금 방법 타입과 프로바이더 정보를 캡슐화
 */
export class DepositMethod {
  private constructor(
    public readonly methodType: DepositMethodType,
    public readonly provider: PaymentProvider,
  ) {}

  static create(
    methodType: DepositMethodType,
    provider: PaymentProvider,
  ): DepositMethod {
    return new DepositMethod(methodType, provider);
  }

  static fromPersistence(data: {
    methodType: DepositMethodType;
    provider: PaymentProvider;
  }): DepositMethod {
    return new DepositMethod(data.methodType, data.provider);
  }

  toPersistence(): {
    methodType: DepositMethodType;
    provider: PaymentProvider;
  } {
    return {
      methodType: this.methodType,
      provider: this.provider,
    };
  }

  isCryptoWallet(): boolean {
    return this.methodType === DepositMethodType.CRYPTO_WALLET;
  }

  isBankTransfer(): boolean {
    return this.methodType === DepositMethodType.BANK_TRANSFER;
  }

  isManual(): boolean {
    return this.provider === PaymentProvider.MANUAL;
  }

  isNowPayment(): boolean {
    return this.provider === PaymentProvider.NOWPAYMENT;
  }
}
