import { Processor } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { ClsService } from 'nestjs-cls';
import { BaseProcessor } from 'src/infrastructure/bullmq/base.processor';
import {
  BULLMQ_QUEUES,
  getQueueConfig,
} from 'src/infrastructure/bullmq/bullmq.constants';
import { UserTierRepositoryPort } from '../../profile/infrastructure/user-tier.repository.port';
import { nowUtc } from 'src/utils/date.util';
import {
  TierEvaluationJobType,
  TierEvaluationJobPayload,
} from './tier-evaluation.types';

const queueConfig = getQueueConfig(
  BULLMQ_QUEUES.TIER_EVALUATOR.EVALUATION_TRIGGER,
);

@Processor(queueConfig.processorOptions, queueConfig.workerOptions)
export class TierEvaluationTriggerProcessor extends BaseProcessor<any, void> {
  protected readonly logger = new Logger(TierEvaluationTriggerProcessor.name);

  constructor(
    private readonly userTierRepository: UserTierRepositoryPort,
    @InjectQueue(BULLMQ_QUEUES.TIER_EVALUATOR.USER_EVALUATION.name)
    private readonly userEvaluationQueue: Queue,
    protected readonly cls: ClsService,
  ) {
    super();
  }

  protected async processJob(job: Job<any>): Promise<void> {
    this.logger.log(
      'Starting tier evaluation trigger (Cursor-based Streaming)...',
    );

    try {
      const now = nowUtc();
      const BATCH_SIZE = 1000;
      const hourKey = now.toISOString().substring(0, 13).replace(/[-T]/g, ''); // YYYYMMDDHH

      let cursor: bigint | undefined;
      let totalQueued = 0;

      while (true) {
        // 1. 심사 대상 ID 조회 (커서 기반)
        const userIds = await this.userTierRepository.findIdsNeedingEvaluation(
          now,
          BATCH_SIZE,
          cursor,
        );

        if (userIds.length === 0) break;

        // 2. 개별 유저 심사 잡 생성 (중복 방지용 JobId 부여)
        const evalJobs = userIds.map((userId) => ({
          name: `evaluate-user-${userId}`,
          data: {
            type: TierEvaluationJobType.EVALUATE_USER,
            data: { userId: userId.toString() },
          } as TierEvaluationJobPayload,
          opts: {
            // 중복 방지 핵심: 같은 시각에 같은 유저에 대한 잡은 하나만 허용
            jobId: `eval-${userId}-${hourKey}`,
          },
        }));

        await this.userEvaluationQueue.addBulk(evalJobs);

        totalQueued += userIds.length;
        cursor = userIds[userIds.length - 1]; // 다음 루프를 위한 커서 갱신

        this.logger.debug(
          `Queued ${userIds.length} users... (Total: ${totalQueued})`,
        );

        // 모든 데이터를 다 가져왔으면 종료
        if (userIds.length < BATCH_SIZE) break;
      }

      this.logger.log(
        `Tier evaluation trigger completed. Total dispatched: ${totalQueued}`,
      );
    } catch (error) {
      this.logger.error('Failed to trigger tier evaluation:', error);
      throw error;
    }
  }
}
