import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import {
    TierAuditRepositoryPort,
    CreateTierHistoryProps,
    UpdateTierStatsProps,
} from '../infrastructure/tier-audit.repository.port';
import { Prisma } from '@prisma/client';
import { BULLMQ_QUEUES } from 'src/infrastructure/bullmq/bullmq.constants';
import {
    TierAuditJobType,
    RecordTierSnapshotJobData,
} from '../infrastructure/tier-audit.types';

@Injectable()
export class TierAuditService {
    constructor(
        private readonly snowflakeService: SnowflakeService,
        private readonly auditRepository: TierAuditRepositoryPort,
        @InjectQueue(BULLMQ_QUEUES.TIER.STATS_RECORD.name)
        private readonly recordQueue: Queue,
    ) { }

    /**
     * 유저의 티어 변경 이력을 기록합니다.
     */
    async recordTierChange(
        props: Omit<CreateTierHistoryProps, 'id' | 'changedAt'>,
    ): Promise<void> {
        const { id, timestamp } = this.snowflakeService.generate();
        await this.auditRepository.saveHistory({
            ...props,
            id,
            changedAt: timestamp,
        });
    }


    /**
     * 등급별 통계(TierStats)를 기록하거나 업데이트합니다.
     */
    async recordTierStats(
        timestamp: Date,
        tierId: bigint,
        metrics: {
            snapshotUserCount?: number;
            totalBonusPaidUsd?: Prisma.Decimal;
            totalRollingUsd?: Prisma.Decimal;
            totalDepositUsd?: Prisma.Decimal;
            promotedCount?: number;
            demotedCount?: number;
            maintainedCount?: number;
            graceCount?: number;
        },
    ): Promise<void> {
        await this.recordQueue.add(BULLMQ_QUEUES.TIER.STATS_RECORD.name, {
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
     * 등급별 통계 수치를 누적(Increment)합니다. (승급/강등 이벤트 시 비동기 호출)
     */
    async incrementTierStats(
        timestamp: Date,
        tierId: bigint,
        metrics: {
            totalBonusPaidUsd?: Prisma.Decimal;
            totalRollingUsd?: Prisma.Decimal;
            totalDepositUsd?: Prisma.Decimal;
            promotedCount?: number;
            demotedCount?: number;
            maintainedCount?: number;
            graceCount?: number;
        },
    ): Promise<void> {
        await this.recordQueue.add(BULLMQ_QUEUES.TIER.STATS_RECORD.name, {
            type: TierAuditJobType.INCREMENT_TIER_STATS,
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
            totalBonusPaidUsd: metrics.totalBonusPaidUsd
                ? new Prisma.Decimal(metrics.totalBonusPaidUsd)
                : undefined,
            totalRollingUsd: metrics.totalRollingUsd
                ? new Prisma.Decimal(metrics.totalRollingUsd)
                : undefined,
            totalDepositUsd: metrics.totalDepositUsd
                ? new Prisma.Decimal(metrics.totalDepositUsd)
                : undefined,
        };

        await this.auditRepository.updateStats(
            normalizedTime,
            BigInt(tierId),
            normalizedMetrics,
        );
    }

    /**
     * [Internal] BullMQ 프로세서에서 호출하는 실제 통계 누적 로직입니다.
     */
    async handleIncrementStats(data: RecordTierSnapshotJobData): Promise<void> {
        const { timestamp, tierId, metrics } = data;
        const normalizedTime = new Date(timestamp);
        normalizedTime.setUTCMinutes(0, 0, 0);

        const normalizedMetrics: any = {
            ...metrics,
            totalBonusPaidUsd: metrics.totalBonusPaidUsd
                ? new Prisma.Decimal(metrics.totalBonusPaidUsd)
                : undefined,
            totalRollingUsd: metrics.totalRollingUsd
                ? new Prisma.Decimal(metrics.totalRollingUsd)
                : undefined,
            totalDepositUsd: metrics.totalDepositUsd
                ? new Prisma.Decimal(metrics.totalDepositUsd)
                : undefined,
        };

        await this.auditRepository.incrementStats(
            normalizedTime,
            BigInt(tierId),
            normalizedMetrics,
        );
    }
}
