import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
    TierAuditRepositoryPort,
    UpdateTierStatsProps,
} from '../infrastructure/tier-audit.repository.port';
import { RecordTierSnapshotJobData } from '../infrastructure/tier-audit.types';

@Injectable()
export class HandleTierStatsService {
    constructor(
        private readonly auditRepository: TierAuditRepositoryPort,
    ) { }

    /**
     * BullMQ 프로세서에서 호출하는 실제 통계 저장 로직입니다.
     */
    async handleRecord(data: RecordTierSnapshotJobData): Promise<void> {
        const { timestamp, tierId, metrics } = data;

        // 시간 단위(Hourly) 정규화
        const normalizedTime = new Date(timestamp);
        normalizedTime.setUTCMinutes(0, 0, 0);

        const normalizedMetrics: UpdateTierStatsProps = {
            ...metrics,
            periodBonusPaidUsd: metrics.periodBonusPaidUsd
                ? new Prisma.Decimal(metrics.periodBonusPaidUsd)
                : undefined,
            periodRollingUsd: metrics.periodRollingUsd
                ? new Prisma.Decimal(metrics.periodRollingUsd)
                : undefined,
            periodDepositUsd: metrics.periodDepositUsd
                ? new Prisma.Decimal(metrics.periodDepositUsd)
                : undefined,
        };

        await this.auditRepository.updateStats(
            normalizedTime,
            BigInt(tierId),
            normalizedMetrics,
        );
    }

    /**
     * BullMQ 프로세서에서 호출하는 실제 통계 누적 로직입니다.
     */
    async handleIncrement(data: RecordTierSnapshotJobData): Promise<void> {
        const { timestamp, tierId, metrics } = data;
        const normalizedTime = new Date(timestamp);
        normalizedTime.setUTCMinutes(0, 0, 0);

        const normalizedMetrics: any = {
            ...metrics,
            periodBonusPaidUsd: metrics.periodBonusPaidUsd
                ? new Prisma.Decimal(metrics.periodBonusPaidUsd)
                : undefined,
            periodRollingUsd: metrics.periodRollingUsd
                ? new Prisma.Decimal(metrics.periodRollingUsd)
                : undefined,
            periodDepositUsd: metrics.periodDepositUsd
                ? new Prisma.Decimal(metrics.periodDepositUsd)
                : undefined,
        };

        await this.auditRepository.incrementStats(
            normalizedTime,
            BigInt(tierId),
            normalizedMetrics,
        );
    }
}
