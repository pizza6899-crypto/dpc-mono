import { Inject, Injectable } from '@nestjs/common';
import { ExchangeCurrencyCode, Prisma } from '@repo/database';
import { ANALYTICS_REPOSITORY } from '../ports/analytics.repository.token';
import type { AnalyticsRepositoryPort } from '../ports/analytics.repository.port';
import { UserHourlyStat } from '../domain/model/user-hourly-stat.entity';
import { Transactional } from '@nestjs-cls/transactional';

interface RecordDepositParams {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    amount: Prisma.Decimal;
    date: Date;
}

interface RecordWithdrawParams {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    amount: Prisma.Decimal;
    date: Date;
}

interface RecordGameParams {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    date: Date;
    betAmount: Prisma.Decimal;
    winAmount: Prisma.Decimal;
    category: 'slot' | 'live' | 'other';
}

interface RecordBonusParams {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    date: Date;
    givenAmount?: Prisma.Decimal;
    usedAmount?: Prisma.Decimal;
    convertedAmount?: Prisma.Decimal;
}

interface RecordCompParams {
    userId: bigint;
    currency: ExchangeCurrencyCode;
    date: Date;
    earnedAmount?: Prisma.Decimal;
    convertedAmount?: Prisma.Decimal;
}

@Injectable()
export class RecordUserActivityService {
    constructor(
        @Inject(ANALYTICS_REPOSITORY)
        private readonly repository: AnalyticsRepositoryPort,
    ) { }

    private getHourStart(date: Date): Date {
        const d = new Date(date);
        d.setMinutes(0, 0, 0);
        return d;
    }

    private async getOrCreateStat(
        userId: bigint,
        date: Date,
        currency: ExchangeCurrencyCode,
    ): Promise<UserHourlyStat> {
        const hourStart = this.getHourStart(date);
        let stat = await this.repository.findByUserAndDate(
            userId,
            hourStart,
            currency,
        );

        if (!stat) {
            stat = UserHourlyStat.create({
                userId,
                currency,
                date: hourStart,
                // TODO: 이전 시간의 endBalance를 가져와서 startBalance로 설정하는 로직이 필요할 수 있음
                // 현재는 0으로 초기화
            });
        }
        return stat;
    }

    @Transactional()
    async recordDeposit(params: RecordDepositParams): Promise<void> {
        const stat = await this.getOrCreateStat(
            params.userId,
            params.date,
            params.currency,
        );

        stat.totalDeposit = stat.totalDeposit.add(params.amount);
        stat.depositCount += 1;

        // Update balance snapshot
        stat.endBalance = stat.endBalance.add(params.amount);

        await this.repository.save(stat);
    }

    @Transactional()
    async recordWithdraw(params: RecordWithdrawParams): Promise<void> {
        const stat = await this.getOrCreateStat(
            params.userId,
            params.date,
            params.currency,
        );

        stat.totalWithdraw = stat.totalWithdraw.add(params.amount);
        stat.withdrawCount += 1;

        // Update balance snapshot
        stat.endBalance = stat.endBalance.sub(params.amount);

        await this.repository.save(stat);
    }

    @Transactional()
    async recordGame(params: RecordGameParams): Promise<void> {
        const stat = await this.getOrCreateStat(
            params.userId,
            params.date,
            params.currency,
        );

        stat.totalBet = stat.totalBet.add(params.betAmount);
        stat.totalWin = stat.totalWin.add(params.winAmount);
        stat.netWin = stat.totalWin.sub(stat.totalBet); // Net Win for User
        stat.ggr = stat.totalBet.sub(stat.totalWin); // GGR for Operator
        stat.totalGameCount += 1;

        if (params.category === 'slot') {
            stat.slotBetAmount = stat.slotBetAmount.add(params.betAmount);
            stat.slotWinAmount = stat.slotWinAmount.add(params.winAmount);
            stat.slotGgr = stat.slotBetAmount.sub(stat.slotWinAmount);
            stat.slotGameCount += 1;
        } else if (params.category === 'live') {
            stat.liveBetAmount = stat.liveBetAmount.add(params.betAmount);
            stat.liveWinAmount = stat.liveWinAmount.add(params.winAmount);
            stat.liveGgr = stat.liveBetAmount.sub(stat.liveWinAmount);
            stat.liveGameCount += 1;
        }

        // Update balance snapshot (Balance += Win - Bet)
        stat.endBalance = stat.endBalance.add(params.winAmount).sub(params.betAmount);

        await this.repository.save(stat);
    }

    @Transactional()
    async recordBonus(params: RecordBonusParams): Promise<void> {
        const stat = await this.getOrCreateStat(
            params.userId,
            params.date,
            params.currency,
        );

        if (params.givenAmount) {
            stat.totalBonusGiven = stat.totalBonusGiven.add(params.givenAmount);
            stat.endBonusBalance = stat.endBonusBalance.add(params.givenAmount);
        }
        if (params.usedAmount) {
            stat.totalBonusUsed = stat.totalBonusUsed.add(params.usedAmount);
            stat.endBonusBalance = stat.endBonusBalance.sub(params.usedAmount);
        }
        if (params.convertedAmount) {
            stat.totalBonusConverted = stat.totalBonusConverted.add(
                params.convertedAmount,
            );
            // Converted bonus usually moves to cash balance
            stat.endBonusBalance = stat.endBonusBalance.sub(params.convertedAmount);
            stat.endBalance = stat.endBalance.add(params.convertedAmount);
        }

        await this.repository.save(stat);
    }

    @Transactional()
    async recordComp(params: RecordCompParams): Promise<void> {
        const stat = await this.getOrCreateStat(
            params.userId,
            params.date,
            params.currency,
        );

        if (params.earnedAmount) {
            stat.totalCompEarned = stat.totalCompEarned.add(params.earnedAmount);
        }

        if (params.convertedAmount) {
            stat.totalCompConverted = stat.totalCompConverted.add(params.convertedAmount);
            stat.endBalance = stat.endBalance.add(params.convertedAmount);
        }

        await this.repository.save(stat);
    }
}
