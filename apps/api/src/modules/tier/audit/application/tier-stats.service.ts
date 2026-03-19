import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Prisma } from '@prisma/client';
import { BULLMQ_QUEUES } from 'src/infrastructure/bullmq/bullmq.constants';
import { TierAuditJobType } from '../infrastructure/tier-audit.types';

@Injectable()
export class TierStatsService {
  constructor(
    @InjectQueue(BULLMQ_QUEUES.TIER.STATS_RECORD.name)
    private readonly recordQueue: Queue,
  ) {}

  /**
   * 등급별 통계(TierStats)를 기록하거나 업데이트 요청을 보냅니다.
   */
  async record(
    timestamp: Date,
    tierId: bigint,
    metrics: {
      snapshotUserCount?: number;
      periodActiveUserCount?: number;
      periodExpGranted?: bigint;
      upgradedCount?: number;
      downgradedCount?: number;
      maintainedCount?: number;
      graceCount?: number;
      periodTotalRollingUsd?: Prisma.Decimal;
      periodRewardClaimedUsd?: Prisma.Decimal;
    },
  ): Promise<void> {
    await this.recordQueue.add(BULLMQ_QUEUES.TIER.STATS_RECORD.name, {
      type: TierAuditJobType.RECORD_TIER_SNAPSHOT,
      data: {
        timestamp,
        tierId: tierId.toString(),
        metrics: {
          ...metrics,
          periodExpGranted: metrics.periodExpGranted?.toString(),
          periodTotalRollingUsd: metrics.periodTotalRollingUsd?.toString(),
          periodRewardClaimedUsd: metrics.periodRewardClaimedUsd?.toString(),
        },
      },
    });
  }

  /**
   * 등급별 통계 수치를 누적(Increment) 요청을 보냅니다.
   */
  async increment(
    timestamp: Date,
    tierId: bigint,
    metrics: {
      periodActiveUserCount?: number;
      periodExpGranted?: bigint;
      upgradedCount?: number;
      downgradedCount?: number;
      maintainedCount?: number;
      graceCount?: number;
      periodTotalRollingUsd?: Prisma.Decimal;
      periodRewardClaimedUsd?: Prisma.Decimal;
    },
  ): Promise<void> {
    await this.recordQueue.add(BULLMQ_QUEUES.TIER.STATS_RECORD.name, {
      type: TierAuditJobType.INCREMENT_TIER_STATS,
      data: {
        timestamp,
        tierId: tierId.toString(),
        metrics: {
          ...metrics,
          periodExpGranted: metrics.periodExpGranted?.toString(),
          periodTotalRollingUsd: metrics.periodTotalRollingUsd?.toString(),
          periodRewardClaimedUsd: metrics.periodRewardClaimedUsd?.toString(),
        },
      },
    });
  }
}
