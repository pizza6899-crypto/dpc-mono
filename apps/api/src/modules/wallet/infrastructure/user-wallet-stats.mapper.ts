import { Injectable } from '@nestjs/common';
import {
    UserWalletTotalStats,
    UserWalletHourlyStats
} from '../domain';
import {
    UserWalletTotalStats as PrismaTotalStats,
    UserWalletHourlyStats as PrismaHourlyStats,
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
            // Cash
            totalDepositCash: prismaModel.totalDepositCash,
            totalWithdrawCash: prismaModel.totalWithdrawCash,
            // Bet/Win
            totalBetCash: prismaModel.totalBetCash,
            totalWinCash: prismaModel.totalWinCash,
            totalBetBonus: prismaModel.totalBetBonus,
            totalWinBonus: prismaModel.totalWinBonus,
            // USD
            totalBetCashUsd: prismaModel.totalBetCashUsd,
            totalWinCashUsd: prismaModel.totalWinCashUsd,
            totalDepositCashUsd: prismaModel.totalDepositCashUsd,
            totalWithdrawCashUsd: prismaModel.totalWithdrawCashUsd,
            // Hall of Fame
            maxBetAmount: prismaModel.maxBetAmount,
            maxWinAmount: prismaModel.maxWinAmount,
            maxWinAmountUsd: prismaModel.maxWinAmountUsd,
            // Count
            totalBetCount: prismaModel.totalBetCount,
            totalWinCount: prismaModel.totalWinCount,
            // Bonus
            totalBonusGiven: prismaModel.totalBonusGiven,
            totalBonusUsed: prismaModel.totalBonusUsed,
            // Comp
            totalCompEarned: prismaModel.totalCompEarned,
            totalCompUsed: prismaModel.totalCompUsed,
            // Vault
            totalVaultIn: prismaModel.totalVaultIn,
            totalVaultOut: prismaModel.totalVaultOut,
            // Recency
            lastBetAt: prismaModel.lastBetAt,
            lastWinAt: prismaModel.lastWinAt,
            lastDepositAt: prismaModel.lastDepositAt,
            lastWithdrawAt: prismaModel.lastWithdrawAt,
            // Time
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
            // Cash
            totalDepositCash: domain.totalDepositCash,
            totalWithdrawCash: domain.totalWithdrawCash,
            // Bet/Win
            totalBetCash: domain.totalBetCash,
            totalWinCash: domain.totalWinCash,
            totalBetBonus: domain.totalBetBonus,
            totalWinBonus: domain.totalWinBonus,
            // USD
            totalBetCashUsd: domain.totalBetCashUsd,
            totalWinCashUsd: domain.totalWinCashUsd,
            totalDepositCashUsd: domain.totalDepositCashUsd,
            totalWithdrawCashUsd: domain.totalWithdrawCashUsd,
            // Hall of Fame
            maxBetAmount: domain.maxBetAmount,
            maxWinAmount: domain.maxWinAmount,
            maxWinAmountUsd: domain.maxWinAmountUsd,
            // Count
            totalBetCount: domain.totalBetCount,
            totalWinCount: domain.totalWinCount,
            // Bonus
            totalBonusGiven: domain.totalBonusGiven,
            totalBonusUsed: domain.totalBonusUsed,
            // Comp
            totalCompEarned: domain.totalCompEarned,
            totalCompUsed: domain.totalCompUsed,
            // Vault
            totalVaultIn: domain.totalVaultIn,
            totalVaultOut: domain.totalVaultOut,
            // Recency
            lastBetAt: domain.lastBetAt ?? null,
            lastWinAt: domain.lastWinAt ?? null,
            lastDepositAt: domain.lastDepositAt ?? null,
            lastWithdrawAt: domain.lastWithdrawAt ?? null,
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
            // Cash
            totalDepositCash: prismaModel.totalDepositCash,
            totalWithdrawCash: prismaModel.totalWithdrawCash,
            totalBetCash: prismaModel.totalBetCash,
            totalWinCash: prismaModel.totalWinCash,
            // USD
            totalDepositCashUsd: prismaModel.totalDepositCashUsd,
            totalWithdrawCashUsd: prismaModel.totalWithdrawCashUsd,
            totalBetCashUsd: prismaModel.totalBetCashUsd,
            totalWinCashUsd: prismaModel.totalWinCashUsd,
            // Hall of Fame
            maxBetAmount: prismaModel.maxBetAmount,
            maxWinAmount: prismaModel.maxWinAmount,
            maxWinAmountUsd: prismaModel.maxWinAmountUsd,
            // Count
            totalBetCount: prismaModel.totalBetCount,
            totalWinCount: prismaModel.totalWinCount,
            transactionCount: prismaModel.transactionCount,
            // Bonus
            totalBonusGiven: prismaModel.totalBonusGiven,
            totalBonusUsed: prismaModel.totalBonusUsed,
            totalBetBonus: prismaModel.totalBetBonus,
            totalWinBonus: prismaModel.totalWinBonus,
            // Recency
            lastBetAt: prismaModel.lastBetAt,
            lastWinAt: prismaModel.lastWinAt,
            lastDepositAt: prismaModel.lastDepositAt,
            lastWithdrawAt: prismaModel.lastWithdrawAt,
            // Snapshots
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
            // Cash
            totalDepositCash: domain.totalDepositCash,
            totalWithdrawCash: domain.totalWithdrawCash,
            totalBetCash: domain.totalBetCash,
            totalWinCash: domain.totalWinCash,
            // USD
            totalDepositCashUsd: domain.totalDepositCashUsd,
            totalWithdrawCashUsd: domain.totalWithdrawCashUsd,
            totalBetCashUsd: domain.totalBetCashUsd,
            totalWinCashUsd: domain.totalWinCashUsd,
            // Hall of Fame
            maxBetAmount: domain.maxBetAmount,
            maxWinAmount: domain.maxWinAmount,
            maxWinAmountUsd: domain.maxWinAmountUsd,
            // Count
            totalBetCount: domain.totalBetCount,
            totalWinCount: domain.totalWinCount,
            transactionCount: domain.transactionCount,
            // Bonus
            totalBonusGiven: domain.totalBonusGiven,
            totalBonusUsed: domain.totalBonusUsed,
            totalBetBonus: domain.totalBetBonus,
            totalWinBonus: domain.totalWinBonus,
            // Recency
            lastBetAt: domain.lastBetAt ?? null,
            lastWinAt: domain.lastWinAt ?? null,
            lastDepositAt: domain.lastDepositAt ?? null,
            lastWithdrawAt: domain.lastWithdrawAt ?? null,
            // Snapshots
            startCash: domain.startCash,
            endCash: domain.endCash,
            startBonus: domain.startBonus,
            endBonus: domain.endBonus,
        };
    }
}
