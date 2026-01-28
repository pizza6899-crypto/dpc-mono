import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TierAuditRepositoryPort, CreateTierHistoryProps, UpdateEvaluationLogMetrics, UpdateTierStatsProps } from '../infrastructure/audit.repository.port';
import { EvaluationStatus, Prisma } from '@prisma/client';
import { TIER_AUDIT_QUEUE_NAME, TierAuditJobType, RecordTierSnapshotJobData, RecordDemotionWarningJobData } from '../infrastructure/tier-audit.constants';
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
     * (주로 강등 및 등급 유지 심사를 위한 배치 작업입니다. 승급은 실시간으로 처리됩니다.)
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
        totalDepositUsd?: Prisma.Decimal;
        promotedCount?: number;
        demotedCount?: number;
    }): Promise<void> {
        await this.auditQueue.add(TierAuditJobType.RECORD_TIER_SNAPSHOT, {
            type: TierAuditJobType.RECORD_TIER_SNAPSHOT,
            data: {
                timestamp,
                tierId: tierId.toString(),
                metrics: {
                    ...metrics,
                    totalBonusPaidUsd: metrics.totalBonusPaidUsd?.toString(),
                    totalRollingUsd: metrics.totalRollingUsd?.toString(),
                    totalDepositUsd: metrics.totalDepositUsd?.toString(),
                },
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
    async handleRecordStats(data: RecordTierSnapshotJobData): Promise<void> {
        const { timestamp, tierId, metrics } = data;

        // 시간 단위(Hourly) 정규화
        const normalizedTime = new Date(timestamp);
        normalizedTime.setUTCMinutes(0, 0, 0);

        const normalizedMetrics: UpdateTierStatsProps = {
            ...metrics,
            totalBonusPaidUsd: metrics.totalBonusPaidUsd ? new Prisma.Decimal(metrics.totalBonusPaidUsd) : undefined,
            totalRollingUsd: metrics.totalRollingUsd ? new Prisma.Decimal(metrics.totalRollingUsd) : undefined,
            totalDepositUsd: metrics.totalDepositUsd ? new Prisma.Decimal(metrics.totalDepositUsd) : undefined,
        };

        await this.auditRepository.updateStats(normalizedTime, BigInt(tierId), normalizedMetrics);
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
