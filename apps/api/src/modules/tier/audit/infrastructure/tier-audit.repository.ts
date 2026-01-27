import { Injectable } from '@nestjs/common';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import { EvaluationStatus } from '@prisma/client';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { TierAuditRepositoryPort, CreateTierHistoryProps, UpdateEvaluationLogMetrics, UpdateTierStatsProps } from './audit.repository.port';
import { TierHistory } from '../domain/tier-history.entity';
import { TierEvaluationLog } from '../domain/tier-evaluation-log.entity';
import { TierDemotionWarning } from '../domain/tier-demotion-warning.entity';
import { TierStats, UserTierPeriodStats } from '../domain/tier-stats.entity';

@Injectable()
export class TierAuditRepository implements TierAuditRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
        private readonly snowflake: SnowflakeService,
    ) { }

    // --- History ---
    async saveHistory(props: CreateTierHistoryProps): Promise<TierHistory> {
        const id = this.snowflake.generate(new Date());
        const record = await this.tx.tierHistory.create({
            data: {
                id,
                ...props,
                changeBy: props.changeBy || 'SYSTEM',
            }
        });
        return TierHistory.fromPersistence(record);
    }

    async findHistoryByUserId(userId: bigint, limit: number = 20): Promise<TierHistory[]> {
        const records = await this.tx.tierHistory.findMany({
            where: { userId },
            take: limit,
            orderBy: { changedAt: 'desc' }
        });
        return records.map(TierHistory.fromPersistence);
    }

    // --- Evaluation Log ---
    async createEvaluationLog(status: EvaluationStatus): Promise<TierEvaluationLog> {
        const id = this.snowflake.generate(new Date());
        const record = await this.tx.tierEvaluationLog.create({
            data: {
                id,
                status,
                startedAt: new Date(),
                totalProcessedCount: 0,
                promotedCount: 0,
                demotedCount: 0,
                gracePeriodCount: 0,
                maintainedCount: 0,
                skippedBonusCount: 0
            }
        });
        return TierEvaluationLog.fromPersistence(record);
    }

    async updateEvaluationLog(id: bigint, startedAt: Date, data: UpdateEvaluationLogMetrics & { status?: EvaluationStatus, finishedAt?: Date, errorMessage?: string | null }): Promise<TierEvaluationLog> {
        const record = await this.tx.tierEvaluationLog.update({
            where: { id_startedAt: { id, startedAt } },
            data
        });
        return TierEvaluationLog.fromPersistence(record);
    }

    // --- Demotion Warning ---
    async upsertDemotionWarning(warning: TierDemotionWarning): Promise<TierDemotionWarning> {
        const data = {
            currentTierId: warning.currentTierId,
            targetTierId: warning.targetTierId,
            evaluationDueAt: warning.evaluationDueAt,
            requiredRolling: warning.requiredRolling,
            currentRolling: warning.currentRolling,
            lastNotifiedAt: warning.lastNotifiedAt
        };
        const record = await this.tx.tierDemotionWarning.upsert({
            where: { userId: warning.userId },
            create: { userId: warning.userId, ...data },
            update: data
        });
        return TierDemotionWarning.fromPersistence(record);
    }

    async deleteDemotionWarning(userId: bigint): Promise<void> {
        await this.tx.tierDemotionWarning.deleteMany({ where: { userId } });
    }

    // --- Stats ---
    async updateStats(timestamp: Date, tierId: bigint, data: UpdateTierStatsProps): Promise<void> {
        await this.tx.tierStats.upsert({
            where: { timestamp_tierId: { timestamp, tierId } },
            create: { timestamp, tierId, ...data },
            update: data
        });
    }

    async savePeriodStats(stats: UserTierPeriodStats): Promise<void> {
        const id = this.snowflake.generate(new Date());
        await this.tx.userTierPeriodStats.create({
            data: {
                id,
                userId: stats.userId,
                year: stats.year,
                month: stats.month,
                tierId: stats.tierId,
                monthlyRollingUsd: stats.monthlyRollingUsd,
                monthlyDepositUsd: stats.monthlyDepositUsd
            }
        });
    }
}
