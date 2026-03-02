import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import { BULLMQ_QUEUES } from 'src/infrastructure/bullmq/bullmq.constants';
import { CreateTierHistoryProps } from '../infrastructure/tier-audit.repository.port';
import { TierAuditJobType } from '../infrastructure/tier-audit.types';

@Injectable()
export class RecordTierHistoryService {
  constructor(
    private readonly snowflakeService: SnowflakeService,
    @InjectQueue(BULLMQ_QUEUES.TIER.STATS_RECORD.name)
    private readonly recordQueue: Queue,
  ) {}

  /**
   * 유저의 티어 변경 이력을 비동기(BullMQ)로 기록합니다.
   */
  async execute(
    props: Omit<CreateTierHistoryProps, 'id' | 'changedAt'>,
  ): Promise<void> {
    const { id, timestamp } = this.snowflakeService.generate();

    const jobData: any = {
      ...props,
      id: id.toString(),
      userId: props.userId.toString(),
      fromTierId: props.fromTierId?.toString(),
      toTierId: props.toTierId.toString(),
      referenceId: props.referenceId?.toString(),
      changedBy: props.changedBy?.toString(),
      changedAt: timestamp,
    };

    // Decimal 필드 문자열 변환
    const decimalFields = [
      'statusRollingUsdSnap',
      'compRateSnap',
      'weeklyLossbackRateSnap',
      'monthlyLossbackRateSnap',
      'lifetimeRollingUsdSnap',
      'lifetimeDepositUsdSnap',
      'dailyWithdrawalLimitUsdSnap',
      'weeklyWithdrawalLimitUsdSnap',
      'monthlyWithdrawalLimitUsdSnap',
      'upgradeBonusSnap',
    ];

    for (const field of decimalFields) {
      if (props[field]) {
        jobData[field] = props[field].toString();
      }
    }

    // statusExpSnap (bigint)
    jobData.statusExpSnap = props.statusExpSnap.toString();

    await this.recordQueue.add(BULLMQ_QUEUES.TIER.STATS_RECORD.name, {
      type: TierAuditJobType.RECORD_TIER_HISTORY,
      data: jobData,
    });
  }
}
