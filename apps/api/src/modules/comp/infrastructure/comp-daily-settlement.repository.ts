import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { ExchangeCurrencyCode, Prisma, CompSettlementStatus } from '@prisma/client';
import { CompDailySettlementRepositoryPort } from '../ports';
import { CompDailySettlement } from '../domain';
import { CompMapper } from './comp.mapper';

@Injectable()
export class CompDailySettlementRepository implements CompDailySettlementRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
        private readonly mapper: CompMapper,
    ) { }

    async save(settlement: CompDailySettlement): Promise<CompDailySettlement> {
        const data = this.mapper.toDailySettlementPersistence(settlement);

        const result = await this.tx.compDailySettlement.upsert({
            where: {
                userId_currency_date: {
                    userId: settlement.userId,
                    currency: settlement.currency,
                    date: settlement.date,
                },
            },
            create: {
                userId: data.userId!,
                currency: data.currency!,
                date: data.date!,
                totalEarned: data.totalEarned,
                status: data.status,
                rewardId: data.rewardId,
                failureReason: data.failureReason,
                processedAt: data.processedAt,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
            },
            update: {
                totalEarned: data.totalEarned,
                status: data.status,
                rewardId: data.rewardId,
                failureReason: data.failureReason,
                processedAt: data.processedAt,
                updatedAt: data.updatedAt,
            },
        });

        return this.mapper.toDailySettlementDomain(result);
    }

    async create(settlement: CompDailySettlement): Promise<CompDailySettlement> {
        const data = this.mapper.toDailySettlementPersistence(settlement);
        const result = await this.tx.compDailySettlement.create({
            data: data as any,
        });
        return this.mapper.toDailySettlementDomain(result);
    }

    async findByUserIdAndCurrencyAndDate(
        userId: bigint,
        currency: ExchangeCurrencyCode,
        date: Date,
    ): Promise<CompDailySettlement | null> {
        const result = await this.tx.compDailySettlement.findUnique({
            where: {
                userId_currency_date: {
                    userId,
                    currency,
                    date,
                },
            },
        });
        return result ? this.mapper.toDailySettlementDomain(result) : null;
    }

    async findPendingSettlements(
        untilDate: Date,
        skip: number,
        take: number,
    ): Promise<
        Array<{
            userId: bigint;
            currency: ExchangeCurrencyCode;
            totalEarned: Prisma.Decimal;
        }>
    > {
        const results = await this.tx.compDailySettlement.groupBy({
            by: ['userId', 'currency'],
            _sum: { totalEarned: true },
            where: {
                status: { in: [CompSettlementStatus.UNSETTLED, CompSettlementStatus.SKIPPED] },
                date: { lt: untilDate },
            },
            orderBy: [{ userId: 'asc' }, { currency: 'asc' }],
            skip,
            take,
        });

        return results.map((r) => ({
            userId: r.userId,
            currency: r.currency,
            totalEarned: r._sum.totalEarned || new Prisma.Decimal(0),
        }));
    }

    async getPendingTotalForUser(
        userId: bigint,
        currency: ExchangeCurrencyCode,
        untilDate: Date,
    ): Promise<Prisma.Decimal> {
        const result = await this.tx.compDailySettlement.aggregate({
            _sum: { totalEarned: true },
            where: {
                userId,
                currency,
                status: { in: [CompSettlementStatus.UNSETTLED, CompSettlementStatus.SKIPPED] },
                date: { lt: untilDate },
            },
        });
        return result._sum.totalEarned || new Prisma.Decimal(0);
    }

    async updateStatuses(
        userId: bigint,
        currency: ExchangeCurrencyCode,
        status: CompSettlementStatus,
        untilDate: Date,
        rewardId?: bigint,
    ): Promise<void> {
        await this.tx.compDailySettlement.updateMany({
            where: {
                userId,
                currency,
                status: { in: [CompSettlementStatus.UNSETTLED, CompSettlementStatus.SKIPPED] },
                date: { lt: untilDate },
            },
            data: {
                status,
                rewardId,
                processedAt: new Date(),
            },
        });
    }
}
