// src/modules/deposit/domain/model/bank-config.entity.ts
import { Prisma } from '@repo/database';
import { ExchangeCurrencyCode } from '@repo/database';

/**
 * BankConfig 도메인 엔티티
 *
 * 은행 계좌 입금 설정 및 계좌 정보를 표현하는 도메인 엔티티입니다.
 * - 은행 계좌 정보 (은행명, 계좌번호, 예금주 등)
 * - 입금 설정 (최소/최대 금액, 우선순위 등)
 * - 통계 정보 (총 입금 횟수, 총 입금 금액)
 * - 소프트 삭제 지원
 */
export class BankConfig {
  private constructor(
    public readonly id: bigint,
    public readonly uid: string,
    public readonly currency: ExchangeCurrencyCode,
    public readonly bankName: string,
    public readonly accountNumber: string,
    public readonly accountHolder: string,
    private _isActive: boolean,
    public readonly priority: number,
    public readonly description: string | null,
    public readonly notes: string | null,
    public readonly minAmount: Prisma.Decimal,
    public readonly maxAmount: Prisma.Decimal | null,
    private _totalDeposits: number,
    private _totalDepositAmount: Prisma.Decimal,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    private _deletedAt: Date | null,
  ) {}

  /**
   * DB에서 조회한 데이터로부터 엔티티 생성
   */
  static fromPersistence(data: {
    id: bigint;
    uid: string;
    currency: ExchangeCurrencyCode;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    isActive: boolean;
    priority: number;
    description: string | null;
    notes: string | null;
    minAmount: Prisma.Decimal;
    maxAmount: Prisma.Decimal | null;
    totalDeposits: number;
    totalDepositAmount: Prisma.Decimal;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): BankConfig {
    return new BankConfig(
      data.id,
      data.uid,
      data.currency,
      data.bankName,
      data.accountNumber,
      data.accountHolder,
      data.isActive,
      data.priority,
      data.description,
      data.notes,
      data.minAmount,
      data.maxAmount,
      data.totalDeposits,
      data.totalDepositAmount,
      data.createdAt,
      data.updatedAt,
      data.deletedAt,
    );
  }

  /**
   * Domain 엔티티를 Persistence 레이어로 변환
   */
  toPersistence(): {
    id: bigint;
    uid: string;
    currency: ExchangeCurrencyCode;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    isActive: boolean;
    priority: number;
    description: string | null;
    notes: string | null;
    minAmount: Prisma.Decimal;
    maxAmount: Prisma.Decimal | null;
    totalDeposits: number;
    totalDepositAmount: Prisma.Decimal;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  } {
    return {
      id: this.id,
      uid: this.uid,
      currency: this.currency,
      bankName: this.bankName,
      accountNumber: this.accountNumber,
      accountHolder: this.accountHolder,
      isActive: this._isActive,
      priority: this.priority,
      description: this.description,
      notes: this.notes,
      minAmount: this.minAmount,
      maxAmount: this.maxAmount,
      totalDeposits: this._totalDeposits,
      totalDepositAmount: this._totalDepositAmount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this._deletedAt,
    };
  }

  // 상태 관련 메서드
  get isActive(): boolean {
    return this._isActive;
  }

  toggleActive(): void {
    this._isActive = !this._isActive;
  }

  activate(): void {
    this._isActive = true;
  }

  deactivate(): void {
    this._isActive = false;
  }

  // 소프트 삭제 관련 메서드
  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  softDelete(): void {
    this._deletedAt = new Date();
  }

  restore(): void {
    this._deletedAt = null;
  }

  // 통계 관련 메서드
  get totalDeposits(): number {
    return this._totalDeposits;
  }

  get totalDepositAmount(): Prisma.Decimal {
    return this._totalDepositAmount;
  }

  /**
   * 입금 통계 증가
   */
  incrementDepositStats(amount: Prisma.Decimal): void {
    this._totalDeposits += 1;
    this._totalDepositAmount = this._totalDepositAmount.add(amount);
  }

  // 검증 메서드
  /**
   * 입금 금액이 최소 금액 이상인지 확인
   */
  isAmountAboveMinimum(amount: Prisma.Decimal): boolean {
    return amount.gte(this.minAmount);
  }

  /**
   * 입금 금액이 최대 금액 이하인지 확인
   */
  isAmountBelowMaximum(amount: Prisma.Decimal): boolean {
    if (this.maxAmount === null) {
      return true; // 최대 금액 제한이 없으면 항상 true
    }
    return amount.lte(this.maxAmount);
  }

  /**
   * 입금 금액이 유효한 범위 내인지 확인
   */
  isAmountValid(amount: Prisma.Decimal): boolean {
    return (
      this.isAmountAboveMinimum(amount) &&
      this.isAmountBelowMaximum(amount)
    );
  }

  /**
   * 사용 가능한 상태인지 확인 (활성화되어 있고 삭제되지 않음)
   */
  isAvailable(): boolean {
    return this._isActive && !this.isDeleted();
  }
}

