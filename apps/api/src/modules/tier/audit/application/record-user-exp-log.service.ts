import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import { BULLMQ_QUEUES } from 'src/infrastructure/bullmq/bullmq.constants';
import { CreateUserExpLogProps } from '../infrastructure/tier-audit.repository.port';
import { TierAuditJobType } from '../infrastructure/tier-audit.types';

@Injectable()
export class RecordUserExpLogService {
  constructor(
    private readonly snowflakeService: SnowflakeService,
    @InjectQueue(BULLMQ_QUEUES.TIER.STATS_RECORD.name)
    private readonly recordQueue: Queue,
  ) {}

  /**
   * 유저의 XP 변동 이력을 비동기(BullMQ)로 기록합니다.
   */
  async execute(
    props: Omit<CreateUserExpLogProps, 'id' | 'createdAt'>,
  ): Promise<void> {
    const { id, timestamp } = this.snowflakeService.generate();

    await this.recordQueue.add(BULLMQ_QUEUES.TIER.STATS_RECORD.name, {
      type: TierAuditJobType.RECORD_USER_EXP_LOG,
      data: {
        ...props,
        id: id.toString(),
        userId: props.userId.toString(),
        amount: props.amount.toString(),
        statusExpSnap: props.statusExpSnap.toString(),
        referenceId: props.referenceId?.toString(),
        createdAt: timestamp,
      },
    });
  }
}
