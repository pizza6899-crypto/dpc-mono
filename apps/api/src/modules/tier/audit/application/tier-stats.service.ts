import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BULLMQ_QUEUES } from 'src/infrastructure/bullmq/bullmq.constants';
import { TierAuditJobType } from '../infrastructure/tier-audit.types';
import { UpdateTierStatsProps } from '../infrastructure/tier-audit.repository.port';

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
    metrics: UpdateTierStatsProps,
  ): Promise<void> {
    const stringifiedMetrics: any = { ...metrics };

    // Decimal 필드들을 문자열로 변환하여 큐에 직렬화
    for (const key in metrics) {
      if (
        metrics[key] &&
        typeof metrics[key] === 'object' &&
        'toString' in metrics[key]
      ) {
        stringifiedMetrics[key] = metrics[key].toString();
      }
    }

    await this.recordQueue.add(BULLMQ_QUEUES.TIER.STATS_RECORD.name, {
      type: TierAuditJobType.RECORD_TIER_SNAPSHOT,
      data: {
        timestamp,
        tierId: tierId.toString(),
        metrics: stringifiedMetrics,
      },
    });
  }

  /**
   * 등급별 통계 수치를 누적(Increment) 요청을 보냅니다.
   */
  async increment(
    timestamp: Date,
    tierId: bigint,
    metrics: Partial<UpdateTierStatsProps>,
  ): Promise<void> {
    const stringifiedMetrics: any = { ...metrics };

    for (const key in metrics) {
      if (
        metrics[key] &&
        typeof metrics[key] === 'object' &&
        'toString' in metrics[key]
      ) {
        stringifiedMetrics[key] = metrics[key].toString();
      }
    }

    await this.recordQueue.add(BULLMQ_QUEUES.TIER.STATS_RECORD.name, {
      type: TierAuditJobType.INCREMENT_TIER_STATS,
      data: {
        timestamp,
        tierId: tierId.toString(),
        metrics: stringifiedMetrics,
      },
    });
  }
}
