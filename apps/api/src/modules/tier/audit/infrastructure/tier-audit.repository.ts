import { Injectable } from '@nestjs/common';
import { Prisma, TierChangeType } from '@prisma/client';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import {
    TierAuditRepositoryPort,
    CreateTierHistoryProps,
    UpdateTierStatsProps,
} from './tier-audit.repository.port';
import { TierHistory } from '../domain/tier-history.entity';
import { PaginatedData } from 'src/common/http/types/pagination.types';

@Injectable()
export class TierAuditRepository implements TierAuditRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
    ) { }

    // --- History ---
    async saveHistory(props: CreateTierHistoryProps): Promise<TierHistory> {
        const record = await this.tx.tierHistory.create({
            data: {
                ...props,
                changeBy: props.changeBy || 'SYSTEM',
            },
        });
        return TierHistory.fromPersistence(record);
    }

    async findHistoryByUserId(
        userId: bigint,
        params: {
            startDate?: Date;
            endDate?: Date;
            page?: number;
            limit?: number;
            changeType?: TierChangeType;
        } = {},
    ): Promise<PaginatedData<TierHistory>> {
        const { startDate, endDate, page = 1, limit = 20, changeType } = params;
        const where: Prisma.TierHistoryWhereInput = {
            userId,
        };

        if (startDate || endDate) {
            where.changedAt = {};
            if (startDate) where.changedAt.gte = startDate;
            if (endDate) where.changedAt.lte = endDate;
        }

        if (changeType) {
            where.changeType = changeType;
        }

        const [total, records] = await Promise.all([
            this.tx.tierHistory.count({ where }),
            this.tx.tierHistory.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { changedAt: 'desc' },
            }),
        ]);

        return {
            data: records.map(TierHistory.fromPersistence),
            total,
            page,
            limit,
        };
    }

    // --- Stats ---
    async updateStats(
        timestamp: Date,
        tierId: bigint,
        data: UpdateTierStatsProps,
    ): Promise<void> {
        await this.tx.tierStats.upsert({
            where: { timestamp_tierId: { timestamp, tierId } },
            create: { timestamp, tierId, ...data },
            update: data,
        });
    }

    async incrementStats(
        timestamp: Date,
        tierId: bigint,
        data: Partial<Record<keyof UpdateTierStatsProps, number | Prisma.Decimal>>,
    ): Promise<void> {
        const updateData: any = {};
        for (const [key, value] of Object.entries(data)) {
            updateData[key] = { increment: value };
        }

        await this.tx.tierStats.upsert({
            where: { timestamp_tierId: { timestamp, tierId } },
            create: {
                timestamp,
                tierId,
                snapshotUserCount: typeof data.snapshotUserCount === 'number' ? data.snapshotUserCount : 0,
                periodBonusPaidUsd: data.periodBonusPaidUsd instanceof Prisma.Decimal ? data.periodBonusPaidUsd : 0,
                periodRollingUsd: data.periodRollingUsd instanceof Prisma.Decimal ? data.periodRollingUsd : 0,
                periodDepositUsd: data.periodDepositUsd instanceof Prisma.Decimal ? data.periodDepositUsd : 0,
                upgradedCount: typeof data.upgradedCount === 'number' ? data.upgradedCount : 0,
                downgradedCount: typeof data.downgradedCount === 'number' ? data.downgradedCount : 0,
                maintainedCount: typeof data.maintainedCount === 'number' ? data.maintainedCount : 0,
                graceCount: typeof data.graceCount === 'number' ? data.graceCount : 0,
            },
            update: updateData,
        });
    }
}
