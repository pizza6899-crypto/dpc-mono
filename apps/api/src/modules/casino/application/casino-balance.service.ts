import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/platform/prisma/prisma.service';
import { CasinoErrorCode } from '../constants/casino-error-codes';
import { WalletCurrencyCode } from 'src/utils/currency.util';
import { UserStatsService } from 'src/modules/user-stats/application/user-stats.service';

@Injectable()
export class CasinoBalanceService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userStatsService: UserStatsService,
  ) {}

  /**
   * 사용자의 실시간 카지노 잔액 및 주요 값을 조회한다.
   * @param userId 사용자 ID
   */
  async getUserCasinoBalance({
    userId,
    currency,
    tx = this.prismaService,
  }: {
    userId: string;
    currency: WalletCurrencyCode;
    tx?: Prisma.TransactionClient;
  }): Promise<{ mainBalance: Prisma.Decimal; bonusBalance: Prisma.Decimal }> {
    const balance = await tx.userBalance.findUnique({
      where: { userId_currency: { userId, currency } },
      select: {
        mainBalance: true,
        bonusBalance: true,
      },
    });

    if (!balance) {
      throw new Error(CasinoErrorCode.USER_BALANCE_NOT_FOUND);
    }

    return {
      mainBalance: balance.mainBalance,
      bonusBalance: balance.bonusBalance,
    };
  }

  async updateUserCasinoBalance({
    tx = this.prismaService,
    userId,
    currency,
    amount,
  }: {
    tx: Prisma.TransactionClient;
    userId: string;
    currency: WalletCurrencyCode;
    amount: Prisma.Decimal;
  }): Promise<{
    /** 업데이트 후 메인 잔액 */
    mainAfterBalance: Prisma.Decimal;
    /** 업데이트 후 보너스 잔액 */
    bonusAfterBalance: Prisma.Decimal;
    /** 업데이트 전 메인 잔액 */
    mainBeforeBalance: Prisma.Decimal;
    /** 업데이트 전 보너스 잔액 */
    bonusBeforeBalance: Prisma.Decimal;
    /** 메인 잔액 변경량 (afterMainBalance - beforeMainBalance) */
    mainBalanceChange: Prisma.Decimal;
    /** 보너스 잔액 변경량 (afterBonusBalance - beforeBonusBalance) */
    bonusBalanceChange: Prisma.Decimal;
  }> {
    const userBalance = await tx.userBalance.findUnique({
      where: { userId_currency: { userId, currency } },
      select: {
        mainBalance: true,
        bonusBalance: true,
      },
    });
    if (!userBalance) throw new Error(CasinoErrorCode.USER_BALANCE_NOT_FOUND);

    // 변경 전 잔액 저장
    const mainBeforeBalance = userBalance.mainBalance;
    const bonusBeforeBalance = userBalance.bonusBalance;

    let primaryBalance = userBalance.mainBalance;
    let bonusBalance = userBalance.bonusBalance;

    if (amount.lt(0)) {
      let remain = Prisma.Decimal.abs(amount);
      const usedBalance =
        remain > userBalance.mainBalance ? userBalance.mainBalance : remain;
      primaryBalance = userBalance.mainBalance.sub(usedBalance);
      remain = remain.sub(usedBalance);
      bonusBalance = userBalance.bonusBalance.sub(remain);
    } else {
      primaryBalance = userBalance.mainBalance.add(amount);
    }

    if (primaryBalance.lt(0) || bonusBalance.lt(0)) {
      throw new Error(CasinoErrorCode.INSUFFICIENT_FUNDS);
    }

    const updatedUserBalance = await tx.userBalance.update({
      where: { userId_currency: { userId, currency } },
      data: {
        mainBalance: primaryBalance,
        bonusBalance: bonusBalance,
      },
    });

    // 통계 업데이트
    if (amount.lt(0)) {
      // 베팅 (음수)
      await this.userStatsService.updateBetWinStats(
        tx,
        userId,
        currency,
        amount.abs(),
        new Prisma.Decimal(0),
      );
    } else {
      // 승리 (양수)
      await this.userStatsService.updateBetWinStats(
        tx,
        userId,
        currency,
        new Prisma.Decimal(0),
        amount,
      );
    }

    // 변경량 계산
    const mainBalanceChange =
      updatedUserBalance.mainBalance.sub(mainBeforeBalance);
    const bonusBalanceChange =
      updatedUserBalance.bonusBalance.sub(bonusBeforeBalance);

    return {
      mainAfterBalance: updatedUserBalance.mainBalance,
      bonusAfterBalance: updatedUserBalance.bonusBalance,
      mainBeforeBalance,
      bonusBeforeBalance,
      mainBalanceChange,
      bonusBalanceChange,
    };
  }

  /**
   * 베팅 취소 시 정확한 잔액 반환
   * 베팅 시 사용한 mainBalance와 bonusBalance를 각각 정확히 반환
   * @param mainAmount 반환할 메인 잔액 (양수)
   * @param bonusAmount 반환할 보너스 잔액 (양수)
   */
  async refundUserCasinoBalance({
    tx = this.prismaService,
    userId,
    currency,
    mainAmount,
    bonusAmount,
  }: {
    tx: Prisma.TransactionClient;
    userId: string;
    currency: WalletCurrencyCode;
    mainAmount: Prisma.Decimal; // 반환할 메인 잔액 (양수)
    bonusAmount: Prisma.Decimal; // 반환할 보너스 잔액 (양수)
  }): Promise<{
    /** 업데이트 후 메인 잔액 */
    mainAfterBalance: Prisma.Decimal;
    /** 업데이트 후 보너스 잔액 */
    bonusAfterBalance: Prisma.Decimal;
    /** 업데이트 전 메인 잔액 */
    mainBeforeBalance: Prisma.Decimal;
    /** 업데이트 전 보너스 잔액 */
    bonusBeforeBalance: Prisma.Decimal;
    /** 메인 잔액 변경량 (afterMainBalance - beforeMainBalance) */
    mainBalanceChange: Prisma.Decimal;
    /** 보너스 잔액 변경량 (afterBonusBalance - beforeBonusBalance) */
    bonusBalanceChange: Prisma.Decimal;
  }> {
    const userBalance = await tx.userBalance.findUnique({
      where: { userId_currency: { userId, currency } },
      select: {
        mainBalance: true,
        bonusBalance: true,
      },
    });
    if (!userBalance) throw new Error(CasinoErrorCode.USER_BALANCE_NOT_FOUND);

    // 변경 전 잔액 저장
    const mainBeforeBalance = userBalance.mainBalance;
    const bonusBeforeBalance = userBalance.bonusBalance;

    // 정확한 반환: 각각의 잔액에 정확히 추가
    const primaryBalance = userBalance.mainBalance.add(mainAmount);
    const bonusBalance = userBalance.bonusBalance.add(bonusAmount);

    if (primaryBalance.lt(0) || bonusBalance.lt(0)) {
      throw new Error(CasinoErrorCode.INSUFFICIENT_FUNDS);
    }

    const updatedUserBalance = await tx.userBalance.update({
      where: { userId_currency: { userId, currency } },
      data: {
        mainBalance: primaryBalance,
        bonusBalance: bonusBalance,
      },
    });

    // 통계 업데이트 (환불이므로 베팅 감소)
    const totalRefund = mainAmount.add(bonusAmount);
    await this.userStatsService.updateBetWinStats(
      tx,
      userId,
      currency,
      totalRefund.neg(), // 베팅 감소 (음수)
      new Prisma.Decimal(0),
    );

    // 변경량 계산
    const mainBalanceChange =
      updatedUserBalance.mainBalance.sub(mainBeforeBalance);
    const bonusBalanceChange =
      updatedUserBalance.bonusBalance.sub(bonusBeforeBalance);

    return {
      mainAfterBalance: updatedUserBalance.mainBalance,
      bonusAfterBalance: updatedUserBalance.bonusBalance,
      mainBeforeBalance,
      bonusBeforeBalance,
      mainBalanceChange,
      bonusBalanceChange,
    };
  }
}
