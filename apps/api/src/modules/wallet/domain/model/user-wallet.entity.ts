// src/modules/wallet/domain/model/user-wallet.entity.ts
import { ExchangeCurrencyCode, Prisma, UserWalletStatus } from '@prisma/client';
import {
  InvalidWalletBalanceException,
  InsufficientBalanceException,
} from '../wallet.exception';

/**
 * UserWallet 도메인 엔티티
 *
 * 사용자 지갑(UserWallet)을 표현하는 도메인 엔티티입니다.
 * Cash, Bonus, Reward, Lock, Vault 등 다양한 자산 유형을 관리합니다.
 */
export class UserWallet {
  private constructor(
    public readonly userId: bigint,
    public readonly currency: ExchangeCurrencyCode,
    private _cash: Prisma.Decimal,
    private _bonus: Prisma.Decimal,
    private _lock: Prisma.Decimal,
    private _vault: Prisma.Decimal,
    private _status: UserWalletStatus,
    public readonly updatedAt: Date,
  ) {
    this.validateBalances();
  }

  private validateBalances(): void {
    if (this._cash.lt(0)) throw new InvalidWalletBalanceException(`Cash balance cannot be negative: ${this._cash}`);
    if (this._bonus.lt(0)) throw new InvalidWalletBalanceException(`Bonus balance cannot be negative: ${this._bonus}`);
    if (this._lock.lt(0)) throw new InvalidWalletBalanceException(`Lock balance cannot be negative: ${this._lock}`);
    if (this._vault.lt(0)) throw new InvalidWalletBalanceException(`Vault balance cannot be negative: ${this._vault}`);
  }

  static create(params: {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    cash?: Prisma.Decimal;
    bonus?: Prisma.Decimal;
    lock?: Prisma.Decimal;
    vault?: Prisma.Decimal;
    status?: UserWalletStatus;
  }): UserWallet {
    return new UserWallet(
      params.userId,
      params.currency,
      params.cash ?? new Prisma.Decimal(0),
      params.bonus ?? new Prisma.Decimal(0),
      params.lock ?? new Prisma.Decimal(0),
      params.vault ?? new Prisma.Decimal(0),
      params.status ?? UserWalletStatus.ACTIVE,
      new Date(),
    );
  }

  static fromPersistence(data: {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    cash: Prisma.Decimal;
    bonus: Prisma.Decimal;
    lock: Prisma.Decimal;
    vault: Prisma.Decimal;
    status: UserWalletStatus;
    updatedAt: Date;
  }): UserWallet {
    return new UserWallet(
      data.userId,
      data.currency,
      data.cash,
      data.bonus,
      data.lock,
      data.vault,
      data.status,
      data.updatedAt,
    );
  }

  // Getters
  get cash(): Prisma.Decimal { return this._cash; }
  get bonus(): Prisma.Decimal { return this._bonus; }
  get lock(): Prisma.Decimal { return this._lock; }
  get vault(): Prisma.Decimal { return this._vault; }
  get status(): UserWalletStatus { return this._status; }

  // Business Logic

  /**
   * 총 사용 가능 잔액 (Cash + Bonus + Reward)
   */
  get totalAvailableBalance(): Prisma.Decimal {
    return this._cash.add(this._bonus);
  }

  hasSufficientCash(amount: Prisma.Decimal): boolean {
    return this._cash.gte(amount);
  }

  // Modifiers

  increaseCash(amount: Prisma.Decimal): void {
    if (amount.isNegative()) throw new InvalidWalletBalanceException('Amount to increase must be positive');
    this._cash = this._cash.add(amount);
  }

  decreaseCash(amount: Prisma.Decimal): void {
    if (amount.isNegative()) throw new InvalidWalletBalanceException('Amount to decrease must be positive');
    if (!this.hasSufficientCash(amount)) {
      throw new InsufficientBalanceException(this._cash.toString(), amount.toString());
    }
    this._cash = this._cash.sub(amount);
  }

  increaseBonus(amount: Prisma.Decimal): void {
    if (amount.isNegative()) throw new InvalidWalletBalanceException('Amount to increase must be positive');
    this._bonus = this._bonus.add(amount);
  }

  decreaseBonus(amount: Prisma.Decimal): void {
    if (amount.isNegative()) throw new InvalidWalletBalanceException('Amount to decrease must be positive');
    if (this._bonus.lt(amount)) {
      throw new InsufficientBalanceException(this._bonus.toString(), amount.toString());
    }
    this._bonus = this._bonus.sub(amount);
  }

  increaseLock(amount: Prisma.Decimal): void {
    if (amount.isNegative()) throw new InvalidWalletBalanceException('Amount to increase must be positive');
    this._lock = this._lock.add(amount);
  }

  decreaseLock(amount: Prisma.Decimal): void {
    if (amount.isNegative()) throw new InvalidWalletBalanceException('Amount to decrease must be positive');
    if (this._lock.lt(amount)) {
      throw new InsufficientBalanceException(this._lock.toString(), amount.toString());
    }
    this._lock = this._lock.sub(amount);
  }

  increaseVault(amount: Prisma.Decimal): void {
    if (amount.isNegative()) throw new InvalidWalletBalanceException('Amount to increase must be positive');
    this._vault = this._vault.add(amount);
  }

  decreaseVault(amount: Prisma.Decimal): void {
    if (amount.isNegative()) throw new InvalidWalletBalanceException('Amount to decrease must be positive');
    if (this._vault.lt(amount)) {
      throw new InsufficientBalanceException(this._vault.toString(), amount.toString());
    }
    this._vault = this._vault.sub(amount);
  }

  depositToVault(amount: Prisma.Decimal): void {
    this.decreaseCash(amount);
    this.increaseVault(amount);
  }

  withdrawFromVault(amount: Prisma.Decimal): void {
    this.decreaseVault(amount);
    this.increaseCash(amount);
  }

  // Status Modifiers

  freeze(): void {
    this._status = UserWalletStatus.FROZEN;
  }

  activate(): void {
    this._status = UserWalletStatus.ACTIVE;
  }

  deactivate(): void {
    this._status = UserWalletStatus.INACTIVE;
  }

  setReadOnly(): void {
    this._status = UserWalletStatus.READ_ONLY;
  }

  restrictWithdrawal(): void {
    this._status = UserWalletStatus.WITHDRAWAL_RESTRICTED;
  }

  terminate(): void {
    this._status = UserWalletStatus.TERMINATED;
  }
}

