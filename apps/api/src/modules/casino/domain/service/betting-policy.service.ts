import { Prisma } from '@prisma/client';
import { CasinoErrorCode } from '../../constants/casino-error-codes';

export interface BalanceSplitResult {
  cashDeduction: Prisma.Decimal;
  bonusDeduction: Prisma.Decimal;
  cashGameAmount: Prisma.Decimal;
  bonusGameAmount: Prisma.Decimal;
}

/**
 * 베팅 금액 처리 정책 (Domain Service)
 */
export class BettingPolicy {
  /**
   * 유저의 지갑 잔액 상태에 따라 차감할 금액을 계산합니다. (Cash First Policy)
   */
  public static calculateBalanceSplit(
    betAmount: Prisma.Decimal,
    userWallet: { cash: Prisma.Decimal; bonus: Prisma.Decimal },
    exchangeRate: Prisma.Decimal,
  ): BalanceSplitResult {
    let cashDeduction = new Prisma.Decimal(0);
    let bonusDeduction = new Prisma.Decimal(0);

    // 1. Cash 우선 차감
    if (userWallet.cash.gte(betAmount)) {
      cashDeduction = betAmount;
    } else {
      // Cash가 부족할 경우 전액 소진
      cashDeduction = userWallet.cash;
      // 나머지는 Bonus에서 차감
      bonusDeduction = betAmount.sub(userWallet.cash);
    }

    // 2. Bonus 잔액 검증
    if (bonusDeduction.gt(0) && userWallet.bonus.lt(bonusDeduction)) {
      throw new Error(CasinoErrorCode.INSUFFICIENT_FUNDS);
    }

    // 3. Game Currency 금액 계산 (환율 적용)
    // 지갑 화폐 * 환율 = 게임 화폐
    const cashGameAmount = cashDeduction.mul(exchangeRate);
    const bonusGameAmount = bonusDeduction.mul(exchangeRate);

    return { cashDeduction, bonusDeduction, cashGameAmount, bonusGameAmount };
  }
}
