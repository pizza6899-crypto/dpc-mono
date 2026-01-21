// src/modules/wallet/domain/model/user-wallet.entity.ts
import type { ExchangeCurrencyCode } from '@prisma/client';
import { Prisma } from '@prisma/client';
import {
  InvalidWalletBalanceException,
  InsufficientBalanceException,
} from '../wallet.exception';
import { BalanceType, UpdateOperation } from '../wallet.types';

/**
 * UserWallet 도메인 엔티티
 *
 * 사용자 잔액(UserBalance)을 표현하는 도메인 엔티티입니다.
 * 사용자가 본인의 잔액을 조회하고 관리할 수 있는 기능을 제공합니다.
 */
export class UserWallet {
  private constructor(
    public readonly userId: bigint,
    public readonly currency: ExchangeCurrencyCode,
    private _mainBalance: Prisma.Decimal,
    private _bonusBalance: Prisma.Decimal,
    public readonly updatedAt: Date,
  ) {
    // 비즈니스 규칙: 잔액은 음수가 될 수 없음
    if (this._mainBalance.lt(0)) {
      throw new InvalidWalletBalanceException(
        `Main balance cannot be negative: ${this._mainBalance}`,
      );
    }
    if (this._bonusBalance.lt(0)) {
      throw new InvalidWalletBalanceException(
        `Bonus balance cannot be negative: ${this._bonusBalance}`,
      );
    }
  }

  /**
   * 새로운 월렛 생성
   * @param params - 월렛 생성 파라미터
   * @returns 생성된 월렛 엔티티
   * @description Application 레이어에서 Prisma.Decimal로 변환하여 전달해야 함
   */
  static create(params: {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    mainBalance?: Prisma.Decimal; // 기본값: 0
    bonusBalance?: Prisma.Decimal; // 기본값: 0
  }): UserWallet {
    const mainBalance = params.mainBalance ?? new Prisma.Decimal(0);
    const bonusBalance = params.bonusBalance ?? new Prisma.Decimal(0);

    const now = new Date();
    return new UserWallet(
      params.userId,
      params.currency,
      mainBalance,
      bonusBalance,
      now,
    );
  }

  /**
   * DB에서 조회한 데이터로부터 엔티티 생성
   * Repository에서 Prisma를 통해 생성/조회된 데이터를 Domain Entity로 변환할 때 사용
   */
  static fromPersistence(data: {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    mainBalance: Prisma.Decimal;
    bonusBalance: Prisma.Decimal;
    updatedAt: Date;
  }): UserWallet {
    return new UserWallet(
      data.userId,
      data.currency,
      data.mainBalance,
      data.bonusBalance,
      data.updatedAt,
    );
  }

  /**
   * Domain 엔티티를 Persistence 레이어로 변환
   */
  toPersistence(): {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    mainBalance: Prisma.Decimal;
    bonusBalance: Prisma.Decimal;
    updatedAt: Date;
  } {
    return {
      userId: this.userId,
      currency: this.currency,
      mainBalance: this._mainBalance,
      bonusBalance: this._bonusBalance,
      updatedAt: this.updatedAt,
    };
  }

  // Getters

  /**
   * 메인 잔액 조회
   */
  get mainBalance(): Prisma.Decimal {
    return this._mainBalance;
  }

  /**
   * 보너스 잔액 조회
   */
  get bonusBalance(): Prisma.Decimal {
    return this._bonusBalance;
  }

  /**
   * 총 잔액 조회 (메인 + 보너스)
   */
  get totalBalance(): Prisma.Decimal {
    return this._mainBalance.add(this._bonusBalance);
  }

  // Business Logic Methods

  /**
   * 잔액이 충분한지 확인
   * @param requiredAmount 필요한 금액
   * @returns 잔액이 충분하면 true, 부족하면 false
   */
  hasSufficientBalance(requiredAmount: Prisma.Decimal): boolean {
    return this.totalBalance.gte(requiredAmount);
  }

  /**
   * 메인 잔액이 충분한지 확인
   * @param requiredAmount 필요한 금액
   * @returns 메인 잔액이 충분하면 true, 부족하면 false
   */
  hasSufficientMainBalance(requiredAmount: Prisma.Decimal): boolean {
    return this._mainBalance.gte(requiredAmount);
  }

  /**
   * 잔액이 있는지 확인 (0보다 큰지)
   * @returns 잔액이 있으면 true, 없으면 false
   */
  hasBalance(): boolean {
    return this.totalBalance.gt(0);
  }

  /**
   * 메인 잔액만 있는지 확인 (보너스 잔액 없음)
   * @returns 메인 잔액만 있으면 true
   */
  hasOnlyMainBalance(): boolean {
    return this._mainBalance.gt(0) && this._bonusBalance.eq(0);
  }

  /**
   * 보너스 잔액만 있는지 확인 (메인 잔액 없음)
   * @returns 보너스 잔액만 있으면 true
   */
  hasOnlyBonusBalance(): boolean {
    return this._mainBalance.eq(0) && this._bonusBalance.gt(0);
  }

  /**
   * 잔액이 비어있는지 확인
   * @returns 잔액이 없으면 true
   */
  isEmpty(): boolean {
    return this.totalBalance.eq(0);
  }

  // Update Methods

  /**
   * 메인 잔액 증가
   * @param amount 증가할 금액
   * @throws {InvalidWalletBalanceException} 금액이 0 이하인 경우
   */
  addMainBalance(amount: Prisma.Decimal): void {
    if (amount.isZero()) return;

    if (amount.isNegative()) {
      throw new InvalidWalletBalanceException(
        'Amount to be added must be greater than 0.',
      );
    }
    this._mainBalance = this._mainBalance.add(amount);
    // updatedAt은 toPersistence에서 처리하므로 여기서는 업데이트하지 않음
  }

  /**
   * 보너스 잔액 증가
   * @param amount 증가할 금액
   * @throws {InvalidWalletBalanceException} 금액이 0 이하인 경우
   */
  addBonusBalance(amount: Prisma.Decimal): void {
    if (amount.isZero()) return;

    if (amount.isNegative()) {
      throw new InvalidWalletBalanceException(
        'Amount to be added must be greater than 0.',
      );
    }
    this._bonusBalance = this._bonusBalance.add(amount);
  }

  /**
   * 메인 잔액 감소
   * @param amount 감소할 금액
   * @throws {InsufficientBalanceException} 잔액이 부족한 경우
   */
  subtractMainBalance(amount: Prisma.Decimal): void {
    if (amount.isZero()) return;

    if (amount.isNegative()) {
      throw new InvalidWalletBalanceException(
        'Amount to be subtracted must be greater than 0.',
      );
    }
    if (!this.hasSufficientMainBalance(amount)) {
      throw new InsufficientBalanceException(
        this._mainBalance.toString(),
        amount.toString(),
      );
    }
    this._mainBalance = this._mainBalance.sub(amount);
  }

  /**
   * 보너스 잔액 감소
   * @param amount 감소할 금액
   * @throws {InsufficientBalanceException} 잔액이 부족한 경우
   */
  subtractBonusBalance(amount: Prisma.Decimal): void {
    if (amount.isZero()) return;

    if (amount.isNegative()) {
      throw new InvalidWalletBalanceException(
        'Amount to be subtracted must be greater than 0.',
      );
    }
    const currentBonusBalance = this._bonusBalance;
    if (currentBonusBalance.lt(amount)) {
      throw new InsufficientBalanceException(
        currentBonusBalance.toString(),
        amount.toString(),
      );
    }
    this._bonusBalance = this._bonusBalance.sub(amount);
  }

  /**
   * 총 잔액에서 차감 (메인 잔액 우선, 부족하면 보너스 잔액에서 차감)
   * @param amount 차감할 금액
   * @throws {InsufficientBalanceException} 총 잔액이 부족한 경우
   */
  subtractFromTotal(amount: Prisma.Decimal): void {
    if (amount.isZero()) return;

    if (amount.isNegative()) {
      throw new InvalidWalletBalanceException(
        'Amount to be subtracted must be greater than 0.',
      );
    }
    if (!this.hasSufficientBalance(amount)) {
      throw new InsufficientBalanceException(
        this.totalBalance.toString(),
        amount.toString(),
      );
    }

    let remaining = amount;
    // 메인 잔액에서 먼저 차감
    if (this._mainBalance.gt(0)) {
      const fromMain = Prisma.Decimal.min(this._mainBalance, remaining);
      this._mainBalance = this._mainBalance.sub(fromMain);
      remaining = remaining.sub(fromMain);
    }
    // 남은 금액은 보너스 잔액에서 차감
    if (remaining.gt(0)) {
      this._bonusBalance = this._bonusBalance.sub(remaining);
    }
  }

  /**
   * 잔액 업데이트 (통합 메서드)
   * @param type 잔액 타입 (MAIN, BONUS, TOTAL)
   * @param operation 연산 타입 (ADD, SUBTRACT)
   * @param amount 금액
   * @returns 변경된 잔액 정보 (변경량 및 변경 전/후 잔액)
   */
  updateBalance(
    type: BalanceType,
    operation: UpdateOperation,
    amount: Prisma.Decimal,
  ): {
    mainChange: Prisma.Decimal;
    bonusChange: Prisma.Decimal;
    beforeMainBalance: Prisma.Decimal;
    afterMainBalance: Prisma.Decimal;
    beforeBonusBalance: Prisma.Decimal;
    afterBonusBalance: Prisma.Decimal;
  } {
    const beforeMainBalance = this._mainBalance;
    const beforeBonusBalance = this._bonusBalance;

    if (operation === UpdateOperation.ADD) {
      if (type === BalanceType.BONUS) {
        this.addBonusBalance(amount);
      } else {
        // MAIN, TOTAL -> Add to Main (정책)
        this.addMainBalance(amount);
      }
    } else {
      // SUBTRACT
      if (type === BalanceType.MAIN) {
        this.subtractMainBalance(amount);
      } else if (type === BalanceType.BONUS) {
        this.subtractBonusBalance(amount);
      } else {
        // TOTAL: 메인 우선, 부족하면 보너스에서 차감
        this.subtractFromTotal(amount);
      }
    }

    return {
      mainChange: this._mainBalance.sub(beforeMainBalance),
      bonusChange: this._bonusBalance.sub(beforeBonusBalance),
      beforeMainBalance,
      afterMainBalance: this._mainBalance,
      beforeBonusBalance,
      afterBonusBalance: this._bonusBalance,
    };
  }
}

