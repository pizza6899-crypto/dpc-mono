import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { BaseProcessor } from 'src/infrastructure/bullmq/base.processor';
import { BULLMQ_QUEUES, getQueueConfig } from 'src/infrastructure/bullmq/bullmq.constants';
import { BatchEvaluationService } from '../application/batch-evaluation.service';
import { TierRepositoryPort } from '../../master/infrastructure/tier.repository.port';
import { TierEvaluationJobType, TierEvaluationJobPayload } from './tier-evaluation.types';

const queueConfig = getQueueConfig(BULLMQ_QUEUES.TIER_EVALUATOR.USER_EVALUATION);

@Processor(queueConfig.processorOptions, queueConfig.workerOptions)
export class TierUserEvaluationProcessor extends BaseProcessor<TierEvaluationJobPayload, void> {
    protected readonly logger = new Logger(TierUserEvaluationProcessor.name);

    constructor(
        private readonly batchEvaluationService: BatchEvaluationService,
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

            // 실제 유저 심사 로직 실행
            // BatchEvaluationService.evaluateUser 메서드는 @Transactional이 걸려 있어 안전하게 수행됩니다.
            // metrics 객체는 통계용 로그 기록을 위해 전달합니다 (단일 잡이므로 더미 카운터 전달)
            const dummyMetrics = {
                totalProcessedCount: 0,
                promotedCount: 0,
                demotedCount: 0,
                gracePeriodCount: 0,
                maintainedCount: 0,
                skippedBonusCount: 0,
            };

            await this.batchEvaluationService.evaluateUser(userId, allTiers, dummyMetrics);

        } catch (error) {
            this.logger.error(`Failed to evaluate user ${userId}:`, error);
            throw error;
        }
    }
}
