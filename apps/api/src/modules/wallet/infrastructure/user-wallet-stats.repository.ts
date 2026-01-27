
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { ExchangeCurrencyCode, Prisma } from '@prisma/client';
import { UserWalletStatsRepositoryPort, UpdateWalletStatsDto } from '../ports/out/user-wallet-stats.repository.port';
import { UserWalletTotalStats, UserWalletHourlyStats } from '../domain';
import { UserWalletStatsMapper } from './user-wallet-stats.mapper';

@Injectable()
export class UserWalletStatsRepository implements UserWalletStatsRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
        private readonly mapper: UserWalletStatsMapper,
    ) { }

    // --- Basic CRUD (Port Implementation) ---

    async getTotalStats(userId: bigint, currency: ExchangeCurrencyCode): Promise<UserWalletTotalStats | null> {
        const stats = await this.tx.userWalletTotalStats.findUnique({
            where: { userId_currency: { userId, currency } },
        });
        return stats ? this.mapper.toTotalDomain(stats) : null;
    }

    async saveTotalStats(stats: UserWalletTotalStats): Promise<void> {
        const data = this.mapper.toTotalPrisma(stats);
        await this.tx.userWalletTotalStats.upsert({
            where: { userId_currency: { userId: data.userId, currency: data.currency } },
            create: data,
            update: data,
        });
    }

    async getHourlyStats(userId: bigint, currency: ExchangeCurrencyCode, date: Date): Promise<UserWalletHourlyStats | null> {
        const stats = await this.tx.userWalletHourlyStats.findUnique({
            where: { date_userId_currency: { date, userId, currency } },
        });
        return stats ? this.mapper.toHourlyDomain(stats) : null;
    }

    async saveHourlyStats(stats: UserWalletHourlyStats): Promise<void> {
        const data = this.mapper.toHourlyPrisma(stats);
        await this.tx.userWalletHourlyStats.upsert({
            where: {
                date_userId_currency: {
                    date: data.date,
                    userId: data.userId,
                    currency: data.currency
                }
            },
            create: data,
            update: data,
        });
    }

    // --- Atomic Updates (Performance-based) ---

    async increaseTotalStats(dto: UpdateWalletStatsDto): Promise<void> {
        const { userId, currency } = dto;

        const data = {
            totalDepositCash: dto.depositCash ?? new Prisma.Decimal(0),
            totalWithdrawCash: dto.withdrawCash ?? new Prisma.Decimal(0),
            totalBetCash: dto.betCash ?? new Prisma.Decimal(0),
            totalWinCash: dto.winCash ?? new Prisma.Decimal(0),
            totalBonusGiven: dto.bonusGiven ?? new Prisma.Decimal(0),
            totalBonusUsed: dto.bonusUsed ?? new Prisma.Decimal(0),
            totalBetBonus: dto.betBonus ?? new Prisma.Decimal(0),
            totalWinBonus: dto.winBonus ?? new Prisma.Decimal(0),
            totalCompEarned: dto.compEarned ?? new Prisma.Decimal(0),
            totalCompUsed: dto.compUsed ?? new Prisma.Decimal(0),
            totalVaultIn: dto.vaultIn ?? new Prisma.Decimal(0),
            totalVaultOut: dto.vaultOut ?? new Prisma.Decimal(0),
        };

        await this.tx.userWalletTotalStats.upsert({
            where: { userId_currency: { userId, currency } },
            create: { userId, currency, ...data },
            update: {
                totalDepositCash: { increment: data.totalDepositCash },
                totalWithdrawCash: { increment: data.totalWithdrawCash },
                totalBetCash: { increment: data.totalBetCash },
                totalWinCash: { increment: data.totalWinCash },
                totalBonusGiven: { increment: data.totalBonusGiven },
                totalBonusUsed: { increment: data.totalBonusUsed },
                totalBetBonus: { increment: data.totalBetBonus },
                totalWinBonus: { increment: data.totalWinBonus },
                totalCompEarned: { increment: data.totalCompEarned },
                totalCompUsed: { increment: data.totalCompUsed },
                totalVaultIn: { increment: data.totalVaultIn },
                totalVaultOut: { increment: data.totalVaultOut },
            },
        });
    }

    async updateHourlyStats(dto: UpdateWalletStatsDto): Promise<void> {
        const { userId, currency, currentBalance } = dto;

        // DTO에 타임스탬프가 있으면 그 시간을 기준으로, 없으면 현재 시간 사용
        const targetDate = dto.timestamp || new Date();
        const dateKey = new Date(Date.UTC(
            targetDate.getUTCFullYear(),
            targetDate.getUTCMonth(),
            targetDate.getUTCDate(),
            targetDate.getUTCHours(),
            0,
            0
        ));

        const increments = {
            totalDepositCash: dto.depositCash ?? new Prisma.Decimal(0),
            totalWithdrawCash: dto.withdrawCash ?? new Prisma.Decimal(0),
            totalBetCash: dto.betCash ?? new Prisma.Decimal(0),
            totalWinCash: dto.winCash ?? new Prisma.Decimal(0),
            totalBonusGiven: dto.bonusGiven ?? new Prisma.Decimal(0),
            totalBonusUsed: dto.bonusUsed ?? new Prisma.Decimal(0),
            totalBetBonus: dto.betBonus ?? new Prisma.Decimal(0),
            totalWinBonus: dto.winBonus ?? new Prisma.Decimal(0),
        };

        const currentCash = currentBalance?.cash ?? new Prisma.Decimal(0);
        const currentBonus = currentBalance?.bonus ?? new Prisma.Decimal(0);

        await this.tx.userWalletHourlyStats.upsert({
            where: { date_userId_currency: { userId, currency, date: dateKey } },
            create: {
                userId,
                currency,
                date: dateKey,
                ...increments,
                startCash: currentCash,
                endCash: currentCash,
                startBonus: currentBonus,
                endBonus: currentBonus,
            },
            update: {
                totalDepositCash: { increment: increments.totalDepositCash },
                totalWithdrawCash: { increment: increments.totalWithdrawCash },
                totalBetCash: { increment: increments.totalBetCash },
                totalWinCash: { increment: increments.totalWinCash },
                totalBonusGiven: { increment: increments.totalBonusGiven },
                totalBonusUsed: { increment: increments.totalBonusUsed },
                totalBetBonus: { increment: increments.totalBetBonus },
                totalWinBonus: { increment: increments.totalWinBonus },
                endCash: currentCash,
                endBonus: currentBonus,
            },
        });
    }
}
