// src/modules/casino-refactor/domain/model/user-game-balance.vo.ts
import { Prisma } from '@repo/database';

/**
 * 사용자 게임 잔액 Value Object
 * 
 * 게임 세션의 환율을 적용한 사용자 잔액 정보를 표현합니다.
 * 게임 통화로 변환된 잔액과 지갑 통화 잔액을 포함합니다.
 */
export class UserGameBalance {
  private constructor(
    public readonly balance: Prisma.Decimal, // 게임 통화로 변환된 총 잔액
    public readonly mainBalance: Prisma.Decimal, // 메인 잔액 (지갑 통화)
    public readonly bonusBalance: Prisma.Decimal, // 보너스 잔액 (지갑 통화)
    public readonly walletCurrency: string, // 지갑 통화
    public readonly gameCurrency: string, // 게임 통화
    public readonly exchangeRate: Prisma.Decimal, // 사용된 환율
  ) {
    // 비즈니스 규칙: 잔액은 0 이상이어야 함
    if (this.balance.lt(0)) {
      throw new Error('Balance cannot be negative');
    }
    if (this.mainBalance.lt(0)) {
      throw new Error('Main balance cannot be negative');
    }
    if (this.bonusBalance.lt(0)) {
      throw new Error('Bonus balance cannot be negative');
    }
    // 비즈니스 규칙: 환율은 양수여야 함
    if (this.exchangeRate.lte(0)) {
      throw new Error('Exchange rate must be positive');
    }
  }

  /**
   * UserGameBalance 생성
   * @param params - 잔액 정보 파라미터
   * @returns 생성된 UserGameBalance Value Object
   */
  static create(params: {
    balance: Prisma.Decimal;
    mainBalance: Prisma.Decimal;
    bonusBalance: Prisma.Decimal;
    walletCurrency: string;
    gameCurrency: string;
    exchangeRate: Prisma.Decimal;
  }): UserGameBalance {
    return new UserGameBalance(
      params.balance,
      params.mainBalance,
      params.bonusBalance,
      params.walletCurrency,
      params.gameCurrency,
      params.exchangeRate,
    );
  }

  /**
   * 총 잔액 (메인 + 보너스) 반환 (지갑 통화)
   */
  get totalBalanceInWalletCurrency(): Prisma.Decimal {
    return this.mainBalance.add(this.bonusBalance);
  }

  /**
   * 잔액이 충분한지 확인
   * @param requiredAmount 필요한 금액 (게임 통화)
   * @returns 잔액이 충분하면 true
   */
  hasSufficientBalance(requiredAmount: Prisma.Decimal): boolean {
    return this.balance.gte(requiredAmount);
  }
}

