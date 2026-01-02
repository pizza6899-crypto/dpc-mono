// src/modules/deposit/domain/model/value-objects/deposit-amount.vo.ts
import { Prisma } from '@repo/database';
import { FeePaidByType } from '@repo/database';

/**
 * 입금 금액 Value Object
 * 신청 금액, 실제 입금 금액, 수수료 정보를 캡슐화
 */
export class DepositAmount {
  private constructor(
    public readonly requestedAmount: Prisma.Decimal,
    public readonly actuallyPaid: Prisma.Decimal | null,
    public readonly feeAmount: Prisma.Decimal | null,
    public readonly feeCurrency: string | null,
    public readonly feePaidBy: FeePaidByType | null,
  ) {}

  static fromPersistence(data: {
    requestedAmount: Prisma.Decimal;
    actuallyPaid: Prisma.Decimal | null;
    feeAmount: Prisma.Decimal | null;
    feeCurrency: string | null;
    feePaidBy: FeePaidByType | null;
  }): DepositAmount {
    return new DepositAmount(
      data.requestedAmount,
      data.actuallyPaid,
      data.feeAmount,
      data.feeCurrency,
      data.feePaidBy,
    );
  }

  toPersistence(): {
    requestedAmount: Prisma.Decimal;
    actuallyPaid: Prisma.Decimal | null;
    feeAmount: Prisma.Decimal | null;
    feeCurrency: string | null;
    feePaidBy: FeePaidByType | null;
  } {
    return {
      requestedAmount: this.requestedAmount,
      actuallyPaid: this.actuallyPaid,
      feeAmount: this.feeAmount,
      feeCurrency: this.feeCurrency,
      feePaidBy: this.feePaidBy,
    };
  }

  /**
   * 실제 입금 금액이 있는지 확인
   */
  hasActuallyPaid(): boolean {
    return this.actuallyPaid !== null;
  }

  /**
   * 수수료가 있는지 확인
   */
  hasFee(): boolean {
    return this.feeAmount !== null && !this.feeAmount.isZero();
  }

  /**
   * 사용자가 부담하는 수수료인지 확인
   */
  isFeePaidByUser(): boolean {
    return this.feePaidBy === FeePaidByType.USER;
  }

  /**
   * 시스템이 부담하는 수수료인지 확인
   */
  isFeePaidBySystem(): boolean {
    return this.feePaidBy === FeePaidByType.SYSTEM;
  }

  /**
   * 실제 입금 금액을 설정한 새로운 인스턴스 생성
   * @param actuallyPaid - 실제 입금 금액
   * @returns 새로운 DepositAmount 인스턴스
   */
  withActuallyPaid(actuallyPaid: Prisma.Decimal): DepositAmount {
    return new DepositAmount(
      this.requestedAmount,
      actuallyPaid,
      this.feeAmount,
      this.feeCurrency,
      this.feePaidBy,
    );
  }
}

