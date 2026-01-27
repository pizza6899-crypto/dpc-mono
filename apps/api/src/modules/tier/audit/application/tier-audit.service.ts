import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TierAuditRepositoryPort, CreateTierHistoryProps, UpdateEvaluationLogMetrics, UpdateTierStatsProps } from '../infrastructure/audit.repository.port';
import { EvaluationStatus, Prisma } from '@prisma/client';
import { TIER_AUDIT_QUEUE_NAME, TierAuditJobType, RecordStatsJobData, RecordPeriodStatsJobData, RecordDemotionWarningJobData } from '../infrastructure/tier-audit.constants';
import { UserTierPeriodStats } from '../domain/tier-stats.entity';
import { TierDemotionWarning } from '../domain/tier-demotion-warning.entity';
import { TierEvaluationLog } from '../domain/tier-evaluation-log.entity';

@Injectable()
export class TierAuditService {
    private readonly logger = new Logger(TierAuditService.name);

    constructor(
        private readonly auditRepository: TierAuditRepositoryPort,
        @InjectQueue(TIER_AUDIT_QUEUE_NAME)
        private readonly auditQueue: Queue,
    ) { }

    /**
     * 유저의 티어 변경 이력을 기록합니다.
     */
    async recordTierChange(props: CreateTierHistoryProps): Promise<void> {
        await this.auditRepository.saveHistory(props);

        // 승급 또는 강등 처리가 완료되면 기존 강등 경고 제거
        if (props.changeType === 'UPGRADE' || props.changeType === 'DOWNGRADE') {
            await this.auditRepository.deleteDemotionWarning(props.userId).catch((error) => {
                this.logger.warn(`Failed to delete demotion warning for user ${props.userId}: ${error.message}`);
            });
        }
    }

    /**
     * 배치 심사 로그를 시작합니다.
     */
    async startEvaluationLog(): Promise<TierEvaluationLog> {
        return await this.auditRepository.createEvaluationLog(EvaluationStatus.RUNNING);
    }

    /**
     * 배치 심사 로그를 완료하거나 에러를 기록합니다.
     */
    async finishEvaluationLog(id: bigint, startedAt: Date, metrics: UpdateEvaluationLogMetrics, error?: string): Promise<void> {
        await this.auditRepository.updateEvaluationLog(id, startedAt, {
            ...metrics,
            status: error ? EvaluationStatus.FAILED : EvaluationStatus.SUCCESS,
            finishedAt: new Date(),
            errorMessage: error ?? null
        });
    }

    /**
     * 등급별 통계(TierStats)를 기록하거나 업데이트합니다.
     */
    async recordTierStats(timestamp: Date, tierId: bigint, metrics: {
        snapshotUserCount?: number;
        totalBonusPaidUsd?: Prisma.Decimal;
        totalRollingUsd?: Prisma.Decimal;
        promotedCount?: number;
        demotedCount?: number;
    }): Promise<void> {
        await this.auditQueue.add(TierAuditJobType.RECORD_STATS, {
            type: TierAuditJobType.RECORD_STATS,
            data: {
                timestamp,
                tierId: tierId.toString(),
                metrics: {
                    ...metrics,
                    totalBonusPaidUsd: metrics.totalBonusPaidUsd?.toString(),
                    totalRollingUsd: metrics.totalRollingUsd?.toString(),
                },
            },
        });
    }

    /**
     * 유저의 월별 실적 스냅샷(UserTierPeriodStats)을 저장합니다.
     */
    async recordUserPeriodStats(userId: bigint, props: {
        year: number;
        month: number;
        tierId: bigint;
        monthlyRollingUsd: Prisma.Decimal;
        monthlyDepositUsd: Prisma.Decimal;
    }): Promise<void> {
        await this.auditQueue.add(TierAuditJobType.RECORD_PERIOD_STATS, {
            type: TierAuditJobType.RECORD_PERIOD_STATS,
            data: {
                userId: userId.toString(),
                year: props.year,
                month: props.month,
                tierId: props.tierId.toString(),
                monthlyRollingUsd: props.monthlyRollingUsd.toString(),
                monthlyDepositUsd: props.monthlyDepositUsd.toString(),
                createdAt: new Date().toISOString(),
            },
        });
    }

    /**
     * 강등 경고 정보를 기록하거나 업데이트합니다.
     */
    async recordDemotionWarning(userId: bigint, props: {
        currentTierId: bigint;
        targetTierId: bigint;
        evaluationDueAt: Date;
        requiredRolling: Prisma.Decimal;
        currentRolling: Prisma.Decimal;
    }): Promise<void> {
        await this.auditQueue.add(TierAuditJobType.RECORD_DEMOTION_WARNING, {
            type: TierAuditJobType.RECORD_DEMOTION_WARNING,
            data: {
                userId: userId.toString(),
                currentTierId: props.currentTierId.toString(),
                targetTierId: props.targetTierId.toString(),
                evaluationDueAt: props.evaluationDueAt.toISOString(),
                requiredRolling: props.requiredRolling.toString(),
                currentRolling: props.currentRolling.toString(),
                lastNotifiedAt: null,
            },
        });
    }

    /**
     * [Internal] BullMQ 프로세서에서 호출하는 실제 통계 저장 로직입니다.
     */
    async handleRecordStats(data: RecordStatsJobData): Promise<void> {
        const { timestamp, tierId, metrics } = data;

        // 시간 단위(Hourly) 정규화
        const normalizedTime = new Date(timestamp);
        normalizedTime.setUTCMinutes(0, 0, 0);

        const normalizedMetrics: UpdateTierStatsProps = {
            ...metrics,
            totalBonusPaidUsd: metrics.totalBonusPaidUsd ? new Prisma.Decimal(metrics.totalBonusPaidUsd) : undefined,
            totalRollingUsd: metrics.totalRollingUsd ? new Prisma.Decimal(metrics.totalRollingUsd) : undefined,
        };

        await this.auditRepository.updateStats(normalizedTime, BigInt(tierId), normalizedMetrics);
    }

    /**
     * [Internal] BullMQ 프로세서에서 호출하는 실제 월별 실적 저장 로직입니다.
     */
    async handleRecordUserPeriodStats(data: RecordPeriodStatsJobData): Promise<void> {
        const stats = new UserTierPeriodStats(
            0n,
            BigInt(data.userId),
            data.year,
            data.month,
            BigInt(data.tierId),
            new Prisma.Decimal(data.monthlyRollingUsd),
            new Prisma.Decimal(data.monthlyDepositUsd),
            new Date(data.createdAt)
        );
        await this.auditRepository.savePeriodStats(stats);
    }

    /**
     * [Internal] BullMQ 프로세서에서 호출하는 실제 강등 경고 저장 로직입니다.
     */
    async handleRecordDemotionWarning(data: RecordDemotionWarningJobData): Promise<void> {
        const warning = new TierDemotionWarning(
            0n,
            BigInt(data.userId),
            BigInt(data.currentTierId),
            BigInt(data.targetTierId),
            new Date(data.evaluationDueAt),
            new Prisma.Decimal(data.requiredRolling),
            new Prisma.Decimal(data.currentRolling),
            data.lastNotifiedAt ? new Date(data.lastNotifiedAt) : null
        );
        await this.auditRepository.upsertDemotionWarning(warning);
    }
}
