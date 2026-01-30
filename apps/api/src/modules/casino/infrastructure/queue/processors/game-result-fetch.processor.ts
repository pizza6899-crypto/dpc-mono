import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { GameResultFetchData } from '../casino-queue.types';
import { ClsService } from 'nestjs-cls';
import { WhitecliffFetchGameResultService } from '../../../providers/whitecliff/application/whitecliff-fetch-game-result.service';
import { DcsFetchGameResultService } from '../../../providers/dcs/application/dcs-fetch-game-result.service';
import { GameAggregatorType } from '@prisma/client';
import { Inject } from '@nestjs/common';
import { GAME_ROUND_REPOSITORY_TOKEN } from '../../../ports/out/game-round.repository.token';
import type { GameRoundRepositoryPort } from '../../../ports/out/game-round.repository.port';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import { BaseProcessor } from 'src/infrastructure/bullmq/base.processor';
import { BULLMQ_QUEUES, getQueueConfig } from 'src/infrastructure/bullmq/bullmq.constants';

const queueConfig = getQueueConfig(BULLMQ_QUEUES.CASINO.GAME_RESULT_FETCH);

@Processor(queueConfig.processorOptions, queueConfig.workerOptions)
export class GameResultFetchProcessor extends BaseProcessor<GameResultFetchData, void> {
    protected readonly logger = new Logger(GameResultFetchProcessor.name);

    constructor(
        private readonly dcsService: DcsFetchGameResultService,
        private readonly whitecliffService: WhitecliffFetchGameResultService,
        protected readonly cls: ClsService,
        @Inject(GAME_ROUND_REPOSITORY_TOKEN)
        private readonly gameRoundRepository: GameRoundRepositoryPort,
        private readonly snowflakeService: SnowflakeService,
    ) {
        super();
    }

    protected async processJob(job: Job<GameResultFetchData>): Promise<void> {
        const { gameRoundId } = job.data;
        const roundId = BigInt(gameRoundId);

        // Snowflake ID에서 생성 시간(startedAt) 추출 (파티션 키)
        const { date: startedDate } = this.snowflakeService.parse(roundId);

        this.logger.log(`Processing GameResultFetch job for round ${gameRoundId}`);

        // DB에서 라운드 정보 조회
        const round = await this.gameRoundRepository.findById(roundId, startedDate);
        if (!round) {
            // DB 복제 지연 등으로 아직 조회가 안 될 수 있으므로, 일정 횟수 재시도하도록 에러 throw
            // 영구적으로 없는 경우라면 max attempts 도달 후 Dead Letter Queue로 이동됨
            const msg = `GameRound not found: ${roundId} (Potential DB replication lag)`;
            this.logger.warn(msg);
            throw new Error(msg);
        }

        if (round.aggregatorType === GameAggregatorType.DC) {
            await this.dcsService.execute(round.id, round.startedAt);
        } else if (round.aggregatorType === GameAggregatorType.WHITECLIFF) {
            await this.whitecliffService.execute(round.id, round.startedAt);
        } else {
            this.logger.warn(`Unknown aggregator type: ${round.aggregatorType}`);
        }
    }
}
