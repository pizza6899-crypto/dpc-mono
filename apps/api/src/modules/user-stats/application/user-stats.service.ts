import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/platform/prisma/prisma.service';
import { WalletCurrencyCode } from 'src/utils/currency.util';

@Injectable()
export class UserStatsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 베팅/승리 통계 업데이트
   */
  async updateBetWinStats(
    tx: Prisma.TransactionClient,
    userId: string,
    currency: WalletCurrencyCode,
    betAmount: Prisma.Decimal,
    winAmount: Prisma.Decimal,
  ): Promise<void> {
    try {
      await tx.userBalanceStats.update({
        where: { userId_currency: { userId, currency } },
        data: {
          totalBet: { increment: betAmount },
          totalWin: { increment: winAmount },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        // 레코드가 없으면 생성
        await tx.userBalanceStats.create({
          data: {
            userId,
            currency,
            totalBet: betAmount,
            totalWin: winAmount,
            totalDeposit: new Prisma.Decimal(0),
            totalWithdraw: new Prisma.Decimal(0),
            totalBonus: new Prisma.Decimal(0),
            totalCompEarned: new Prisma.Decimal(0),
            totalCompUsed: new Prisma.Decimal(0),
            totalSettlementFromBet: new Prisma.Decimal(0),
            totalSettlementFromVip: new Prisma.Decimal(0),
          },
        });
      } else {
        throw error;
      }
    }
  }

  /**
   * 입금 통계 업데이트
   */
  async updateDepositStats(
    tx: Prisma.TransactionClient,
    userId: string,
    currency: WalletCurrencyCode,
    amount: Prisma.Decimal,
  ): Promise<void> {
    try {
      await tx.userBalanceStats.update({
        where: { userId_currency: { userId, currency } },
        data: {
          totalDeposit: { increment: amount },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        // 레코드가 없으면 생성
        await tx.userBalanceStats.create({
          data: {
            userId,
            currency,
            totalDeposit: amount,
            totalWithdraw: new Prisma.Decimal(0),
            totalBet: new Prisma.Decimal(0),
            totalWin: new Prisma.Decimal(0),
            totalBonus: new Prisma.Decimal(0),
            totalCompEarned: new Prisma.Decimal(0),
            totalCompUsed: new Prisma.Decimal(0),
            totalSettlementFromBet: new Prisma.Decimal(0),
            totalSettlementFromVip: new Prisma.Decimal(0),
          },
        });
      } else {
        throw error;
      }
    }
  }

  /**
   * 출금 통계 업데이트
   */
  async updateWithdrawStats(
    tx: Prisma.TransactionClient,
    userId: string,
    currency: WalletCurrencyCode,
    amount: Prisma.Decimal,
  ): Promise<void> {
    try {
      await tx.userBalanceStats.update({
        where: { userId_currency: { userId, currency } },
        data: {
          totalWithdraw: { increment: amount },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        // 레코드가 없으면 생성
        await tx.userBalanceStats.create({
          data: {
            userId,
            currency,
            totalDeposit: new Prisma.Decimal(0),
            totalWithdraw: amount,
            totalBet: new Prisma.Decimal(0),
            totalWin: new Prisma.Decimal(0),
            totalBonus: new Prisma.Decimal(0),
            totalCompEarned: new Prisma.Decimal(0),
            totalCompUsed: new Prisma.Decimal(0),
            totalSettlementFromBet: new Prisma.Decimal(0),
            totalSettlementFromVip: new Prisma.Decimal(0),
          },
        });
      } else {
        throw error;
      }
    }
  }

  /**
   * 보너스 통계 업데이트
   */
  async updateBonusStats(
    tx: Prisma.TransactionClient,
    userId: string,
    currency: WalletCurrencyCode,
    amount: Prisma.Decimal,
  ): Promise<void> {
    try {
      await tx.userBalanceStats.update({
        where: { userId_currency: { userId, currency } },
        data: {
          totalBonus: { increment: amount },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        // 레코드가 없으면 생성
        await tx.userBalanceStats.create({
          data: {
            userId,
            currency,
            totalDeposit: new Prisma.Decimal(0),
            totalWithdraw: new Prisma.Decimal(0),
            totalBet: new Prisma.Decimal(0),
            totalWin: new Prisma.Decimal(0),
            totalBonus: amount,
            totalCompEarned: new Prisma.Decimal(0),
            totalCompUsed: new Prisma.Decimal(0),
            totalSettlementFromBet: new Prisma.Decimal(0),
            totalSettlementFromVip: new Prisma.Decimal(0),
          },
        });
      } else {
        throw error;
      }
    }
  }

  /**
   * 콤프 획득 통계 업데이트
   */
  async updateCompEarnedStats(
    tx: Prisma.TransactionClient,
    userId: string,
    currency: WalletCurrencyCode,
    amount: Prisma.Decimal,
  ): Promise<void> {
    try {
      await tx.userBalanceStats.update({
        where: { userId_currency: { userId, currency } },
        data: {
          totalCompEarned: { increment: amount },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        // 레코드가 없으면 생성
        await tx.userBalanceStats.create({
          data: {
            userId,
            currency,
            totalDeposit: new Prisma.Decimal(0),
            totalWithdraw: new Prisma.Decimal(0),
            totalBet: new Prisma.Decimal(0),
            totalWin: new Prisma.Decimal(0),
            totalBonus: new Prisma.Decimal(0),
            totalCompEarned: amount,
            totalCompUsed: new Prisma.Decimal(0),
            totalSettlementFromBet: new Prisma.Decimal(0),
            totalSettlementFromVip: new Prisma.Decimal(0),
          },
        });
      } else {
        throw error;
      }
    }
  }

  /**
   * 콤프 사용 통계 업데이트
   */
  async updateCompUsedStats(
    tx: Prisma.TransactionClient,
    userId: string,
    currency: WalletCurrencyCode,
    amount: Prisma.Decimal,
  ): Promise<void> {
    try {
      await tx.userBalanceStats.update({
        where: { userId_currency: { userId, currency } },
        data: {
          totalCompUsed: { increment: amount },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        // 레코드가 없으면 생성
        await tx.userBalanceStats.create({
          data: {
            userId,
            currency,
            totalDeposit: new Prisma.Decimal(0),
            totalWithdraw: new Prisma.Decimal(0),
            totalBet: new Prisma.Decimal(0),
            totalWin: new Prisma.Decimal(0),
            totalBonus: new Prisma.Decimal(0),
            totalCompEarned: new Prisma.Decimal(0),
            totalCompUsed: amount,
            totalSettlementFromBet: new Prisma.Decimal(0),
            totalSettlementFromVip: new Prisma.Decimal(0),
          },
        });
      } else {
        throw error;
      }
    }
  }

  /**
   * 정산 통계 업데이트
   */
  async updateSettlementStats(
    tx: Prisma.TransactionClient,
    userId: string,
    currency: WalletCurrencyCode,
    fromBet: Prisma.Decimal,
    fromVip: Prisma.Decimal,
  ): Promise<void> {
    try {
      await tx.userBalanceStats.update({
        where: { userId_currency: { userId, currency } },
        data: {
          totalSettlementFromBet: { increment: fromBet },
          totalSettlementFromVip: { increment: fromVip },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        // 레코드가 없으면 생성
        await tx.userBalanceStats.create({
          data: {
            userId,
            currency,
            totalDeposit: new Prisma.Decimal(0),
            totalWithdraw: new Prisma.Decimal(0),
            totalBet: new Prisma.Decimal(0),
            totalWin: new Prisma.Decimal(0),
            totalBonus: new Prisma.Decimal(0),
            totalCompEarned: new Prisma.Decimal(0),
            totalCompUsed: new Prisma.Decimal(0),
            totalSettlementFromBet: fromBet,
            totalSettlementFromVip: fromVip,
          },
        });
      } else {
        throw error;
      }
    }
  }

  /**
   * 통계 조회
   */
  async getStats(userId: string, currency: WalletCurrencyCode) {
    return await this.prisma.userBalanceStats.findUnique({
      where: { userId_currency: { userId, currency } },
    });
  }

  /**
   * 사용자의 모든 통화별 통계 조회
   */
  async getAllStats(userId: string) {
    return await this.prisma.userBalanceStats.findMany({
      where: { userId },
      orderBy: { currency: 'asc' },
    });
  }
}
