import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { BaseProcessor } from 'src/infrastructure/bullmq/base.processor';
import { BULLMQ_QUEUES, getQueueConfig } from 'src/infrastructure/bullmq/bullmq.constants';
import { TierEvaluationService } from '../application/tier-evaluation.service';
import { TierRepositoryPort } from '../../master/infrastructure/tier.repository.port';
import { TierEvaluationJobType, TierEvaluationJobPayload } from './tier-evaluation.types';

const queueConfig = getQueueConfig(BULLMQ_QUEUES.TIER_EVALUATOR.USER_EVALUATION);

@Processor(queueConfig.processorOptions, queueConfig.workerOptions)
export class TierUserEvaluationProcessor extends BaseProcessor<TierEvaluationJobPayload, void> {
    protected readonly logger = new Logger(TierUserEvaluationProcessor.name);

    constructor(
        private readonly tierEvaluationService: TierEvaluationService,
        private readonly tierRepository: TierRepositoryPort,
        protected readonly cls: ClsService,
    ) {
        super();
    }

    protected async processJob(job: Job<TierEvaluationJobPayload>): Promise<void> {
        const { data: payload } = job;

        if (!payload || payload.type !== TierEvaluationJobType.EVALUATE_USER || !payload.data?.userId) {
            this.logger.warn(`Invalid or missing payload for user evaluation: ${JSON.stringify(payload)}`);
            return;
        }

        const userId = BigInt(payload.data.userId);

        try {
            // 모든 티어 정보 조회 (성능을 위해 캐시 활용 - TierRepository에서 내부적으로 캐싱됨)
            const allTiers = await this.tierRepository.findAll();

            await this.tierEvaluationService.evaluateUser(userId, allTiers);

        } catch (error) {
            this.logger.error(`Failed to evaluate user ${userId}:`, error);
            throw error;
        }
    }
}
