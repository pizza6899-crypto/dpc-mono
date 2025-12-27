// src/modules/affiliate/commission/domain/model/affiliate-wallet.entity.ts
import type { ExchangeCurrencyCode } from '@prisma/client';
import { Prisma } from '@prisma/client';
import {
  InsufficientBalanceException,
  InvalidWalletBalanceException,
} from '../commission.exception';

/**
 * 어필리에이트 월렛 엔티티
 * 다중 통화 지원
 */
export class AffiliateWallet {
  private constructor(
    public readonly affiliateId: string,
    public readonly currency: ExchangeCurrencyCode,
    private _availableBalance: Prisma.Decimal, // 출금 가능 잔액
    private _pendingBalance: Prisma.Decimal, // 대기 중인 커미션
    private _totalEarned: Prisma.Decimal, // 총 적립 커미션
    private _updatedAt: Date,
  ) {}

  /**
   * 새로운 월렛 생성
   * @param params - 월렛 생성 파라미터
   * @returns 생성된 월렛 엔티티
   * @description Application 레이어에서 Prisma.Decimal로 변환하여 전달해야 함
   */
  static create(params: {
    affiliateId: string;
    currency: ExchangeCurrencyCode;
    availableBalance?: Prisma.Decimal; // 기본값: 0
    pendingBalance?: Prisma.Decimal; // 기본값: 0
    totalEarned?: Prisma.Decimal; // 기본값: 0
  }): AffiliateWallet {
    const availableBalance = params.availableBalance ?? new Prisma.Decimal(0);
    const pendingBalance = params.pendingBalance ?? new Prisma.Decimal(0);
    const totalEarned = params.totalEarned ?? new Prisma.Decimal(0);

    // 음수 잔액 검증
    if (availableBalance.lt(0)) {
      throw new InvalidWalletBalanceException(
        `Available balance cannot be negative: ${availableBalance}`,
      );
    }
    if (pendingBalance.lt(0)) {
      throw new InvalidWalletBalanceException(
        `Pending balance cannot be negative: ${pendingBalance}`,
      );
    }
    if (totalEarned.lt(0)) {
      throw new InvalidWalletBalanceException(
        `Total earned cannot be negative: ${totalEarned}`,
      );
    }

    // 잔액 일관성 검증: totalEarned >= availableBalance + pendingBalance
    // (totalEarned는 과거 출금 내역을 포함하므로 항상 더 크거나 같아야 함)
    // 단, 새로 생성되는 월렛의 경우 totalEarned가 명시적으로 제공되지 않으면 검증하지 않음
    const currentBalance = availableBalance.add(pendingBalance);
    if (params.totalEarned !== undefined && totalEarned.lt(currentBalance)) {
      throw new InvalidWalletBalanceException(
        `Total earned (${totalEarned}) cannot be less than current balance (available: ${availableBalance} + pending: ${pendingBalance} = ${currentBalance})`,
      );
    }

    const now = new Date();
    return new AffiliateWallet(
      params.affiliateId,
      params.currency,
      availableBalance,
      pendingBalance,
      totalEarned,
      now,
    );
  }

  /**
   * DB에서 조회한 데이터로부터 엔티티 생성
   * @description Mapper에서 Prisma.Decimal로 변환하여 전달해야 함
   */
  static fromPersistence(data: {
    affiliateId: string;
    currency: ExchangeCurrencyCode;
    availableBalance: Prisma.Decimal;
    pendingBalance: Prisma.Decimal;
    totalEarned: Prisma.Decimal;
    updatedAt: Date;
  }): AffiliateWallet {
    return new AffiliateWallet(
      data.affiliateId,
      data.currency,
      data.availableBalance,
      data.pendingBalance,
      data.totalEarned,
      data.updatedAt,
    );
  }

  // Getters
  get availableBalance(): Prisma.Decimal {
    return this._availableBalance;
  }

  get pendingBalance(): Prisma.Decimal {
    return this._pendingBalance;
  }

  get totalEarned(): Prisma.Decimal {
    return this._totalEarned;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business Logic Methods

  /**
   * 출금 가능 여부 확인
   * @param amount - 출금 요청 금액
   * @returns 출금 가능 여부
   */
  canWithdraw(amount: Prisma.Decimal): boolean {
    return this._availableBalance.gte(amount) && amount.gt(0);
  }

  /**
   * 대기 중인 커미션 추가 (pendingBalance 증가, totalEarned 증가)
   * @param amount - 추가할 커미션 금액
   * @throws {InvalidWalletBalanceException} 금액이 0 이하인 경우
   */
  addPendingCommission(amount: Prisma.Decimal): void {
    if (amount.lte(0)) {
      throw new InvalidWalletBalanceException(
        'Commission amount must be greater than 0.',
      );
    }
    this._pendingBalance = this._pendingBalance.add(amount);
    this._totalEarned = this._totalEarned.add(amount);
    this._updatedAt = new Date();
  }

  /**
   * 대기 중인 커미션을 출금 가능 잔액으로 이동 (정산 처리)
   * @param amount - 정산할 금액 (null이면 전체 pendingBalance)
   * @throws {InvalidWalletBalanceException} 정산할 금액이 대기 중인 커미션보다 큰 경우
   */
  settlePendingCommission(amount: Prisma.Decimal | null = null): void {
    const settleAmount = amount ?? this._pendingBalance;
    if (settleAmount.lte(0)) {
      return; // 정산할 금액이 없으면 아무것도 하지 않음
    }
    if (settleAmount.gt(this._pendingBalance)) {
      throw new InvalidWalletBalanceException(
        `The settlement amount (${settleAmount}) is greater than the pending commission (${this._pendingBalance}).`,
      );
    }
    this._pendingBalance = this._pendingBalance.sub(settleAmount);
    this._availableBalance = this._availableBalance.add(settleAmount);
    this._updatedAt = new Date();
  }

  /**
   * 출금 처리 (availableBalance 감소)
   * @param amount - 출금할 금액
   * @throws {InsufficientBalanceException} 잔액이 부족한 경우
   */
  withdraw(amount: Prisma.Decimal): void {
    if (!this.canWithdraw(amount)) {
      throw new InsufficientBalanceException(
        BigInt(this._availableBalance.toFixed(0)),
        BigInt(amount.toFixed(0)),
      );
    }
    this._availableBalance = this._availableBalance.sub(amount);
    this._updatedAt = new Date();
  }

  /**
   * 출금 가능 잔액 직접 추가 (직접 입금 등)
   * @param amount - 추가할 금액
   * @throws {InvalidWalletBalanceException} 금액이 0 이하인 경우
   */
  addAvailableBalance(amount: Prisma.Decimal): void {
    if (amount.lte(0)) {
      throw new InvalidWalletBalanceException(
        'Amount to be added must be greater than 0.',
      );
    }
    this._availableBalance = this._availableBalance.add(amount);
    this._updatedAt = new Date();
  }

  /**
   * DB 저장을 위한 데이터 변환
   */
  toPersistence() {
    return {
      affiliateId: this.affiliateId,
      currency: this.currency,
      availableBalance: this._availableBalance,
      pendingBalance: this._pendingBalance,
      totalEarned: this._totalEarned,
      updatedAt: this._updatedAt,
    };
  }
}
