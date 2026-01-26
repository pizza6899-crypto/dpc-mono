import { Injectable } from '@nestjs/common';
import {
    UserWalletTotalStats,
    UserWalletHourlyStats
} from '../domain';
import {
    UserWalletTotalStats as PrismaTotalStats,
    UserWalletHourlyStats as PrismaHourlyStats,
    ExchangeCurrencyCode,
    Prisma
} from '@prisma/client';

@Injectable()
export class UserWalletStatsMapper {
    /**
     * Total Stats: Prisma -> Domain
     */
    toTotalDomain(prismaModel: PrismaTotalStats): UserWalletTotalStats {
        return UserWalletTotalStats.fromPersistence({
            userId: prismaModel.userId,
            currency: prismaModel.currency,
            totalDeposit: prismaModel.totalDeposit,
            totalWithdraw: prismaModel.totalWithdraw,
            totalBet: prismaModel.totalBet,
            totalWin: prismaModel.totalWin,
            totalBonus: prismaModel.totalBonus,
            totalCompEarned: prismaModel.totalCompEarned,
            totalCompUsed: prismaModel.totalCompUsed,
            updatedAt: prismaModel.updatedAt,
        });
    }

    /**
     * Total Stats: Domain -> Prisma
     */
    toTotalPrisma(domain: UserWalletTotalStats): any {
        return {
            userId: domain.userId,
            currency: domain.currency,
            totalDeposit: domain.totalDeposit,
            totalWithdraw: domain.totalWithdraw,
            totalBet: domain.totalBet,
            totalWin: domain.totalWin,
            totalBonus: domain.totalBonus,
            totalCompEarned: domain.totalCompEarned,
            totalCompUsed: domain.totalCompUsed,
        };
    }

    /**
     * Hourly Stats: Prisma -> Domain
     */
    toHourlyDomain(prismaModel: PrismaHourlyStats): UserWalletHourlyStats {
        return UserWalletHourlyStats.fromPersistence({
            userId: prismaModel.userId,
            currency: prismaModel.currency,
            date: prismaModel.date,
            totalDepositCash: prismaModel.totalDepositCash,
            totalWithdrawCash: prismaModel.totalWithdrawCash,
            totalBetCash: prismaModel.totalBetCash,
            totalWinCash: prismaModel.totalWinCash,
            totalBonusGiven: prismaModel.totalBonusGiven,
            totalBonusUsed: prismaModel.totalBonusUsed,
            totalBetBonus: prismaModel.totalBetBonus,
            totalWinBonus: prismaModel.totalWinBonus,
            startCash: prismaModel.startCash,
            endCash: prismaModel.endCash,
            startBonus: prismaModel.startBonus,
            endBonus: prismaModel.endBonus,
            createdAt: prismaModel.createdAt,
        });
    }

    /**
     * Hourly Stats: Domain -> Prisma
     */
    toHourlyPrisma(domain: UserWalletHourlyStats): any {
        return {
            userId: domain.userId,
            currency: domain.currency,
            date: domain.date,
            totalDepositCash: domain.totalDepositCash,
            totalWithdrawCash: domain.totalWithdrawCash,
            totalBetCash: domain.totalBetCash,
            totalWinCash: domain.totalWinCash,
            totalBonusGiven: domain.totalBonusGiven,
            totalBonusUsed: domain.totalBonusUsed,
            totalBetBonus: domain.totalBetBonus,
            totalWinBonus: domain.totalWinBonus,
            startCash: domain.startCash,
            endCash: domain.endCash,
            startBonus: domain.startBonus,
            endBonus: domain.endBonus,
        };
    }
}
