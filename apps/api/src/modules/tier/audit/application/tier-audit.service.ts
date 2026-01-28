import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TierAuditRepositoryPort, CreateTierHistoryProps, UpdateEvaluationLogMetrics, UpdateTierStatsProps } from '../infrastructure/audit.repository.port';
import { EvaluationStatus, Prisma } from '@prisma/client';
import { TIER_AUDIT_QUEUE_NAME, TierAuditJobType, RecordTierSnapshotJobData } from '../infrastructure/tier-audit.constants';
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
}
