// src/modules/wallet/domain/model/user-wallet.entity.ts
import type { ExchangeCurrencyCode } from '@prisma/client';
import { Prisma } from '@prisma/client';
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
    private _reward: Prisma.Decimal,
    private _lock: Prisma.Decimal,
    private _vault: Prisma.Decimal,
    public readonly updatedAt: Date,
  ) {
    this.validateBalances();
  }

  private validateBalances(): void {
    if (this._cash.lt(0)) throw new InvalidWalletBalanceException(`Cash balance cannot be negative: ${this._cash}`);
    if (this._bonus.lt(0)) throw new InvalidWalletBalanceException(`Bonus balance cannot be negative: ${this._bonus}`);
    if (this._reward.lt(0)) throw new InvalidWalletBalanceException(`Reward balance cannot be negative: ${this._reward}`);
    if (this._lock.lt(0)) throw new InvalidWalletBalanceException(`Lock balance cannot be negative: ${this._lock}`);
    if (this._vault.lt(0)) throw new InvalidWalletBalanceException(`Vault balance cannot be negative: ${this._vault}`);
  }

  static create(params: {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    cash?: Prisma.Decimal;
    bonus?: Prisma.Decimal;
    reward?: Prisma.Decimal;
    lock?: Prisma.Decimal;
    vault?: Prisma.Decimal;
  }): UserWallet {
    return new UserWallet(
      params.userId,
      params.currency,
      params.cash ?? new Prisma.Decimal(0),
      params.bonus ?? new Prisma.Decimal(0),
      params.reward ?? new Prisma.Decimal(0),
      params.lock ?? new Prisma.Decimal(0),
      params.vault ?? new Prisma.Decimal(0),
      new Date(),
    );
  }

  static fromPersistence(data: {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    cash: Prisma.Decimal;
    bonus: Prisma.Decimal;
    reward: Prisma.Decimal;
    lock: Prisma.Decimal;
    vault: Prisma.Decimal;
    updatedAt: Date;
  }): UserWallet {
    return new UserWallet(
      data.userId,
      data.currency,
      data.cash,
      data.bonus,
      data.reward,
      data.lock,
      data.vault,
      data.updatedAt,
    );
  }

  toPersistence() {
    return {
      userId: this.userId,
      currency: this.currency,
      cash: this._cash,
      bonus: this._bonus,
      reward: this._reward,
      lock: this._lock,
      vault: this._vault,
      updatedAt: this.updatedAt,
    };
  }

  // Getters
  get cash(): Prisma.Decimal { return this._cash; }
  get bonus(): Prisma.Decimal { return this._bonus; }
  get reward(): Prisma.Decimal { return this._reward; }
  get lock(): Prisma.Decimal { return this._lock; }
  get vault(): Prisma.Decimal { return this._vault; }

  /**
   * 총 사용 가능 잔액 (Cash + Bonus + Reward)
   * Lock과 Vault는 즉시 사용 불가능하므로 제외 (정책에 따라 변경 가능)
   */
  get totalAvailableBalance(): Prisma.Decimal {
    return this._cash.add(this._bonus).add(this._reward);
  }

  /**
   * 전체 자산 총액 (모든 밸런스 합계)
   */
  get totalAsset(): Prisma.Decimal {
    return this._cash.add(this._bonus).add(this._reward).add(this._lock).add(this._vault);
  }

  // Business Logic

  hasSufficientBalance(amount: Prisma.Decimal): boolean {
    return this.totalAvailableBalance.gte(amount);
  }

  hasSufficientCash(amount: Prisma.Decimal): boolean {
    return this._cash.gte(amount);
  }

  // Modifiers

  addCash(amount: Prisma.Decimal): void {
    if (amount.isNegative()) throw new InvalidWalletBalanceException('Amount/Add must be positive');
    this._cash = this._cash.add(amount);
  }

  subtractCash(amount: Prisma.Decimal): void {
    if (amount.isNegative()) throw new InvalidWalletBalanceException('Amount/Subtract must be positive');
    if (!this.hasSufficientCash(amount)) {
      throw new InsufficientBalanceException(this._cash.toString(), amount.toString());
    }
    this._cash = this._cash.sub(amount);
  }

  addBonus(amount: Prisma.Decimal): void {
    if (amount.isNegative()) throw new InvalidWalletBalanceException('Amount/Add must be positive');
    this._bonus = this._bonus.add(amount);
  }

  subtractBonus(amount: Prisma.Decimal): void {
    if (amount.isNegative()) throw new InvalidWalletBalanceException('Amount/Subtract must be positive');
    if (this._bonus.lt(amount)) {
      throw new InsufficientBalanceException(this._bonus.toString(), amount.toString());
    }
    this._bonus = this._bonus.sub(amount);
  }

  // Reward, Lock, Vault 관련 메서드도 필요에 따라 추가
  addReward(amount: Prisma.Decimal): void {
    if (amount.isNegative()) throw new InvalidWalletBalanceException('Amount/Add must be positive');
    this._reward = this._reward.add(amount);
  }

  subtractReward(amount: Prisma.Decimal): void {
    if (amount.isNegative()) throw new InvalidWalletBalanceException('Amount/Subtract must be positive');
    if (this._reward.lt(amount)) throw new InsufficientBalanceException(this._reward.toString(), amount.toString());
    this._reward = this._reward.sub(amount);
  }

  // Vault 입출금 로직 등은 별도 메서드로 구현 가능
  depositToVault(amount: Prisma.Decimal): void {
    this.subtractCash(amount); // Cash에서 차감하여
    this._vault = this._vault.add(amount); // Vault로 이동
  }

  withdrawFromVault(amount: Prisma.Decimal): void {
    if (this._vault.lt(amount)) throw new InsufficientBalanceException(this._vault.toString(), amount.toString());
    this._vault = this._vault.sub(amount); // Vault에서 차감하여
    this.addCash(amount); // Cash로 이동
  }
}

