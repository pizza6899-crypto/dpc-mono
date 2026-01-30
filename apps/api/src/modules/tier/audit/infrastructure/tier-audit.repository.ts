import { Injectable } from '@nestjs/common';
import { EvaluationStatus, Prisma, TierChangeType } from '@prisma/client';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import {
    TierAuditRepositoryPort,
    CreateTierHistoryProps,
    UpdateEvaluationLogMetrics,
    UpdateTierStatsProps,
} from './audit.repository.port';
import { TierHistory } from '../domain/tier-history.entity';
import { TierEvaluationLog } from '../domain/tier-evaluation-log.entity';
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

    // --- Evaluation Log ---
    async createEvaluationLog(
        id: bigint,
        timestamp: Date,
        status: EvaluationStatus,
    ): Promise<TierEvaluationLog> {
        const record = await this.tx.tierEvaluationLog.create({
            data: {
                id,
                status,
                startedAt: timestamp,
                totalProcessedCount: 0,
                promotedCount: 0,
                demotedCount: 0,
                gracePeriodCount: 0,
                maintainedCount: 0,
                skippedBonusCount: 0,
            },
        });
        return TierEvaluationLog.fromPersistence(record);
    }

    async updateEvaluationLog(
        id: bigint,
        startedAt: Date,
        data: UpdateEvaluationLogMetrics & {
            status?: EvaluationStatus;
            finishedAt?: Date;
            errorMessage?: string | null;
        },
    ): Promise<TierEvaluationLog> {
        const record = await this.tx.tierEvaluationLog.update({
            where: { id_startedAt: { id, startedAt } },
            data,
        });
        return TierEvaluationLog.fromPersistence(record);
    }

    async findEvaluationLogs(page: number = 1, limit: number = 20): Promise<PaginatedData<TierEvaluationLog>> {
        const [total, records] = await Promise.all([
            this.tx.tierEvaluationLog.count(),
            this.tx.tierEvaluationLog.findMany({
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { startedAt: 'desc' },
            }),
        ]);

        return {
            data: records.map(TierEvaluationLog.fromPersistence),
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
}
